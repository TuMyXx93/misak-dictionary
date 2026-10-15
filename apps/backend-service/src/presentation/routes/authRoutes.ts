/**
 * Auth Routes
 * Spec 002 - Auth RBAC
 * Rutas de autenticación para Fastify.
 * R-003: rate limiting específico por-ruta (más estricto que el global).
 */

import type { FastifyInstance } from 'fastify';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import { TokenService } from '../../infrastructure/auth/TokenService.js';
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import { AuditService } from '../../shared/audit/AuditService.js';
import { env } from '../../shared/config/env.js';
import { AuthController } from '../controllers/AuthController.js';

/** R-003: clave de rate limit por IP + username (fuerza bruta dirigida) */
function authRateLimitKey(request: { ip?: string; body?: unknown }): string {
  const username =
    typeof request.body === 'object' && request.body !== null && 'username' in request.body
      ? String((request.body as { username?: unknown }).username ?? '')
      : '';
  return `${request.ip ?? 'unknown'}:${username}`;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Inicializar dependencias
  const tokenService = new TokenService();
  const passwordService = new PasswordService();
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const auditService = new AuditService();

  // Inicializar use cases
  const loginUseCase = new LoginUseCase(
    userRepository,
    passwordService,
    tokenService,
    sessionRepository,
    auditService,
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    tokenService,
    sessionRepository,
    auditService,
  );
  const logoutUseCase = new LogoutUseCase(sessionRepository, auditService);

  // Inicializar controller
  const authController = new AuthController(loginUseCase, refreshTokenUseCase, logoutUseCase);

  // Prefijo para todas las rutas de auth
  await app.register(
    async (authApp) => {
      /**
       * POST /auth/login
       * Autenticar usuario y obtener tokens
       * R-003: 5 intentos / 15 min por IP+username
       */
      authApp.post(
        '/login',
        {
          config: {
            rateLimit: {
              max: env.AUTH_RATE_LIMIT_MAX,
              timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
              keyGenerator: authRateLimitKey,
            },
          },
        },
        authController.login.bind(authController),
      );

      /**
       * POST /auth/refresh
       * Renovar access token (con rotación, R-006)
       * R-003: rate limit específico también aplica
       */
      authApp.post(
        '/refresh',
        {
          config: {
            rateLimit: {
              max: env.AUTH_RATE_LIMIT_MAX,
              timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
            },
          },
        },
        authController.refresh.bind(authController),
      );

      /**
       * POST /auth/logout
       * Cerrar sesión (R-010)
       */
      authApp.post('/logout', authController.logout.bind(authController));
    },
    { prefix: '/auth' },
  );
}
