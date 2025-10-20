/**
 * SessionRepository Implementation
 * Sprint 2 - Auth System
 * Implementa ISessionRepository usando Prisma
 */

import type { ISessionRepository } from '../../domain/interfaces/IAuthServices.js';
import type { Session } from '../../domain/entities/Session.js';
import { prisma } from '../../shared/config/prisma.js';

export class SessionRepository implements ISessionRepository {
  async create(data: {
    userId: bigint;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data: {
        userId: data.userId,
        token: data.token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { token },
    });
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
