import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    rolePermission: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { PermissionRepository } from './PermissionRepository.js';

describe('PermissionRepository', () => {
  let repository: PermissionRepository;

  beforeEach(() => {
    repository = new PermissionRepository();
  });

  it('retorna permisos deduplicados en formato resource:action para usuarios y roles activos', async () => {
    vi.mocked(prisma.rolePermission.findMany).mockResolvedValue([
      { permission: { resource: 'dictionary', action: 'read' } },
      { permission: { resource: 'dictionary', action: 'write' } },
      { permission: { resource: 'dictionary', action: 'read' } },
      { permission: { resource: 'media', action: 'upload' } },
    ] as never);

    const permissions = await repository.findPermissionNamesForUser(42n);

    expect(permissions).toEqual(['dictionary:read', 'dictionary:write', 'media:upload']);
    expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
      where: {
        role: {
          isActive: true,
          userRoles: {
            some: {
              userId: 42n,
              user: { isActive: true, deletedAt: null },
            },
          },
        },
      },
      select: {
        permission: { select: { resource: true, action: true } },
      },
    });
  });

  it('retorna un arreglo vacío cuando el usuario no tiene permisos activos', async () => {
    vi.mocked(prisma.rolePermission.findMany).mockResolvedValue([]);

    const permissions = await repository.findPermissionNamesForUser(99n);

    expect(permissions).toEqual([]);
  });
});
