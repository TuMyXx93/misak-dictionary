/**
 * LoginUseCase Tests
 * Sprint 2 - Auth System
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AccountLockedError,
  AccountSuspendedError,
  InvalidCredentialsError,
} from '../../../domain/errors/AuthErrors.js';
import type {
  IPasswordService,
  ISessionRepository,
  ITokenService,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import { LoginUseCase } from './LoginUseCase.js';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: IUserRepository;
  let mockPasswordService: IPasswordService;
  let mockTokenService: ITokenService;
  let mockSessionRepository: ISessionRepository;
  // biome-ignore lint/suspicious/noExplicitAny: doble de prueba ligero para AuditService
  let mockAuditService: any;

  const mockUser = {
    id: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUserWithRoles = {
    ...mockUser,
    roles: [{ roleId: BigInt(1), role: { id: BigInt(1), name: 'user' } }],
  };

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findByIdWithRoles: vi.fn(),
    } as unknown as IUserRepository;

    // Mock PasswordService
    mockPasswordService = {
      hash: vi.fn(),
      compare: vi.fn(),
      needsRehash: vi.fn().mockReturnValue(false),
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

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockPasswordService,
      mockTokenService,
      mockSessionRepository,
      mockAuditService,
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
      expect(result.user.mustChangePassword).toBe(false);
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
      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw AccountSuspendedError for inactive user (R-011)', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(inactiveUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow(AccountSuspendedError);
    });

    it('should reject login if account is locked by failed attempts', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      };
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(lockedUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow(AccountLockedError);
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
      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw generic error if user not found after password verification (R-011)', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(null);

      const input = {
        username: 'testuser',
        password: 'correctPassword',
      };

      // Act & Assert
      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
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

    it('should rehash legacy bcrypt password on login (R-005)', async () => {
      // Arrange
      const legacyUser = { ...mockUser, password: '$2a$10$legacybcrypthash' };
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(legacyUser);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUserWithRoles);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordService.needsRehash).mockReturnValue(true);
      vi.mocked(mockPasswordService.hash).mockResolvedValue('$argon2id$newhash');
      const updatePassword = vi.fn();
      (mockUserRepository as unknown as { updatePassword: typeof updatePassword }).updatePassword =
        updatePassword;

      // Act
      await loginUseCase.execute({
        username: 'testuser',
        password: 'correctPassword',
      });

      // Assert
      expect(mockPasswordService.hash).toHaveBeenCalledWith('correctPassword');
      expect(updatePassword).toHaveBeenCalledWith(BigInt(1), '$argon2id$newhash');
    });

    it('should not rehash when password is already argon2', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUserWithRoles);
      vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordService.needsRehash).mockReturnValue(false);

      // Act
      await loginUseCase.execute({
        username: 'testuser',
        password: 'correctPassword',
      });

      // Assert
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
    });

    it('should generate correct token payload', async () => {
      // Arrange
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [
          { roleId: BigInt(1), role: { id: BigInt(1), name: 'user' } },
          { roleId: BigInt(2), role: { id: BigInt(2), name: 'admin' } },
        ],
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
  it('should audit failed login attempts (R-012)', async () => {
    // Arrange
    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

    // Act & Assert
    await expect(loginUseCase.execute({ username: 'ghost', password: 'x' })).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login.failed',
        actorUsername: 'ghost',
        newData: { reason: 'user_not_found' },
      }),
    );
  });

  it('should audit successful login (R-012)', async () => {
    // Arrange
    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
    vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(mockUserWithRoles);
    vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

    // Act
    await loginUseCase.execute({
      username: 'testuser',
      password: 'correctPassword',
    });

    // Assert
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login',
        actorUsername: 'testuser',
        newData: { roles: ['user'] },
      }),
    );
  });

  it('should propagate mustChangePassword = true when user has a temporary password (R-028)', async () => {
    const tempUser = { ...mockUser, mustChangePassword: true };
    const tempUserWithRoles = { ...mockUserWithRoles, mustChangePassword: true };
    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(tempUser);
    vi.mocked(mockUserRepository.findByIdWithRoles).mockResolvedValue(tempUserWithRoles);
    vi.mocked(mockPasswordService.compare).mockResolvedValue(true);

    const result = await loginUseCase.execute({
      username: 'testuser',
      password: 'TempPassword123!',
    });

    expect(result.user.mustChangePassword).toBe(true);
  });
});
