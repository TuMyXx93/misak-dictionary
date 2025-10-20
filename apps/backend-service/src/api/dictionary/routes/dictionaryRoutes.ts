/**
 * Dictionary Routes
 * Sprint 3 - Dictionary API (Public endpoints)
 * Rutas públicas para consultar palabras del diccionario
 */

import type { FastifyInstance } from 'fastify';
import { DictionaryController } from '../controllers/DictionaryController.js';
import { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';

export async function dictionaryRoutes(fastify: FastifyInstance) {
  // Instanciar dependencias
  const palabraRepository = new PalabraRepository();
  const searchWordsUseCase = new SearchWordsUseCase(palabraRepository);
  const getWordByIdUseCase = new GetWordByIdUseCase(palabraRepository);
  const dictionaryController = new DictionaryController(searchWordsUseCase, getWordByIdUseCase);

  /**
   * GET /api/dictionary/words/search
   * Búsqueda de palabras con filtros
   */
  fastify.get('/words/search', async (request, reply) => {
    return dictionaryController.searchWords(request, reply);
  });

  /**
   * GET /api/dictionary/words/modelo1/:id
   * Obtener palabra Modelo 1 por ID
   */
  fastify.get('/words/modelo1/:id', async (request, reply) => {
    return dictionaryController.getWordModelo1ById(request, reply);
  });

  /**
   * GET /api/dictionary/words/modelo2/:id
   * Obtener palabra Modelo 2 por ID
   */
  fastify.get('/words/modelo2/:id', async (request, reply) => {
    return dictionaryController.getWordModelo2ById(request, reply);
  });
}
