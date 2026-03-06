/**
 * Auth Controller
 * Sprint 2 - Auth System
 * Controlador HTTP para endpoints de autenticación
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  LoginDTOSchema,
  LogoutDTOSchema,
  RefreshTokenDTOSchema,
} from '../../application/dtos/AuthDTO.js';
import type { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import type { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}
  /**
   * POST /auth/login
   * Autenticar usuario y generar tokens
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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

      const result = await this.loginUseCase.execute(loginInput);

      return reply.code(200).send({
        statusCode: 200,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      // Validation errors
      if (error instanceof ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

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
  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar request body
      const body = RefreshTokenDTOSchema.parse(request.body);

      // Ejecutar use case
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: body.refreshToken,
      });

      return reply.code(200).send({
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      // Validation errors
      if (error instanceof ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

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
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validar request body
      const body = LogoutDTOSchema.parse(request.body);

      // Ejecutar use case
      await this.logoutUseCase.execute({
        refreshToken: body.refreshToken,
      });

      return reply.code(200).send({
        statusCode: 200,
        message: 'Logout successful',
      });
    } catch (error) {
      // Validation errors
      if (error instanceof ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during logout',
      });
    }
  }
}
