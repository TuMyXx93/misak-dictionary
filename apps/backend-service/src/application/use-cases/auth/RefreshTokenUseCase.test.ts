/**
 * RefreshTokenUseCase Tests
 * Sprint 2 - Auth System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js';
import type {
  IUserRepository,
  ITokenService,
  ISessionRepository,
} from '../../../domain/interfaces/IAuthServices.js';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepository: IUserRepository;
  let mockTokenService: ITokenService;
  let mockSessionRepository: ISessionRepository;

  const mockUser = {
    id: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ role: { name: 'user' } }],
  };

  const mockSession = {
    id: BigInt(1),
    userId: BigInt(1),
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
    createdAt: new Date(),
  };

  const mockTokenPayload = {
    userId: BigInt(1),
    username: 'testuser',
    email: '',
    roles: [] as string[],
  };

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByIdWithRoles: vi.fn(),
    } as unknown as IUserRepository;

    // Mock TokenService
    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
      verifyRefreshToken: vi.fn(),
    } as unknown as ITokenService;

    // Mock SessionRepository
    mockSessionRepository = {
      findByToken: vi.fn(),
      deleteByToken: vi.fn(),
    } as unknown as ISessionRepository;

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockUserRepository,
      mockTokenService,
      mockSessionRepository,
    );
  });

  describe('execute', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUser);

      const input = {
        refreshToken: 'valid-refresh-token',
      };

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.tokens.accessToken).toBe('new-access-token');
      expect(result.tokens.refreshToken).toBe('valid-refresh-token');
      expect(result.tokens.expiresIn).toBe(900);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionRepository.findByToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.findByIdWithRoles).toHaveBeenCalledWith(BigInt(1));
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(null);

      const input = {
        refreshToken: 'invalid-token',
      };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw error when session not found', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(null);

      const input = {
        refreshToken: 'valid-but-no-session',
      };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Session not found');
    });

    it('should throw error and delete expired session', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(expiredSession);

      const input = {
        refreshToken: 'expired-session-token',
      };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Session expired');
      expect(mockSessionRepository.deleteByToken).toHaveBeenCalledWith('expired-session-token');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(null);

      const input = {
        refreshToken: 'valid-refresh-token',
      };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('User not found');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };

      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(inactiveUser);

      const input = {
        refreshToken: 'valid-refresh-token',
      };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('User account is inactive');
    });

    it('should generate new access token with updated user roles', async () => {
      // Arrange
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [{ role: { name: 'user' } }, { role: { name: 'admin' } }],
      };

      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(userWithMultipleRoles);

      const input = {
        refreshToken: 'valid-refresh-token',
      };

      // Act
      await refreshTokenUseCase.execute(input);

      // Assert
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: BigInt(1),
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user', 'admin'],
        }),
      );
    });

    it('should keep same refresh token in response', async () => {
      // Arrange
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepository.findByToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUser);

      const input = {
        refreshToken: 'my-refresh-token',
      };

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result.tokens.refreshToken).toBe('my-refresh-token');
    });
  });
});
