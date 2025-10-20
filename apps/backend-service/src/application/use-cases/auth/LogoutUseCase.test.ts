/**
 * LogoutUseCase Tests
 * Sprint 2 - Auth System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogoutUseCase } from './LogoutUseCase.js';
import type { ISessionRepository } from '../../../domain/interfaces/IAuthServices.js';

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;
  let mockSessionRepository: ISessionRepository;

  const mockSession = {
    id: BigInt(1),
    userId: BigInt(1),
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Mock SessionRepository
    mockSessionRepository = {
      findByToken: vi.fn(),
      deleteByToken: vi.fn(),
      create: vi.fn(),
    } as unknown as ISessionRepository;

    logoutUseCase = new LogoutUseCase(mockSessionRepository);
  });

  describe('execute', () => {
    it('should successfully logout and delete session', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);

      const input = {
        refreshToken: 'valid-refresh-token',
      };

      // Act
      await logoutUseCase.execute(input);

      // Assert
      expect(mockSessionRepository.findByToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionRepository.deleteByToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should handle logout when session does not exist', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(null);

      const input = {
        refreshToken: 'non-existent-token',
      };

      // Act
      await logoutUseCase.execute(input);

      // Assert
      expect(mockSessionRepository.findByToken).toHaveBeenCalledWith('non-existent-token');
      expect(mockSessionRepository.deleteByToken).not.toHaveBeenCalled();
    });

    it('should not throw error when session already deleted', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(null);

      const input = {
        refreshToken: 'already-deleted-token',
      };

      // Act & Assert
      await expect(logoutUseCase.execute(input)).resolves.toBeUndefined();
    });

    it('should delete session regardless of expiration', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(expiredSession);

      const input = {
        refreshToken: 'expired-token',
      };

      // Act
      await logoutUseCase.execute(input);

      // Assert
      expect(mockSessionRepository.deleteByToken).toHaveBeenCalledWith('expired-token');
    });

    it('should complete successfully with valid token', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockSessionRepository.deleteByToken).mockResolvedValue(undefined);

      const input = {
        refreshToken: 'valid-token',
      };

      // Act & Assert
      await expect(logoutUseCase.execute(input)).resolves.toBeUndefined();
    });
  });
});
