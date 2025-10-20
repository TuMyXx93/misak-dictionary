/**
 * DictionaryController
 * Sprint 3 - Dictionary API
 * Controlador para endpoints públicos del diccionario
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import { SearchWordsQuerySchema, WordIdParamSchema } from '../dtos/DictionaryDto.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class DictionaryController {
  constructor(
    private readonly searchWordsUseCase: SearchWordsUseCase,
    private readonly getWordByIdUseCase: GetWordByIdUseCase,
  ) {}

  /**
   * GET /api/dictionary/words/search
   * Búsqueda de palabras con filtros y paginación
   */
  async searchWords(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar query params
      const queryParams = SearchWordsQuerySchema.parse(request.query);

      // Ejecutar use case
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchParams: any = {
        page: queryParams.page,
        limit: queryParams.limit,
        orderBy: queryParams.orderBy,
      };
      if (queryParams.q) searchParams.query = queryParams.q;
      if (queryParams.microcampoId) searchParams.microcampoId = queryParams.microcampoId;

      const result = await this.searchWordsUseCase.execute(searchParams);

      // Serializar BigInt a string para JSON
      const serializedData = result.data.map((word) => ({
        ...word,
        id: word.id?.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        microcampos: (word as any).microcampos?.map((rel: any) => ({
          ...rel,
          microcampoId: rel.microcampoId?.toString(),
          microcampo: {
            ...rel.microcampo,
            id: rel.microcampo?.id?.toString(),
            subcampoSemanticoId: rel.microcampo?.subcampoSemanticoId?.toString(),
          },
        })),
      }));

      return reply.status(200).send({
        data: serializedData,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/dictionary/words/modelo1/:id
   * Obtener palabra Modelo 1 por ID
   */
  async getWordModelo1ById(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar path params
      const { id } = WordIdParamSchema.parse(request.params);

      // Ejecutar use case
      const word = await this.getWordByIdUseCase.executeModelo1(id);

      // Serializar BigInt a string
      const serializedWord = {
        ...word,
        id: word.id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        microcampos: word.microcampos?.map((rel: any) => ({
          ...rel,
          microcampoId: rel.microcampoId?.toString(),
          microcampo: {
            ...rel.microcampo,
            id: rel.microcampo.id.toString(),
            subcampoSemanticoId: rel.microcampo.subcampoSemanticoId?.toString(),
            subcampoSemantico: {
              ...rel.microcampo.subcampoSemantico,
              id: rel.microcampo.subcampoSemantico.id.toString(),
              campoSemanticoId: rel.microcampo.subcampoSemantico.campoSemanticoId?.toString(),
              campoSemantico: {
                ...rel.microcampo.subcampoSemantico.campoSemantico,
                id: rel.microcampo.subcampoSemantico.campoSemantico.id.toString(),
              },
            },
          },
        })),
      };

      return reply.status(200).send(serializedWord);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/dictionary/words/modelo2/:id
   * Obtener palabra Modelo 2 por ID
   */
  async getWordModelo2ById(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar path params
      const { id } = WordIdParamSchema.parse(request.params);

      // Ejecutar use case
      const word = await this.getWordByIdUseCase.executeModelo2(id);

      // Serializar BigInt a string
      const serializedWord = {
        ...word,
        id: word.id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        microcampos: word.microcampos?.map((rel: any) => ({
          ...rel,
          microcampoId: rel.microcampoId?.toString(),
          microcampo: {
            ...rel.microcampo,
            id: rel.microcampo.id.toString(),
            subcampoSemanticoId: rel.microcampo.subcampoSemanticoId?.toString(),
            subcampoSemantico: {
              ...rel.microcampo.subcampoSemantico,
              id: rel.microcampo.subcampoSemantico.id.toString(),
              campoSemanticoId: rel.microcampo.subcampoSemantico.campoSemanticoId?.toString(),
              campoSemantico: {
                ...rel.microcampo.subcampoSemantico.campoSemantico,
                id: rel.microcampo.subcampoSemantico.campoSemantico.id.toString(),
              },
            },
          },
        })),
      };

      return reply.status(200).send(serializedWord);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }
}
