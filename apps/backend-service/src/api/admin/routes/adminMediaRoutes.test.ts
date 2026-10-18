import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { adminMediaRoutes } from './adminMediaRoutes.js';

// Mocks de Use Cases
const mockListMediaExecute = vi.fn();
const mockUploadMediaExecute = vi.fn();
const mockRatifyMediaExecute = vi.fn();
const mockDeleteMediaExecute = vi.fn();
const mockFindById = vi.fn();
const mockUpdateMetadata = vi.fn();

vi.mock('../../../application/use-cases/media/ListMediaUseCase.js', () => ({
  ListMediaUseCase: class {
    execute = mockListMediaExecute;
  },
}));

vi.mock('../../../application/use-cases/media/UploadMediaUseCase.js', () => ({
  UploadMediaUseCase: class {
    execute = mockUploadMediaExecute;
  },
}));

vi.mock('../../../application/use-cases/media/RatifyMediaUseCase.js', () => ({
  RatifyMediaUseCase: class {
    execute = mockRatifyMediaExecute;
  },
}));

vi.mock('../../../application/use-cases/media/DeleteMediaUseCase.js', () => ({
  DeleteMediaUseCase: class {
    execute = mockDeleteMediaExecute;
  },
}));

vi.mock('../../../infrastructure/repositories/MedioCulturalRepository.js', () => ({
  PrismaMedioCulturalRepository: class {
    findById = mockFindById;
    updateMetadata = mockUpdateMetadata;
  },
}));

vi.mock('../../../shared/storage/local-storage.service.js', () => ({
  LocalStorageService: class {},
}));

vi.mock('../../../shared/audit/AuditService.js', () => ({
  AuditService: class {
    record = vi.fn();
  },
}));

// Mock de autenticación y permisos
let mockUserPermissions: string[] = [];

vi.mock('../../../infrastructure/repositories/PermissionRepository.js', () => ({
  PermissionRepository: class {
    findPermissionNamesForUser = vi.fn(async () => mockUserPermissions);
  },
}));

vi.mock('../../../infrastructure/repositories/UserRepository.js', () => ({
  UserRepository: class {
    checkMustChangePassword = vi.fn(async () => false);
    findById = vi.fn(async () => ({ mustChangePassword: false }));
  },
}));

vi.mock('../../../presentation/middleware/authMiddleware.js', () => ({
  authMiddleware: async (req: any) => {
    req.user = {
      id: BigInt(1),
      username: 'admin_test',
      email: 'admin@test.com',
      roles: ['media_admin'],
    };
  },
}));

describe('Admin Media Routes (adminMediaRoutes)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUserPermissions = [];
    app = Fastify();
    await app.register(adminMediaRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('permite listar medios si el usuario cuenta con permiso media:read (R-007, R-014)', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_LEER];
      mockListMediaExecute.mockResolvedValue({
        items: [
          {
            id: BigInt(1),
            uuid: 'uuid-1',
            tipo: 'audio',
            estado: 'borrador',
          },
        ],
        total: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
    });

    it('deniega acceso con 403 Forbidden si el usuario carece de permiso media:read', async () => {
      mockUserPermissions = [PERMISSIONS.AUDITORIA_LEER]; // Solo auditoría

      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /:id/metadatos', () => {
    it('actualiza metadatos si cuenta con permiso media:write (R-007)', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_ESCRIBIR];
      mockUpdateMetadata.mockResolvedValue({
        id: BigInt(5),
        uuid: 'uuid-5',
        hablanteAutor: 'Taita Nuevo',
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/5/metadatos',
        payload: {
          hablanteAutor: 'Taita Nuevo',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.hablanteAutor).toBe('Taita Nuevo');
    });

    it('deniega actualización con 403 si carece de media:write', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_LEER]; // Solo lectura

      const response = await app.inject({
        method: 'PATCH',
        url: '/5/metadatos',
        payload: {
          hablanteAutor: 'Taita Nuevo',
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /:id/ratificar', () => {
    it('ratifica medio si cuenta con taxonomy:ratify (R-003)', async () => {
      mockUserPermissions = [PERMISSIONS.TAXONOMIA_RATIFICAR];
      mockRatifyMediaExecute.mockResolvedValue({
        id: BigInt(5),
        estado: 'ratificado',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/5/ratificar',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.estado).toBe('ratificado');
    });

    it('deniega ratificación con 403 a usuarios con solo media:write (separación de funciones)', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_ESCRIBIR];

      const response = await app.inject({
        method: 'POST',
        url: '/5/ratificar',
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /:id', () => {
    it('elimina medio lógicamente si cuenta con media:delete (R-007)', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_BORRAR];
      mockDeleteMediaExecute.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/8',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(mockDeleteMediaExecute).toHaveBeenCalledWith(
        expect.objectContaining({ id: BigInt(8) }),
      );
    });

    it('deniega eliminación con 403 si carece de media:delete', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_LEER];

      const response = await app.inject({
        method: 'DELETE',
        url: '/8',
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
