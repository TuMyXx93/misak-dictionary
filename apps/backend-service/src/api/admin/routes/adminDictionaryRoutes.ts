/**
 * Admin Dictionary Routes
 * Sprint 4 - Admin API
 * Rutas protegidas para CRUD de diccionario
 */

import type { FastifyInstance } from 'fastify';
import { CreateWordModel1UseCase } from '../../../application/use-cases/admin/CreateWordModel1UseCase.js';
import { DeleteWordUseCase } from '../../../application/use-cases/admin/DeleteWordUseCase.js';
import { ManageSemanticFieldsUseCase } from '../../../application/use-cases/admin/ManageSemanticFieldsUseCase.js';
import { UpdateWordModel1UseCase } from '../../../application/use-cases/admin/UpdateWordModel1UseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import { requireEditor } from '../../../presentation/middleware/authorizationMiddleware.js';
import { AdminDictionaryController } from '../controllers/AdminDictionaryController.js';

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
  fastify.addHook('onRequest', requireEditor);

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
