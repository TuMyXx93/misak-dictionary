/**
 * Helper compartido para responder streams multimedia con soporte HTTP Range 206,
 * descarga forzada (?download=1) y políticas de caché editorial (R-003).
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MedioCultural } from '../../domain/entities/MedioCultural.js';
import { AppError, RangeNotSatisfiableError } from '../../shared/errors/AppError.js';
import type { StreamFileResult } from '../../shared/storage/storage.service.js';

export function sendMediaStreamResponse(
  reply: FastifyReply,
  streamResult: StreamFileResult,
  medio: Pick<MedioCultural, 'uuid' | 'originalName' | 'estado'>,
  isDownload = false,
): FastifyReply {
  reply.header('Accept-Ranges', 'bytes');
  reply.header('Content-Type', streamResult.contentType);
  reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

  if (isDownload) {
    const safeFilename = (medio.originalName || `${medio.uuid}.bin`).replace(/["\r\n]/g, '_');
    reply.header('Content-Disposition', `attachment; filename="${safeFilename}"`);
  }

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

  // Caché pública para medios ratificados (1 hora en navegador, 1 día en CDN); borradores nunca se cachean
  reply.header(
    'Cache-Control',
    medio.estado === 'ratificado' ? 'public, max-age=3600, s-maxage=86400' : 'private, no-store',
  );

  return reply.send(streamResult.stream);
}

/**
 * Emite respuestas HTTP estandarizadas para errores de streaming multimedia (416 con Content-Range, 4xx AppError, 500).
 */
export function sendMediaStreamError(
  request: FastifyRequest,
  reply: FastifyReply,
  err: unknown,
): FastifyReply {
  if (err instanceof RangeNotSatisfiableError) {
    reply.header('Content-Range', `bytes */${err.totalSize}`);
    return reply.code(416).send({
      statusCode: 416,
      error: 'Range Not Satisfiable',
      ...(err.code ? { code: err.code } : {}),
      message: err.message,
    });
  }

  if (err instanceof AppError) {
    return reply.code(err.statusCode).send({
      statusCode: err.statusCode,
      error: err.name,
      ...(err.code ? { code: err.code } : {}),
      message: err.message,
    });
  }

  request.log.error(err, 'Error procesando streaming de medio');
  return reply.code(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Error al acceder al archivo multimedia',
  });
}
