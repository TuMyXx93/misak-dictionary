/**
 * ManageUserRolesUseCase Tests
 * Spec 002 - Auth RBAC
 * R-007: asignar/revocar roles con auditoría; protección del último super_admin.
 */

import { describe, expect, it, vi } from 'vitest';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { ManageUserRolesUseCase } from './ManageUserRolesUseCase.js';

// Tipo del repo extendido que usa el use case
type MockUserRepo = {
  findByIdWithRoles: ReturnType<typeof vi.fn>;
  assignRole: ReturnType<typeof vi.fn>;
  revokeRole: ReturnType<typeof vi.fn>;
  findRoleByName: ReturnType<typeof vi.fn>;
  countSuperAdmins: ReturnType<typeof vi.fn>;
};

describe('ManageUserRolesUseCase', () => {
  const targetUser = {
    id: BigInt(2),
    username: 'ana',
    email: 'ana@misak.local',
    password: 'hash',
    fullName: 'Ana Linguista',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    roles: [],
  };

  const superAdminRole = { id: BigInt(1), name: 'super_admin' };
  const linguistRole = { id: BigInt(2), name: 'linguist' };

  const buildUseCase = (overrides: Partial<MockUserRepo> = {}) => {
    const repo: MockUserRepo = {
      findByIdWithRoles: vi.fn().mockResolvedValue(targetUser),
      assignRole: vi.fn().mockResolvedValue(undefined),
      revokeRole: vi.fn().mockResolvedValue(undefined),
      findRoleByName: vi.fn().mockResolvedValue(linguistRole),
      countSuperAdmins: vi.fn().mockResolvedValue(2),
      ...overrides,
    };
    const audit = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;
    // biome-ignore lint/suspicious/noExplicitAny: doble de prueba ligero para UserRepository
    const useCase = new ManageUserRolesUseCase(repo as any, audit);
    return { useCase, repo, audit };
  };

  const baseInput = {
    targetUserId: BigInt(2),
    roleName: 'linguist',
    actorUserId: BigInt(1),
    actorUsername: 'root',
    ipAddress: '127.0.0.1',
  };

  describe('assign', () => {
    it('asigna el rol y audita el cambio (R-007)', async () => {
      const { useCase, repo, audit } = buildUseCase();

      await useCase.assign(baseInput);

      expect(repo.assignRole).toHaveBeenCalledWith(BigInt(2), BigInt(2));
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin.role.assigned',
          entity: 'user',
          entityId: '2',
          actorUsername: 'root',
          newData: expect.objectContaining({ role: 'linguist' }),
        }),
      );
    });

    it('rechaza roles inexistentes', async () => {
      const { useCase, repo } = buildUseCase({
        findRoleByName: vi.fn().mockResolvedValue(null),
      });

      await expect(useCase.assign(baseInput)).rejects.toThrow('Role not found');
      expect(repo.assignRole).not.toHaveBeenCalled();
    });

    it('rechaza usuarios inexistentes', async () => {
      const { useCase, repo } = buildUseCase({
        findByIdWithRoles: vi.fn().mockResolvedValue(null),
      });

      await expect(useCase.assign(baseInput)).rejects.toThrow('User not found');
      expect(repo.assignRole).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('revoca el rol y audita', async () => {
      const { useCase, repo, audit } = buildUseCase();

      await useCase.revoke(baseInput);

      expect(repo.revokeRole).toHaveBeenCalledWith(BigInt(2), BigInt(2));
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'admin.role.revoked' }),
      );
    });

    it('protege al último super_admin', async () => {
      const { useCase, repo } = buildUseCase({
        findRoleByName: vi.fn().mockResolvedValue(superAdminRole),
        countSuperAdmins: vi.fn().mockResolvedValue(1),
      });

      await expect(useCase.revoke({ ...baseInput, roleName: 'super_admin' })).rejects.toThrow(
        'Cannot revoke the last super_admin',
      );
      expect(repo.revokeRole).not.toHaveBeenCalled();
    });

    it('permite revocar super_admin si hay más de uno', async () => {
      const { useCase, repo } = buildUseCase({
        findRoleByName: vi.fn().mockResolvedValue(superAdminRole),
        countSuperAdmins: vi.fn().mockResolvedValue(3),
      });

      await useCase.revoke({ ...baseInput, roleName: 'super_admin' });

      expect(repo.revokeRole).toHaveBeenCalledWith(BigInt(2), BigInt(1));
    });
  });
});
