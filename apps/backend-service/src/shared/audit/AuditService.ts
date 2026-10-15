/**
 * AuditService
 * Spec 002 - Auth RBAC
 * Registro inmutable de eventos de seguridad en audit_log (R-007/010/012).
 * Nunca persiste contraseñas ni tokens (R-011).
 */

import { prisma } from '../config/prisma.js';

export interface AuditEventInput {
  actorUserId?: bigint | undefined;
  actorUsername?: string | undefined;
  action: string;
  entity: string;
  entityId?: string | undefined;
  oldData?: Record<string, unknown> | undefined;
  newData?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class AuditService {
  /** Registra un evento. Aísla fallas para no romper el flujo principal. */
  async record(event: AuditEventInput): Promise<void> {
    try {
      // exactOptionalPropertyTypes: Prisma no acepta undefined en Json.
      // Se construyen solo las claves presentes (patrón de los repositorios).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        actorUserId: event.actorUserId ?? null,
        actorUsername: event.actorUsername ?? null,
        action: event.action,
        entity: event.entity,
        entityId: event.entityId ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
      };
      if (event.oldData) data.oldData = event.oldData;
      if (event.newData) data.newData = event.newData;

      await prisma.auditLog.create({ data });
    } catch (error) {
      // La auditoría nunca debe tumbar la operación de negocio
      console.error('[audit] Error registrando evento:', error);
    }
  }
}
