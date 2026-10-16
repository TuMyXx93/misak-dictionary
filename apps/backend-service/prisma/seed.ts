/**
 * Database Seed Script
 * Spec 002 / Fase 0 gobernanza
 *
 * - Roles, permisos y su matriz se leen de shared/auth/permissions.ts (idempotente).
 * - Usuario administrador inicial: nunca con contraseña fija en el código.
 *   · SEED_ADMIN_PASSWORD (≥ 15 caracteres) si se define; si no, se genera una
 *     aleatoria y se muestra una sola vez.
 *   · En producción no se crea ningún usuario inicial sin SEED_ADMIN_PASSWORD.
 * - El contenido del diccionario no se siembra aquí: llega por taxonomy:import (data/taxonomy).
 */

import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PasswordService } from '../src/infrastructure/auth/PasswordService.js';
import { PERMISSION_CATALOG, ROLE_CATALOG } from '../src/shared/auth/permissions.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const passwordService = new PasswordService();

const MIN_PASSWORD_LENGTH = 15;
const isProduction = process.env.NODE_ENV === 'production';

async function seedPermissionsAndRoles() {
  console.log('\n🔐 Creating permissions...');
  for (const permiso of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: {
        resource_action: { resource: permiso.resource, action: permiso.action },
      },
      update: { description: permiso.description },
      create: {
        resource: permiso.resource,
        action: permiso.action,
        description: permiso.description,
      },
    });
  }

  console.log('\n📋 Creating roles and role-permission matrix...');
  for (const rol of ROLE_CATALOG) {
    const role = await prisma.role.upsert({
      where: { name: rol.name },
      update: { description: rol.description },
      create: { name: rol.name, description: rol.description },
    });

    for (const nombre of rol.permissions) {
      const [resource, action] = nombre.split(':');
      const permission = await prisma.permission.findUniqueOrThrow({
        where: {
          resource_action: { resource: resource ?? '', action: action ?? '' },
        },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`  ✅ Role ${rol.name}: ${rol.permissions.length} permiso(s)`);
  }
}

function resolveAdminPassword(): string | null {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD;
  if (fromEnv !== undefined && fromEnv !== '') {
    if (fromEnv.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`SEED_ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }
    return fromEnv;
  }
  if (isProduction) {
    return null;
  }
  return randomBytes(18).toString('base64url');
}

async function seedAdminUser() {
  console.log('\n👤 Creating initial super admin user...');

  const adminUsername = 'admin';
  const adminEmail = 'admin@misak-dictionary.com';

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: adminUsername }, { email: adminEmail }] },
  });
  if (existingUser) {
    console.log(`  ℹ️  Admin user already exists: ${existingUser.username}`);
    return;
  }

  const password = resolveAdminPassword();
  if (password === null) {
    console.log('  ⏭️  Producción sin SEED_ADMIN_PASSWORD: no se crea usuario inicial.');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      email: adminEmail,
      password: await passwordService.hash(password),
      fullName: 'Super Administrator',
      isActive: true,
      mustChangePassword: true,
    },
  });

  const superAdminRole = await prisma.role.findFirstOrThrow({
    where: { name: 'super_admin' },
  });
  await prisma.userRole.create({
    data: { userId: admin.id, roleId: superAdminRole.id },
  });

  console.log(`  ✅ Created admin user: ${adminUsername} (super_admin)`);
  if (process.env.SEED_ADMIN_PASSWORD === undefined || process.env.SEED_ADMIN_PASSWORD === '') {
    console.log(`     Contraseña generada (se muestra una sola vez): ${password}`);
  }
  console.log('     Deberá cambiarla en el primer ingreso.');
}

async function main() {
  console.log('🌱 Starting database seed...');

  await seedPermissionsAndRoles();
  await seedAdminUser();

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
