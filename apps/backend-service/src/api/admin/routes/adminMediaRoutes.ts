/**
 * Admin Media Routes
 * Spec 007 - Medios Escalonados (R-007, R-008, R-014)
 * Gestión integral de archivos multimedia en el panel administrativo:
 * subida segura, edición de metadatos, ratificación y eliminación lógica.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DeleteMediaUseCase } from '../../../application/use-cases/media/DeleteMediaUseCase.js';
import { ListMediaUseCase } from '../../../application/use-cases/media/ListMediaUseCase.js';
import { RatifyMediaUseCase } from '../../../application/use-cases/media/RatifyMediaUseCase.js';
import { UploadMediaUseCase } from '../../../application/use-cases/media/UploadMediaUseCase.js';
import type { PropositoMedio, TipoMedio } from '../../../domain/entities/MedioCultural.js';
import { PrismaMedioCulturalRepository } from '../../../infrastructure/repositories/MedioCulturalRepository.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { LocalStorageService } from '../../../shared/storage/local-storage.service.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const MediaIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val)),
});

const ListMediaQuerySchema = z.object({
  tipo: z.enum(['audio', 'imagen']).optional(),
  estado: z.enum(['borrador', 'ratificado']).optional(),
  sentidoId: z.coerce
    .number()
    .optional()
    .transform((v) => (v ? BigInt(v) : undefined)),
  formaId: z.coerce
    .number()
    .optional()
    .transform((v) => (v ? BigInt(v) : undefined)),
  query: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const UpdateMetadataBodySchema = z.object({
  hablanteAutor: z.string().max(255).optional(),
  varianteDialectal: z.string().max(100).optional(),
  descripcionEspanol: z.string().max(1000).optional(),
  descripcionNamtrik: z.string().max(1000).optional(),
  licenciaComunitaria: z.string().max(255).optional(),
  sentidoId: z
    .number()
    .nullable()
    .optional()
    .transform((v) => (v !== undefined && v !== null ? BigInt(v) : v)),
  formaId: z
    .number()
    .nullable()
    .optional()
    .transform((v) => (v !== undefined && v !== null ? BigInt(v) : v)),
  proposito: z
    .enum([
      'pronunciacion_lema',
      'contexto_oracion',
      'pregunta_dialogo',
      'respuesta_dialogo',
      'ilustracion_cultural',
      'fotografia_territorio',
    ])
    .optional(),
});

interface RequestUser {
  id: bigint | string | number;
  username?: string;
  email?: string;
}

function getAuthenticatedUser(request: FastifyRequest): RequestUser | undefined {
  return (request as unknown as { user?: RequestUser }).user;
}

export async function adminMediaRoutes(app: FastifyInstance): Promise<void> {
  const mediaRepo = new PrismaMedioCulturalRepository();
  const storageService = new LocalStorageService();
  const auditService = new AuditService();

  const uploadMediaUseCase = new UploadMediaUseCase(mediaRepo, storageService);
  const listMediaUseCase = new ListMediaUseCase(mediaRepo);
  const ratifyMediaUseCase = new RatifyMediaUseCase(mediaRepo, auditService);
  const deleteMediaUseCase = new DeleteMediaUseCase(mediaRepo, auditService);

  // Guardas globales del plugin administrativo
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * POST /api/admin/medios/upload
   * Subida de archivo multimedia con multipart/form-data (requiere media:write, R-007, R-008)
   */
  app.post(
    '/upload',
    { preHandler: [requirePermission(PERMISSIONS.MEDIOS_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) {
        throw new AppError('No se adjuntó ningún archivo multimedia en la petición', 400);
      }

      const buffer = await data.toBuffer();
      const fields = data.fields as Record<string, unknown>;

      // Extraer campos del formulario multipart
      const extractField = (key: string): string | undefined => {
        const val = fields[key];
        if (!val) return undefined;
        return typeof val === 'object' && 'value' in val ? String(val.value) : String(val);
      };

      const tipo = extractField('tipo') as TipoMedio;
      const proposito = extractField('proposito') as PropositoMedio;
      const sentidoIdRaw = extractField('sentidoId');
      const formaIdRaw = extractField('formaId');
      const hablanteAutor = extractField('hablanteAutor');
      const varianteDialectal = extractField('varianteDialectal');
      const descripcionEspanol = extractField('descripcionEspanol');
      const descripcionNamtrik = extractField('descripcionNamtrik');
      const licenciaComunitaria = extractField('licenciaComunitaria');
      const duracionSegundosRaw = extractField('duracionSegundos');

      const sentidoId = sentidoIdRaw ? BigInt(sentidoIdRaw) : undefined;
      const formaId = formaIdRaw ? BigInt(formaIdRaw) : undefined;
      const duracionSegundos = duracionSegundosRaw ? parseFloat(duracionSegundosRaw) : undefined;
      const user = getAuthenticatedUser(request);

      const created = await uploadMediaUseCase.execute({
        fileBuffer: buffer,
        originalFilename: data.filename,
        declaredMimetype: data.mimetype,
        tipo,
        proposito,
        sentidoId,
        formaId,
        hablanteAutor,
        varianteDialectal,
        descripcionEspanol,
        descripcionNamtrik,
        licenciaComunitaria,
        duracionSegundos,
        userId: user?.id ? BigInt(user.id) : undefined,
      });

      return reply.code(201).send({
        success: true,
        data: serializeBigInt(created),
      });
    },
  );

  /**
   * GET /api/admin/medios
   * Listado paginado de medios (requiere media:read, R-007, R-014)
   */
  app.get(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.MEDIOS_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = ListMediaQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new AppError(parsedQuery.error.issues[0]?.message ?? 'Parámetros inválidos', 400);
      }

      const result = await listMediaUseCase.execute(parsedQuery.data);

      return reply.code(200).send({
        success: true,
        data: serializeBigInt(result.items),
        total: result.total,
        limit: parsedQuery.data.limit,
        offset: parsedQuery.data.offset,
      });
    },
  );

  /**
   * GET /api/admin/medios/:id
   * Detalle de un medio por ID (requiere media:read)
   */
  app.get(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.MEDIOS_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = MediaIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de medio inválido', 400);
      }

      const medio = await mediaRepo.findById(parsedParams.data.id);
      if (!medio) {
        throw new AppError('Medio cultural no encontrado', 404);
      }

      return reply.code(200).send({
        success: true,
        data: serializeBigInt(medio),
      });
    },
  );

  /**
   * PATCH /api/admin/medios/:id/metadatos
   * Actualización de metadatos culturales (requiere media:write, R-007)
   */
  app.patch(
    '/:id/metadatos',
    { preHandler: [requirePermission(PERMISSIONS.MEDIOS_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = MediaIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de medio inválido', 400);
      }

      const parsedBody = UpdateMetadataBodySchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Metadatos inválidos', 400);
      }

      const updated = await mediaRepo.updateMetadata(parsedParams.data.id, parsedBody.data);

      return reply.code(200).send({
        success: true,
        data: serializeBigInt(updated),
      });
    },
  );

  /**
   * POST /api/admin/medios/:id/ratificar
   * Ratificación editorial de un medio (requiere taxonomy:ratify, R-003)
   */
  app.post(
    '/:id/ratificar',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = MediaIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de medio inválido', 400);
      }

      const user = getAuthenticatedUser(request);
      if (!user?.id) {
        throw new AppError('Usuario no autenticado', 401);
      }
      const ratified = await ratifyMediaUseCase.execute({
        id: parsedParams.data.id,
        actorUserId: BigInt(user.id),
        actorUsername: user.username,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.code(200).send({
        success: true,
        data: serializeBigInt(ratified),
      });
    },
  );

  /**
   * DELETE /api/admin/medios/:id
   * Eliminación lógica de un medio (requiere media:delete, R-007)
   */
  app.delete(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.MEDIOS_BORRAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = MediaIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de medio inválido', 400);
      }

      const user = getAuthenticatedUser(request);
      if (!user?.id) {
        throw new AppError('Usuario no autenticado', 401);
      }
      await deleteMediaUseCase.execute({
        id: parsedParams.data.id,
        actorUserId: BigInt(user.id),
        actorUsername: user.username,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.code(200).send({
        success: true,
        message: 'Medio cultural eliminado correctamente',
      });
    },
  );
}
