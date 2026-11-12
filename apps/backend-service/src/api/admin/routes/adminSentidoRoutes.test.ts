/**
 * Admin Sentido Routes Tests (T-024)
 * Verificación con app.inject de códigos 200, 201, 204, 400, 401, 403, 409
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { adminSentidoRoutes } from './adminSentidoRoutes.js';

// Mocks de Use Cases
const mockListSentidosExecute = vi.fn();
const mockCreateSentidoExecute = vi.fn();
const mockUpdateSentidoExecute = vi.fn();
const mockDeleteSentidoExecute = vi.fn();
const mockRatificarSentidoExecute = vi.fn();
const mockRevertirRatificacionExecute = vi.fn();

vi.mock('../../../application/use-cases/admin/ListSentidosAdminUseCase.js', () => ({
  ListSentidosAdminUseCase: class {
    execute = mockListSentidosExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/CreateSentidoUseCase.js', () => ({
  CreateSentidoUseCase: class {
    execute = mockCreateSentidoExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/UpdateSentidoUseCase.js', () => ({
  UpdateSentidoUseCase: class {
    execute = mockUpdateSentidoExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/DeleteSentidoUseCase.js', () => ({
  DeleteSentidoUseCase: class {
    execute = mockDeleteSentidoExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/RatificarSentidoUseCase.js', () => ({
  RatificarSentidoUseCase: class {
    execute = mockRatificarSentidoExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/RevertirRatificacionUseCase.js', () => ({
  RevertirRatificacionUseCase: class {
    execute = mockRevertirRatificacionExecute;
  },
}));

// Mock de repositorios de auth
let mockUserPermissions: string[] = [];
let mockMustChangePassword = false;
let mockUserIsActive = true;

vi.mock('../../../infrastructure/repositories/PermissionRepository.js', () => ({
  PermissionRepository: class {
    findPermissionNamesForUser = vi.fn(async () => mockUserPermissions);
  },
}));

vi.mock('../../../infrastructure/repositories/UserRepository.js', () => ({
  UserRepository: class {
    checkMustChangePassword = vi.fn(async () => mockMustChangePassword);
    findById = vi.fn(async () => ({
      mustChangePassword: mockMustChangePassword,
      isActive: mockUserIsActive,
    }));
  },
}));

// Mock de TokenService para autenticación con Bearer
vi.mock('../../../infrastructure/auth/TokenService.js', () => ({
  TokenService: class {
    verifyAccessToken = vi.fn((token: string) => {
      if (token === 'valid-token') {
        return {
          userId: 10n,
          username: 'editor_cultural',
          roles: ['cultural_reviewer'],
        };
      }
      if (token === 'content-admin-token') {
        return {
          userId: 11n,
          username: 'content_admin_user',
          roles: ['content_admin'],
        };
      }
      return null;
    });
  },
}));

describe('adminSentidoRoutes (app.inject)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUserPermissions = [];
    mockMustChangePassword = false;
    mockUserIsActive = true;

    app = Fastify({ logger: false });
    await app.register(adminSentidoRoutes, { prefix: '/api/admin/dictionary/sentidos' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve 401 si no se envía cabecera Authorization', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/sentidos',
    });

    expect(res.statusCode).toBe(401);
  });

  it('devuelve 403 si el usuario debe cambiar su contraseña (must_change_password)', async () => {
    mockMustChangePassword = true;

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/sentidos',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload);
    expect(body.message).toContain('cambiar su contraseña');
  });

  it('devuelve 403 al listar si no tiene el permiso dictionary:read', async () => {
    mockUserPermissions = []; // Sin permisos

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/sentidos',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('devuelve 200 al listar con permiso dictionary:read', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_LEER];
    mockListSentidosExecute.mockResolvedValue({ items: [], nextCursor: null });

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/sentidos?limit=10',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(mockListSentidosExecute).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('devuelve 403 al crear sentido si no tiene permiso dictionary:write', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_LEER]; // Solo lectura

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        ubicacion: { nivel: 'campo', id: '1' },
        formas: [{ lema: 'yal' }],
        espanolGlosa: 'casa',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('devuelve 201 al crear sentido con datos válidos y permiso dictionary:write', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_ESCRIBIR];
    mockCreateSentidoExecute.mockResolvedValue({
      id: 100n,
      codigo: 'C1.E001',
      estado: 'borrador',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos',
      headers: { authorization: 'Bearer content-admin-token' },
      payload: {
        ubicacion: { nivel: 'campo', id: '1' },
        formas: [{ lema: 'yal' }],
        espanolGlosa: 'casa',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(mockCreateSentidoExecute).toHaveBeenCalled();
  });

  it('devuelve 409 al editar si hay conflicto de concurrencia de versión', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_ESCRIBIR];
    const { AppError } = await import('../../../shared/errors/AppError.js');
    mockUpdateSentidoExecute.mockRejectedValue(
      new AppError(
        'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
        409,
      ),
    );

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/dictionary/sentidos/50',
      headers: { authorization: 'Bearer content-admin-token' },
      payload: {
        version: 1,
        espanolGlosa: 'nueva glosa',
      },
    });

    expect(res.statusCode).toBe(409);
  });

  it('devuelve 403 con AUTH_ACCOUNT_SUSPENDED si la cuenta fue desactivada (R-010)', async () => {
    mockUserIsActive = false;
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_LEER];

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/sentidos',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload);
    expect(body.code).toBe('AUTH_ACCOUNT_SUSPENDED');
  });

  it('devuelve 403 al borrar lógicamente si solo tiene dictionary:write sin dictionary:delete (R-008)', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_ESCRIBIR];

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/dictionary/sentidos/50',
      headers: { authorization: 'Bearer content-admin-token' },
    });

    expect(res.statusCode).toBe(403);
    expect(mockDeleteSentidoExecute).not.toHaveBeenCalled();
  });

  it('devuelve 204 al borrar lógicamente con permiso dictionary:delete', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_BORRAR];
    mockDeleteSentidoExecute.mockResolvedValue(undefined);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/dictionary/sentidos/50',
      headers: { authorization: 'Bearer content-admin-token' },
    });

    expect(res.statusCode).toBe(204);
    expect(mockDeleteSentidoExecute).toHaveBeenCalledWith(50n, expect.any(Object));
  });

  it('devuelve 403 al ratificar si el usuario carece de permiso taxonomy:ratify (ej. content_admin)', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_ESCRIBIR]; // Solo escribe, no ratifica

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos/50/ratificar',
      headers: { authorization: 'Bearer content-admin-token' },
      payload: { version: 1 },
    });

    expect(res.statusCode).toBe(403);
  });

  it('devuelve 409 al ratificar si hay colisión de auto-ratificación', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
    const { AppError } = await import('../../../shared/errors/AppError.js');
    mockRatificarSentidoExecute.mockRejectedValue(
      new AppError(
        'No puedes ratificar un sentido cuya última edición fue realizada por ti mismo',
        409,
        true,
        'SELF_RATIFICATION_FORBIDDEN',
      ),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos/50/ratificar',
      headers: { authorization: 'Bearer valid-token' },
      payload: { version: 1 },
    });

    expect(res.statusCode).toBe(409);
  });

  it('devuelve 403 al revertir si carece del permiso taxonomy:revert (R-008)', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos/50/revertir',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        version: 2,
        motivo: 'Motivo suficientemente descriptivo',
      },
    });

    expect(res.statusCode).toBe(403);
    expect(mockRevertirRatificacionExecute).not.toHaveBeenCalled();
  });

  it('devuelve 400 al revertir si el motivo no cumple la longitud mínima de 10 caracteres', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_REVERTIR];

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos/50/revertir',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        version: 2,
        motivo: 'corto', // Menos de 10 caracteres
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('devuelve 200 al revertir con motivo válido y permiso taxonomy:revert', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_REVERTIR];
    mockRevertirRatificacionExecute.mockResolvedValue({
      id: 50n,
      estado: 'borrador',
      version: 3,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/dictionary/sentidos/50/revertir',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        version: 2,
        motivo: 'Motivo suficientemente descriptivo',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(mockRevertirRatificacionExecute).toHaveBeenCalled();
  });
});
