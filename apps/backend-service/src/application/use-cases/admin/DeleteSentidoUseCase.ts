/**
 * DeleteSentidoUseCase
 * Spec 006 (R-009, R-020) - Borrado lógico de un sentido léxico con auditoría transaccional.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface ActorAdmin {
  userId: bigint;
  username: string;
}

export class DeleteSentidoUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(id: bigint, actor: ActorAdmin): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const sentido = await tx.sentidoLexico.findUnique({
        where: { id },
        include: {
          formas: { orderBy: { orden: 'asc' } },
        },
      });

      if (!sentido || sentido.deletedAt !== null) {
        throw new AppError('Sentido no encontrado', 404);
      }

      const ahora = new Date();

      await tx.sentidoLexico.update({
        where: { id },
        data: {
          deletedAt: ahora,
          ultimoEditorId: actor.userId,
          ultimoEditorAt: ahora,
        },
      });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'delete',
        entity: 'sentido',
        entityId: id.toString(),
        oldData: {
          codigo: sentido.codigo,
          estado: sentido.estado,
          version: sentido.version,
          espanolGlosa: sentido.espanolGlosa,
          formas: sentido.formas.map((f) => ({ orden: f.orden, lema: f.lema })),
          deletedAt: null,
        },
        newData: {
          deletedAt: ahora.toISOString(),
        },
      });
    });
  }
}
