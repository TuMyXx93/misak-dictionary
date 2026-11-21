/**
 * RevertirRatificacionUseCase
 * Spec 006 (R-013) - Reversión de ratificación a borrador con motivo obligatorio
 * (mínimo 10 caracteres) y auditoría transaccional.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { RevertirRatificacionDTO } from '../../dtos/AdminSentidoDto.js';

export interface ActorRevertidor {
  userId: bigint;
  username: string;
}

export class RevertirRatificacionUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(id: bigint, dto: RevertirRatificacionDTO, actor: ActorRevertidor) {
    if (!dto.motivo || dto.motivo.trim().length < 10) {
      throw new AppError('El motivo de reversión debe tener al menos 10 caracteres', 400);
    }

    const motivo = dto.motivo.trim();

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

      if (sentido.version !== dto.version) {
        throw new AppError(
          'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
          409,
          true,
          'VERSION_CONFLICT',
        );
      }

      if (sentido.estado !== 'ratificado') {
        throw new AppError(
          'Solo se pueden revertir sentidos que estén ratificados',
          409,
          true,
          'INVALID_EDITORIAL_STATE',
        );
      }

      const ahora = new Date();
      const nuevaVersion = sentido.version + 1;

      const sentidoActualizado = await tx.sentidoLexico.update({
        where: { id },
        data: {
          estado: 'borrador',
          ratificadoPorId: null,
          ratificadoAt: null,
          version: nuevaVersion,
          ultimoEditorId: actor.userId,
          ultimoEditorAt: ahora,
        },
        include: {
          formas: { orderBy: { orden: 'asc' } },
        },
      });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'revert_ratification',
        entity: 'sentido',
        entityId: id.toString(),
        oldData: {
          codigo: sentido.codigo,
          estado: sentido.estado,
          version: sentido.version,
          ratificadoPorId: sentido.ratificadoPorId?.toString() ?? null,
          ratificadoAt: sentido.ratificadoAt?.toISOString() ?? null,
        },
        newData: {
          codigo: sentidoActualizado.codigo,
          estado: 'borrador',
          version: nuevaVersion,
          motivo,
          revertidoPor: actor.userId.toString(),
          revertidoAt: ahora.toISOString(),
        },
      });

      return sentidoActualizado;
    });
  }
}
