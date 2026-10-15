/**
 * Auth Services Interfaces (Ports)
 * Sprint 2 - Auth System
 * Contratos que define el dominio para servicios de autenticación
 */

import type { Session } from '../entities/Session.js';
import type { User, UserWithRoles } from '../entities/User.js';

/**
 * Payload de tokens JWT
 */
export interface TokenPayload {
  userId: bigint;
  username: string;
  email: string;
  roles: string[];
}

/**
 * Tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Servicio de manejo de passwords
 */
export interface IPasswordService {
  /**
   * Hashear una contraseña en texto plano
   */
  hash(password: string): Promise<string>;

  /**
   * Comparar contraseña en texto plano con hash
   */
  compare(password: string, hash: string): Promise<boolean>;

  /**
   * R-005: true si el hash usa un formato legacy y debe rehashearse
   */
  needsRehash(hash: string): boolean;
}

/**
 * Servicio de manejo de JWT tokens
 */
export interface ITokenService {
  /**
   * Generar access token
   */
  generateAccessToken(payload: TokenPayload): string;

  /**
   * Generar refresh token
   */
  generateRefreshToken(payload: TokenPayload): string;

  /**
   * Verificar y decodificar access token
   */
  verifyAccessToken(token: string): TokenPayload | null;

  /**
   * Verificar y decodificar refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null;
}

/**
 * Repositorio de usuarios
 */
export interface IUserRepository {
  /**
   * Buscar usuario por username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Buscar usuario por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Buscar usuario por ID con roles
   */
  findByIdWithRoles(id: bigint): Promise<UserWithRoles | null>;

  /**
   * Crear usuario
   */
  create(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<User>;
}

/**
 * Repositorio de sesiones
 */
export interface ISessionRepository {
  /**
   * Crear sesión (con familia de rotación opcional)
   */
  create(data: {
    userId: bigint;
    token: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    expiresAt: Date;
    familyId?: string | undefined;
  }): Promise<Session>;

  /**
   * Buscar sesión por token
   */
  findByToken(token: string): Promise<Session | null>;

  /**
   * Buscar sesión activa por hash SHA-256 del refresh token (R-006)
   */
  findByTokenHash(token: string): Promise<Session | null>;

  /**
   * Buscar sesión revocada por hash (detección de reuso, R-006)
   */
  findRevokedByTokenHash(token: string): Promise<Session | null>;

  /**
   * Revocar una sesión (marca revoked_at)
   */
  revoke(id: string): Promise<void>;

  /**
   * Revocar todas las sesiones de una familia (R-006)
   */
  revokeFamily(familyId: string): Promise<number>;

  /**
   * Eliminar sesión
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Eliminar sesiones expiradas
   */
  deleteExpired(): Promise<number>;
}
