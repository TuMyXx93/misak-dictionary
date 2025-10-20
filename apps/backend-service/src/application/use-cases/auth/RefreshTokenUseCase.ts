/**
 * RefreshTokenUseCase
 * Sprint 2 - Auth System
 * Caso de uso: Renovar access token usando refresh token
 */

import type {
  IUserRepository,
  ITokenService,
  ISessionRepository,
  AuthTokens,
} from '../../../domain/interfaces/IAuthServices.js';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  tokens: AuthTokens;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Verificar refresh token
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);

    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Verificar que la sesión existe y no ha expirado
    const session = await this.sessionRepository.findByToken(input.refreshToken);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.expiresAt < new Date()) {
      // Eliminar sesión expirada
      await this.sessionRepository.deleteByToken(input.refreshToken);
      throw new Error('Session expired');
    }

    // 3. Obtener usuario con roles actualizados
    const userWithRoles = await this.userRepository.findByIdWithRoles(payload.userId);

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    if (!userWithRoles.isActive) {
      throw new Error('User account is inactive');
    }

    // 4. Generar nuevo access token
    const tokenPayload = {
      userId: userWithRoles.id,
      username: userWithRoles.username,
      email: userWithRoles.email,
      roles: userWithRoles.roles.map((r) => r.name),
    };

    const newAccessToken = this.tokenService.generateAccessToken(tokenPayload);

    // 5. Retornar nuevo access token (refresh token permanece igual)
    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: input.refreshToken, // Mismo refresh token
        expiresIn: 900, // 15 minutos
      },
    };
  }
}
