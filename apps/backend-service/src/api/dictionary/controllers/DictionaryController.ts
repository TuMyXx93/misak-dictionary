/**
 * DictionaryController
 * Sprint 3 - Dictionary API
 * Controlador para endpoints públicos del diccionario
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetHomeSlotsUseCase } from '../../../application/use-cases/dictionary/GetHomeSlotsUseCase.js';
import type { GetSemanticFieldsUseCase } from '../../../application/use-cases/dictionary/GetSemanticFieldsUseCase.js';
import type { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import type { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { toSlug } from '../../../shared/utils/slug.js';
import { SearchWordsQuerySchema, WordIdParamSchema } from '../dtos/DictionaryDto.js';

export class DictionaryController {
  constructor(
    private readonly searchWordsUseCase: SearchWordsUseCase,
    private readonly getWordByIdUseCase: GetWordByIdUseCase,
    private readonly getSemanticFieldsUseCase: GetSemanticFieldsUseCase,
    private readonly getHomeSlotsUseCase: GetHomeSlotsUseCase,
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

  /**
   * GET /api/dictionary/semantic-fields
   * Obtener jerarquía semántica completa
   */
  async getSemanticFields(request: FastifyRequest, reply: FastifyReply) {
    try {
      const fields = await this.getSemanticFieldsUseCase.execute();
      const serialized = this.serializeBigInt(fields);
      return reply.status(200).send(this.enrichWithSlugs(serialized));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/dictionary/home-slots
   * Spec 004 R-013: Obtener los 7 slots del home persistidos con sus campos asociados
   */
  async getHomeSlots(request: FastifyRequest, reply: FastifyReply) {
    try {
      const slots = await this.getHomeSlotsUseCase.execute();
      const serialized = this.serializeBigInt(slots);
      return reply.status(200).send(serialized);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/dictionary/semantic-fields/:id
   * Obtener un campo semántico específico con su jerarquía
   */
  async getSemanticFieldById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      const field = await this.getSemanticFieldsUseCase.executeById(id);

      if (!field) {
        return reply.status(404).send({ error: 'Campo semántico no encontrado' });
      }

      const serialized = this.serializeBigInt(field);
      return reply.status(200).send(serialized);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Helper para serializar BigInt a string recursivamente
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /**
   * GET /api/dictionary/semantic-fields/slug/:slug
   * Spec 003: campo por slug (rutas estables sin IDs numéricos)
   */
  async getSemanticFieldBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const field = await this.getSemanticFieldsUseCase.executeBySlug(slug);

      if (!field) {
        return reply.status(404).send({ error: 'Campo semántico no encontrado' });
      }

      const serialized = this.serializeBigInt(field);
      return reply.status(200).send(this.enrichWithSlugs(serialized));
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Spec 003: añade slug derivado en cada nivel de la jerarquía para que
   * el frontend construya rutas estables. Spec 004 persistirá el slug.
   */
  private enrichWithSlugs(node: any): any {
    if (Array.isArray(node)) return node.map((n) => this.enrichWithSlugs(n));
    if (node && typeof node === 'object') {
      const out: any = { ...node };
      if (typeof out.namtrikTermino === 'string') out.slug = toSlug(out.namtrikTermino);
      for (const key of Object.keys(out)) {
        if (['subcampos', 'microcampos', 'palabrasM1'].includes(key)) {
          out[key] = this.enrichWithSlugs(out[key]);
        }
      }
      // En puentes palabra↔microcampo, enriquecer la palabra hija
      if (out.palabra && typeof out.palabra === 'object') {
        out.palabra = this.enrichWithSlugs(out.palabra);
      }
      return out;
    }
    return node;
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = {};
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          result[key] = this.serializeBigInt(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }
}
