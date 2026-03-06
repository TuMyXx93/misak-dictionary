/**
 * GetWordByIdUseCase
 * Sprint 3 - Dictionary API
 * Caso de uso para obtener una palabra por ID (Modelo 1 o Modelo 2)
 */

import type { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class GetWordByIdUseCase {
  constructor(private readonly palabraRepository: PalabraRepository) {}

  async executeModelo1(id: bigint) {
    const word = await this.palabraRepository.findModelo1ById(id);

    if (!word) {
      throw new AppError('Palabra no encontrada', 404);
    }

    return word;
  }

  async executeModelo2(id: bigint) {
    const word = await this.palabraRepository.findModelo2ById(id);

    if (!word) {
      throw new AppError('Palabra no encontrada', 404);
    }

    return word;
  }
}
