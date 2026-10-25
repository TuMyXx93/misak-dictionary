/**
 * AuthController Integration Tests
 * Sprint 2 - Auth System
 */

import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangePasswordUseCase } from '../../application/use-cases/auth/ChangePasswordUseCase.js';
import type { GetAuthMeUseCase } from '../../application/use-cases/auth/GetAuthMeUseCase.js';
import type { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import type { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { AuthController } from './AuthController.js';

describe('AuthController Integration Tests', () => {
  let app: FastifyInstance;
  let mockLoginExecute: ReturnType<typeof vi.fn>;
  let mockRefreshExecute: ReturnType<typeof vi.fn>;
  let mockLogoutExecute: ReturnType<typeof vi.fn>;
  let mockMeExecute: ReturnType<typeof vi.fn>;
  let mockChangePasswordExecute: ReturnType<typeof vi.fn>;
  let currentUser: { userId: bigint; username: string; roles: string[] } | undefined;

  const mockLoginResponse = {
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['user'],
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
    },
  };

  const mockRefreshResponse = {
    tokens: {
      accessToken: 'new-access-token',
      refreshToken: 'same-refresh-token',
      expiresIn: 900,
    },
  };

  beforeEach(async () => {
    // Create mocked execute functions
    mockLoginExecute = vi.fn();
    mockRefreshExecute = vi.fn();
    mockLogoutExecute = vi.fn();
    mockMeExecute = vi.fn();
    mockChangePasswordExecute = vi.fn();
    currentUser = undefined;

    // Create mock use cases
    const mockLoginUseCase = { execute: mockLoginExecute } as unknown as LoginUseCase;
    const mockRefreshUseCase = { execute: mockRefreshExecute } as unknown as RefreshTokenUseCase;
    const mockLogoutUseCase = { execute: mockLogoutExecute } as unknown as LogoutUseCase;
    const mockGetAuthMeUseCase = { execute: mockMeExecute } as unknown as GetAuthMeUseCase;
    const mockChangePasswordUseCase = {
      execute: mockChangePasswordExecute,
    } as unknown as ChangePasswordUseCase;

    // Create controller with mocked use cases
    const authController = new AuthController(
      mockLoginUseCase,
      mockRefreshUseCase,
      mockLogoutUseCase,
      mockGetAuthMeUseCase,
      mockChangePasswordUseCase,
    );

    // Create Fastify instance and register cookie plugin + routes manually
    app = Fastify({ logger: false });
    await app.register(cookie);

    app.addHook('preHandler', async (request) => {
      if (currentUser !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: mock authMiddleware
        (request as any).user = currentUser;
      }
    });

    app.post('/auth/login', authController.login.bind(authController));
    app.post('/auth/refresh', authController.refresh.bind(authController));
    app.post('/auth/logout', authController.logout.bind(authController));
    app.get('/auth/me', authController.me.bind(authController));
    app.post('/auth/change-password', authController.changePassword.bind(authController));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockLoginExecute.mockResolvedValue(mockLoginResponse);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'Test123!',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(200);
      expect(body.message).toBe('Login successful');
      expect(body.data.user.username).toBe('testuser');
      expect(body.data.tokens.accessToken).toBe('mock-access-token');
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockLoginExecute.mockRejectedValue(new Error('Invalid credentials'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'wronguser',
          password: 'wrongpass',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 for inactive user', async () => {
      // Arrange
      mockLoginExecute.mockRejectedValue(new Error('User account is inactive'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'inactiveuser',
          password: 'Test123!',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('inactive');
    });

    it('should return 400 for missing username', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          password: 'Test123!',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for short password', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'short',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should successfully refresh token', async () => {
      // Arrange
      mockRefreshExecute.mockResolvedValue(mockRefreshResponse);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(200);
      expect(body.message).toBe('Token refreshed successfully');
      expect(body.data.tokens.accessToken).toBe('new-access-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      mockRefreshExecute.mockRejectedValue(new Error('Invalid or expired refresh token'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 for expired session', async () => {
      // Arrange
      mockRefreshExecute.mockRejectedValue(new Error('Session expired'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'expired-session-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for missing refresh token', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout', async () => {
      // Arrange
      mockLogoutExecute.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        payload: {
          refreshToken: 'valid-refresh-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(200);
      expect(body.message).toBe('Logout successful');
    });

    it('should handle logout for non-existent session', async () => {
      // Arrange
      mockLogoutExecute.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        payload: {
          refreshToken: 'non-existent-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
    });

    it('should return 400 for missing refresh token', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });

    it('should return 500 for internal errors', async () => {
      // Arrange
      mockLogoutExecute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        payload: {
          refreshToken: 'valid-token',
        },
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('Modo Cookie Opt-in (X-Client: web-admin)', () => {
    it('en login emite la cookie misak_rt y propaga mustChangePassword desde GetAuthMeUseCase', async () => {
      mockLoginExecute.mockResolvedValue({
        ...mockLoginResponse,
        user: {
          ...mockLoginResponse.user,
          mustChangePassword: true,
        },
      });
      mockMeExecute.mockResolvedValue({
        userId: '1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        mustChangePassword: true,
        roles: ['user'],
        permissions: ['dictionary:read'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: {
          'x-client': 'web-admin',
          origin: 'http://localhost:5173',
        },
        payload: {
          username: 'testuser',
          password: 'Test123!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(200);
      expect(body.data.user.mustChangePassword).toBe(true);
      expect(body.data.user.permissions).toEqual(['dictionary:read']);
      expect(body.data.tokens.accessToken).toBe('mock-access-token');
      expect(body.data.tokens.refreshToken).toBeUndefined();

      // Cookie header
      const cookieHeader = response.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const cookieStr = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
      expect(cookieStr).toContain('misak_rt=mock-refresh-token');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('Path=/auth');
    });

    it('en login rechaza con 403 si el Origin no está permitido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: {
          'x-client': 'web-admin',
          origin: 'http://malicious-site.com',
        },
        payload: {
          username: 'testuser',
          password: 'Test123!',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Origin no permitido');
    });

    it('en refresh lee la cookie misak_rt, rota el token y emite nueva cookie', async () => {
      mockRefreshExecute.mockResolvedValue(mockRefreshResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          'x-client': 'web-admin',
          origin: 'http://localhost:5173',
          cookie: 'misak_rt=existing-refresh-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.tokens.accessToken).toBe('new-access-token');
      expect(body.data.tokens.refreshToken).toBeUndefined();

      const cookieHeader = response.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const cookieStr = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
      expect(cookieStr).toContain('misak_rt=same-refresh-token');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('en refresh rechaza con 401 si no hay cookie misak_rt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          'x-client': 'web-admin',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('cookie');
    });

    it('en logout borra la cookie misak_rt y retorna 200', async () => {
      mockLogoutExecute.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          'x-client': 'web-admin',
          cookie: 'misak_rt=token-to-revoke',
        },
      });

      expect(response.statusCode).toBe(200);
      const cookieHeader = response.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const cookieStr = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
      expect(cookieStr).toContain('misak_rt=;');
    });
  });

  describe('GET /auth/me', () => {
    it('retorna 401 si no hay usuario autenticado', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('retorna la información del usuario resuelta en servidor', async () => {
      currentUser = {
        userId: 42n,
        username: 'namtrik_user',
        roles: ['cultural_reviewer'],
      };

      const mockMeData = {
        userId: '42',
        username: 'namtrik_user',
        email: 'namtrik@misak.org',
        fullName: 'Namtrik Lingüista',
        mustChangePassword: false,
        roles: ['cultural_reviewer'],
        permissions: ['dictionary:read', 'taxonomy:ratify'],
      };
      mockMeExecute.mockResolvedValue(mockMeData);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockMeData);
      expect(mockMeExecute).toHaveBeenCalledWith({ userId: 42n });
    });
  });

  describe('POST /auth/change-password', () => {
    it('retorna 401 si no hay usuario autenticado', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        payload: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePassword2026!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('retorna 400 si faltan campos o la contraseña es muy corta', async () => {
      currentUser = {
        userId: 1n,
        username: 'admin',
        roles: ['super_admin'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        payload: {
          currentPassword: 'OldPassword123!',
          newPassword: 'short',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('actualiza la contraseña exitosamente', async () => {
      currentUser = {
        userId: 1n,
        username: 'admin',
        roles: ['super_admin'],
      };

      mockChangePasswordExecute.mockResolvedValue({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        payload: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePassword2026!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('exitosa');
      expect(mockChangePasswordExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1n,
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePassword2026!',
        }),
      );
    });
  });
});
