/**
 * Auth Routes
 * Sprint 2 - Auth System
 * Rutas de autenticación para Fastify
 */

import type { FastifyInstance } from 'fastify';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import { TokenService } from '../../infrastructure/auth/TokenService.js';
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import { AuthController } from '../controllers/AuthController.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Inicializar dependencias
  const tokenService = new TokenService();
  const passwordService = new PasswordService();
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();

  // Inicializar use cases
  const loginUseCase = new LoginUseCase(
    userRepository,
    passwordService,
    tokenService,
    sessionRepository,
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    tokenService,
    sessionRepository,
  );
  const logoutUseCase = new LogoutUseCase(sessionRepository);

  // Inicializar controller
  const authController = new AuthController(loginUseCase, refreshTokenUseCase, logoutUseCase);

  // Prefijo para todas las rutas de auth
  app.register(
    async (authApp) => {
      /**
       * POST /auth/login
       * Autenticar usuario y obtener tokens
       */
      authApp.post('/login', authController.login.bind(authController));

      /**
       * POST /auth/refresh
       * Renovar access token
       */
      authApp.post('/refresh', authController.refresh.bind(authController));

      /**
       * POST /auth/logout
       * Cerrar sesión
       */
      authApp.post('/logout', authController.logout.bind(authController));
    },
    { prefix: '/auth' },
  );
}
