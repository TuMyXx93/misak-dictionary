/**
 * GetSemanticFieldsUseCase
 * Sprint 3 - Dictionary API
 * Caso de uso para obtener la jerarquía semántica completa
 */

import { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';

export class GetSemanticFieldsUseCase {
  constructor(private readonly campoSemanticoRepository: CampoSemanticoRepository) {}

  /**
   * Obtener todos los campos semánticos con su jerarquía completa
   */
  async execute() {
    return this.campoSemanticoRepository.findAllWithHierarchy();
  }

  /**
   * Obtener un campo semántico específico con su jerarquía
   */
  async executeById(id: bigint) {
    return this.campoSemanticoRepository.findByIdWithHierarchy(id);
  }
}
