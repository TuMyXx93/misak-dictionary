import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetMediaStreamUseCase } from '../../application/use-cases/media/GetMediaStreamUseCase.js';
import { PrismaMedioCulturalRepository } from '../../infrastructure/repositories/MedioCulturalRepository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { LocalStorageService } from '../../shared/storage/local-storage.service.js';

export async function mediaRoutes(fastify: FastifyInstance): Promise<void> {
  const mediaRepo = new PrismaMedioCulturalRepository();
  const storageService = new LocalStorageService();
  const getMediaStreamUseCase = new GetMediaStreamUseCase(mediaRepo, storageService);

  /**
   * GET /api/media/:uuid/stream
   * Streaming de audio con HTTP Range 206 y visualización de imágenes (R-002, R-006)
   */
  fastify.get(
    '/:uuid/stream',
    async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
      const { uuid } = request.params;
      const rangeHeader = request.headers.range;

      try {
        const { streamResult, medio } = await getMediaStreamUseCase.execute({
          uuid,
          rangeHeader,
          canReadDrafts: false,
        });

        // Configurar cabeceras de streaming
        reply.header('Accept-Ranges', 'bytes');
        reply.header('Content-Type', streamResult.contentType);
        reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

        if (streamResult.isPartial) {
          reply.code(206);
          reply.header(
            'Content-Range',
            `bytes ${streamResult.start}-${streamResult.end}/${streamResult.totalSize}`,
          );
          reply.header('Content-Length', String(streamResult.end - streamResult.start + 1));
        } else {
          reply.code(200);
          reply.header('Content-Length', String(streamResult.totalSize));
        }

        // Caché pública para medios ratificados (1 hora en navegador, 1 día en CDN)
        if (medio.estado === 'ratificado') {
          reply.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        }

        return reply.send(streamResult.stream);
      } catch (err: unknown) {
        if (err instanceof AppError) {
          return reply.code(err.statusCode).send({
            statusCode: err.statusCode,
            error: err.name,
            message: err.message,
          });
        }
        request.log.error(err, 'Error procesando streaming de medio');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Error al servir el recurso multimedia',
        });
      }
    },
  );

  /**
   * GET /api/media/:uuid/meta
   * Consulta pública de metadatos culturales de un recurso (R-002, R-009, R-011)
   */
  fastify.get(
    '/:uuid/meta',
    async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
      const { uuid } = request.params;
      const medio = await mediaRepo.findByUuid(uuid);

      if (!medio || medio.estado !== 'ratificado') {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Recurso multimedia no encontrado o no ratificado públicamente',
        });
      }

      reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return reply.code(200).send({
        uuid: medio.uuid,
        tipo: medio.tipo,
        proposito: medio.proposito,
        mimetype: medio.mimetype,
        duracionSegundos: medio.duracionSegundos,
        anchoPx: medio.anchoPx,
        altoPx: medio.altoPx,
        hablanteAutor: medio.hablanteAutor,
        varianteDialectal: medio.varianteDialectal,
        descripcionEspanol: medio.descripcionEspanol,
        descripcionNamtrik: medio.descripcionNamtrik,
        licenciaComunitaria: medio.licenciaComunitaria,
        posterUuid: medio.posterUuid ?? null,
        metadata: medio.metadata ?? null,
        streamUrl: `/api/media/${medio.uuid}/stream`,
      });
    },
  );
}
