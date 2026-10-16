/**
 * Admin Dictionary Routes
 * Sprint 4 - Admin API
 * Rutas protegidas para CRUD de diccionario
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CreateWordModel1UseCase } from '../../../application/use-cases/admin/CreateWordModel1UseCase.js';
import { DeleteWordUseCase } from '../../../application/use-cases/admin/DeleteWordUseCase.js';
import { ManageSemanticFieldsUseCase } from '../../../application/use-cases/admin/ManageSemanticFieldsUseCase.js';
import {
  NIVELES_PAPELERA,
  PapeleraUseCase,
} from '../../../application/use-cases/admin/PapeleraUseCase.js';
import { UpdateWordModel1UseCase } from '../../../application/use-cases/admin/UpdateWordModel1UseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
  requireSuperAdmin,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';
import { AdminDictionaryController } from '../controllers/AdminDictionaryController.js';

const PapeleraParamsSchema = z.object({
  nivel: z.enum(NIVELES_PAPELERA),
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((valor) => BigInt(valor)),
});

const PurgarPapeleraBodySchema = z.object({
  confirmCodigo: z.string().min(1, 'Código de confirmación requerido'),
});

export async function adminDictionaryRoutes(fastify: FastifyInstance) {
  // Instanciar use cases
  const createWordModel1UseCase = new CreateWordModel1UseCase();
  const updateWordModel1UseCase = new UpdateWordModel1UseCase();
  const deleteWordUseCase = new DeleteWordUseCase();
  const manageSemanticFieldsUseCase = new ManageSemanticFieldsUseCase();

  // Instanciar controller
  const controller = new AdminDictionaryController(
    createWordModel1UseCase,
    updateWordModel1UseCase,
    deleteWordUseCase,
    manageSemanticFieldsUseCase,
  );

  // Aplicar middleware de auth y autorización a todas las rutas
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('onRequest', requirePasswordChanged());
  fastify.addHook('onRequest', requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR));

  // ========== PAPELERA (restaurar borrados lógicos y purga física) ==========

  const papeleraUseCase = new PapeleraUseCase();

  fastify.get('/papelera', async () => {
    const listado = await papeleraUseCase.listar();
    return serializeBigInt(listado);
  });

  fastify.post('/papelera/:nivel/:id/restaurar', async (request, reply) => {
    const parametros = PapeleraParamsSchema.safeParse(request.params);
    if (!parametros.success) {
      throw new AppError('Parámetros de papelera inválidos', 400);
    }
    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }
    await papeleraUseCase.restaurar(parametros.data.nivel, parametros.data.id, actor);
    return reply.status(204).send();
  });

  /**
   * DELETE /api/admin/dictionary/papelera/:nivel/:id
   * Purga física irrevocable exclusiva de super_admin (R-017, D-5)
   */
  fastify.delete(
    '/papelera/:nivel/:id',
    { preHandler: [requireSuperAdmin] },
    async (request, reply) => {
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
    },
  );

  // ========== PALABRAS MODELO 1 ==========

  fastify.post('/words/modelo1', async (request, reply) => {
    return controller.createWordModel1(request, reply);
  });

  fastify.put('/words/modelo1/:id', async (request, reply) => {
    return controller.updateWordModel1(request, reply);
  });

  fastify.delete('/words/modelo1/:id', async (request, reply) => {
    return controller.deleteWordModel1(request, reply);
  });

  // ========== CAMPOS SEMÁNTICOS ==========

  fastify.post('/semantic-fields', async (request, reply) => {
    return controller.createCampoSemantico(request, reply);
  });

  fastify.put('/semantic-fields/:id', async (request, reply) => {
    return controller.updateCampoSemantico(request, reply);
  });

  fastify.delete('/semantic-fields/:id', async (request, reply) => {
    return controller.deleteCampoSemantico(request, reply);
  });

  // ========== SUBCAMPOS SEMÁNTICOS ==========

  fastify.post('/semantic-fields/:id/subcampos', async (request, reply) => {
    return controller.createSubcampoSemantico(request, reply);
  });

  fastify.put('/subcampos/:id', async (request, reply) => {
    return controller.updateSubcampoSemantico(request, reply);
  });

  fastify.delete('/subcampos/:id', async (request, reply) => {
    return controller.deleteSubcampoSemantico(request, reply);
  });

  // ========== MICROCAMPOS ==========

  fastify.post('/subcampos/:id/microcampos', async (request, reply) => {
    return controller.createMicrocampo(request, reply);
  });

  fastify.put('/microcampos/:id', async (request, reply) => {
    return controller.updateMicrocampo(request, reply);
  });

  fastify.delete('/microcampos/:id', async (request, reply) => {
    return controller.deleteMicrocampo(request, reply);
  });
}
