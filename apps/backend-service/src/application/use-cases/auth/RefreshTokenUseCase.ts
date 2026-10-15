/**
 * RefreshTokenUseCase
 * Spec 002 - Auth RBAC
 * R-006: rotación de refresh tokens con detección de reuso.
 * Si se presenta un token ya rotado, se revoca toda la familia de sesiones.
 */

import type {
  AuthTokens,
  ISessionRepository,
  ITokenService,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import { hashToken } from '../../../infrastructure/repositories/SessionRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface RefreshTokenInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string | undefined;
}

export interface RefreshTokenOutput {
  tokens: AuthTokens;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService?: AuditService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Verificar firma del refresh token
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);

    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Buscar sesión activa por hash
    const session = await this.sessionRepository.findByTokenHash(input.refreshToken);

    if (!session) {
      // 2b. R-006: ¿token ya rotado? → reuso detectado → revocar familia
      const revoked = await this.sessionRepository.findRevokedByTokenHash(input.refreshToken);
      if (revoked) {
        const revokedCount = await this.sessionRepository.revokeFamily(revoked.familyId);
        await this.auditService?.record({
          action: 'auth.refresh.reuse_detected',
          entity: 'session',
          entityId: revoked.id,
          actorUserId: payload.userId,
          actorUsername: payload.username,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          newData: {
            familyId: revoked.familyId,
            revokedSessions: revokedCount,
          },
        });
        throw new Error('Session revoked due to token reuse');
      }
      throw new Error('Session not found');
    }

    if (session.revokedAt) {
      // Sesión revocada pero localizable: trato como reuso
      const revokedCount = await this.sessionRepository.revokeFamily(session.familyId);
      await this.auditService?.record({
        action: 'auth.refresh.reuse_detected',
        entity: 'session',
        entityId: session.id,
        actorUserId: payload.userId,
        actorUsername: payload.username,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        newData: { familyId: session.familyId, revokedSessions: revokedCount },
      });
      throw new Error('Session revoked due to token reuse');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.deleteByToken(input.refreshToken);
      throw new Error('Session expired');
    }

    // 3. Obtener usuario con roles actualizados
    const userWithRoles = await this.userRepository.findByIdWithRoles(payload.userId);

    if (!userWithRoles) {
      throw new Error('Invalid or expired refresh token');
    }

    if (!userWithRoles.isActive) {
      throw new Error('Invalid or expired refresh token');
    }

    // 4. Generar NUEVO par de tokens (rotación)
    const tokenPayload = {
      userId: userWithRoles.id,
      username: userWithRoles.username,
      email: userWithRoles.email,
      roles: userWithRoles.roles.map((r) => r.role.name),
    };

    const newAccessToken = this.tokenService.generateAccessToken(tokenPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(tokenPayload);

    // 5. Rotar: revocar el actual, crear el nuevo en la misma familia
    await this.sessionRepository.revoke(session.id);
    await this.sessionRepository.create({
      userId: userWithRoles.id,
      token: newRefreshToken,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: session.expiresAt,
      familyId: session.familyId,
    });

    await this.auditService?.record({
      action: 'auth.refresh.rotated',
      entity: 'session',
      entityId: session.id,
      actorUserId: userWithRoles.id,
      actorUsername: userWithRoles.username,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      newData: { tokenHash: hashToken(newRefreshToken).slice(0, 8) + '…' },
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    };
  }
}
