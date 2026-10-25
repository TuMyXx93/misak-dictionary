import { Readable } from 'node:stream';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaRoutes } from './mediaRoutes.js';

// Mocks de Use Cases y Repositorios
const mockGetMediaStreamExecute = vi.fn();
const mockFindByUuid = vi.fn();

vi.mock('../../application/use-cases/media/GetMediaStreamUseCase.js', () => ({
  GetMediaStreamUseCase: class {
    execute = mockGetMediaStreamExecute;
  },
}));

vi.mock('../../infrastructure/repositories/MedioCulturalRepository.js', () => ({
  PrismaMedioCulturalRepository: class {
    findByUuid = mockFindByUuid;
  },
}));

vi.mock('../../shared/storage/local-storage.service.js', () => ({
  LocalStorageService: class {},
}));

describe('Public Media Routes (GET /api/media)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
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
