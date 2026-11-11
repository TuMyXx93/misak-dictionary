/**
 * LoginUseCase
 * Spec 002 - Auth RBAC
 * Caso de uso: Autenticar usuario y generar tokens.
 * R-005: rehash transparente bcrypt → Argon2id en login exitoso.
 * R-011: errores genéricos (no revelan si el usuario existe).
 * R-012: auditoría de intentos exitosos y fallidos.
 */

import {
  AccountLockedError,
  AccountSuspendedError,
  InvalidCredentialsError,
} from '../../../domain/errors/AuthErrors.js';
import type {
  AuthTokens,
  IPasswordService,
  ISessionRepository,
  ITokenService,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface LoginInput {
  username: string;
  password: string;
  ipAddress?: string;
  userAgent?: string | undefined;
}

export interface LoginOutput {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    mustChangePassword?: boolean;
    roles: string[];
  };
  tokens: AuthTokens;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService?: AuditService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const auditBase = {
      action: 'auth.login',
      entity: 'session',
      entityId: input.username,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };

    // 1. Buscar usuario por username o email
    let user = await this.userRepository.findByUsername(input.username);
    if (!user) {
      user = await this.userRepository.findByEmail(input.username);
    }

    if (!user) {
      // R-011: mensaje genérico — no revelar si el usuario existe
      await this.auditService?.record({
        ...auditBase,
        actorUsername: input.username,
        action: 'auth.login.failed',
        newData: { reason: 'user_not_found' },
      });
      throw new InvalidCredentialsError();
    }

    // 2. Comparar password primero para mitigar enumeración de cuentas
    const isPasswordValid = await this.passwordService.compare(input.password, user.password);

    if (!isPasswordValid) {
      if ('incrementFailedAttempts' in this.userRepository) {
        await (this.userRepository as any).incrementFailedAttempts(user.id);
      }
      await this.auditService?.record({
        ...auditBase,
        actorUserId: user.id,
        actorUsername: user.username,
        action: 'auth.login.failed',
        newData: { reason: 'bad_password' },
      });
      throw new InvalidCredentialsError();
    }

    // 3. Con clave verificada, comprobar bloqueo por intentos fallidos
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000),
      );
      await this.auditService?.record({
        ...auditBase,
        actorUserId: user.id,
        actorUsername: user.username,
        action: 'auth.login.failed',
        newData: { reason: 'account_locked', lockedUntil: user.lockedUntil, retryAfterSeconds },
      });
      throw new AccountLockedError(new Date(user.lockedUntil), retryAfterSeconds);
    }

    // 4. Con clave verificada, comprobar si el usuario está inactivo / suspendido
    if (!user.isActive) {
      await this.auditService?.record({
        ...auditBase,
        actorUserId: user.id,
        actorUsername: user.username,
        action: 'auth.login.failed',
        newData: { reason: 'inactive' },
      });
      throw new AccountSuspendedError();
    }

    // Resetear intentos fallidos si existían
    if ((user.failedLoginAttempts && user.failedLoginAttempts > 0) || user.lockedUntil) {
      if ('resetFailedAttempts' in this.userRepository) {
        await (this.userRepository as any).resetFailedAttempts(user.id);
      }
    }

    // 3b. R-005: rehash transparente si el hash es legacy bcrypt
    if (this.passwordService.needsRehash(user.password)) {
      const newHash = await this.passwordService.hash(input.password);
      if ('updatePassword' in this.userRepository) {
        await (
          this.userRepository as unknown as {
            updatePassword: (id: bigint, hash: string) => Promise<void>;
          }
        ).updatePassword(user.id, newHash);
      }
    }

    // 4. Obtener roles del usuario
    const userWithRoles = await this.userRepository.findByIdWithRoles(user.id);

    if (!userWithRoles) {
      throw new InvalidCredentialsError();
    }

    // 5. Generar tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: userWithRoles.roles.map((r) => r.role.name),
    };

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const refreshToken = this.tokenService.generateRefreshToken(tokenPayload);

    // 6. Guardar refresh token en sesiones
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // biome-ignore lint/suspicious/noExplicitAny: construcción condicional de sesión para exactOptionalPropertyTypes
    const sessionData: any = {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    };
    if (input.ipAddress) sessionData.ipAddress = input.ipAddress;
    if (input.userAgent) sessionData.userAgent = input.userAgent;

    await this.sessionRepository.create(sessionData);

    // R-012: auditar login exitoso
    await this.auditService?.record({
      ...auditBase,
      actorUserId: user.id,
      actorUsername: user.username,
      action: 'auth.login',
      newData: { roles: tokenPayload.roles },
    });

    // 7. Retornar usuario y tokens
    return {
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        mustChangePassword: Boolean(userWithRoles.mustChangePassword ?? user.mustChangePassword),
        roles: userWithRoles.roles.map((r) => r.role.name),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutos en segundos
      },
    };
  }
}
