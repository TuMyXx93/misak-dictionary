/**
 * @module authorizationMiddleware.test
 * @description Tests unitarios para el middleware de autorización por roles.
 * Spec 006 — Admin API
 *
 * Verifica que requireRoles, requireAdmin y requireSuperAdmin
 * permitan o denieguen el acceso según los roles del usuario autenticado.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { requireAdmin, requireRoles, requireSuperAdmin } from './authorizationMiddleware.js';

// ========== TEST DATA ==========

// biome-ignore lint/suspicious/noExplicitAny: mock flexible para simular distintos payloads de usuario en tests
let currentUser: any;

// ========== TESTS ==========

describe('authorizationMiddleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // 1. Resetear usuario antes de cada test
    currentUser = undefined;

    // 2. Crear instancia de Fastify con hook que simula autenticación previa
    app = Fastify({ logger: false });

    app.addHook('preHandler', async (request) => {
      if (currentUser !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: asignación dinámica de user para simular authMiddleware
        (request as any).user = currentUser;
      }
    });

    // 3. Registrar rutas con distintos middlewares de autorización
    app.get('/roles-custom', { preHandler: requireRoles('viewer', 'moderator') }, async () => ({
      ok: true,
    }));
    app.get('/admin', { preHandler: requireAdmin }, async () => ({ ok: true }));
    app.get('/super-admin', { preHandler: requireSuperAdmin }, async () => ({
      ok: true,
    }));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ========== requireRoles (genérico) ==========

  describe('requireRoles', () => {
    it('debería retornar 401 cuando el usuario no está autenticado', async () => {
      // Arrange — currentUser no se establece (undefined)

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/roles-custom',
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('No estás autenticado');
    });

    it('debería retornar 403 cuando el usuario no tiene los roles requeridos', async () => {
      // Arrange — usuario con rol que no coincide
      currentUser = { userId: 1, username: 'user1', roles: ['editor'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/roles-custom',
      });

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(403);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('viewer');
      expect(body.message).toContain('moderator');
    });

    it('debería permitir acceso cuando el usuario tiene uno de los roles requeridos', async () => {
      // Arrange — usuario con rol 'moderator' que está permitido
      currentUser = { userId: 1, username: 'mod1', roles: ['moderator'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/roles-custom',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
    });

    it('debería retornar 403 cuando el usuario tiene roles vacíos', async () => {
      // Arrange — usuario sin roles
      currentUser = { userId: 1, username: 'noroles', roles: [] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/roles-custom',
      });

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });
  });

  // ========== requireAdmin ==========

  describe('requireAdmin', () => {
    it('debería permitir acceso al rol admin', async () => {
      // Arrange
      currentUser = { userId: 2, username: 'admin1', roles: ['admin'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
    });

    it('debería permitir acceso al rol super_admin', async () => {
      // Arrange
      currentUser = {
        userId: 3,
        username: 'superadmin1',
        roles: ['super_admin'],
      };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
    });

    it('debería denegar acceso al rol editor', async () => {
      // Arrange
      currentUser = { userId: 4, username: 'editor1', roles: ['editor'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
      });

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('admin');
      expect(body.message).toContain('super_admin');
    });
  });

  // ========== requireSuperAdmin ==========

  describe('requireSuperAdmin', () => {
    it('debería permitir acceso únicamente al rol super_admin', async () => {
      // Arrange
      currentUser = {
        userId: 9,
        username: 'superadmin3',
        roles: ['super_admin'],
      };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/super-admin',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
    });

    it('debería denegar acceso al rol admin', async () => {
      // Arrange
      currentUser = { userId: 10, username: 'admin3', roles: ['admin'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/super-admin',
      });

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });

    it('debería denegar acceso al rol editor', async () => {
      // Arrange
      currentUser = { userId: 11, username: 'editor3', roles: ['editor'] };

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/super-admin',
      });

      // Assert
      expect(response.statusCode).toBe(403);
    });
  });
});
