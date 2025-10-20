/**
 * SearchWordsUseCase
 * Sprint 3 - Dictionary API
 * Caso de uso para búsqueda de palabras con filtros y paginación
 */

import type {
  SearchParams,
  PaginatedResult,
  RawWordResult,
} from '../../../infrastructure/repositories/PalabraRepository.js';
import { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';

export class SearchWordsUseCase {
  constructor(private readonly palabraRepository: PalabraRepository) {}

  async execute(params: SearchParams): Promise<PaginatedResult<RawWordResult>> {
    return this.palabraRepository.searchModelo1(params);
  }
}
