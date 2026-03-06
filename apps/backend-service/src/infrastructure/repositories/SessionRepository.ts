/**
 * SessionRepository Implementation
 * Sprint 2 - Auth System
 * Implementa ISessionRepository usando Prisma
 */

import type { Session } from '../../domain/entities/Session.js';
import type { ISessionRepository } from '../../domain/interfaces/IAuthServices.js';
import { prisma } from '../../shared/config/prisma.js';

export class SessionRepository implements ISessionRepository {
  async create(data: {
    userId: bigint;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    };
    if (data.ipAddress) createData.ipAddress = data.ipAddress;
    if (data.userAgent) createData.userAgent = data.userAgent;

    return prisma.session.create({
      data: createData,
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
