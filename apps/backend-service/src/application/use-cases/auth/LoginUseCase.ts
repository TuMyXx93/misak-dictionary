/**
 * LoginUseCase
 * Sprint 2 - Auth System
 * Caso de uso: Autenticar usuario y generar tokens
 */

import type {
  IUserRepository,
  IPasswordService,
  ITokenService,
  ISessionRepository,
  AuthTokens,
} from '../../../domain/interfaces/IAuthServices.js';

export interface LoginInput {
  username: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginOutput {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
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
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Buscar usuario por username
    const user = await this.userRepository.findByUsername(input.username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // 3. Comparar password
    const isPasswordValid = await this.passwordService.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 4. Obtener roles del usuario
    const userWithRoles = await this.userRepository.findByIdWithRoles(user.id);

    if (!userWithRoles) {
      throw new Error('User not found');
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionData: any = {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    };
    if (input.ipAddress) sessionData.ipAddress = input.ipAddress;
    if (input.userAgent) sessionData.userAgent = input.userAgent;

    await this.sessionRepository.create(sessionData);

    // 7. Retornar usuario y tokens
    return {
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
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
