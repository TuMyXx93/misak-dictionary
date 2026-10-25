/**
 * ResetUserPasswordUseCase
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-005)
 * Genera o asigna una contraseña temporal segura, marca mustChangePassword: true,
 * limpia bloqueos por intentos fallidos, revoca todas las sesiones y audita la acción.
 */

import { randomInt } from 'node:crypto';
import type {
  IPasswordService,
  ISessionRepository,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface ResetUserPasswordInput {
  targetUserId: bigint;
  temporaryPassword?: string | undefined;
  actorUserId: bigint;
  actorUsername: string;
  actorRoles: string[];
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface ResetUserPasswordOutput {
  temporaryPassword: string;
  mustChangePassword: boolean;
  user: {
    id: bigint;
    username: string;
    email: string;
    fullName: string;
  };
}

/** Genera una contraseña segura aleatoria de 14 caracteres */
export function generateSecureTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';

  // Al menos un caracter de cada conjunto
  let password =
    upper.charAt(randomInt(upper.length)) +
    lower.charAt(randomInt(lower.length)) +
    digits.charAt(randomInt(digits.length)) +
    symbols.charAt(randomInt(symbols.length));

  const allChars = upper + lower + digits + symbols;
  for (let i = 0; i < 10; i++) {
    password += allChars.charAt(randomInt(allChars.length));
  }

  // Mezclar caracteres con Fisher-Yates
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const charI = chars[i];
    const charJ = chars[j];
    if (charI !== undefined && charJ !== undefined) {
      chars[i] = charJ;
      chars[j] = charI;
    }
  }

  return chars.join('');
}

export class ResetUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: ResetUserPasswordInput): Promise<ResetUserPasswordOutput> {
    const {
      targetUserId,
      temporaryPassword: providedPassword,
      actorUserId,
      actorUsername,
      actorRoles,
      ipAddress,
      userAgent,
    } = input;

    // 1. Verificar existencia del usuario
    const target = await this.userRepository.findByIdWithRoles(targetUserId);
    if (!target) {
      const error = new Error('Usuario no encontrado');
      // @ts-expect-error statusCode helper
      error.statusCode = 404;
      throw error;
    }

    const isTargetSuperAdmin = target.roles.some((r) => r.role.name === 'super_admin');
    const isActorSuperAdmin = actorRoles.includes('super_admin');

    // 2. Solo super_admin puede resetear clave a un super_admin
    if (isTargetSuperAdmin && !isActorSuperAdmin) {
      const error = new Error(
        'Solo un superadministrador puede restablecer la contraseña de una cuenta con rol super_admin',
      );
      // @ts-expect-error statusCode helper
      error.statusCode = 403;
      throw error;
    }

    // 3. Obtener o generar clave temporal
    const finalTemporaryPassword = providedPassword || generateSecureTemporaryPassword();

    // 4. Hashear contraseña
    const passwordHash = await this.passwordService.hash(finalTemporaryPassword);

    // 5. Actualizar en repositorio
    let updatedUser: any;
    if ('resetPasswordWithTemporary' in this.userRepository) {
      updatedUser = await (this.userRepository as any).resetPasswordWithTemporary(
        targetUserId,
        passwordHash,
      );
    } else if ('updatePassword' in this.userRepository) {
      await (this.userRepository as any).updatePassword(targetUserId, passwordHash);
      updatedUser = target;
    }

    // 6. Revocar todas las sesiones previas
    if (this.sessionRepository.revokeAllForUser) {
      await this.sessionRepository.revokeAllForUser(targetUserId);
    }

    // 7. Auditoría (sin guardar la clave en texto plano ni en los logs)
    await this.auditService.record({
      action: 'user.password_reset',
      entity: 'user',
      entityId: targetUserId.toString(),
      actorUserId,
      actorUsername,
      ipAddress,
      userAgent,
      newData: {
        mustChangePassword: true,
        resetBy: actorUsername,
      },
    });

    return {
      temporaryPassword: finalTemporaryPassword,
      mustChangePassword: true,
      user: {
        id: updatedUser?.id ?? target.id,
        username: updatedUser?.username ?? target.username,
        email: updatedUser?.email ?? target.email,
        fullName: updatedUser?.fullName ?? target.fullName,
      },
    };
  }
}
