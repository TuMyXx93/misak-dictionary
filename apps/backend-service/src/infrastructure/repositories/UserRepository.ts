/**
 * UserRepository Implementation
 * Sprint 2 - Auth System
 * Implementa IUserRepository usando Prisma
 */

import type { User, UserWithRoles } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../domain/interfaces/IAuthServices.js';
import { prisma } from '../../shared/config/prisma.js';

export class UserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return user;
  }

  async findById(id: bigint): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return user;
  }

  async findByIdWithRoles(id: bigint): Promise<UserWithRoles | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      nombres: user.nombres,
      apellidos: user.apellidos,
      tipoIdentificacion: user.tipoIdentificacion,
      numeroIdentificacion: user.numeroIdentificacion,
      telefonoContacto: user.telefonoContacto,
      direccionResidencia: user.direccionResidencia,
      barrio: user.barrio,
      departamento: user.departamento,
      ciudadMunicipio: user.ciudadMunicipio,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lockedUntil: user.lockedUntil,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roles: user.userRoles.map((ur) => ({
        roleId: ur.roleId,
        role: {
          id: ur.role.id,
          name: ur.role.name,
        },
      })),
    };
  }

  async create(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    nombres?: string | null;
    apellidos?: string | null;
    tipoIdentificacion?: string | null;
    numeroIdentificacion?: string | null;
    telefonoContacto?: string | null;
    direccionResidencia?: string | null;
    barrio?: string | null;
    departamento?: string | null;
    ciudadMunicipio?: string | null;
    mustChangePassword?: boolean;
  }): Promise<User> {
    const createData: any = {
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    };
    if (data.nombres !== undefined) createData.nombres = data.nombres;
    if (data.apellidos !== undefined) createData.apellidos = data.apellidos;
    if (data.tipoIdentificacion !== undefined)
      createData.tipoIdentificacion = data.tipoIdentificacion;
    if (data.numeroIdentificacion !== undefined)
      createData.numeroIdentificacion = data.numeroIdentificacion;
    if (data.telefonoContacto !== undefined) createData.telefonoContacto = data.telefonoContacto;
    if (data.direccionResidencia !== undefined)
      createData.direccionResidencia = data.direccionResidencia;
    if (data.barrio !== undefined) createData.barrio = data.barrio;
    if (data.departamento !== undefined) createData.departamento = data.departamento;
    if (data.ciudadMunicipio !== undefined) createData.ciudadMunicipio = data.ciudadMunicipio;
    if (data.mustChangePassword !== undefined)
      createData.mustChangePassword = data.mustChangePassword;

    return prisma.user.create({
      data: createData,
    });
  }

  async update(
    id: bigint,
    data: {
      username?: string;
      email?: string;
      fullName?: string;
      nombres?: string | null;
      apellidos?: string | null;
      tipoIdentificacion?: string;
      numeroIdentificacion?: string | null;
      telefonoContacto?: string | null;
      direccionResidencia?: string | null;
      barrio?: string | null;
      departamento?: string | null;
      ciudadMunicipio?: string | null;
      isActive?: boolean;
      failedLoginAttempts?: number;
      lockedUntil?: Date | null;
    },
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async incrementFailedAttempts(
    id: bigint,
    lockDurationMinutes = 15,
  ): Promise<{ failedAttempts: number; lockedUntil: Date | null }> {
    const current = await prisma.user.findUnique({
      where: { id },
      select: { failedLoginAttempts: true },
    });
    const newAttempts = (current?.failedLoginAttempts ?? 0) + 1;
    let lockedUntil: Date | null = null;
    if (newAttempts >= 5) {
      lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    }
    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: newAttempts,
        ...(lockedUntil ? { lockedUntil } : {}),
      },
    });
    return { failedAttempts: newAttempts, lockedUntil };
  }

  async resetFailedAttempts(id: bigint): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async unlockUser(id: bigint): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async toggleActive(id: bigint, isActive: boolean): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * R-005: Resetear contraseña con clave temporal y forzar cambio en primer inicio
   */
  async resetPasswordWithTemporary(id: bigint, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        password: passwordHash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * R-005: actualizar hash de contraseña (rehash transparente)
   */
  async updatePassword(id: bigint, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  /**
   * R-028: actualizar contraseña y remover flag must_change_password
   */
  async updatePasswordAndClearMustChange(id: bigint, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        password: passwordHash,
        mustChangePassword: false,
      },
    });
  }

  /**
   * R-028: verificar si el usuario tiene pendiente cambiar contraseña
   */
  async checkMustChangePassword(id: bigint): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { mustChangePassword: true },
    });
    return user?.mustChangePassword ?? false;
  }

  /**
   * R-008: crear usuario con rol asignado (bootstrap de root)
   */
  async createWithRole(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    roleId: bigint;
    mustChangePassword?: boolean;
  }): Promise<User> {
    await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        mustChangePassword: data.mustChangePassword ?? false,
        userRoles: {
          create: { roleId: data.roleId },
        },
      },
    });
    const created = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
    });
    return created;
  }

  /**
   * R-007: gestionar roles de usuario
   */
  async assignRole(userId: bigint, roleId: bigint): Promise<void> {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }

  async revokeRole(userId: bigint, roleId: bigint): Promise<void> {
    await prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  /**
   * R-008: ¿existe algún super_admin?
   */
  async countSuperAdmins(): Promise<number> {
    return prisma.user.count({
      where: {
        isActive: true,
        userRoles: { some: { role: { name: 'super_admin' } } },
      },
    });
  }

  /**
   * Buscar rol por nombre
   */
  async findRoleByName(name: string): Promise<{ id: bigint; name: string } | null> {
    return prisma.role.findUnique({
      where: { name },
      select: { id: true, name: true },
    });
  }
}
