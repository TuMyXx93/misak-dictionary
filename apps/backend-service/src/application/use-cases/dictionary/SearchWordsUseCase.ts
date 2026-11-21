/**
 * SearchWordsUseCase
 * Spec 003 — Dictionary API
 * Caso de uso para búsqueda de palabras con filtros y paginación
 */

import type {
  PaginatedResult,
  PalabraRepository,
  RawWordResult,
  SearchParams,
} from '../../../infrastructure/repositories/PalabraRepository.js';

export class SearchWordsUseCase {
  constructor(private readonly palabraRepository: PalabraRepository) {}

  async execute(params: SearchParams): Promise<PaginatedResult<RawWordResult>> {
    return this.palabraRepository.searchModelo1(params);
  }
}
