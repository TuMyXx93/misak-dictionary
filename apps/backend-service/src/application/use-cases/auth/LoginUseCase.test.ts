/**
 * LoginUseCase Tests
 * Sprint 2 - Auth System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginUseCase } from './LoginUseCase.js';
import type {
  IUserRepository,
  IPasswordService,
  ITokenService,
  ISessionRepository,
} from '../../../domain/interfaces/IAuthServices.js';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: IUserRepository;
  let mockPasswordService: IPasswordService;
  let mockTokenService: ITokenService;
  let mockSessionRepository: ISessionRepository;

  const mockUser = {
    id: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithRoles = {
    ...mockUser,
    roles: [{ role: { name: 'user' } }],
  };

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByUsername: vi.fn(),
      findByIdWithRoles: vi.fn(),
    } as unknown as IUserRepository;

    // Mock PasswordService
    mockPasswordService = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordService;

    // Mock TokenService
    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    } as unknown as ITokenService;

    // Mock SessionRepository
    mockSessionRepository = {
      create: vi.fn(),
      findByToken: vi.fn(),
      deleteByToken: vi.fn(),
    } as unknown as ISessionRepository;

    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockPasswordService,
      mockTokenService,
      mockSessionRepository,
    );
  });

  describe('execute', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUserWithRoles);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.id).toBe('1');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.roles).toEqual(['user']);
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
      expect(result.tokens.expiresIn).toBe(900);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashedPassword123',
      );
      expect(mockSessionRepository.create).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      const input = {
        username: 'nonexistent',
        password: 'password',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(inactiveUser);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('User account is inactive');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(false);

      const input = {
        username: 'testuser',
        password: 'wrongPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user not found after password verification', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(null);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow('User not found');
    });

    it('should handle optional ipAddress and userAgent', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUserWithRoles);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(mockSessionRepository.create).toHaveBeenCalled();
    });

    it('should generate correct token payload', async () => {
      // Arrange
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [{ role: { name: 'user' } }, { role: { name: 'admin' } }],
      };

      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(userWithMultipleRoles);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act
      const result = await loginUseCase.execute(input);

      // Assert
      expect(result.user.roles).toEqual(['user', 'admin']);
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: BigInt(1),
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user', 'admin'],
        }),
      );
    });
  });
});
