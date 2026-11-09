/**
 * Session Domain Entity
 * Sprint 2 - Auth System
 * Representa una sesión activa de usuario
 */

export interface Session {
  id: string;
  userId: bigint;
  token: string;
  tokenHash?: string | null;
  familyId: string;
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Payload para crear una sesión
 */
export interface CreateSessionPayload {
  userId: bigint;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  familyId?: string;
}
