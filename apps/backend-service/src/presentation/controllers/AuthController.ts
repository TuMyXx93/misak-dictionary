/**
 * Auth Controller
 * Sprint 2 - Auth System
 * Controlador HTTP para endpoints de autenticación
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  ChangePasswordDTOSchema,
  LoginDTOSchema,
  LogoutDTOSchema,
  RefreshTokenDTOSchema,
} from '../../application/dtos/AuthDTO.js';
import type { ChangePasswordUseCase } from '../../application/use-cases/auth/ChangePasswordUseCase.js';
import type { GetAuthMeUseCase } from '../../application/use-cases/auth/GetAuthMeUseCase.js';
import type { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import type { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { AccountLockedError, DomainAuthError } from '../../domain/errors/AuthErrors.js';
import { corsOrigins, env } from '../../shared/config/env.js';

const COOKIE_NAME = 'misak_rt';

function isWebAdminClient(request: FastifyRequest): boolean {
  const header = request.headers['x-client'];
  return typeof header === 'string' && header.toLowerCase() === 'web-admin';
}

function validateOrigin(request: FastifyRequest): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  return corsOrigins.includes(origin);
}

function getCookieOptions() {
  const sameSiteEnv = (process.env['COOKIE_SAME_SITE'] || 'lax').toLowerCase();
  const sameSite: 'lax' | 'strict' | 'none' =
    sameSiteEnv === 'strict' ? 'strict' : sameSiteEnv === 'none' ? 'none' : 'lax';

  return {
    httpOnly: true,
    path: '/auth',
    sameSite,
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  };
}

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getAuthMeUseCase?: GetAuthMeUseCase,
    private readonly changePasswordUseCase?: ChangePasswordUseCase,
  ) {}

  /**
   * POST /auth/login
   * Autenticar usuario y generar tokens
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const isCookieMode = isWebAdminClient(request);
      if (isCookieMode && !validateOrigin(request)) {
        return reply.code(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Origin no permitido',
        });
      }

      // Validar request body
      const body = LoginDTOSchema.parse(request.body);

      // Ejecutar use case
      // biome-ignore lint/suspicious/noExplicitAny: login input construction
      const loginInput: any = {
        username: (body.username ?? body.email ?? '').trim(),
        password: body.password,
        ipAddress: request.ip,
      };
      const userAgent = request.headers['user-agent'];
      if (userAgent) loginInput.userAgent = userAgent;

      const result = await this.loginUseCase.execute(loginInput);

      if (isCookieMode) {
        reply.setCookie(COOKIE_NAME, result.tokens.refreshToken, getCookieOptions());
        let permissions: string[] = [];
        let mustChangePassword = Boolean(result.user.mustChangePassword);
        if (this.getAuthMeUseCase) {
          try {
            const meData = await this.getAuthMeUseCase.execute({ userId: BigInt(result.user.id) });
            permissions = meData.permissions;
            mustChangePassword = Boolean(meData.mustChangePassword);
          } catch {
            // fallback sin permisos adicionales
          }
        }
        return reply.code(200).send({
          statusCode: 200,
          message: 'Login successful',
          data: {
            user: {
              ...result.user,
              userId: result.user.id,
              mustChangePassword,
              permissions,
            },
            tokens: {
              accessToken: result.tokens.accessToken,
              expiresIn: result.tokens.expiresIn,
            },
          },
        });
      }

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
          code: 'VALIDATION_ERROR',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

      if (error instanceof DomainAuthError) {
        const payload: Record<string, unknown> = {
          statusCode: error.httpStatus,
          error: error.name,
          code: error.code,
          message: error.message,
        };
        if (error instanceof AccountLockedError) {
          payload['lockedUntil'] = error.lockedUntil.toISOString();
          payload['retryAfterSeconds'] = error.retryAfterSeconds;
          reply.header('Retry-After', String(error.retryAfterSeconds));
        }
        return reply.code(error.httpStatus).send(payload);
      }

      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('inactive')) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            code: 'AUTH_INVALID_CREDENTIALS',
            message: error.message,
          });
        }
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR',
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
      const isCookieMode = isWebAdminClient(request);
      if (isCookieMode && !validateOrigin(request)) {
        return reply.code(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Origin no permitido',
        });
      }

      let refreshToken: string | undefined;

      if (isCookieMode) {
        refreshToken = request.cookies?.[COOKIE_NAME];
        if (!refreshToken) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'No se proporcionó refresh token válido en cookie',
          });
        }
      } else {
        const body = RefreshTokenDTOSchema.parse(request.body);
        refreshToken = body.refreshToken;
      }

      // Ejecutar use case
      const result = await this.refreshTokenUseCase.execute({
        refreshToken,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (isCookieMode) {
        reply.setCookie(COOKIE_NAME, result.tokens.refreshToken, getCookieOptions());

        let userPayload: Record<string, unknown> | undefined;
        if (result.user) {
          let permissions: string[] = [];
          let mustChangePassword = Boolean(result.user.mustChangePassword);
          if (this.getAuthMeUseCase) {
            try {
              const meData = await this.getAuthMeUseCase.execute({
                userId: BigInt(result.user.id),
              });
              permissions = meData.permissions;
              mustChangePassword = Boolean(meData.mustChangePassword);
            } catch {
              // fallback
            }
          }
          userPayload = {
            ...result.user,
            userId: result.user.id,
            mustChangePassword,
            permissions,
          };
        }

        return reply.code(200).send({
          statusCode: 200,
          message: 'Token refreshed successfully',
          data: {
            user: userPayload,
            tokens: {
              accessToken: result.tokens.accessToken,
              expiresIn: result.tokens.expiresIn,
            },
          },
        });
      }

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
          code: 'VALIDATION_ERROR',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

      if (error instanceof Error) {
        if (
          error.message.includes('Invalid') ||
          error.message.includes('expired') ||
          error.message.includes('not found') ||
          error.message.includes('inactive') ||
          error.message.includes('revoked') ||
          error.message.includes('reuse')
        ) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            code: 'AUTH_INVALID_TOKEN',
            message: error.message,
          });
        }
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR',
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
      const isCookieMode = isWebAdminClient(request);
      if (isCookieMode && !validateOrigin(request)) {
        return reply.code(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Origin no permitido',
        });
      }

      let refreshToken: string | undefined;

      if (isCookieMode) {
        refreshToken = request.cookies?.[COOKIE_NAME];
        if (
          !refreshToken &&
          request.body &&
          typeof request.body === 'object' &&
          'refreshToken' in request.body
        ) {
          refreshToken = (request.body as { refreshToken?: string }).refreshToken;
        }
      } else {
        const body = LogoutDTOSchema.parse(request.body);
        refreshToken = body.refreshToken;
      }

      // Ejecutar use case si hay token para revocar
      if (refreshToken) {
        await this.logoutUseCase.execute({
          refreshToken,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }

      if (isCookieMode) {
        reply.clearCookie(COOKIE_NAME, { path: '/auth' });
      }

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

  /**
   * GET /auth/me
   * R-003: Consulta el perfil del usuario autenticado, sus roles y permisos en servidor.
   */
  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No estás autenticado',
        });
      }

      if (!this.getAuthMeUseCase) {
        throw new Error('GetAuthMeUseCase no inyectado');
      }

      const result = await this.getAuthMeUseCase.execute({ userId: user.userId });

      return reply.code(200).send({
        statusCode: 200,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Error al consultar información de usuario',
      });
    }
  }

  /**
   * POST /auth/change-password
   * R-028: Cambio de contraseña obligatorio u opcional.
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No estás autenticado',
        });
      }

      if (!this.changePasswordUseCase) {
        throw new Error('ChangePasswordUseCase no inyectado');
      }

      const body = ChangePasswordDTOSchema.parse(request.body);

      const changePasswordInput = {
        userId: user.userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      };

      const result = await this.changePasswordUseCase.execute(changePasswordInput);

      return reply.code(200).send({
        statusCode: 200,
        message: result.message,
        data: { success: result.success },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.issues[0]?.message ?? 'Validation failed',
        });
      }

      if (error instanceof Error) {
        if (
          error.message.includes('incorrecta') ||
          error.message.includes('al menos') ||
          error.message.includes('diferente')
        ) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
        if (error.message.includes('inactivo') || error.message.includes('no encontrado')) {
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
        message: 'Error al cambiar contraseña',
      });
    }
  }
}
