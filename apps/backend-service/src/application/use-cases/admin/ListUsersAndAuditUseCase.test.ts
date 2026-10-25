import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { ListAuditUseCase } from './ListAuditUseCase.js';
import { ListUsersUseCase } from './ListUsersUseCase.js';

describe('ListUsersUseCase & ListAuditUseCase', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
      },
    };
  });

  describe('ListUsersUseCase', () => {
    it('lista usuarios con roles y nunca incluye passwordHash ni tokens', async () => {
      const mockUsers = [
        {
          id: 1n,
          username: 'admin1',
          email: 'admin1@misak.org',
          isActive: true,
          mustChangePassword: false,
          createdAt: new Date('2026-10-01'),
          userRoles: [
            {
              role: { name: 'super_admin' },
            },
            {
              role: { name: 'cultural_reviewer' },
            },
          ],
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const useCase = new ListUsersUseCase(mockPrisma as unknown as PrismaClient);
      const result = await useCase.execute();

      expect(result.items).toHaveLength(1);
      const user = result.items[0]!;
      expect(user).toEqual(
        expect.objectContaining({
          id: '1',
          username: 'admin1',
          email: 'admin1@misak.org',
          isActive: true,
          mustChangePassword: false,
          createdAt: expect.any(Date),
          roles: ['super_admin', 'cultural_reviewer'],
        }),
      );

      // Validar que no existan campos sensibles
      expect((user as any).passwordHash).toBeUndefined();
      expect((user as any).token).toBeUndefined();
    });
  });

  describe('ListAuditUseCase', () => {
    it('filtra logs por entidad y rango de fechas, sanitizando claves sensibles en oldData y newData', async () => {
      const mockLogs = [
        {
          id: 100n,
          actorUserId: 1n,
          actorUsername: 'admin',
          action: 'update_password',
          entity: 'user',
          entityId: '1',
          oldData: {
            passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$secret_hash_here',
            email: 'admin@misak.org',
          },
          newData: {
            passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$new_secret_hash',
            email: 'admin@misak.org',
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2026-10-15T12:00:00Z'),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const useCase = new ListAuditUseCase(mockPrisma as unknown as PrismaClient);
      const desde = new Date('2026-10-01');
      const hasta = new Date('2026-10-16');

      const result = await useCase.execute({
        entity: 'user',
        desde,
        hasta,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            entity: 'user',
            createdAt: {
              gte: desde,
              lte: hasta,
            },
          },
          orderBy: { id: 'desc' },
        }),
      );

      expect(result.items).toHaveLength(1);
      const log = result.items[0]!;
      expect(log.oldData.passwordHash).toBe('[REDACTED]');
      expect(log.newData.passwordHash).toBe('[REDACTED]');
      expect(log.oldData.email).toBe('admin@misak.org');
    });
  });
});
