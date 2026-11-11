/**
 * LogoutUseCase Tests
 * Spec 002 - Auth RBAC
 * R-010: logout invalida la familia de sesiones + audita el evento.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISessionRepository } from '../../../domain/interfaces/IAuthServices.js';
import { LogoutUseCase } from './LogoutUseCase.js';

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;
  let mockSessionRepository: ISessionRepository;
  // biome-ignore lint/suspicious/noExplicitAny: doble de prueba ligero para AuditService
  let mockAuditService: any;

  const mockSession = {
    id: 'session-uuid-1',
    userId: BigInt(1),
    token: 'valid-refresh-token',
    tokenHash: 'hash-valid-refresh-token',
    familyId: 'family-uuid-1',
    revokedAt: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Mock SessionRepository
    mockSessionRepository = {
      findByToken: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeFamily: vi.fn().mockResolvedValue(1),
      deleteByToken: vi.fn(),
    } as unknown as ISessionRepository;

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    logoutUseCase = new LogoutUseCase(mockSessionRepository, mockAuditService);
  });

  describe('execute', () => {
    it('debe revocar la familia de sesiones y auditar (R-010)', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(mockSession);

      // Act
      await logoutUseCase.execute({ refreshToken: 'valid-refresh-token' });

      // Assert
      expect(mockSessionRepository.revokeFamily).toHaveBeenCalledWith('family-uuid-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.logout',
          entity: 'session',
          entityId: 'session-uuid-1',
          actorUserId: BigInt(1),
        }),
      );
    });

    it('debe resolver sin error si la sesión no existe', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(null);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(null);

      // Act & Assert
      await expect(
        logoutUseCase.execute({ refreshToken: 'non-existent-token' }),
      ).resolves.toBeUndefined();
      expect(mockSessionRepository.revokeFamily).not.toHaveBeenCalled();
      expect(mockAuditService.record).not.toHaveBeenCalled();
    });

    it('debe funcionar con sesiones legacy sin tokenHash (fallback findByToken)', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(null);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);

      // Act
      await logoutUseCase.execute({ refreshToken: 'valid-refresh-token' });

      // Assert
      expect(mockSessionRepository.findByToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionRepository.revokeFamily).toHaveBeenCalledWith('family-uuid-1');
    });
  });
});
