/**
 * Admin Maintenance & Management Routes Tests (T-026)
 * Verificación con app.inject para:
 * - DELETE /api/admin/papelera/:nivel/:id (R-017)
 * - GET /api/admin/users (R-018)
 * - GET /api/admin/audit (R-019)
 * - GET/PUT /api/admin/settings/public-only-ratified (R-026)
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { adminAuditRoutes } from './adminAuditRoutes.js';
import { adminPapeleraRoutes } from './adminPapeleraRoutes.js';
import { adminSettingsRoutes } from './adminSettingsRoutes.js';
import { adminUserRoutes } from './adminUserRoutes.js';

// Mocks de Use Cases y Servicios
const mockPapeleraPurgar = vi.fn();
const mockPapeleraListar = vi.fn();
const mockListUsersExecute = vi.fn();
const mockListAuditExecute = vi.fn();
const mockGetPublicOnlyRatified = vi.fn();
const mockSetPublicOnlyRatified = vi.fn();

vi.mock('../../../application/use-cases/admin/PapeleraUseCase.js', () => ({
  NIVELES_PAPELERA: ['palabra', 'campo', 'subcampo', 'microcampo', 'sentido'],
  PapeleraUseCase: class {
    purgar = mockPapeleraPurgar;
    listar = mockPapeleraListar;
    restaurar = vi.fn();
  },
}));

vi.mock('../../../application/use-cases/admin/ListUsersUseCase.js', () => ({
  ListUsersUseCase: class {
    execute = mockListUsersExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/ListAuditUseCase.js', () => ({
  ListAuditUseCase: class {
    execute = mockListAuditExecute;
  },
}));

vi.mock('../../../shared/settings/SystemSettingsService.js', () => ({
  SystemSettingsService: class {
    getPublicOnlyRatified = mockGetPublicOnlyRatified;
    setPublicOnlyRatified = mockSetPublicOnlyRatified;
  },
}));

// Mock de repositorios de auth
let mockUserPermissions: string[] = [];
let mockMustChangePassword = false;

vi.mock('../../../infrastructure/repositories/PermissionRepository.js', () => ({
  PermissionRepository: class {
    findPermissionNamesForUser = vi.fn(async () => mockUserPermissions);
  },
}));

vi.mock('../../../infrastructure/repositories/UserRepository.js', () => ({
  UserRepository: class {
    checkMustChangePassword = vi.fn(async () => mockMustChangePassword);
    findById = vi.fn(async () => ({ mustChangePassword: mockMustChangePassword }));
  },
}));

// Mock de TokenService
vi.mock('../../../infrastructure/auth/TokenService.js', () => ({
  TokenService: class {
    verifyAccessToken = vi.fn((token: string) => {
      if (token === 'super-admin-token') {
        return {
          userId: 1n,
          username: 'namtrik_super_admin',
          roles: ['super_admin'],
        };
      }
      if (token === 'reviewer-token') {
        return {
          userId: 10n,
          username: 'cultural_reviewer_user',
          roles: ['cultural_reviewer'],
        };
      }
      return null;
    });
  },
}));

describe('Admin Maintenance & Management Routes (T-026)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUserPermissions = [];
    mockMustChangePassword = false;

    app = Fastify();
    await app.register(adminPapeleraRoutes, { prefix: '/api/admin/papelera' });
    await app.register(adminUserRoutes);
    await app.register(adminAuditRoutes, { prefix: '/api/admin/audit' });
    await app.register(adminSettingsRoutes, { prefix: '/api/admin/settings' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ========== PAPELERA PURGA ==========
  describe('DELETE /api/admin/papelera/:nivel/:id', () => {
    it('devuelve 403 al listar papelera si solo tiene dictionary:write sin dictionary:delete (R-008)', async () => {
      mockUserPermissions = [PERMISSIONS.DICCIONARIO_ESCRIBIR];

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/papelera',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(403);
      expect(mockPapeleraListar).not.toHaveBeenCalled();
    });

    it('devuelve 403 si el usuario no es super_admin (ej. cultural_reviewer)', async () => {
      mockUserPermissions = [PERMISSIONS.DICCIONARIO_BORRAR];

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/papelera/sentido/10',
        headers: { authorization: 'Bearer reviewer-token' },
        payload: { confirmCodigo: 'C1.E001' },
      });

      expect(res.statusCode).toBe(403);
      expect(mockPapeleraPurgar).not.toHaveBeenCalled();
    });

    it('devuelve 400 si falta el código de confirmación', async () => {
      mockUserPermissions = [PERMISSIONS.DICCIONARIO_BORRAR];

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/papelera/sentido/10',
        headers: { authorization: 'Bearer super-admin-token' },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      expect(mockPapeleraPurgar).not.toHaveBeenCalled();
    });

    it('devuelve 409 si el use case rechaza por retención mínima o dependencias activas', async () => {
      mockUserPermissions = [PERMISSIONS.DICCIONARIO_BORRAR];
      const { AppError } = await import('../../../shared/errors/AppError.js');
      mockPapeleraPurgar.mockRejectedValue(
        new AppError('No se puede purgar: el registro no ha cumplido el periodo de retención', 409),
      );

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/papelera/sentido/10',
        headers: { authorization: 'Bearer super-admin-token' },
        payload: { confirmCodigo: 'C1.E001' },
      });

      expect(res.statusCode).toBe(409);
      expect(mockPapeleraPurgar).toHaveBeenCalled();
    });

    it('devuelve 204 al purgar físicamente con éxito', async () => {
      mockUserPermissions = [PERMISSIONS.DICCIONARIO_BORRAR];
      mockPapeleraPurgar.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/papelera/sentido/10',
        headers: { authorization: 'Bearer super-admin-token' },
        payload: { confirmCodigo: 'C1.E001' },
      });

      expect(res.statusCode).toBe(204);
      expect(mockPapeleraPurgar).toHaveBeenCalledWith(
        'sentido',
        10n,
        'C1.E001',
        expect.objectContaining({ userId: 1n, username: 'namtrik_super_admin' }),
      );
    });
  });

  // ========== USERS ==========
  describe('GET /api/admin/users', () => {
    it('devuelve 403 si el usuario no es super_admin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(403);
      expect(mockListUsersExecute).not.toHaveBeenCalled();
    });

    it('devuelve 200 con listado de usuarios sanitizados para super_admin', async () => {
      mockUserPermissions = [PERMISSIONS.USUARIOS_GESTIONAR];
      mockListUsersExecute.mockResolvedValue({
        items: [
          {
            id: '1',
            username: 'namtrik_super_admin',
            email: 'admin@misak.edu.co',
            isActive: true,
            mustChangePassword: false,
            createdAt: new Date(),
            roles: ['super_admin'],
          },
        ],
        nextCursor: null,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: 'Bearer super-admin-token' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].username).toBe('namtrik_super_admin');
    });
  });

  // ========== AUDIT ==========
  describe('GET /api/admin/audit', () => {
    it('devuelve 403 si carece de permiso audit:read', async () => {
      mockUserPermissions = [];

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/audit',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(403);
      expect(mockListAuditExecute).not.toHaveBeenCalled();
    });

    it('devuelve 200 con registros de auditoría filtrables', async () => {
      mockUserPermissions = [PERMISSIONS.AUDITORIA_LEER];
      mockListAuditExecute.mockResolvedValue({
        items: [
          {
            id: '1',
            actorUserId: '1',
            actorUsername: 'namtrik_super_admin',
            action: 'ratificar',
            entity: 'sentido',
            entityId: '50',
            oldData: { estado: 'borrador' },
            newData: { estado: 'ratificado' },
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            createdAt: new Date(),
          },
        ],
        nextCursor: null,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/audit?entity=sentido&limit=10',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.items).toHaveLength(1);
      expect(mockListAuditExecute).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'sentido', limit: 10 }),
      );
    });
  });

  // ========== SETTINGS ==========
  describe('/api/admin/settings/public-only-ratified', () => {
    it('devuelve 403 si el usuario carece del permiso settings:manage', async () => {
      mockUserPermissions = [];
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/settings/public-only-ratified',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('GET devuelve 200 con el estado actual de la bandera con settings:manage', async () => {
      mockUserPermissions = [PERMISSIONS.AJUSTES_GESTIONAR];
      mockGetPublicOnlyRatified.mockResolvedValue(true);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/settings/public-only-ratified',
        headers: { authorization: 'Bearer reviewer-token' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.enabled).toBe(true);
      expect(mockGetPublicOnlyRatified).toHaveBeenCalled();
    });

    it('PUT devuelve 200 al actualizar la bandera con settings:manage', async () => {
      mockUserPermissions = [PERMISSIONS.AJUSTES_GESTIONAR];
      mockSetPublicOnlyRatified.mockResolvedValue(false);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/admin/settings/public-only-ratified',
        headers: { authorization: 'Bearer super-admin-token' },
        payload: { enabled: false },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.enabled).toBe(false);
      expect(mockSetPublicOnlyRatified).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ userId: 1n, username: 'namtrik_super_admin' }),
      );
    });
  });
});
