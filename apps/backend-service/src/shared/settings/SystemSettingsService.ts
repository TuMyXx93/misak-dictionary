/**
 * SystemSettingsService
 * Spec 006 (R-026, RK-7) - Servicio de banderas y ajustes globales del sistema
 * con almacenamiento en BD (tabla system_settings), caché en memoria TTL 30 s,
 * invalidación al escribir y auditoría.
 */

import type { PrismaClient } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/AuditService.js';
import { prisma as defaultPrisma } from '../config/prisma.js';

export const KEY_PUBLIC_ONLY_RATIFIED = 'PUBLIC_ONLY_RATIFIED';
export const CACHE_TTL_MS = 30_000; // 30 segundos

export interface ActorSetting {
  userId: bigint;
  username: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SystemSettingsService {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async getPublicOnlyRatified(): Promise<boolean> {
    const cached = this.getFromCache<boolean>(KEY_PUBLIC_ONLY_RATIFIED);
    if (cached !== null) {
      return cached;
    }

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: KEY_PUBLIC_ONLY_RATIFIED },
    });

    const valor = setting ? Boolean(setting.value) : false;
    this.setInCache(KEY_PUBLIC_ONLY_RATIFIED, valor);
    return valor;
  }

  async setPublicOnlyRatified(value: boolean, actor: ActorSetting): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const previo = await tx.systemSetting.findUnique({
        where: { key: KEY_PUBLIC_ONLY_RATIFIED },
      });

      const valorAnterior = previo ? Boolean(previo.value) : false;
      const ahora = new Date();

      await tx.systemSetting.upsert({
        where: { key: KEY_PUBLIC_ONLY_RATIFIED },
        create: {
          key: KEY_PUBLIC_ONLY_RATIFIED,
          value,
          updatedById: actor.userId,
          updatedAt: ahora,
        },
        update: {
          value,
          updatedById: actor.userId,
          updatedAt: ahora,
        },
      });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'update_setting',
        entity: 'system_setting',
        entityId: KEY_PUBLIC_ONLY_RATIFIED,
        oldData: { value: valorAnterior },
        newData: { value },
      });

      // Actualizar caché de inmediato
      this.setInCache(KEY_PUBLIC_ONLY_RATIFIED, value);

      return value;
    });
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  private setInCache<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }
}
