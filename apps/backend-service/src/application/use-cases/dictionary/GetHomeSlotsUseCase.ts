/**
 * GetHomeSlotsUseCase
 * Spec 004 R-013 — Botones de campos semánticos del home persistidos
 * Caso de uso para obtener los slots del home ordenados por posición.
 */

import type { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';

export class GetHomeSlotsUseCase {
  constructor(private readonly campoSemanticoRepository: CampoSemanticoRepository) {}

  /**
   * Obtener los slots del home con los datos de sus campos asociados
   */
  async execute() {
    return this.campoSemanticoRepository.findHomeSlots();
  }
}
