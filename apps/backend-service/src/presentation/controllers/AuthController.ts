/**
 * Auth Controller
 * Sprint 2 - Auth System
 * Controlador HTTP para endpoints de autenticación
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import {
  LoginDTOSchema,
  RefreshTokenDTOSchema,
  LogoutDTOSchema,
} from '../../application/dtos/AuthDTO.js';
import { TokenService } from '../../infrastructure/auth/TokenService.js';
import { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository.js';

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

export class AuthController {
  /**
   * POST /auth/login
   * Autenticar usuario y generar tokens
   */
  static async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar request body
      const body = LoginDTOSchema.parse(request.body);

      // Ejecutar use case
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loginInput: any = {
        username: body.username,
        password: body.password,
        ipAddress: request.ip,
      };
      const userAgent = request.headers['user-agent'];
      if (userAgent) loginInput.userAgent = userAgent;

      const result = await loginUseCase.execute(loginInput);

      return reply.code(200).send({
        statusCode: 200,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('inactive')) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during login',
      });
    }
  }

  /**
   * POST /auth/refresh
   * Renovar access token usando refresh token
   */
  static async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar request body
      const body = RefreshTokenDTOSchema.parse(request.body);

      // Ejecutar use case
      const result = await refreshTokenUseCase.execute({
        refreshToken: body.refreshToken,
      });

      return reply.code(200).send({
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid') ||
          error.message.includes('expired') ||
          error.message.includes('not found') ||
          error.message.includes('inactive')
        ) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during token refresh',
      });
    }
  }

  /**
   * POST /auth/logout
   * Cerrar sesión y eliminar refresh token
   */
  static async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar request body
      const body = LogoutDTOSchema.parse(request.body);

      // Ejecutar use case
      await logoutUseCase.execute({
        refreshToken: body.refreshToken,
      });

      return reply.code(200).send({
        statusCode: 200,
        message: 'Logout successful',
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during logout',
      });
    }
  }
}
