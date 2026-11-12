/**
 * Admin Governance Routes
 * Spec 006 (R-014, R-015, R-025, R-027) - Rutas de gobierno editorial para ratificación de nodos,
 * ratificación por lote atómica y consulta de progreso.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { RatificarLoteSchema } from '../../../application/dtos/AdminSentidoDto.js';
import { ProgresoRatificacionUseCase } from '../../../application/use-cases/admin/ProgresoRatificacionUseCase.js';
import {
  RatificarLoteError,
  RatificarLoteUseCase,
} from '../../../application/use-cases/admin/RatificarLoteUseCase.js';
import {
  type NivelNodoTaxonomico,
  RatificarNodoUseCase,
} from '../../../application/use-cases/admin/RatificarNodoUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const NodoParamsSchema = z.object({
  nivel: z.enum(['campo', 'subcampo', 'microcampo']),
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val)),
});

const NodoLoteParamsSchema = z.object({
  nivel: z.enum(['campo', 'subcampo', 'microcampo']),
  id: z
    .string()
    .trim()
    .regex(/^(\d+|[Cc]\d+(\.[Ss]\d+(\.[Mm]\d+)?)?)$/, 'Identificador o código de nodo inválido')
    .transform((val) => (/^\d+$/.test(val) ? BigInt(val) : val.toUpperCase())),
});

const RatificarNodoBodySchema = z.object({
  version: z.number().int().min(1, 'La versión debe ser un entero positivo'),
});

const ProgresoQuerySchema = z.object({
  soloConPendientes: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export async function adminGovernanceRoutes(app: FastifyInstance): Promise<void> {
  const ratificarNodoUseCase = new RatificarNodoUseCase();
  const ratificarLoteUseCase = new RatificarLoteUseCase();
  const progresoRatificacionUseCase = new ProgresoRatificacionUseCase();

  // Guardas globales del plugin: Autenticación requerida y contraseña cambiada
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * POST /api/admin/governance/nodos/:nivel/:id/ratificar
   * Ratificar nodo taxonómico (campo, subcampo, microcampo) (requiere taxonomy:ratify)
   */
  app.post(
    '/nodos/:nivel/:id/ratificar',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = NodoParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        throw new AppError('Parámetros de nodo inválidos', 400);
      }

      const parsedBody = RatificarNodoBodySchema.safeParse(request.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
      }

      const actor = request.user;
      if (!actor) {
        throw new AppError('No estás autenticado', 401);
      }

      const resultado = await ratificarNodoUseCase.execute(
        {
          nivel: parsedParams.data.nivel as NivelNodoTaxonomico,
          id: parsedParams.data.id,
          version: parsedBody.data.version,
        },
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
   * POST /api/admin/governance/nodos/:nivel/:id/ratificar-lote
   * Ratificación por lote atómica (todo o nada) por microcampo (requiere taxonomy:ratify)
   */
  const handleRatificarLote = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = NodoLoteParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      throw new AppError('Parámetros de nodo inválidos', 400);
    }

    const parsedBody = RatificarLoteSchema.safeParse(request.body);
    if (!parsedBody.success) {
      throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
    }

    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }

    try {
      const resultado = await ratificarLoteUseCase.execute(
        parsedParams.data.nivel as NivelNodoTaxonomico,
        parsedParams.data.id,
        parsedBody.data,
        {
          userId: BigInt(actor.userId),
          username: actor.username,
          roles: actor.roles ?? [],
        },
      );

      return reply.code(200).send(serializeBigInt(resultado));
    } catch (error) {
      if (error instanceof RatificarLoteError) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          code: 'BATCH_RATIFICATION_CONFLICT',
          message: error.message,
          conflictos: error.conflictos,
        });
      }
      throw error;
    }
  };

  app.post(
    '/nodos/:nivel/:id/ratificar-lote',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    handleRatificarLote,
  );

  app.post(
    '/ratificar-lote/:nivel/:id',
    { preHandler: [requirePermission(PERMISSIONS.TAXONOMIA_RATIFICAR)] },
    handleRatificarLote,
  );

  /**
   * GET /api/admin/governance/progreso
   * Progreso editorial de ratificación por campo, subcampo y microcampo (requiere dictionary:read)
   */
  app.get(
    '/progreso',
    { preHandler: [requirePermission(PERMISSIONS.DICCIONARIO_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = ProgresoQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new AppError('Parámetros inválidos', 400);
      }

      const resultado = await progresoRatificacionUseCase.execute({
        soloConPendientes: parsedQuery.data.soloConPendientes,
      });

      return reply.code(200).send(serializeBigInt(resultado));
    },
  );
}
