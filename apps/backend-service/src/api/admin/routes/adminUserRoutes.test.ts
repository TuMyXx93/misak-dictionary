/**
 * Admin User Routes Tests
 * Pruebas de endpoints administrativos de usuarios:
 * - Sugerencia inteligente de username
 * - Expediente y edición de usuario
 * - Desbloqueo de cuentas e intentos fallidos
 * - Activación y desactivación de cuentas
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUserRoutes, cleanString, generateCandidateUsername } from './adminUserRoutes.js';

// Mocks de repositorio y use cases
const mockFindByUsername = vi.fn();
const mockFindByEmail = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdWithRoles = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockUnlockUser = vi.fn();
const mockToggleActive = vi.fn();
const mockCountSuperAdmins = vi.fn();
const mockResetPasswordWithTemporary = vi.fn();

vi.mock('../../../infrastructure/repositories/UserRepository.js', () => ({
  UserRepository: class {
    findByUsername = mockFindByUsername;
    findByEmail = mockFindByEmail;
    findById = mockFindById;
    findByIdWithRoles = mockFindByIdWithRoles;
    create = mockCreate;
    update = mockUpdate;
    unlockUser = mockUnlockUser;
    toggleActive = mockToggleActive;
    countSuperAdmins = mockCountSuperAdmins;
    resetPasswordWithTemporary = mockResetPasswordWithTemporary;
    checkMustChangePassword = vi.fn(async () => false);
  },
}));

vi.mock('../../../infrastructure/repositories/SessionRepository.js', () => ({
  SessionRepository: class {
    revokeAllForUser = vi.fn(async () => 1);
  },
}));

vi.mock('../../../infrastructure/auth/PasswordService.js', () => ({
  PasswordService: class {
    hash = vi.fn(async (p: string) => `hashed_${p}`);
  },
}));

vi.mock('../../../shared/audit/AuditService.js', () => ({
  AuditService: class {
    record = vi.fn(async () => undefined);
  },
}));

// Mock auth middleware para inyectar super_admin
vi.mock('../../../presentation/middleware/authMiddleware.js', () => ({
  authMiddleware: async (request: any) => {
    request.user = {
      userId: '1',
      username: 'admin',
      email: 'admin@misak.local',
      roles: ['super_admin'],
    };
  },
}));

vi.mock('../../../presentation/middleware/authorizationMiddleware.js', () => ({
  requirePasswordChanged: () => async () => undefined,
  requireSuperAdmin: async () => undefined,
  requirePermission: () => async () => undefined,
}));

describe('generateCandidateUsername helper', () => {
  it('limpia tildes y diacríticos correctamente', () => {
    expect(cleanString('José María')).toBe('jose maria');
    expect(cleanString('Muñoz-Pérez')).toBe('munoz perez');
  });

  it('combina primer nombre y primer apellido en minúsculas', () => {
    expect(generateCandidateUsername('Juan Carlos', 'Gómez Hurtado')).toBe('juan.gomez');
    expect(generateCandidateUsername('María', 'Tunubalá')).toBe('maria.tunubala');
  });

  it('maneja solo nombres si no hay apellidos', () => {
    expect(generateCandidateUsername('Carlos', '')).toBe('carlos');
  });
});

describe('adminUserRoutes endpoints', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(adminUserRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/admin/users/suggest-username', () => {
    it('sugiere el username base si está libre', async () => {
      mockFindByUsername.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/suggest-username?nombres=Carlos&apellidos=Almendra',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.username).toBe('carlos.almendra');
      expect(body.available).toBe(true);
    });

    it('añade sufijo numérico si el username ya está ocupado', async () => {
      mockFindByUsername
        .mockResolvedValueOnce({ id: 1n, username: 'carlos.almendra' })
        .mockResolvedValueOnce(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/suggest-username?nombres=Carlos&apellidos=Almendra',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.username).toBe('carlos.almendra1');
    });

    it('retorna 400 si no se envían nombres ni apellidos', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/suggest-username',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('retorna expediente completo del usuario', async () => {
      mockFindByIdWithRoles.mockResolvedValue({
        id: 10n,
        username: 'ana.calambas',
        email: 'ana@misak.local',
        fullName: 'Ana Calambás',
        nombres: 'Ana',
        apellidos: 'Calambás',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '1061000222',
        telefonoContacto: '3123456789',
        direccionResidencia: 'Calle 5 # 3-21',
        barrio: 'Centro',
        departamento: 'Cauca',
        ciudadMunicipio: 'Silvia',
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        roles: [{ roleId: 1n, role: { id: 1n, name: 'content_admin' } }],
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/10',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.id).toBe('10');
      expect(body.nombres).toBe('Ana');
      expect(body.ciudadMunicipio).toBe('Silvia');
    });

    it('retorna 404 si el usuario no existe', async () => {
      mockFindByIdWithRoles.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/999',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it('actualiza campos del expediente', async () => {
      mockFindByIdWithRoles.mockResolvedValue({
        id: 10n,
        username: 'ana.calambas',
        email: 'ana@misak.local',
        fullName: 'Ana Calambás',
        nombres: 'Ana',
        apellidos: 'Calambás',
        roles: [],
      });
      mockUpdate.mockResolvedValue({
        id: 10n,
        username: 'ana.calambas',
        email: 'ana@misak.local',
        fullName: 'Ana Calambás',
        telefonoContacto: '3200000000',
      });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/10',
        payload: {
          telefonoContacto: '3200000000',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        10n,
        expect.objectContaining({ telefonoContacto: '3200000000' }),
      );
    });
  });

  describe('PATCH /api/admin/users/:id/status', () => {
    it('activa o desactiva usuario con motivo opcional', async () => {
      mockFindByIdWithRoles.mockResolvedValue({
        id: 10n,
        roles: [{ roleId: 2n, role: { id: 2n, name: 'content_admin' } }],
      });
      mockToggleActive.mockResolvedValue({
        id: 10n,
        isActive: false,
      });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/10/status',
        payload: { isActive: false, motivo: 'Suspensión temporal por seguridad' },
      });

      expect(res.statusCode).toBe(200);
      expect(mockToggleActive).toHaveBeenCalledWith(10n, false);
    });

    it('rechaza auto-suspensión con 400 Bad Request (R-004)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/1/status',
        payload: { isActive: false },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('No es posible suspender su propia cuenta');
    });

    it('rechaza desactivar al único super_admin con 409 Conflict', async () => {
      mockFindByIdWithRoles.mockResolvedValue({
        id: 2n,
        roles: [{ roleId: 1n, role: { id: 1n, name: 'super_admin' } }],
      });
      mockCountSuperAdmins.mockResolvedValue(1);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/2/status',
        payload: { isActive: false },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('restablece contraseña temporal para un usuario (R-005)', async () => {
      mockFindByIdWithRoles.mockResolvedValue({
        id: 10n,
        username: 'ana.calambas',
        email: 'ana@misak.local',
        fullName: 'Ana Calambás',
        roles: [{ roleId: 2n, role: { id: 2n, name: 'content_admin' } }],
      });
      mockResetPasswordWithTemporary.mockResolvedValue({
        id: 10n,
        username: 'ana.calambas',
        email: 'ana@misak.local',
        fullName: 'Ana Calambás',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/users/10/reset-password',
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.mustChangePassword).toBe(true);
      expect(body.temporaryPassword).toBeDefined();
      expect(body.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('POST /api/admin/users/:id/unlock', () => {
    it('desbloquea usuario y resetea intentos fallidos', async () => {
      mockFindById.mockResolvedValue({
        id: 10n,
        username: 'bloqueado',
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 600000),
      });
      mockUnlockUser.mockResolvedValue({
        id: 10n,
        username: 'bloqueado',
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/users/10/unlock',
      });

      expect(res.statusCode).toBe(200);
      expect(mockUnlockUser).toHaveBeenCalledWith(10n);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('desbloqueada exitosamente');
    });
  });
});
