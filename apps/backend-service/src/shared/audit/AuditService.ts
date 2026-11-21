/**
 * AuditService
 * Spec 002 - Auth RBAC
 * Registro inmutable de eventos de seguridad en audit_log (R-007/010/012).
 * Nunca persiste contraseñas ni tokens (R-011).
 */

import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';

export interface AuditEventInput {
  actorUserId?: bigint | undefined;
  actorUsername?: string | undefined;
  action: string;
  entity: string;
  entityId?: string | undefined;
  oldData?: Record<string, unknown> | null | undefined;
  newData?: Record<string, unknown> | null | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface AuditTransactionalClient {
  auditLog: {
    create(args: { data: Prisma.AuditLogUncheckedCreateInput }): Promise<unknown>;
  };
}

function buildAuditData(event: AuditEventInput): Prisma.AuditLogUncheckedCreateInput {
  return {
    actorUserId: event.actorUserId ?? null,
    actorUsername: event.actorUsername ?? null,
    action: event.action,
    entity: event.entity,
    entityId: event.entityId ?? null,
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null,
    ...(event.oldData ? { oldData: event.oldData as Prisma.InputJsonValue } : {}),
    ...(event.newData ? { newData: event.newData as Prisma.InputJsonValue } : {}),
  };
}

export class AuditService {
  /** Registra un evento. Aísla fallas para no romper el flujo principal. */
  async record(event: AuditEventInput): Promise<void> {
    try {
      await prisma.auditLog.create({ data: buildAuditData(event) });
    } catch (error) {
      // La auditoría nunca debe tumbar la operación de negocio
      console.error('[audit] Error registrando evento:', error);
    }
  }

  /**
   * Registra un evento dentro de una transacción activa.
   * NO aísla errores: si la auditoría falla o la transacción aborta,
   * la mutación y la auditoría se revierten juntas (RK-3 / R-020 / R-025).
   */
  async recordInTx(tx: AuditTransactionalClient, event: AuditEventInput): Promise<void> {
    await tx.auditLog.create({ data: buildAuditData(event) });
  }
}
