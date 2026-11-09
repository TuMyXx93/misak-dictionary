/**
 * Admin Governance Routes Tests (T-025)
 * Verificación con app.inject de códigos 200, 400, 401, 403, 409
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { adminGovernanceRoutes } from './adminGovernanceRoutes.js';

// Mocks de Use Cases
const mockRatificarNodoExecute = vi.fn();
const mockRatificarLoteExecute = vi.fn();
const mockProgresoRatificacionExecute = vi.fn();

vi.mock('../../../application/use-cases/admin/RatificarNodoUseCase.js', () => ({
  RatificarNodoUseCase: class {
    execute = mockRatificarNodoExecute;
  },
}));

vi.mock('../../../application/use-cases/admin/RatificarLoteUseCase.js', () => {
  class RatificarLoteError extends Error {
    public readonly conflictos: unknown[];
    constructor(message: string, conflictos: unknown[]) {
      super(message);
      this.conflictos = conflictos;
    }
  }

  return {
    RatificarLoteError,
    RatificarLoteUseCase: class {
      execute = mockRatificarLoteExecute;
    },
  };
});

vi.mock('../../../application/use-cases/admin/ProgresoRatificacionUseCase.js', () => ({
  ProgresoRatificacionUseCase: class {
    execute = mockProgresoRatificacionExecute;
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

// Mock de TokenService para autenticación con Bearer
vi.mock('../../../infrastructure/auth/TokenService.js', () => ({
  TokenService: class {
    verifyAccessToken = vi.fn((token: string) => {
      if (token === 'reviewer-token') {
        return {
          userId: 10n,
          username: 'cultural_reviewer_user',
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

describe('adminGovernanceRoutes (app.inject)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUserPermissions = [];
    mockMustChangePassword = false;

    app = Fastify();
    await app.register(adminGovernanceRoutes, { prefix: '/api/admin/governance' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve 401 si no se envía cabecera Authorization', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/governance/progreso',
    });

    expect(res.statusCode).toBe(401);
  });

  it('devuelve 403 si el usuario debe cambiar su contraseña (must_change_password)', async () => {
    mockMustChangePassword = true;

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/governance/progreso',
      headers: { authorization: 'Bearer reviewer-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload);
    expect(body.message).toContain('cambiar su contraseña');
  });

  it('devuelve 403 al ratificar nodo si carece de permiso taxonomy:ratify', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_LEER];

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar',
      headers: { authorization: 'Bearer content-admin-token' },
      payload: { version: 1 },
    });

    expect(res.statusCode).toBe(403);
    expect(mockRatificarNodoExecute).not.toHaveBeenCalled();
  });

  it('devuelve 400 al ratificar nodo si versión es inválida (< 1)', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: { version: 0 },
    });

    expect(res.statusCode).toBe(400);
    expect(mockRatificarNodoExecute).not.toHaveBeenCalled();
  });

  it('devuelve 409 al ratificar nodo si hay conflicto de concurrencia o auto-ratificación', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
    const { AppError } = await import('../../../shared/errors/AppError.js');
    mockRatificarNodoExecute.mockRejectedValue(
      new AppError('Conflicto de concurrencia: el nodo ha sido modificado por otro usuario', 409),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: { version: 1 },
    });

    expect(res.statusCode).toBe(409);
    expect(mockRatificarNodoExecute).toHaveBeenCalled();
  });

  it('devuelve 200 al ratificar nodo con éxito', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
    mockRatificarNodoExecute.mockResolvedValue({
      id: 5n,
      codigo: 'C1.S1.M1',
      estado: 'ratificado',
      version: 2,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: { version: 1 },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.estado).toBe('ratificado');
    expect(body.id).toBe('5');
    expect(mockRatificarNodoExecute).toHaveBeenCalled();
  });

  it('devuelve 400 al ratificar por lote si falta alguna casilla del checklist', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar-lote',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: {
        checklist: {
          ortografia: true,
          categorias: true,
          glosas: false, // Incompleta
          cientificos: true,
        },
        snapshot: [{ id: '1', version: 1 }],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(mockRatificarLoteExecute).not.toHaveBeenCalled();
  });

  it('devuelve 409 con detalle de conflictos al ratificar por lote', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
    const { RatificarLoteError } = await import(
      '../../../application/use-cases/admin/RatificarLoteUseCase.js'
    );
    mockRatificarLoteExecute.mockRejectedValue(
      new RatificarLoteError('Conflictos detectados en el lote', [
        { codigo: 'C1.E001', motivo: 'auto_ratificacion' },
      ]),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar-lote',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: {
        checklist: {
          ortografia: true,
          categorias: true,
          glosas: true,
          cientificos: true,
        },
        snapshot: [{ id: '1', version: 1 }],
      },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload);
    expect(body.conflictos).toHaveLength(1);
    expect(body.conflictos[0].motivo).toBe('auto_ratificacion');
    expect(mockRatificarLoteExecute).toHaveBeenCalled();
  });

  it('devuelve 200 al ratificar lote atómicamente con éxito', async () => {
    mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
    mockRatificarLoteExecute.mockResolvedValue({
      ok: true,
      sentidosRatificados: 3,
      nodoRatificado: true,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/governance/nodos/microcampo/5/ratificar-lote',
      headers: { authorization: 'Bearer reviewer-token' },
      payload: {
        checklist: {
          ortografia: true,
          categorias: true,
          glosas: true,
          cientificos: true,
        },
        snapshot: [{ id: '1', version: 1 }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.ok).toBe(true);
    expect(body.sentidosRatificados).toBe(3);
    expect(mockRatificarLoteExecute).toHaveBeenCalled();
  });

  it('devuelve 403 al consultar progreso si carece de permiso dictionary:read', async () => {
    mockUserPermissions = [];

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/governance/progreso',
      headers: { authorization: 'Bearer content-admin-token' },
    });

    expect(res.statusCode).toBe(403);
    expect(mockProgresoRatificacionExecute).not.toHaveBeenCalled();
  });

  it('devuelve 200 al consultar progreso con permiso dictionary:read y filtro', async () => {
    mockUserPermissions = [PERMISSIONS.DICCIONARIO_LEER];
    mockProgresoRatificacionExecute.mockResolvedValue([
      {
        id: '1',
        codigo: 'C1',
        nivel: 'campo',
        termino: 'El Cosmos',
        padreCodigo: null,
        ratificados: 10,
        total: 15,
        porcentaje: 66.67,
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/governance/progreso?soloConPendientes=true',
      headers: { authorization: 'Bearer reviewer-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].codigo).toBe('C1');
    expect(mockProgresoRatificacionExecute).toHaveBeenCalledWith({ soloConPendientes: true });
  });
});
