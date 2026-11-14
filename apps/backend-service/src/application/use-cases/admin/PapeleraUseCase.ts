/**
 * Papelera de la taxonomía: listar y restaurar nodos borrados lógicamente.
 * La restauración reactiva solo el nodo; sus hijos conservan su estado.
 * Si el código o el nombre ya están ocupados por un registro activo, se
 * devuelve 409 y no se modifica nada.
 */

import { Prisma } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { LocalStorageService } from '../../../shared/storage/local-storage.service.js';

export const NIVELES_PAPELERA = ['campo', 'subcampo', 'microcampo', 'sentido', 'medio'] as const;
export type NivelPapelera = (typeof NIVELES_PAPELERA)[number];

const RETENCION_PAPELERA_DIAS = 30;

export interface ElementoPapelera {
  nivel: NivelPapelera;
  id: string;
  codigo: string;
  namtrik: string | null;
  espanol: string;
  eliminadoAt: Date;
}

export interface ActorAuditoria {
  userId: bigint;
  username: string;
}

const auditService = new AuditService();
const storageService = new LocalStorageService();

export class PapeleraUseCase {
  async listar(): Promise<ElementoPapelera[]> {
    const [campos, subcampos, microcampos, sentidos, medios] = await Promise.all([
      prisma.campoSemantico.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.subcampoSemantico.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.microcampo.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.sentidoLexico.findMany({
        where: { deletedAt: { not: null } },
        include: { formas: { orderBy: { orden: 'asc' }, take: 1 } },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.medioCultural?.findMany
        ? prisma.medioCultural.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const elementos: ElementoPapelera[] = [
      ...campos.map((c) => ({
        nivel: 'campo' as const,
        id: c.id.toString(),
        codigo: c.codigo,
        namtrik: c.namtrikTermino,
        espanol: c.espanolTermino,
        eliminadoAt: c.deletedAt as Date,
      })),
      ...subcampos.map((s) => ({
        nivel: 'subcampo' as const,
        id: s.id.toString(),
        codigo: s.codigo,
        namtrik: s.namtrikTermino,
        espanol: s.espanolTermino,
        eliminadoAt: s.deletedAt as Date,
      })),
      ...microcampos.map((m) => ({
        nivel: 'microcampo' as const,
        id: m.id.toString(),
        codigo: m.codigo,
        namtrik: m.namtrikTermino,
        espanol: m.espanolTermino,
        eliminadoAt: m.deletedAt as Date,
      })),
      ...(sentidos ?? []).map((s) => ({
        nivel: 'sentido' as const,
        id: s.id.toString(),
        codigo: s.codigo,
        namtrik: s.formas[0]?.lema ?? null,
        espanol: s.espanolGlosa,
        eliminadoAt: s.deletedAt as Date,
      })),
      ...(medios ?? []).map((m) => ({
        nivel: 'medio' as const,
        id: m.id.toString(),
        codigo: `MED-${m.id.toString()}`,
        namtrik: m.descripcionNamtrik ?? m.hablanteAutor ?? null,
        espanol: m.descripcionEspanol || m.originalName || m.uuid,
        eliminadoAt: m.deletedAt as Date,
      })),
    ];

    return elementos.sort((a, b) => b.eliminadoAt.getTime() - a.eliminadoAt.getTime());
  }

  async restaurar(nivel: NivelPapelera, id: bigint, actor: ActorAuditoria): Promise<void> {
    const antes = await this.buscarEliminado(nivel, id);

    try {
      await this.reactivar(nivel, id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(
          'No se puede restaurar: el código, el slug o el nombre ya están en uso por un registro activo',
          409,
        );
      }
      throw error;
    }

    await auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'restore',
      entity: nivel,
      entityId: id.toString(),
      oldData: { deletedAt: antes.deletedAt?.toISOString() ?? null },
      newData: { deletedAt: null },
    });
  }

  async purgar(
    nivel: NivelPapelera,
    id: bigint,
    confirmCodigo: string,
    actor: { userId: bigint; username: string; roles: string[] },
  ): Promise<void> {
    if (!actor.roles.includes('super_admin')) {
      throw new AppError(
        'Solo el rol super_admin tiene autorización para purgar elementos de la papelera',
        403,
      );
    }

    const elemento = await this.buscarEliminado(nivel, id);
    const codigoElemento = 'codigo' in elemento ? elemento.codigo : `MED-${elemento.id.toString()}`;

    if (codigoElemento !== confirmCodigo) {
      throw new AppError('El código de confirmación no coincide con el elemento a purgar', 400);
    }

    const ahora = new Date();
    const eliminadoAt = new Date(elemento.deletedAt ?? ahora);
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - eliminadoAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diasTranscurridos < RETENCION_PAPELERA_DIAS) {
      throw new AppError(
        'No se puede purgar: se requiere una retención mínima de 30 días en papelera',
        409,
      );
    }

    // Verificar dependencias activas (R-017)
    if (nivel === 'campo') {
      const subcamposActivos = await prisma.subcampoSemantico.count({
        where: { campoSemanticoId: id, deletedAt: null },
      });
      if (subcamposActivos > 0) {
        throw new AppError('No se puede purgar: el campo tiene subcampos activos', 409);
      }
      const sentidosActivos = await prisma.sentidoUbicacion.count({
        where: { campoSemanticoId: id, sentido: { deletedAt: null } },
      });
      if (sentidosActivos > 0) {
        throw new AppError('No se puede purgar: el campo tiene sentidos activos asociados', 409);
      }
    } else if (nivel === 'subcampo') {
      const microcamposActivos = await prisma.microcampo.count({
        where: { subcampoSemanticoId: id, deletedAt: null },
      });
      if (microcamposActivos > 0) {
        throw new AppError('No se puede purgar: el subcampo tiene microcampos activos', 409);
      }
      const sentidosActivos = await prisma.sentidoUbicacion.count({
        where: { subcampoSemanticoId: id, sentido: { deletedAt: null } },
      });
      if (sentidosActivos > 0) {
        throw new AppError('No se puede purgar: el subcampo tiene sentidos activos asociados', 409);
      }
    } else if (nivel === 'microcampo') {
      const subnivelesActivos = await prisma.microcampo.count({
        where: { padreId: id, deletedAt: null },
      });
      if (subnivelesActivos > 0) {
        throw new AppError('No se puede purgar: el microcampo tiene subniveles activos', 409);
      }
      const sentidosActivos = await prisma.sentidoUbicacion.count({
        where: { microcampoId: id, sentido: { deletedAt: null } },
      });
      if (sentidosActivos > 0) {
        throw new AppError(
          'No se puede purgar: el microcampo tiene sentidos activos asociados',
          409,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Snapshot previo para auditoría
      const snapshot: Record<string, unknown> = { ...elemento };
      for (const [k, v] of Object.entries(snapshot)) {
        if (typeof v === 'bigint') snapshot[k] = v.toString();
        else if (v instanceof Date) snapshot[k] = v.toISOString();
      }

      if (nivel === 'campo') {
        await tx.campoSemantico.delete({ where: { id } });
      } else if (nivel === 'subcampo') {
        await tx.subcampoSemantico.delete({ where: { id } });
      } else if (nivel === 'microcampo') {
        await tx.microcampo.delete({ where: { id } });
      } else if (nivel === 'sentido') {
        await tx.sentidoLexico.delete({ where: { id } });
      } else {
        await tx.medioCultural.delete({ where: { id } });
      }

      await auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'purge',
        entity: nivel,
        entityId: id.toString(),
        oldData: snapshot,
        newData: null,
      });
    });

    if (nivel === 'medio' && 'filename' in elemento && typeof elemento.filename === 'string') {
      try {
        await storageService.delete(elemento.filename);
      } catch {
        // Archivo físico ya ausente; la purga en BD prevalece
      }
    }
  }

  async buscarEliminado(nivel: NivelPapelera, id: bigint) {
    const nodo =
      nivel === 'campo'
        ? await prisma.campoSemantico.findUnique({ where: { id } })
        : nivel === 'subcampo'
          ? await prisma.subcampoSemantico.findUnique({ where: { id } })
          : nivel === 'microcampo'
            ? await prisma.microcampo.findUnique({ where: { id } })
            : nivel === 'sentido'
              ? await prisma.sentidoLexico.findUnique({ where: { id } })
              : await prisma.medioCultural.findUnique({ where: { id } });

    if (!nodo || nodo.deletedAt === null) {
      throw new AppError('El elemento no está en la papelera', 404);
    }
    return nodo;
  }

  private async reactivar(nivel: NivelPapelera, id: bigint): Promise<void> {
    const data = { deletedAt: null };
    if (nivel === 'campo') {
      await prisma.campoSemantico.update({ where: { id }, data });
    } else if (nivel === 'subcampo') {
      await prisma.subcampoSemantico.update({ where: { id }, data });
    } else if (nivel === 'microcampo') {
      await prisma.microcampo.update({ where: { id }, data });
    } else if (nivel === 'sentido') {
      await prisma.sentidoLexico.update({ where: { id }, data });
    } else {
      await prisma.medioCultural.update({ where: { id }, data });
    }
  }
}
