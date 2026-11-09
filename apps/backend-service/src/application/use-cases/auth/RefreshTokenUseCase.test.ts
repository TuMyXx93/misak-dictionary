/**
 * RefreshTokenUseCase Tests
 * Spec 002 - Auth RBAC
 * R-006: rotación de refresh tokens con detección de reuso.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ISessionRepository,
  ITokenService,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepository: IUserRepository;
  let mockTokenService: ITokenService;
  let mockSessionRepository: ISessionRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuditService: any;

  const mockUser = {
    id: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    roles: [{ role: { name: 'user' } }],
  };

  const mockSession = {
    id: 'session-uuid-1',
    userId: BigInt(1),
    token: 'valid-refresh-token',
    tokenHash: 'hash-of-valid-refresh-token',
    familyId: 'family-uuid-1',
    revokedAt: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    createdAt: new Date(),
  };

  const mockTokenPayload = {
    userId: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user'],
  };

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByIdWithRoles: vi.fn(),
    } as unknown as IUserRepository;

    // Mock TokenService
    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
      verifyRefreshToken: vi.fn(),
    } as unknown as ITokenService;

    // Mock SessionRepository
    mockSessionRepository = {
      findByToken: vi.fn(),
      findByTokenHash: vi.fn(),
      findRevokedByTokenHash: vi.fn().mockResolvedValue(null),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeFamily: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue(mockSession),
      deleteByToken: vi.fn(),
    } as unknown as ISessionRepository;

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockUserRepository,
      mockTokenService,
      mockSessionRepository,
      mockAuditService,
    );
  });

  describe('execute', () => {
    it('debe rotar el refresh token con uno válido (R-006)', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUser);

      // Act
      const result = await refreshTokenUseCase.execute({
        refreshToken: 'valid-refresh-token',
      });

      // Assert
      expect(result.tokens.accessToken).toBe('new-access-token');
      expect(result.tokens.refreshToken).toBe('new-refresh-token');
      expect(mockSessionRepository.revoke).toHaveBeenCalledWith('session-uuid-1');
      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'new-refresh-token',
          familyId: 'family-uuid-1',
        }),
      );
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.refresh.rotated' }),
      );
    });

    it('debe rechazar token con firma inválida', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(null);

      // Act & Assert
      await expect(refreshTokenUseCase.execute({ refreshToken: 'invalid-token' })).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('debe revocar la familia ante reuso de token rotado (R-006)', async () => {
      // Arrange
      const revokedSession = { ...mockSession, revokedAt: new Date() };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(null);
      vi.mocked(mockSessionRepository.findRevokedByTokenHash).mockResolvedValue(revokedSession);
      vi.mocked(mockSessionRepository.revokeFamily).mockResolvedValue(3);

      // Act & Assert
      await expect(refreshTokenUseCase.execute({ refreshToken: 'rotated-token' })).rejects.toThrow(
        'Session revoked due to token reuse',
      );
      expect(mockSessionRepository.revokeFamily).toHaveBeenCalledWith('family-uuid-1');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.refresh.reuse_detected',
          newData: expect.objectContaining({ revokedSessions: 3 }),
        }),
      );
    });

    it('debe rechazar token desconocido sin familia revocada', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(null);
      vi.mocked(mockSessionRepository.findRevokedByTokenHash).mockResolvedValue(null);

      // Act & Assert
      await expect(refreshTokenUseCase.execute({ refreshToken: 'unknown-token' })).rejects.toThrow(
        'Session not found',
      );
    });

    it('debe eliminar y rechazar sesión expirada', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(expiredSession);

      // Act & Assert
      await expect(refreshTokenUseCase.execute({ refreshToken: 'expired-token' })).rejects.toThrow(
        'Session expired',
      );
      expect(mockSessionRepository.deleteByToken).toHaveBeenCalledWith('expired-token');
    });

    it('debe devolver error genérico si el usuario no existe (R-011)', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(null);

      // Act & Assert
      await expect(
        refreshTokenUseCase.execute({ refreshToken: 'valid-refresh-token' }),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('debe devolver error genérico para usuario inactivo (R-011)', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act & Assert
      await expect(
        refreshTokenUseCase.execute({ refreshToken: 'valid-refresh-token' }),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('debe generar access token con roles actualizados', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue({
        ...mockUser,
        roles: [{ role: { name: 'user' } }, { role: { name: 'admin' } }],
      });

      // Act
      await refreshTokenUseCase.execute({
        refreshToken: 'valid-refresh-token',
      });

      // Assert
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: BigInt(1),
          username: 'testuser',
          roles: ['user', 'admin'],
        }),
      );
    });
  });
});
