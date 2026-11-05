/**
 * Dictionary Routes
 * Sprint 3 - Dictionary API (Public endpoints)
 * Rutas públicas para consultar palabras del diccionario
 */

import type { FastifyInstance } from 'fastify';
import { GetHomeSlotsUseCase } from '../../../application/use-cases/dictionary/GetHomeSlotsUseCase.js';
import { GetSemanticFieldsUseCase } from '../../../application/use-cases/dictionary/GetSemanticFieldsUseCase.js';
import { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';
import { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';
import { DictionaryController } from '../controllers/DictionaryController.js';

export async function dictionaryRoutes(fastify: FastifyInstance) {
  // Instanciar dependencias
  const palabraRepository = new PalabraRepository();
  const campoSemanticoRepository = new CampoSemanticoRepository();
  const searchWordsUseCase = new SearchWordsUseCase(palabraRepository);
  const getWordByIdUseCase = new GetWordByIdUseCase(palabraRepository);
  const getSemanticFieldsUseCase = new GetSemanticFieldsUseCase(campoSemanticoRepository);
  const getHomeSlotsUseCase = new GetHomeSlotsUseCase(campoSemanticoRepository);
  const dictionaryController = new DictionaryController(
    searchWordsUseCase,
    getWordByIdUseCase,
    getSemanticFieldsUseCase,
    getHomeSlotsUseCase,
  );

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

  /**
   * GET /api/dictionary/home-slots
   * Spec 004 R-013: Obtener los 7 slots del home configurados en BD
   */
  fastify.get('/home-slots', async (request, reply) => {
    return dictionaryController.getHomeSlots(request, reply);
  });

  /**
   * GET /api/dictionary/semantic-fields
   * Obtener jerarquía semántica completa
   */
  fastify.get('/semantic-fields', async (request, reply) => {
    return dictionaryController.getSemanticFields(request, reply);
  });

  /**
   * GET /api/dictionary/semantic-fields/:id
   * Obtener un campo semántico específico
   */
  /**
   * GET /api/dictionary/semantic-fields/slug/:slug
   * Spec 003: campo por slug (rutas estables). Segmento estático "slug"
   * tiene prioridad sobre el paramétrico :id en el router de Fastify.
   */
  fastify.get('/semantic-fields/slug/:slug', async (request, reply) => {
    return dictionaryController.getSemanticFieldBySlug(request, reply);
  });

  /**
   * GET /api/dictionary/semantic-fields/:id
   */
  fastify.get('/semantic-fields/:id', async (request, reply) => {
    return dictionaryController.getSemanticFieldById(request, reply);
  });

  /**
   * GET /api/dictionary/abreviaturas
   * Catálogo de abreviaturas lingüísticas activas (Spec 012 v0.2.0 / R-012, R-017)
   */
  fastify.get('/abreviaturas', async (_request, reply) => {
    const { ManageAbreviaturasUseCase } = await import(
      '../../../application/use-cases/dictionary/ManageAbreviaturasUseCase.js'
    );
    const manageAbreviaturasUseCase = new ManageAbreviaturasUseCase();
    const list = await manageAbreviaturasUseCase.listarPublicas();
    return reply.code(200).send(list);
  });
}
