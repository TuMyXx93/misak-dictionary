/**
 * AuthController Integration Tests
 * Sprint 2 - Auth System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { AuthController } from './AuthController.js';
import type { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import type { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';

describe('AuthController Integration Tests', () => {
  let app: FastifyInstance;
  let mockLoginExecute: ReturnType<typeof vi.fn>;
  let mockRefreshExecute: ReturnType<typeof vi.fn>;
  let mockLogoutExecute: ReturnType<typeof vi.fn>;

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

    // Create mock use cases
    const mockLoginUseCase = { execute: mockLoginExecute } as unknown as LoginUseCase;
    const mockRefreshUseCase = { execute: mockRefreshExecute } as unknown as RefreshTokenUseCase;
    const mockLogoutUseCase = { execute: mockLogoutExecute } as unknown as LogoutUseCase;

    // Create controller with mocked use cases
    const authController = new AuthController(
      mockLoginUseCase,
      mockRefreshUseCase,
      mockLogoutUseCase,
    );

    // Create Fastify instance and register routes manually
    app = Fastify({ logger: false });
    app.post('/auth/login', authController.login.bind(authController));
    app.post('/auth/refresh', authController.refresh.bind(authController));
    app.post('/auth/logout', authController.logout.bind(authController));
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
});
