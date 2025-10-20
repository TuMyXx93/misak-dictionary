/**
 * Auth Middleware
 * Sprint 2 - Auth System
 * Middleware para proteger rutas con JWT
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../../infrastructure/auth/TokenService.js';

const tokenService = new TokenService();

/**
 * Middleware para verificar JWT en el header Authorization
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authorization header is missing',
      });
    }

    // 2. Verificar formato "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
    }

    // 3. Verificar y decodificar token
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // 4. Agregar payload al request para uso en handlers
    request.user = payload;
  } catch {
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Declaración de tipos para extender FastifyRequest
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: bigint;
      username: string;
      email: string;
      roles: string[];
    };
  }
}
