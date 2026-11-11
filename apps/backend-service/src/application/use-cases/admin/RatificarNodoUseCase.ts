/**
 * RatificarNodoUseCase
 * Spec 006 (R-015) - Ratificación editorial de nodos taxonómicos (campos, subcampos, microcampos)
 * con bloqueo de auto-ratificación y auditoría transaccional.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export type NivelNodoTaxonomico = 'campo' | 'subcampo' | 'microcampo';

export interface ParametrosRatificarNodo {
  nivel: NivelNodoTaxonomico;
  id: bigint;
  version: number;
}

export interface ActorRatificadorNodo {
  userId: bigint;
  username: string;
  roles: string[];
}

export class RatificarNodoUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(params: ParametrosRatificarNodo, actor: ActorRatificadorNodo) {
    const { nivel, id, version } = params;

    return this.prisma.$transaction(async (tx) => {
      const nodo =
        nivel === 'campo'
          ? await tx.campoSemantico.findUnique({ where: { id } })
          : nivel === 'subcampo'
            ? await tx.subcampoSemantico.findUnique({ where: { id } })
            : await tx.microcampo.findUnique({ where: { id } });

      if (!nodo || nodo.deletedAt !== null) {
        throw new AppError(`Nodo taxonómico de nivel ${nivel} no encontrado`, 404);
      }

      if (nodo.version !== version) {
        throw new AppError(
          'Conflicto de concurrencia: el nodo ha sido modificado por otro usuario',
          409,
        );
      }

      if (nodo.estado === 'ratificado') {
        throw new AppError('El nodo ya se encuentra ratificado', 409);
      }

      const esSuperAdmin = actor.roles.includes('super_admin');
      if (nodo.ultimoEditorId !== null && nodo.ultimoEditorId === actor.userId && !esSuperAdmin) {
        throw new AppError(
          'No puedes ratificar un nodo cuya última edición fue realizada por ti mismo',
          409,
        );
      }

      const ahora = new Date();
      const nuevaVersion = (nodo.version ?? 1) + 1;

      const dataUpdate = {
        estado: 'ratificado',
        ratificadoPorId: actor.userId,
        ratificadoAt: ahora,
        version: nuevaVersion,
      };

      const nodoActualizado =
        nivel === 'campo'
          ? await tx.campoSemantico.update({ where: { id }, data: dataUpdate })
          : nivel === 'subcampo'
            ? await tx.subcampoSemantico.update({ where: { id }, data: dataUpdate })
            : await tx.microcampo.update({ where: { id }, data: dataUpdate });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'ratify',
        entity: nivel,
        entityId: id.toString(),
        oldData: {
          codigo: nodo.codigo,
          estado: nodo.estado,
          version: nodo.version,
        },
        newData: {
          codigo: nodoActualizado.codigo,
          estado: 'ratificado',
          version: nuevaVersion,
          ratificadoPorId: actor.userId.toString(),
          ratificadoAt: ahora.toISOString(),
        },
      });

      return nodoActualizado;
    });
  }
}
