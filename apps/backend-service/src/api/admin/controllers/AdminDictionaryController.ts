/**
 * AdminDictionaryController
 * Sprint 4 - Admin API
 * Controller para CRUD de diccionario (protegido con autenticación)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { CreateWordModel1UseCase } from '../../../application/use-cases/admin/CreateWordModel1UseCase.js';
import { UpdateWordModel1UseCase } from '../../../application/use-cases/admin/UpdateWordModel1UseCase.js';
import { DeleteWordUseCase } from '../../../application/use-cases/admin/DeleteWordUseCase.js';
import { ManageSemanticFieldsUseCase } from '../../../application/use-cases/admin/ManageSemanticFieldsUseCase.js';
import {
  CreateWordModel1DTOSchema,
  UpdateWordModel1DTOSchema,
  CreateCampoSemanticoDTO,
  UpdateCampoSemanticoDTO,
  CreateSubcampoSemanticoDTO,
  UpdateSubcampoSemanticoDTO,
  CreateMicrocampoDTO,
  UpdateMicrocampoDTO,
} from '../../../application/dtos/AdminDictionaryDto.js';
import { WordIdParamSchema } from '../../dictionary/dtos/DictionaryDto.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class AdminDictionaryController {
  constructor(
    private readonly createWordModel1UseCase: CreateWordModel1UseCase,
    private readonly updateWordModel1UseCase: UpdateWordModel1UseCase,
    private readonly deleteWordUseCase: DeleteWordUseCase,
    private readonly manageSemanticFieldsUseCase: ManageSemanticFieldsUseCase,
  ) {}

  // ========== PALABRAS MODELO 1 ==========

  async createWordModel1(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = CreateWordModel1DTOSchema.parse(request.body);
      const result = await this.createWordModel1UseCase.execute(data);
      return reply.status(201).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async updateWordModel1(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      const data = UpdateWordModel1DTOSchema.parse(request.body);
      const result = await this.updateWordModel1UseCase.execute(id, data);
      return reply.status(200).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteWordModel1(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      await this.deleteWordUseCase.deleteModelo1(id);
      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  // ========== CAMPOS SEMÁNTICOS ==========

  async createCampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as CreateCampoSemanticoDTO;
      const result = await this.manageSemanticFieldsUseCase.createCampoSemantico(data);
      return reply.status(201).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async updateCampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      const data = request.body as UpdateCampoSemanticoDTO;
      const result = await this.manageSemanticFieldsUseCase.updateCampoSemantico(id, data);
      return reply.status(200).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteCampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      await this.manageSemanticFieldsUseCase.deleteCampoSemantico(id);
      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  // ========== SUBCAMPOS SEMÁNTICOS ==========

  async createSubcampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as CreateSubcampoSemanticoDTO;
      const result = await this.manageSemanticFieldsUseCase.createSubcampoSemantico(data);
      return reply.status(201).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async updateSubcampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      const data = request.body as UpdateSubcampoSemanticoDTO;
      const result = await this.manageSemanticFieldsUseCase.updateSubcampoSemantico(id, data);
      return reply.status(200).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteSubcampoSemantico(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      await this.manageSemanticFieldsUseCase.deleteSubcampoSemantico(id);
      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  // ========== MICROCAMPOS ==========

  async createMicrocampo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as CreateMicrocampoDTO;
      const result = await this.manageSemanticFieldsUseCase.createMicrocampo(data);
      return reply.status(201).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async updateMicrocampo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      const data = request.body as UpdateMicrocampoDTO;
      const result = await this.manageSemanticFieldsUseCase.updateMicrocampo(id, data);
      return reply.status(200).send(this.serializeBigInt(result));
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteMicrocampo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = WordIdParamSchema.parse(request.params);
      await this.manageSemanticFieldsUseCase.deleteMicrocampo(id);
      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  // ========== HELPERS ==========

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.serializeBigInt(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }

  private handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
}
