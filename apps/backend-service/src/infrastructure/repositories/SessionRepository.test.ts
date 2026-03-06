/**
 * SessionRepository Tests
 * Sprint 2 - Auth System
 * Tests para el repositorio de sesiones con Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { SessionRepository } from './SessionRepository.js';

describe('SessionRepository', () => {
  let repository: SessionRepository;

  // ========== FIXTURES ==========
  const mockSession = {
    id: 'session-uuid-1',
    userId: BigInt(1),
    token: 'jwt-refresh-token-abc123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    repository = new SessionRepository();
  });

  // ========== create ==========
  describe('create', () => {
    it('debería crear sesión con todos los campos incluyendo opcionales', async () => {
      // Arrange
      const createData = {
        userId: BigInt(1),
        token: 'jwt-refresh-token-abc123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date('2025-12-31'),
      };
      vi.mocked(prisma.session.create).mockResolvedValue(mockSession);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result).toEqual(mockSession);
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          token: createData.token,
          expiresAt: createData.expiresAt,
          ipAddress: createData.ipAddress,
          userAgent: createData.userAgent,
        },
      });
    });

    it('debería crear sesión sin ipAddress ni userAgent opcionales', async () => {
      // Arrange
      const createData = {
        userId: BigInt(1),
        token: 'jwt-refresh-token-xyz',
        expiresAt: new Date('2025-12-31'),
      };
      const sessionWithoutOptionals = {
        ...mockSession,
        token: createData.token,
        ipAddress: null,
        userAgent: null,
      };
      vi.mocked(prisma.session.create).mockResolvedValue(sessionWithoutOptionals);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result).toEqual(sessionWithoutOptionals);
      // 1. Verifica que NO se incluyan los campos opcionales en el data
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          token: createData.token,
          expiresAt: createData.expiresAt,
        },
      });
    });
  });

  // ========== findByToken ==========
  describe('findByToken', () => {
    it('debería retornar la sesión cuando el token existe', async () => {
      // Arrange
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      // Act
      const result = await repository.findByToken('jwt-refresh-token-abc123');

      // Assert
      expect(result).toEqual(mockSession);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'jwt-refresh-token-abc123' },
      });
    });

    it('debería retornar null cuando el token no existe', async () => {
      // Arrange
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findByToken('token-inexistente');

      // Assert
      expect(result).toBeNull();
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'token-inexistente' },
      });
    });
  });

  // ========== deleteByToken ==========
  describe('deleteByToken', () => {
    it('debería eliminar la sesión por token', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma delete retorna el registro eliminado
      vi.mocked(prisma.session.delete).mockResolvedValue(mockSession as any);

      // Act
      await repository.deleteByToken('jwt-refresh-token-abc123');

      // Assert
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'jwt-refresh-token-abc123' },
      });
    });
  });

  // ========== deleteExpired ==========
  describe('deleteExpired', () => {
    it('debería retornar la cantidad de sesiones expiradas eliminadas', async () => {
      // Arrange
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 5 });

      // Act
      const result = await repository.deleteExpired();

      // Assert
      expect(result).toBe(5);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});
