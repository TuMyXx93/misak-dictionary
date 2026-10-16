/**
 * ChangePasswordUseCase
 * Spec 006 - Panel Administrativo y Gobierno Editorial
 * R-028: Permite al usuario cambiar su contraseña, limpiando el flag
 * must_change_password y registrando el evento en auditoría.
 */

import type { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import type { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface ChangePasswordInput {
  userId: bigint;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface ChangePasswordOutput {
  success: boolean;
  message: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService?: AuditService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    if (!input.newPassword || input.newPassword.length < 12) {
      throw new Error('La nueva contraseña debe tener al menos 12 caracteres');
    }

    if (input.currentPassword === input.newPassword) {
      throw new Error('La nueva contraseña debe ser diferente de la actual');
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user || !user.isActive) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    const isValid = await this.passwordService.compare(input.currentPassword, user.password);
    if (!isValid) {
      await this.auditService?.record({
        actorUserId: input.userId,
        actorUsername: user.username,
        action: 'auth.password.change.failed',
        entity: 'user',
        entityId: input.userId.toString(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        newData: { reason: 'bad_current_password' },
      });
      throw new Error('Contraseña actual incorrecta');
    }

    const newHash = await this.passwordService.hash(input.newPassword);
    await this.userRepository.updatePasswordAndClearMustChange(input.userId, newHash);

    await this.auditService?.record({
      actorUserId: input.userId,
      actorUsername: user.username,
      action: 'auth.password.change',
      entity: 'user',
      entityId: input.userId.toString(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
