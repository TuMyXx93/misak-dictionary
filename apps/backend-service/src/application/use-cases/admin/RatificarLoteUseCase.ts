/**
 * RatificarLoteUseCase
 * Spec 006 (R-012, R-025, D-7) - Ratificación por lote atómica (todo o nada) de sentidos
 * léxicos por microcampo/nodo con checklist obligatorio, snapshot de versiones y bloqueo
 * de auto-ratificación.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { RatificarLoteDTO } from '../../dtos/AdminSentidoDto.js';

export interface ActorRatificadorLote {
  userId: bigint;
  username: string;
  roles: string[];
}

export interface ConflictoLote {
  codigo: string;
  motivo: 'auto_ratificacion' | 'version_obsoleta' | 'ya_ratificado' | 'no_encontrado';
}

export class RatificarLoteError extends AppError {
  public readonly conflictos: ConflictoLote[];

  constructor(message: string, conflictos: ConflictoLote[]) {
    super(message, 409, true, 'BATCH_RATIFICATION_CONFLICT');
    this.conflictos = conflictos;
  }
}

export class RatificarLoteUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(
    nivel: 'campo' | 'subcampo' | 'microcampo',
    nodoId: bigint | string,
    dto: RatificarLoteDTO,
    actor: ActorRatificadorLote,
  ) {
    const { checklist, snapshot } = dto;

    // 1. Validar checklist
    if (
      !checklist ||
      checklist.ortografia !== true ||
      checklist.categorias !== true ||
      checklist.glosas !== true ||
      checklist.cientificos !== true
    ) {
      throw new AppError(
        'Debe confirmar los 4 puntos de la lista de verificación para ratificar por lote',
        400,
      );
    }

    if (!snapshot || snapshot.length === 0) {
      throw new AppError('El lote debe contener al menos un sentido para ratificar', 400);
    }

    const ids: bigint[] = [];
    const versionMap = new Map<string, number>();

    for (const item of snapshot) {
      try {
        const idBigInt = BigInt(item.id);
        ids.push(idBigInt);
        versionMap.set(item.id, item.version);
      } catch {
        throw new AppError(`ID de sentido inválido en snapshot: ${item.id}`, 400);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let resolvedEntityId = nodoId.toString();

      if (typeof nodoId === 'string' && !/^\d+$/.test(nodoId)) {
        const codigoNormalizado = nodoId.trim().toUpperCase();
        const txModels = tx as unknown as {
          campoSemantico?: {
            findFirst?: (args: unknown) => Promise<{ id: bigint } | null>;
          };
          subcampoSemantico?: {
            findFirst?: (args: unknown) => Promise<{ id: bigint } | null>;
          };
          microcampo?: {
            findFirst?: (args: unknown) => Promise<{ id: bigint } | null>;
          };
        };
        const finder =
          nivel === 'campo'
            ? txModels.campoSemantico?.findFirst
            : nivel === 'subcampo'
              ? txModels.subcampoSemantico?.findFirst
              : txModels.microcampo?.findFirst;

        if (finder) {
          const nodoEncontrado = await finder({
            where: { codigo: codigoNormalizado, deletedAt: null },
            select: { id: true },
          });
          if (!nodoEncontrado) {
            throw new AppError(
              `Nodo taxonómico ${nivel} (${codigoNormalizado}) no encontrado`,
              404,
            );
          }
          resolvedEntityId = nodoEncontrado.id.toString();
        } else {
          resolvedEntityId = codigoNormalizado;
        }
      }

      // 2. Cargar todos los sentidos indicados activos
      const sentidos = await tx.sentidoLexico.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        select: {
          id: true,
          codigo: true,
          estado: true,
          version: true,
          ultimoEditorId: true,
        },
      });

      const conflictos: ConflictoLote[] = [];
      const encontradosMap = new Map<string, (typeof sentidos)[0]>();

      for (const s of sentidos) {
        encontradosMap.set(s.id.toString(), s);
      }

      const esSuperAdmin = actor.roles.includes('super_admin');

      // 3. Evaluar cada sentido contra snapshot y reglas de negocio
      for (const item of snapshot) {
        const sentido = encontradosMap.get(item.id);
        if (!sentido) {
          conflictos.push({
            codigo: item.id,
            motivo: 'no_encontrado',
          });
          continue;
        }

        if (sentido.estado === 'ratificado') {
          conflictos.push({
            codigo: sentido.codigo,
            motivo: 'ya_ratificado',
          });
          continue;
        }

        if (sentido.version !== item.version) {
          conflictos.push({
            codigo: sentido.codigo,
            motivo: 'version_obsoleta',
          });
          continue;
        }

        // Bloqueo de auto-ratificación (R-012)
        if (
          sentido.ultimoEditorId !== null &&
          sentido.ultimoEditorId === actor.userId &&
          !esSuperAdmin
        ) {
          conflictos.push({
            codigo: sentido.codigo,
            motivo: 'auto_ratificacion',
          });
        }
      }

      // 4. Si hay algún conflicto, rechazar el lote completo (todo o nada)
      if (conflictos.length > 0) {
        throw new RatificarLoteError('Conflictos impiden ratificar el lote', conflictos);
      }

      const ahora = new Date();
      const codigosRatificados: string[] = [];

      // 5. Aplicar ratificación a cada sentido e incrementar versión
      for (const s of sentidos) {
        const nuevaVersion = s.version + 1;
        await tx.sentidoLexico.update({
          where: { id: s.id },
          data: {
            estado: 'ratificado',
            ratificadoPorId: actor.userId,
            ratificadoAt: ahora,
            version: nuevaVersion,
          },
        });

        codigosRatificados.push(s.codigo);

        // 1 registro de auditoría individual por sentido
        await this.auditService.recordInTx(tx, {
          actorUserId: actor.userId,
          actorUsername: actor.username,
          action: 'ratify',
          entity: 'sentido',
          entityId: s.id.toString(),
          oldData: {
            codigo: s.codigo,
            estado: s.estado,
            version: s.version,
          },
          newData: {
            codigo: s.codigo,
            estado: 'ratificado',
            version: nuevaVersion,
            ratificadoPorId: actor.userId.toString(),
            ratificadoAt: ahora.toISOString(),
          },
        });
      }

      // 6. 1 registro de auditoría de lote
      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'ratify_batch',
        entity: nivel,
        entityId: resolvedEntityId,
        oldData: null,
        newData: {
          total: sentidos.length,
          codigos: codigosRatificados,
          ratificadoPorId: actor.userId.toString(),
          ratificadoAt: ahora.toISOString(),
        },
      });

      return {
        ratificados: sentidos.length,
        codigos: codigosRatificados,
      };
    });
  }
}
