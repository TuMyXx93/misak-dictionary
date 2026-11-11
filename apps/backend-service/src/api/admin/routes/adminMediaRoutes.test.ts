import multipart from '@fastify/multipart';
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
  authMiddleware: async (req: { user?: unknown }) => {
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
    await app.register(multipart, {
      limits: {
        fileSize: 100 * 1024 * 1024,
        files: 1,
        fields: 25,
      },
      attachFieldsToBody: false,
    });
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

  describe('Fase 2: Video, filtros taxonómicos y multipart extendido', () => {
    it('permite filtrar listado por tipo=video y FKs taxonómicos', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_LEER];
      mockListMediaExecute.mockResolvedValue({ items: [], total: 0 });

      const response = await app.inject({
        method: 'GET',
        url: '/?tipo=video&campoSemanticoId=2&subcampoSemanticoId=5&microcampoId=9',
      });

      expect(response.statusCode).toBe(200);
      expect(mockListMediaExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'video',
          campoSemanticoId: BigInt(2),
          subcampoSemanticoId: BigInt(5),
          microcampoId: BigInt(9),
        }),
      );
    });

    it('acepta en PATCH /:id/metadatos nuevos propósitos de video, FKs taxonómicos, dimensiones, posterUuid y metadata', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_ESCRIBIR];
      mockUpdateMetadata.mockResolvedValue({
        id: BigInt(5),
        uuid: 'uuid-5',
        proposito: 'relato_oral_video',
        campoSemanticoId: BigInt(3),
        posterUuid: '11111111-2222-4333-8444-555555555555',
        metadata: { capitulos: 2 },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/5/metadatos',
        payload: {
          proposito: 'relato_oral_video',
          campoSemanticoId: 3,
          anchoPx: 1920,
          altoPx: 1080,
          duracionSegundos: 64.5,
          posterUuid: '11111111-2222-4333-8444-555555555555',
          metadata: { capitulos: 2 },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateMetadata).toHaveBeenCalledWith(
        BigInt(5),
        expect.objectContaining({
          proposito: 'relato_oral_video',
          campoSemanticoId: BigInt(3),
          anchoPx: 1920,
          altoPx: 1080,
          duracionSegundos: 64.5,
          posterUuid: '11111111-2222-4333-8444-555555555555',
          metadata: { capitulos: 2 },
        }),
      );
    });

    it('procesa POST /upload multipart con campos taxonómicos, posterUuid y metadata JSON válido', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_ESCRIBIR];
      mockUploadMediaExecute.mockResolvedValue({
        id: BigInt(12),
        uuid: 'video-uuid-12',
        tipo: 'video',
        proposito: 'registro_practica_cultural',
        estado: 'borrador',
      });

      const boundary = '----MisakMultipartBoundary';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="tipo"',
        '',
        'video',
        `--${boundary}`,
        'Content-Disposition: form-data; name="proposito"',
        '',
        'registro_practica_cultural',
        `--${boundary}`,
        'Content-Disposition: form-data; name="campoSemanticoId"',
        '',
        '4',
        `--${boundary}`,
        'Content-Disposition: form-data; name="anchoPx"',
        '',
        '1920',
        `--${boundary}`,
        'Content-Disposition: form-data; name="altoPx"',
        '',
        '1080',
        `--${boundary}`,
        'Content-Disposition: form-data; name="posterUuid"',
        '',
        '11111111-2222-4333-8444-555555555555',
        `--${boundary}`,
        'Content-Disposition: form-data; name="metadata"',
        '',
        '{"comunidad":"Guambia"}',
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="minga.mp4"',
        'Content-Type: video/mp4',
        '',
        'FAKE_VIDEO_PAYLOAD',
        `--${boundary}--`,
        '',
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      });

      expect(response.statusCode).toBe(201);
      expect(mockUploadMediaExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'video',
          proposito: 'registro_practica_cultural',
          campoSemanticoId: BigInt(4),
          anchoPx: 1920,
          altoPx: 1080,
          posterUuid: '11111111-2222-4333-8444-555555555555',
          metadata: { comunidad: 'Guambia' },
        }),
      );
    });

    it('rechaza con HTTP 400 en POST /upload si metadata no es un JSON objeto válido', async () => {
      mockUserPermissions = [PERMISSIONS.MEDIOS_ESCRIBIR];

      const boundary = '----MisakMultipartBoundaryInvalid';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="tipo"',
        '',
        'video',
        `--${boundary}`,
        'Content-Disposition: form-data; name="proposito"',
        '',
        'relato_oral_video',
        `--${boundary}`,
        'Content-Disposition: form-data; name="metadata"',
        '',
        '[1,2,3]',
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="relato.mp4"',
        'Content-Type: video/mp4',
        '',
        'FAKE_VIDEO_PAYLOAD',
        `--${boundary}--`,
        '',
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      });

      expect(response.statusCode).toBe(400);
      expect(mockUploadMediaExecute).not.toHaveBeenCalled();
    });
  });
});
