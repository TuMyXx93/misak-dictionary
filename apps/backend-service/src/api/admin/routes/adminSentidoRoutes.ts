/**
 * Admin Sentido Routes
 * Spec 006 (R-004, R-006..R-013) - Rutas administrativas para CRUD y ratificación de sentidos léxicos.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  CreateSentidoSchema,
  ListSentidosAdminQuerySchema,
  RatificarSentidoSchema,
  RevertirRatificacionSchema,
  UpdateSentidoSchema,
} from '../../../application/dtos/AdminSentidoDto.js';
import { CreateSentidoUseCase } from '../../../application/use-cases/admin/CreateSentidoUseCase.js';
import { DeleteSentidoUseCase } from '../../../application/use-cases/admin/DeleteSentidoUseCase.js';
import { ListSentidosAdminUseCase } from '../../../application/use-cases/admin/ListSentidosAdminUseCase.js';
import { RatificarSentidoUseCase } from '../../../application/use-cases/admin/RatificarSentidoUseCase.js';
import { RevertirRatificacionUseCase } from '../../../application/use-cases/admin/RevertirRatificacionUseCase.js';
import { UpdateSentidoUseCase } from '../../../application/use-cases/admin/UpdateSentidoUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const SentidoIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val)),
});

export async function adminSentidoRoutes(app: FastifyInstance): Promise<void> {
  const listSentidosUseCase = new ListSentidosAdminUseCase();
  const createSentidoUseCase = new CreateSentidoUseCase();
  const updateSentidoUseCase = new UpdateSentidoUseCase();
  const deleteSentidoUseCase = new DeleteSentidoUseCase();
  const ratificarSentidoUseCase = new RatificarSentidoUseCase();
  const revertirRatificacionUseCase = new RevertirRatificacionUseCase();

  // Guardas globales del plugin: Autenticación requerida y contraseña cambiada
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * GET /api/admin/dictionary/sentidos
   * Listado paginado y filtrable (requiere dictionary:read)
   */
  app.get(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = ListSentidosAdminQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new AppError(parsedQuery.error.issues[0]?.message ?? 'Parámetros inválidos', 400);
      }

      const result = await listSentidosUseCase.execute(parsedQuery.data);
      return reply.code(200).send(serializeBigInt(result));
    },
  );

  /**
   * POST /api/admin/dictionary/sentidos
   * Crear sentido léxico con código secuencial atómico (requiere dictionary:write)
   */
  app.post(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedBody = CreateSentidoSchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      const resultado = await createSentidoUseCase.execute(parsedBody.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });

      return reply.code(201).send(serializeBigInt(resultado));
    },
  );

  /**
   * PATCH /api/admin/dictionary/sentidos/:id
   * Actualizar sentido con concurrencia optimista por versión (requiere dictionary:write)
   */
  app.patch(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = SentidoIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de sentido inválido', 400);
      }

      const parsedBody = UpdateSentidoSchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      const resultado = await updateSentidoUseCase.execute(parsedParams.data.id, parsedBody.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });

      return reply.code(200).send(serializeBigInt(resultado));
    },
  );

  /**
   * DELETE /api/admin/dictionary/sentidos/:id
   * Borrado lógico auditado (requiere dictionary:write)
   */
  app.delete(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = SentidoIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de sentido inválido', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      await deleteSentidoUseCase.execute(parsedParams.data.id, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });

      return reply.code(204).send();
    },
  );

  /**
   * POST /api/admin/dictionary/sentidos/:id/ratificar
   * Ratificar sentido editorialmente (requiere taxonomy:ratify)
   */
  app.post(
    '/:id/ratificar',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = SentidoIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de sentido inválido', 400);
      }

      const parsedBody = RatificarSentidoSchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      const resultado = await ratificarSentidoUseCase.execute(
        parsedParams.data.id,
        parsedBody.data,
        {
          userId: BigInt(actor.userId),
          username: actor.username,
          roles: actor.roles ?? [],
        },
      );

      return reply.code(200).send(serializeBigInt(resultado));
    },
  );

  /**
   * POST /api/admin/dictionary/sentidos/:id/revertir
   * Revertir ratificación a borrador con motivo (requiere taxonomy:ratify)
   */
  app.post(
    '/:id/revertir',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = SentidoIdParamSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('ID de sentido inválido', 400);
      }

      const parsedBody = RevertirRatificacionSchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      const resultado = await revertirRatificacionUseCase.execute(
        parsedParams.data.id,
        parsedBody.data,
        {
          userId: BigInt(actor.userId),
          username: actor.username,
        },
      );

      return reply.code(200).send(serializeBigInt(resultado));
    },
  );
}
