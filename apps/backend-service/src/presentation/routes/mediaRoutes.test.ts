import { Readable } from 'node:stream';
import fastifyCookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '../../shared/auth/permissions.js';
import { RangeNotSatisfiableError } from '../../shared/errors/AppError.js';
import { mediaRoutes } from './mediaRoutes.js';

// Mocks de Use Cases y Repositorios
const mocks = vi.hoisted(() => ({
  getMediaStreamExecute: vi.fn(),
  findByUuid: vi.fn(),
  verifyAccessToken: vi.fn(),
  findPermissions: vi.fn(),
}));

const mockGetMediaStreamExecute = mocks.getMediaStreamExecute;
const mockFindByUuid = mocks.findByUuid;
const mockVerifyAccessToken = mocks.verifyAccessToken;
const mockFindPermissions = mocks.findPermissions;

vi.mock('../../application/use-cases/media/GetMediaStreamUseCase.js', () => ({
  GetMediaStreamUseCase: class {
    execute = mocks.getMediaStreamExecute;
  },
}));

vi.mock('../../infrastructure/repositories/MedioCulturalRepository.js', () => ({
  PrismaMedioCulturalRepository: class {
    findByUuid = mocks.findByUuid;
  },
}));

vi.mock('../../shared/storage/local-storage.service.js', () => ({
  LocalStorageService: class {},
}));

vi.mock('../../infrastructure/auth/TokenService.js', () => ({
  TokenService: class {
    verifyAccessToken = mocks.verifyAccessToken;
  },
}));

vi.mock('../../infrastructure/repositories/PermissionRepository.js', () => ({
  PermissionRepository: class {
    findPermissionNamesForUser = mocks.findPermissions;
  },
}));

describe('Public Media Routes (GET /api/media)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(fastifyCookie);
    await app.register(mediaRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /:uuid/stream', () => {
    it('responde 200 con el stream completo y cabeceras adecuadas cuando no hay Range (R-006)', async () => {
      const stream = Readable.from(['AUDIO_DATA']);
      mockGetMediaStreamExecute.mockResolvedValue({
        streamResult: {
          stream,
          totalSize: 10,
          start: 0,
          end: 9,
          isPartial: false,
          contentType: 'audio/mpeg',
        },
        medio: { estado: 'ratificado', uuid: 'uuid-123' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-123/stream',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/mpeg');
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
      expect(response.headers['content-length']).toBe('10');
      expect(response.body).toBe('AUDIO_DATA');
    });

    it('responde 206 Partial Content con Content-Range cuando se envía cabecera Range (R-006)', async () => {
      const stream = Readable.from(['AUDIO_CHUNK']);
      mockGetMediaStreamExecute.mockResolvedValue({
        streamResult: {
          stream,
          totalSize: 100,
          start: 0,
          end: 10,
          isPartial: true,
          contentType: 'audio/mpeg',
        },
        medio: { estado: 'ratificado', uuid: 'uuid-123' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-123/stream',
        headers: {
          range: 'bytes=0-10',
        },
      });

      expect(response.statusCode).toBe(206);
      expect(response.headers['content-type']).toBe('audio/mpeg');
      expect(response.headers['content-range']).toBe('bytes 0-10/100');
      expect(response.headers['content-length']).toBe('11');
      expect(response.headers['accept-ranges']).toBe('bytes');
    });

    it('permite transmitir borradores con cookie HttpOnly misak_at y soporta ?download=1 (R-003)', async () => {
      mockVerifyAccessToken.mockReturnValue({ userId: 7n, roles: ['media_admin'] });
      mockFindPermissions.mockResolvedValue([PERMISSIONS.MEDIOS_LEER]);

      const stream = Readable.from(['DRAFT_AUDIO']);
      mockGetMediaStreamExecute.mockResolvedValue({
        streamResult: {
          stream,
          totalSize: 11,
          start: 0,
          end: 10,
          isPartial: false,
          contentType: 'audio/webm',
        },
        medio: {
          uuid: 'uuid-draft-media',
          originalName: 'borrador.webm',
          estado: 'borrador',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-draft-media/stream?download=1',
        headers: {
          cookie: 'misak_at=valid-media-jwt',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockGetMediaStreamExecute).toHaveBeenCalledWith({
        uuid: 'uuid-draft-media',
        rangeHeader: undefined,
        canReadDrafts: true,
      });
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers['content-disposition']).toBe('attachment; filename="borrador.webm"');
    });

    it('responde 416 Range Not Satisfiable con Content-Range bytes */total cuando el rango excede el archivo', async () => {
      mockGetMediaStreamExecute.mockRejectedValue(new RangeNotSatisfiableError(1024));

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-valid/stream',
        headers: {
          range: 'bytes=5000-',
        },
      });

      expect(response.statusCode).toBe(416);
      expect(response.headers['content-range']).toBe('bytes */1024');
      expect(response.json()).toMatchObject({
        statusCode: 416,
        code: 'RANGE_NOT_SATISFIABLE',
      });
    });

    it('soporta HEAD /:uuid/stream sin cuerpo y conservando Content-Length y Accept-Ranges', async () => {
      const mockStream = Readable.from([]);
      mockGetMediaStreamExecute.mockResolvedValue({
        streamResult: {
          stream: mockStream,
          totalSize: 2048,
          start: 0,
          end: 2047,
          isPartial: false,
          contentType: 'audio/mpeg',
        },
        medio: {
          uuid: 'uuid-valid',
          originalName: 'audio.mp3',
          estado: 'ratificado',
        },
      });

      const response = await app.inject({
        method: 'HEAD',
        url: '/uuid-valid/stream',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-length']).toBe('2048');
      expect(response.body).toBe('');
      expect(mockGetMediaStreamExecute).toHaveBeenCalledWith({
        uuid: 'uuid-valid',
        rangeHeader: undefined,
        canReadDrafts: false,
        headOnly: true,
      });
    });
  });

  describe('GET /:uuid/meta', () => {
    it('responde 200 con metadatos de un medio ratificado', async () => {
      mockFindByUuid.mockResolvedValue({
        uuid: 'uuid-abc',
        tipo: 'imagen',
        proposito: 'ilustracion_cultural',
        mimetype: 'image/webp',
        duracionSegundos: null,
        anchoPx: 1200,
        altoPx: 800,
        hablanteAutor: 'Artesano',
        varianteDialectal: null,
        descripcionEspanol: 'Tejido Misak',
        descripcionNamtrik: null,
        licenciaComunitaria: 'Licencia Misak',
        estado: 'ratificado',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-abc/meta',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
      const json = response.json();
      expect(json.uuid).toBe('uuid-abc');
      expect(json.tipo).toBe('imagen');
      expect(json.posterUuid).toBeNull();
      expect(json.metadata).toBeNull();
      expect(json.streamUrl).toBe('/api/media/uuid-abc/stream');
    });

    it('responde 404 si el medio está en estado borrador (R-002)', async () => {
      mockFindByUuid.mockResolvedValue({
        uuid: 'uuid-borrador',
        estado: 'borrador',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/uuid-borrador/meta',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
