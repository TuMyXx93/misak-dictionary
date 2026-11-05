/**
 * adminTaxonomyRoutes
 * Spec 012 v0.2.0 — Rutas administrativas protegidas para gestión taxonómica integral:
 * Árbol completo con métricas de términos, CRUD para campos, subcampos y microcampos
 * con protección estricta contra eliminación de nodos con dependencias activas (HTTP 409).
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateCampoSchema,
  CreateMicrocampoSchema,
  CreateSubcampoSchema,
  TaxonomyIdParamSchema,
  UpdateCampoSchema,
  UpdateMicrocampoSchema,
  UpdateSubcampoSchema,
} from '../../../application/dtos/AdminTaxonomiaDto.js';
import { ManageTaxonomiaUseCase } from '../../../application/use-cases/admin/ManageTaxonomiaUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

export async function adminTaxonomyRoutes(app: FastifyInstance): Promise<void> {
  const useCase = new ManageTaxonomiaUseCase();

  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * GET /api/admin/dictionary/taxonomia/arbol
   * Árbol taxonómico completo con conteos de hijos y términos
   */
  app.get(
    '/arbol',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_LEER)] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const tree = await useCase.obtenerArbol();
      return reply.code(200).send(serializeBigInt(tree));
    },
  );

  /**
   * POST /api/admin/dictionary/taxonomia/campos
   */
  app.post(
    '/campos',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateCampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const created = await useCase.crearCampo(parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(201).send(serializeBigInt(created));
    },
  );

  /**
   * PATCH /api/admin/dictionary/taxonomia/campos/:id
   */
  app.patch(
    '/campos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const parsed = UpdateCampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const updated = await useCase.actualizarCampo(params.data.id, parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(serializeBigInt(updated));
    },
  );

  /**
   * DELETE /api/admin/dictionary/taxonomia/campos/:id
   */
  app.delete(
    '/campos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_BORRAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const res = await useCase.eliminarCampo(params.data.id, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(res);
    },
  );

  /**
   * POST /api/admin/dictionary/taxonomia/subcampos
   */
  app.post(
    '/subcampos',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateSubcampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const created = await useCase.crearSubcampo(parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(201).send(serializeBigInt(created));
    },
  );

  /**
   * PATCH /api/admin/dictionary/taxonomia/subcampos/:id
   */
  app.patch(
    '/subcampos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const parsed = UpdateSubcampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const updated = await useCase.actualizarSubcampo(params.data.id, parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(serializeBigInt(updated));
    },
  );

  /**
   * DELETE /api/admin/dictionary/taxonomia/subcampos/:id
   */
  app.delete(
    '/subcampos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_BORRAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const res = await useCase.eliminarSubcampo(params.data.id, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(res);
    },
  );

  /**
   * POST /api/admin/dictionary/taxonomia/microcampos
   */
  app.post(
    '/microcampos',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateMicrocampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const created = await useCase.crearMicrocampo(parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(201).send(serializeBigInt(created));
    },
  );

  /**
   * PATCH /api/admin/dictionary/taxonomia/microcampos/:id
   */
  app.patch(
    '/microcampos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const parsed = UpdateMicrocampoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }
      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const updated = await useCase.actualizarMicrocampo(params.data.id, parsed.data, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(serializeBigInt(updated));
    },
  );

  /**
   * DELETE /api/admin/dictionary/taxonomia/microcampos/:id
   */
  app.delete(
    '/microcampos/:id',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_BORRAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = TaxonomyIdParamSchema.safeParse(request.params);
      if (!params.success) throw new AppError('ID inválido', 400);

      const actor = request.user;
      if (!actor) throw new AppError('No autenticado', 401);

      const res = await useCase.eliminarMicrocampo(params.data.id, {
        userId: BigInt(actor.userId),
        username: actor.username,
      });
      return reply.code(200).send(res);
    },
  );
}
