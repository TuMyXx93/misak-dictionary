/**
 * Database Seed Script
 * Sprint 2 - Auth System
 * Crear usuario super_admin inicial y roles
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PasswordService } from '../src/infrastructure/auth/PasswordService.js';
import { seedDictionaryContent } from './seed-dictionary.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const passwordService = new PasswordService();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Crear roles básicos
  console.log('\n📋 Creating roles...');

  const roles = [
    {
      name: 'super_admin',
      description: 'Full system access with all permissions',
    },
    {
      name: 'content_admin',
      description: 'Manage dictionary content and semantic structure',
    },
    {
      name: 'media_admin',
      description: 'Manage media files and uploads',
    },
    {
      name: 'cultural_reviewer',
      description: 'Review and approve cultural content',
    },
    {
      name: 'analytics_viewer',
      description: 'View analytics and metrics',
    },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name },
    });

    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`  ✅ Created role: ${role.name}`);
    } else {
      console.log(`  ℹ️  Role already exists: ${role.name}`);
    }
  }

  // 2. Crear usuario super_admin
  console.log('\n👤 Creating super admin user...');

  const adminUsername = 'admin';
  const adminEmail = 'admin@misak-dictionary.com';
  const adminPassword = 'Admin123!'; // Cambiar en producción

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  if (!existingUser) {
    // Hashear password
    const hashedPassword = await passwordService.hash(adminPassword);

    // Crear usuario
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Super Administrator',
        isActive: true,
      },
    });

    console.log(`  ✅ Created admin user: ${adminUsername}`);

    // 3. Asignar rol super_admin
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'super_admin' },
    });

    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: superAdminRole.id,
        },
      });

      console.log('  ✅ Assigned super_admin role');
    }

    console.log('\n📝 Admin credentials:');
    console.log(`     Username: ${adminUsername}`);
    console.log(`     Email: ${adminEmail}`);
    console.log(`     Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password in production!');
  } else {
    console.log(`  ℹ️  Admin user already exists: ${existingUser.username}`);
  }

  // 4. Contenido del diccionario (spec 003 — datos desechables de observación)
  await seedDictionaryContent();

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
