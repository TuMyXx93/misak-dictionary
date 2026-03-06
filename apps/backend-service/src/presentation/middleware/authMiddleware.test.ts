/**
 * @module authMiddleware.test
 * @description Tests unitarios para el middleware de autenticación JWT.
 * Sprint 2 - Auth System
 *
 * Verifica que el middleware extraiga, valide y decodifique tokens JWT
 * correctamente, rechazando peticiones sin token o con token inválido.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ========== MOCKS ==========

const { mockVerifyAccessToken } = vi.hoisted(() => ({
  mockVerifyAccessToken: vi.fn(),
}));

vi.mock('../../infrastructure/auth/TokenService.js', () => {
  // biome-ignore lint/complexity/useArrowFunction: se requiere función regular para que sea constructable con `new`
  const MockTokenService = function () {
    return {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyAccessToken: mockVerifyAccessToken,
      verifyRefreshToken: vi.fn(),
    };
  };
  return { TokenService: MockTokenService };
});

import { authMiddleware } from './authMiddleware.js';

// ========== TEST DATA ==========

/**
 * Payload simulado de token JWT válido.
 * Se usa string para userId en lugar de BigInt porque Fastify
 * serializa la respuesta a JSON y BigInt no es serializable.
 */
const validTokenPayload = {
  userId: '1',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['admin'],
};

// ========== TESTS ==========

describe('authMiddleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // 1. Crear instancia de Fastify con el middleware como preHandler
    app = Fastify({ logger: false });
    app.addHook('preHandler', authMiddleware);
    app.get('/test', async (request) => {
      return { user: request.user };
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ========== HEADER MISSING ==========

  it('debería retornar 401 cuando falta el header Authorization', async () => {
    // Arrange — sin header Authorization

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    // Assert
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Authorization header is missing');
  });

  // ========== INVALID FORMAT ==========

  it('debería retornar 401 cuando el formato del header es inválido (sin Bearer)', async () => {
    // Arrange — header sin prefijo Bearer

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: 'Basic some-token',
      },
    });

    // Assert
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Invalid authorization header format');
  });

  it('debería retornar 401 cuando falta el token después de Bearer', async () => {
    // Arrange — header con Bearer pero sin token

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: 'Bearer',
      },
    });

    // Assert
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Invalid authorization header format');
  });

  // ========== INVALID / EXPIRED TOKEN ==========

  it('debería retornar 401 cuando el token es inválido o expirado', async () => {
    // Arrange — verifyAccessToken retorna null (token inválido)
    mockVerifyAccessToken.mockReturnValue(null);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    // Assert
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Invalid or expired token');
  });

  // ========== VALID TOKEN ==========

  it('debería establecer request.user cuando el token es válido', async () => {
    // Arrange — verifyAccessToken retorna un payload válido
    mockVerifyAccessToken.mockReturnValue(validTokenPayload);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: 'Bearer valid-token-123',
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.username).toBe('testuser');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.roles).toEqual(['admin']);
  });

  // ========== ERROR HANDLING ==========

  it('debería retornar 401 cuando verifyAccessToken lanza un error', async () => {
    // Arrange — verifyAccessToken lanza excepción inesperada
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Unexpected JWT error');
    });

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: 'Bearer error-token',
      },
    });

    // Assert
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Authentication failed');
  });

  // ========== TOKEN FORWARDING ==========

  it('debería pasar el token correcto a verifyAccessToken', async () => {
    // Arrange
    const specificToken = 'my-specific-jwt-token-abc123';
    mockVerifyAccessToken.mockReturnValue(validTokenPayload);

    // Act
    await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        authorization: `Bearer ${specificToken}`,
      },
    });

    // Assert
    expect(mockVerifyAccessToken).toHaveBeenCalledTimes(1);
    expect(mockVerifyAccessToken).toHaveBeenCalledWith(specificToken);
  });
});
