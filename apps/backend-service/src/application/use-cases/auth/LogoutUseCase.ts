/**
 * LogoutUseCase
 * Sprint 2 - Auth System
 * Caso de uso: Cerrar sesión y eliminar refresh token
 */

import type { ISessionRepository } from '../../../domain/interfaces/IAuthServices.js';

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    // 1. Verificar que la sesión existe
    const session = await this.sessionRepository.findByToken(input.refreshToken);

    if (!session) {
      // Sesión ya no existe, logout exitoso igualmente
      return;
    }

    // 2. Eliminar sesión
    await this.sessionRepository.deleteByToken(input.refreshToken);
  }
}
