/**
 * Admin Papelera Routes
 * Spec 006 (R-016, R-017) — Listado, restauración y purga física de elementos en papelera.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  NIVELES_PAPELERA,
  PapeleraUseCase,
} from '../../../application/use-cases/admin/PapeleraUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
  requireSuperAdmin,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const PapeleraParamsSchema = z.object({
  nivel: z.enum(NIVELES_PAPELERA),
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((valor) => BigInt(valor)),
});

const PurgarPapeleraBodySchema = z
  .object({
    confirmCodigo: z.string().optional(),
    codigo: z.string().optional(),
  })
  .refine((data) => Boolean(data.confirmCodigo || data.codigo), {
    message: 'Código de confirmación requerido',
  })
  .transform((data) => ({
    confirmCodigo: (data.confirmCodigo ?? data.codigo)!,
  }));

export async function adminPapeleraRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('onRequest', requirePasswordChanged());
  fastify.addHook('onRequest', requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR));

  const papeleraUseCase = new PapeleraUseCase();

  fastify.get('/', async () => {
    const listado = await papeleraUseCase.listar();
    const items = listado.map((it) => ({
      ...it,
      tipo: it.nivel,
      deletedAt: it.eliminadoAt ? it.eliminadoAt.toISOString() : '',
      lema: it.namtrik ?? it.espanol,
      glosa: it.espanol,
    }));
    return serializeBigInt(items);
  });

  const handleRestaurar = async (
    nivelStr: string | undefined,
    idBigInt: bigint,
    actor: any,
    reply: any,
  ) => {
    let nivel = nivelStr as (typeof NIVELES_PAPELERA)[number] | undefined;
    if (!nivel || !NIVELES_PAPELERA.includes(nivel)) {
      // Intentar auto-detectar nivel buscando el registro eliminado
      for (const n of NIVELES_PAPELERA) {
        const item = await (papeleraUseCase as any).buscarEliminado(n, idBigInt);
        if (item) {
          nivel = n;
          break;
        }
      }
    }
    if (!nivel) {
      throw new AppError('Elemento no encontrado en papelera', 404);
    }
    await papeleraUseCase.restaurar(nivel, idBigInt, actor);
    return reply.status(204).send();
  };

  fastify.post('/:nivel/:id/restaurar', async (request, reply) => {
    const parametros = PapeleraParamsSchema.safeParse(request.params);
    if (!parametros.success) {
      throw new AppError('Parámetros de papelera inválidos', 400);
    }
    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }
    return handleRestaurar(parametros.data.nivel, parametros.data.id, actor, reply);
  });

  fastify.post('/:id/restaurar', async (request, reply) => {
    const params = z
      .object({
        id: z
          .string()
          .regex(/^\d+$/)
          .transform((v) => BigInt(v)),
      })
      .safeParse(request.params);
    if (!params.success) {
      throw new AppError('ID de papelera inválido', 400);
    }
    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }
    return handleRestaurar(undefined, params.data.id, actor, reply);
  });

  fastify.delete('/:nivel/:id', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const parametros = PapeleraParamsSchema.safeParse(request.params);
    if (!parametros.success) {
      throw new AppError('Parámetros de papelera inválidos', 400);
    }
    const parsedBody = PurgarPapeleraBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? 'Código de confirmación requerido',
        400,
      );
    }
    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }
    await papeleraUseCase.purgar(
      parametros.data.nivel,
      parametros.data.id,
      parsedBody.data.confirmCodigo,
      {
        userId: BigInt(actor.userId),
        username: actor.username,
        roles: actor.roles ?? [],
      },
    );
    return reply.status(204).send();
  });
}
