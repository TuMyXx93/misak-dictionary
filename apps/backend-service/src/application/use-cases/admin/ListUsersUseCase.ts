/**
 * ListUsersUseCase
 * Spec 006 (R-018) - Listado administrativo de usuarios con roles asignados.
 * Excluye estrictamente hashes de contraseña y tokens de sesión.
 */

import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';

export interface UserAdminItem {
  id: string;
  username: string;
  email: string;
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
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  roles: string[];
}

export interface ListUsersQuery {
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListUsersResult {
  items: UserAdminItem[];
  nextCursor: string | null;
}

export class ListUsersUseCase {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async execute(query: ListUsersQuery = {}): Promise<ListUsersResult> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where: Prisma.UserWhereInput = {};

    if (query.cursor) {
      try {
        where.id = { lt: BigInt(query.cursor) };
      } catch {
        // Ignorar cursor inválido
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        nombres: true,
        apellidos: true,
        tipoIdentificacion: true,
        numeroIdentificacion: true,
        telefonoContacto: true,
        direccionResidencia: true,
        barrio: true,
        departamento: true,
        ciudadMunicipio: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = users.length > limit;
    const itemsParaRetornar = hasMore ? users.slice(0, limit) : users;
    const ultimoUsuario = itemsParaRetornar[itemsParaRetornar.length - 1];
    const nextCursor = hasMore && ultimoUsuario ? ultimoUsuario.id.toString() : null;

    const items: UserAdminItem[] = itemsParaRetornar.map((u) => ({
      id: u.id.toString(),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      nombres: u.nombres,
      apellidos: u.apellidos,
      tipoIdentificacion: u.tipoIdentificacion,
      numeroIdentificacion: u.numeroIdentificacion,
      telefonoContacto: u.telefonoContacto,
      direccionResidencia: u.direccionResidencia,
      barrio: u.barrio,
      departamento: u.departamento,
      ciudadMunicipio: u.ciudadMunicipio,
      failedLoginAttempts: u.failedLoginAttempts ?? 0,
      lockedUntil: u.lockedUntil,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur) => ur.role.name),
    }));

    return {
      items,
      nextCursor,
    };
  }
}
