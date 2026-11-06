/**
 * Admin Abreviaturas Routes
 * Spec 012 v0.2.0 (R-012, R-017)
 * CRUD administrativo seguro para las abreviaturas lingüísticas (codigo y etiquetaCompleta).
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ManageAbreviaturasUseCase } from '../../../application/use-cases/dictionary/ManageAbreviaturasUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const AbreviaturaIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val)),
});

const CreateAbreviaturaBodySchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').max(50),
  etiquetaCompleta: z.string().min(1, 'La etiqueta completa es obligatoria').max(200),
  orden: z.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
});

const UpdateAbreviaturaBodySchema = z.object({
  codigo: z.string().min(1).max(50).optional(),
  etiquetaCompleta: z.string().min(1).max(200).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

const ListQuerySchema = z.object({
  q: z.string().optional(),
});

export async function adminAbreviaturaRoutes(app: FastifyInstance): Promise<void> {
  const useCase = new ManageAbreviaturasUseCase();

  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * GET /api/admin/dictionary/abreviaturas
   * Listado con conteos de uso
   */
  app.get(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ListQuerySchema.safeParse(request.query);
      const filter: { q?: string } = {};
      if (parsed.success && parsed.data?.q) {
        filter.q = parsed.data.q;
      }
      const items = await useCase.listarAdmin(filter);
      return reply.code(200).send(serializeBigInt(items));
    },
  );

  /**
   * POST /api/admin/dictionary/abreviaturas
   * Crear nueva abreviatura
   */
  app.post(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateAbreviaturaBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const created = await useCase.crear(
        {
          codigo: parsed.data.codigo,
          etiquetaCompleta: parsed.data.etiquetaCompleta,
          ...(parsed.data.orden !== undefined ? { orden: parsed.data.orden } : {}),
          ...(parsed.data.activo !== undefined ? { activo: parsed.data.activo } : {}),
        },
        {
          userId: BigInt(actor.userId),
          username: actor.username,
        },
      );
      return reply.code(201).send(serializeBigInt(created));
    },
  );

  /**
   * PATCH /api/admin/dictionary/abreviaturas/:id
   * Actualizar abreviatura
   */
  app.patch(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = AbreviaturaIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const parsed = UpdateAbreviaturaBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const updateData: {
        codigo?: string;
        etiquetaCompleta?: string;
        orden?: number;
        activo?: boolean;
      } = {};
      if (parsed.data.codigo !== undefined) updateData.codigo = parsed.data.codigo;
      if (parsed.data.etiquetaCompleta !== undefined)
        updateData.etiquetaCompleta = parsed.data.etiquetaCompleta;
      if (parsed.data.orden !== undefined) updateData.orden = parsed.data.orden;
      if (parsed.data.activo !== undefined) updateData.activo = parsed.data.activo;

      const updated = await useCase.actualizar(params.data.id, updateData, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(serializeBigInt(updated));
    },
  );

  /**
   * DELETE /api/admin/dictionary/abreviaturas/:id
   * Eliminar abreviatura (falla si está en uso con 409)
   */
  app.delete(
    '/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_BORRAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = AbreviaturaIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      await useCase.eliminar(params.data.id, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send({ success: true, message: 'Abreviatura eliminada' });
    },
  );
}
