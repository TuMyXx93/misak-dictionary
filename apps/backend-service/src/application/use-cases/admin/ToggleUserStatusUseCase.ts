/**
 * ToggleUserStatusUseCase
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-004)
 * Activa o suspende cuentas de usuario, revocando sesiones inmediatamente
 * si se suspende, impidiendo auto-suspensión y protegiendo al último super_admin.
 */

import type {
  ISessionRepository,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface ToggleUserStatusInput {
  targetUserId: bigint;
  isActive: boolean;
  motivo?: string | undefined;
  actorUserId: bigint;
  actorUsername: string;
  actorRoles: string[];
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class ToggleUserStatusUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: ToggleUserStatusInput) {
    const {
      targetUserId,
      isActive,
      motivo,
      actorUserId,
      actorUsername,
      actorRoles,
      ipAddress,
      userAgent,
    } = input;

    // 1. Evitar auto-suspensión
    if (!isActive && targetUserId === actorUserId) {
      const error = new Error('No es posible suspender su propia cuenta de usuario');
      // @ts-expect-error statusCode helper
      error.statusCode = 400;
      throw error;
    }

    // 2. Verificar existencia del usuario
    const target = await this.userRepository.findByIdWithRoles(targetUserId);
    if (!target) {
      const error = new Error('Usuario no encontrado');
      // @ts-expect-error statusCode helper
      error.statusCode = 404;
      throw error;
    }

    const isTargetSuperAdmin = target.roles.some((r) => r.role.name === 'super_admin');
    const isActorSuperAdmin = actorRoles.includes('super_admin');

    // 3. Solo super_admin puede suspender o activar a otro super_admin
    if (isTargetSuperAdmin && !isActorSuperAdmin) {
      const error = new Error(
        'Solo un superadministrador puede modificar el estado de una cuenta con rol super_admin',
      );
      // @ts-expect-error statusCode helper
      error.statusCode = 403;
      throw error;
    }

    // 4. Si se suspende y es super_admin, validar que no sea el último
    if (!isActive && isTargetSuperAdmin) {
      const superAdminCount = await this.userRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        const error = new Error(
          'No es posible desactivar al último super_admin activo del sistema',
        );
        // @ts-expect-error statusCode helper
        error.statusCode = 409;
        throw error;
      }
    }

    // 5. Aplicar cambio de estado en repositorio
    const updated = await this.userRepository.toggleActive(targetUserId, isActive);

    // 6. Si se suspende la cuenta, revocar de inmediato todas sus sesiones activas
    if (!isActive && this.sessionRepository.revokeAllForUser) {
      await this.sessionRepository.revokeAllForUser(targetUserId);
    }

    // 7. Auditoría
    await this.auditService.record({
      action: isActive ? 'user.activate' : 'user.deactivate',
      entity: 'user',
      entityId: targetUserId.toString(),
      actorUserId,
      actorUsername,
      ipAddress,
      userAgent,
      newData: {
        isActive,
        motivo: motivo?.trim() ? motivo.trim() : null,
      },
    });

    return updated;
  }
}
