/**
 * SessionRepository Implementation
 * Spec 002 - Auth RBAC
 * Implementa ISessionRepository usando Prisma, con familias de rotación
 * y token_hash (SHA-256) para detección de reuso (R-006).
 */

import { createHash } from 'node:crypto';
import type { Session } from '../../domain/entities/Session.js';
import type { ISessionRepository } from '../../domain/interfaces/IAuthServices.js';
import { prisma } from '../../shared/config/prisma.js';

/** SHA-256 hex de un refresh token (los JWT ya son de alta entropía) */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class SessionRepository implements ISessionRepository {
  async create(data: {
    userId: bigint;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    familyId?: string;
  }): Promise<Session> {
    // biome-ignore lint/suspicious/noExplicitAny: construcción condicional de payload Prisma con exactOptionalPropertyTypes
    const createData: any = {
      userId: data.userId,
      token: data.token,
      tokenHash: hashToken(data.token),
      expiresAt: data.expiresAt,
    };
    if (data.ipAddress) createData.ipAddress = data.ipAddress;
    if (data.userAgent) createData.userAgent = data.userAgent;
    if (data.familyId) createData.familyId = data.familyId;

    return prisma.session.create({
      data: createData,
    });
  }

  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { token },
    });
  }

  async findByTokenHash(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
    });
  }

  async findRevokedByTokenHash(token: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { tokenHash: hashToken(token), revokedAt: { not: null } },
    });
  }

  async revoke(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async revokeAllForUser(userId: bigint): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
