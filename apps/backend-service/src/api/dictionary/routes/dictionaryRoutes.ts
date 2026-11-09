/**
 * Dictionary Routes
 * Sprint 3 - Dictionary API (Public endpoints)
 * Rutas públicas para consultar palabras del diccionario
 */

import type { FastifyInstance } from 'fastify';
import { GetHomeSlotsUseCase } from '../../../application/use-cases/dictionary/GetHomeSlotsUseCase.js';
import { GetSemanticFieldsUseCase } from '../../../application/use-cases/dictionary/GetSemanticFieldsUseCase.js';
import { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import { ManageAbreviaturasUseCase } from '../../../application/use-cases/dictionary/ManageAbreviaturasUseCase.js';
import { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';
import { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';
import { DictionaryController } from '../controllers/DictionaryController.js';

export async function dictionaryRoutes(fastify: FastifyInstance) {
  const palabraRepository = new PalabraRepository();
  const campoSemanticoRepository = new CampoSemanticoRepository();
  const searchWordsUseCase = new SearchWordsUseCase(palabraRepository);
  const getWordByIdUseCase = new GetWordByIdUseCase(palabraRepository);
  const getSemanticFieldsUseCase = new GetSemanticFieldsUseCase(campoSemanticoRepository);
  const getHomeSlotsUseCase = new GetHomeSlotsUseCase(campoSemanticoRepository);
  const manageAbreviaturasUseCase = new ManageAbreviaturasUseCase();
  const dictionaryController = new DictionaryController(
    searchWordsUseCase,
    getWordByIdUseCase,
    getSemanticFieldsUseCase,
    getHomeSlotsUseCase,
  );

  fastify.get('/words/search', async (request, reply) => {
    return dictionaryController.searchWords(request, reply);
  });

  fastify.get('/words/modelo1/:id', async (request, reply) => {
    return dictionaryController.getWordModelo1ById(request, reply);
  });

  fastify.get('/words/modelo2/:id', async (request, reply) => {
    return dictionaryController.getWordModelo2ById(request, reply);
  });

  fastify.get('/home-slots', async (request, reply) => {
    return dictionaryController.getHomeSlots(request, reply);
  });

  fastify.get('/semantic-fields', async (request, reply) => {
    return dictionaryController.getSemanticFields(request, reply);
  });

  /**
   * El segmento estático `/slug/:slug` precede a `/:id` para garantizar prioridad
   * en el árbol radix del router de Fastify.
   */
  fastify.get('/semantic-fields/slug/:slug', async (request, reply) => {
    return dictionaryController.getSemanticFieldBySlug(request, reply);
  });

  fastify.get('/semantic-fields/:id', async (request, reply) => {
    return dictionaryController.getSemanticFieldById(request, reply);
  });

  fastify.get('/abreviaturas', async (_request, reply) => {
    const list = await manageAbreviaturasUseCase.listarPublicas();
    return reply.code(200).send(list);
  });
}
