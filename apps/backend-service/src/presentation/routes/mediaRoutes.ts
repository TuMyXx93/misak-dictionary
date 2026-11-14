import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetMediaStreamUseCase } from '../../application/use-cases/media/GetMediaStreamUseCase.js';
import { TokenService } from '../../infrastructure/auth/TokenService.js';
import { PrismaMedioCulturalRepository } from '../../infrastructure/repositories/MedioCulturalRepository.js';
import { PermissionRepository } from '../../infrastructure/repositories/PermissionRepository.js';
import { PERMISSIONS } from '../../shared/auth/permissions.js';
import { LocalStorageService } from '../../shared/storage/local-storage.service.js';
import { sendMediaStreamError, sendMediaStreamResponse } from '../helpers/sendMediaStream.js';

interface StreamQuery {
  download?: string;
}

const tokenService = new TokenService();
const permissionRepository = new PermissionRepository();

function extractMediaToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  const cookies = (request as FastifyRequest & { cookies?: Record<string, string | undefined> })
    .cookies;
  const cookieToken = cookies?.['misak_at'];
  return cookieToken && cookieToken.trim().length > 0 ? cookieToken.trim() : null;
}

async function canAuthenticatedUserReadDrafts(request: FastifyRequest): Promise<boolean> {
  const token = extractMediaToken(request);
  if (!token) return false;

  const payload = tokenService.verifyAccessToken(token);
  if (!payload) return false;

  try {
    const permissions = await permissionRepository.findPermissionNamesForUser(payload.userId);
    return (
      permissions.includes(PERMISSIONS.MEDIOS_LEER) ||
      permissions.includes(PERMISSIONS.DICCIONARIO_LEER)
    );
  } catch {
    return false;
  }
}

export async function mediaRoutes(fastify: FastifyInstance): Promise<void> {
  const mediaRepo = new PrismaMedioCulturalRepository();
  const storageService = new LocalStorageService();
  const getMediaStreamUseCase = new GetMediaStreamUseCase(mediaRepo, storageService);

  /**
   * GET /api/media/:uuid/stream
   * Streaming de audio con HTTP Range 206, descarga (?download=1) y lectura autenticada de borradores
   */
  fastify.get(
    '/:uuid/stream',
    async (
      request: FastifyRequest<{ Params: { uuid: string }; Querystring: StreamQuery }>,
      reply: FastifyReply,
    ) => {
      const { uuid } = request.params;
      const rangeHeader = request.headers.range;
      const ifRangeHeader =
        typeof request.headers['if-range'] === 'string' ? request.headers['if-range'] : undefined;
      const ifNoneMatchHeader =
        typeof request.headers['if-none-match'] === 'string'
          ? request.headers['if-none-match']
          : undefined;
      const isDownload = request.query?.download === '1' || request.query?.download === 'true';

      const isHead = request.method === 'HEAD';

      try {
        const result = await getMediaStreamUseCase.execute({
          uuid,
          rangeHeader,
          canReadDrafts: () => canAuthenticatedUserReadDrafts(request),
          ...(ifRangeHeader ? { ifRangeHeader } : {}),
          ...(ifNoneMatchHeader ? { ifNoneMatchHeader } : {}),
          ...(isHead ? { headOnly: true } : {}),
        });

        return sendMediaStreamResponse(reply, result.streamResult, result.medio, isDownload, {
          etag: result.etag,
          notModified: result.notModified,
        });
      } catch (err: unknown) {
        return sendMediaStreamError(request, reply, err);
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
