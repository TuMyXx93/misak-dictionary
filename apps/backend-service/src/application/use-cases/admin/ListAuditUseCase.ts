/**
 * ListAuditUseCase
 * Spec 006 (R-019) - Consulta paginada y filtrable de registros de auditoría.
 * Sanitiza cualquier secreto (hashes, contraseñas, tokens) antes de devolver los datos.
 */

import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';

export interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  userId: string | null;
  actorUsername: string | null;
  action: string;
  entity: string;
  entityType: string;
  entityId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ListAuditQuery {
  actorUserId?: string | undefined;
  entity?: string | undefined;
  action?: string | undefined;
  desde?: Date | undefined;
  hasta?: Date | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListAuditResult {
  items: AuditLogItem[];
  nextCursor: string | null;
}

const CLAVES_SENSIBLES = new Set([
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'refreshtoken',
  'refreshtokenhash',
  'secret',
]);

function sanitizarObjeto(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizarObjeto);
  }

  const copia: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (CLAVES_SENSIBLES.has(key.toLowerCase())) {
      copia[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      copia[key] = sanitizarObjeto(value);
    } else {
      copia[key] = value;
    }
  }
  return copia;
}

export class ListAuditUseCase {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async execute(query: ListAuditQuery = {}): Promise<ListAuditResult> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorUserId) {
      try {
        where.actorUserId = BigInt(query.actorUserId);
      } catch {
        // Ignorar id inválido
      }
    }

    if (query.entity && query.entity.trim().length > 0) {
      where.entity = query.entity.trim();
    }

    if (query.action && query.action.trim().length > 0) {
      where.action = query.action.trim();
    }

    if (query.desde || query.hasta) {
      where.createdAt = {};
      if (query.desde) where.createdAt.gte = query.desde;
      if (query.hasta) where.createdAt.lte = query.hasta;
    }

    if (query.cursor) {
      try {
        where.id = { lt: BigInt(query.cursor) };
      } catch {
        // Ignorar cursor inválido
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = logs.length > limit;
    const itemsParaRetornar = hasMore ? logs.slice(0, limit) : logs;
    const ultimoLog = itemsParaRetornar[itemsParaRetornar.length - 1];
    const nextCursor = hasMore && ultimoLog ? ultimoLog.id.toString() : null;

    const items: AuditLogItem[] = itemsParaRetornar.map((log) => {
      const actorUserId = log.actorUserId ? log.actorUserId.toString() : null;
      return {
        id: log.id.toString(),
        actorUserId,
        userId: actorUserId,
        actorUsername: log.actorUsername,
        action: log.action,
        entity: log.entity,
        entityType: log.entity,
        entityId: log.entityId,
        oldData: sanitizarObjeto(log.oldData),
        newData: sanitizarObjeto(log.newData),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      };
    });

    return {
      items,
      nextCursor,
    };
  }
}
