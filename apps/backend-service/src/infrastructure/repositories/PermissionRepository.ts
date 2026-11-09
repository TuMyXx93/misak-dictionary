/**
 * PermissionRepository
 * Resuelve los permisos efectivos de un usuario consultando la base en cada
 * petición (no se confía en el JWT): usuarios o roles inactivos no pasan.
 */

import { prisma } from '../../shared/config/prisma.js';

export class PermissionRepository {
  async findPermissionNamesForUser(userId: bigint): Promise<string[]> {
    const rows = await prisma.rolePermission.findMany({
      where: {
        role: {
          isActive: true,
          userRoles: {
            some: {
              userId,
              user: { isActive: true, deletedAt: null },
            },
          },
        },
      },
      select: {
        permission: { select: { resource: true, action: true } },
      },
    });

    return [...new Set(rows.map((row) => `${row.permission.resource}:${row.permission.action}`))];
  }
}
