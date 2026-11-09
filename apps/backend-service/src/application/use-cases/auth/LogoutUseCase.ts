/**
 * LogoutUseCase
 * Spec 002 - Auth RBAC
 * R-010: cerrar sesión invalidando el refresh token + auditoría del evento.
 */

import type { ISessionRepository } from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface LogoutInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string | undefined;
}

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService?: AuditService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    // 1. Buscar la sesión (activa o revocada)
    const session =
      (await this.sessionRepository.findByTokenHash(input.refreshToken)) ??
      (await this.sessionRepository.findByToken(input.refreshToken));

    if (!session) {
      // Sesión ya no existe, logout exitoso igualmente
      return;
    }

    // 2. Invalidar toda la familia de rotación
    await this.sessionRepository.revokeFamily(session.familyId);

    // R-010: auditar logout
    await this.auditService?.record({
      action: 'auth.logout',
      entity: 'session',
      entityId: session.id,
      actorUserId: session.userId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
