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

export const NIVELES_PAPELERA = ['campo', 'subcampo', 'microcampo', 'sentido'] as const;
export type NivelPapelera = (typeof NIVELES_PAPELERA)[number];

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

export class PapeleraUseCase {
  async listar(): Promise<ElementoPapelera[]> {
    const [campos, subcampos, microcampos, sentidos] = await Promise.all([
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

  private async buscarEliminado(nivel: NivelPapelera, id: bigint) {
    const nodo =
      nivel === 'campo'
        ? await prisma.campoSemantico.findUnique({ where: { id } })
        : nivel === 'subcampo'
          ? await prisma.subcampoSemantico.findUnique({ where: { id } })
          : nivel === 'microcampo'
            ? await prisma.microcampo.findUnique({ where: { id } })
            : await prisma.sentidoLexico.findUnique({ where: { id } });

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
    } else {
      await prisma.sentidoLexico.update({ where: { id }, data });
    }
  }
}
