/**
 * TokenService Implementation
 * Sprint 2 - Auth System
 * Implementa ITokenService usando jsonwebtoken
 */

import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../domain/interfaces/IAuthServices.js';
import { env } from '../../shared/config/env.js';

export class TokenService implements ITokenService {
  /**
   * Generar access token (corta duración)
   */
  generateAccessToken(payload: TokenPayload): string {
    const jwtPayload = {
      userId: payload.userId.toString(), // bigint to string para JSON
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    };
    const options = {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'misak-dictionary',
      audience: 'misak-api',
    } as jwt.SignOptions;
    return jwt.sign(jwtPayload, env.JWT_SECRET, options);
  }

  /**
   * Generar refresh token (larga duración)
   */
  generateRefreshToken(payload: TokenPayload): string {
    const jwtPayload = {
      userId: payload.userId.toString(),
      username: payload.username,
    };
    const options = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'misak-dictionary',
      audience: 'misak-api',
    } as jwt.SignOptions;
    return jwt.sign(jwtPayload, env.JWT_REFRESH_SECRET, options);
  }

  /**
   * Verificar y decodificar access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'misak-dictionary',
        audience: 'misak-api',
      }) as jwt.JwtPayload;

      return {
        userId: BigInt(decoded.userId as string),
        username: decoded.username as string,
        email: decoded.email as string,
        roles: decoded.roles as string[],
      };
    } catch {
      return null;
    }
  }

  /**
   * Verificar y decodificar refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'misak-dictionary',
        audience: 'misak-api',
      }) as jwt.JwtPayload;

      return {
        userId: BigInt(decoded.userId as string),
        username: decoded.username as string,
        email: '', // No incluido en refresh token
        roles: [], // No incluido en refresh token
      };
    } catch {
      return null;
    }
  }
}
