/**
 * RatificarSentidoUseCase
 * Spec 006 (R-011, R-012) - Ratificación editorial de un sentido léxico con bloqueo
 * estricto de auto-ratificación (salvo super_admin) y auditoría transaccional.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { RatificarSentidoDTO } from '../../dtos/AdminSentidoDto.js';

export interface ActorRatificador {
  userId: bigint;
  username: string;
  roles: string[];
}

export class RatificarSentidoUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(id: bigint, dto: RatificarSentidoDTO, actor: ActorRatificador) {
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

      // Control de versión
      if (sentido.version !== dto.version) {
        throw new AppError(
          'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
          409,
        );
      }

      // Validar estado previo
      if (sentido.estado === 'ratificado') {
        throw new AppError('El sentido ya se encuentra ratificado', 409);
      }

      // Bloqueo de auto-ratificación (R-012 / D-4)
      const esSuperAdmin = actor.roles.includes('super_admin');
      if (
        sentido.ultimoEditorId !== null &&
        sentido.ultimoEditorId === actor.userId &&
        !esSuperAdmin
      ) {
        throw new AppError(
          'No puedes ratificar un sentido cuya última edición fue realizada por ti mismo',
          409,
        );
      }

      const ahora = new Date();
      const nuevaVersion = sentido.version + 1;

      const sentidoActualizado = await tx.sentidoLexico.update({
        where: { id },
        data: {
          estado: 'ratificado',
          ratificadoPorId: actor.userId,
          ratificadoAt: ahora,
          version: nuevaVersion,
        },
        include: {
          formas: { orderBy: { orden: 'asc' } },
        },
      });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'ratify',
        entity: 'sentido',
        entityId: id.toString(),
        oldData: {
          codigo: sentido.codigo,
          estado: sentido.estado,
          version: sentido.version,
          ratificadoPorId: null,
          ratificadoAt: null,
        },
        newData: {
          codigo: sentidoActualizado.codigo,
          estado: 'ratificado',
          version: nuevaVersion,
          ratificadoPorId: actor.userId.toString(),
          ratificadoAt: ahora.toISOString(),
        },
      });

      return sentidoActualizado;
    });
  }
}
