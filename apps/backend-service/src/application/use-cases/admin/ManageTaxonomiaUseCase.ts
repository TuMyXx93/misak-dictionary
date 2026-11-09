/**
 * ManageTaxonomiaUseCase
 * Spec 012 v0.2.0 — Gestión jerárquica de la taxonomía con protección estricta (409 Conflict):
 * Un campo no se puede eliminar si contiene subcampos o términos activos.
 * Un subcampo no se puede eliminar si contiene microcampos o términos activos.
 * Un microcampo no se puede eliminar si contiene subniveles o términos activos.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { normalizarNamtrik } from '../../../shared/utils/namtrik.js';
import type {
  CreateCampoDTO,
  CreateMicrocampoDTO,
  CreateSubcampoDTO,
  UpdateCampoDTO,
  UpdateMicrocampoDTO,
  UpdateSubcampoDTO,
} from '../../dtos/AdminTaxonomiaDto.js';

export interface ActorAuditoria {
  userId: bigint;
  username: string;
}

export interface TaxonomyTreeNode {
  id: string;
  codigo: string;
  slug: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  posicion: number;
  nivel: 'campo' | 'subcampo' | 'microcampo' | 'subnivel';
  totalTerminos: number;
  totalHijos: number;
  hijos?: TaxonomyTreeNode[];
}

export class ManageTaxonomiaUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  /**
   * Obtiene el árbol completo de la taxonomía activa con métricas de hijos y términos
   */
  async obtenerArbol(): Promise<TaxonomyTreeNode[]> {
    const [campos, subcampos, microcampos, countsRaw] = await Promise.all([
      this.prisma.campoSemantico.findMany({
        where: { deletedAt: null },
        orderBy: [{ posicion: 'asc' }, { codigo: 'asc' }],
      }),
      this.prisma.subcampoSemantico.findMany({
        where: { deletedAt: null },
        orderBy: [{ posicion: 'asc' }, { codigo: 'asc' }],
      }),
      this.prisma.microcampo.findMany({
        where: { deletedAt: null },
        orderBy: [{ posicion: 'asc' }, { codigo: 'asc' }],
      }),
      this.prisma.$queryRaw<
        Array<{
          campo_semantico_id: bigint | null;
          subcampo_semantico_id: bigint | null;
          microcampo_id: bigint | null;
          total: bigint;
        }>
      >`
        SELECT campo_semantico_id, subcampo_semantico_id, microcampo_id, count(*)::bigint as total
        FROM sentidos_ubicaciones
        GROUP BY campo_semantico_id, subcampo_semantico_id, microcampo_id
      `,
    ]);

    const microCounts = new Map<string, number>();
    const subcampoDirectCounts = new Map<string, number>();
    const campoDirectCounts = new Map<string, number>();

    for (const r of countsRaw) {
      const cnt = Number(r.total);
      if (r.microcampo_id) microCounts.set(r.microcampo_id.toString(), cnt);
      if (r.subcampo_semantico_id)
        subcampoDirectCounts.set(r.subcampo_semantico_id.toString(), cnt);
      if (r.campo_semantico_id) campoDirectCounts.set(r.campo_semantico_id.toString(), cnt);
    }

    // Organizar microcampos por padreId y subcampoSemanticoId
    const microBySubcampo = new Map<string, typeof microcampos>();
    for (const m of microcampos) {
      const subId = m.subcampoSemanticoId.toString();
      if (!microBySubcampo.has(subId)) microBySubcampo.set(subId, []);
      microBySubcampo.get(subId)?.push(m);
    }

    // Subcampos por campoSemanticoId
    const subByCampo = new Map<string, typeof subcampos>();
    for (const s of subcampos) {
      const cId = s.campoSemanticoId.toString();
      if (!subByCampo.has(cId)) subByCampo.set(cId, []);
      subByCampo.get(cId)?.push(s);
    }

    const tree: TaxonomyTreeNode[] = [];

    for (const c of campos) {
      const cIdStr = c.id.toString();
      const subs = subByCampo.get(cIdStr) ?? [];
      const subNodes: TaxonomyTreeNode[] = [];
      let campoTotalTerminos = campoDirectCounts.get(cIdStr) ?? 0;

      for (const s of subs) {
        const sIdStr = s.id.toString();
        const micros = microBySubcampo.get(sIdStr) ?? [];

        // Raíces de microcampos (sin padre o profundidad 0)
        const roots = micros.filter((m) => !m.padreId || m.profundidad === 0);
        const childrenMap = new Map<string, typeof micros>();
        for (const m of micros) {
          if (m.padreId) {
            const pId = m.padreId.toString();
            if (!childrenMap.has(pId)) childrenMap.set(pId, []);
            childrenMap.get(pId)?.push(m);
          }
        }

        const buildMicroTree = (m: (typeof micros)[0]): TaxonomyTreeNode => {
          const mIdStr = m.id.toString();
          const subChildren = childrenMap.get(mIdStr) ?? [];
          const childNodes = subChildren.map(buildMicroTree);
          let sumTerminos = microCounts.get(mIdStr) ?? 0;
          for (const ch of childNodes) {
            sumTerminos += ch.totalTerminos;
          }

          return {
            id: mIdStr,
            codigo: m.codigo,
            slug: m.slug,
            namtrikTermino: m.namtrikTermino ?? '',
            espanolTermino: m.espanolTermino,
            namtrikDescripcion: m.namtrikDescripcion,
            espanolDescripcion: m.espanolDescripcion,
            imagen: m.imagen,
            namtrikAudio: m.namtrikAudio,
            espanolAudio: m.espanolAudio,
            posicion: m.posicion,
            nivel: m.padreId ? 'subnivel' : 'microcampo',
            totalTerminos: sumTerminos,
            totalHijos: childNodes.length,
            hijos: childNodes,
          };
        };

        const microNodes = roots.map(buildMicroTree);
        let subcampoTotalTerminos = subcampoDirectCounts.get(sIdStr) ?? 0;
        for (const mn of microNodes) {
          subcampoTotalTerminos += mn.totalTerminos;
        }

        campoTotalTerminos += subcampoTotalTerminos;

        subNodes.push({
          id: sIdStr,
          codigo: s.codigo,
          slug: s.slug,
          namtrikTermino: s.namtrikTermino,
          espanolTermino: s.espanolTermino,
          namtrikDescripcion: s.namtrikDescripcion,
          espanolDescripcion: s.espanolDescripcion,
          imagen: s.imagen,
          namtrikAudio: s.namtrikAudio,
          espanolAudio: s.espanolAudio,
          posicion: s.posicion,
          nivel: 'subcampo',
          totalTerminos: subcampoTotalTerminos,
          totalHijos: microNodes.length,
          hijos: microNodes,
        });
      }

      tree.push({
        id: cIdStr,
        codigo: c.codigo,
        slug: c.slug,
        namtrikTermino: c.namtrikTermino,
        espanolTermino: c.espanolTermino,
        namtrikDescripcion: c.namtrikDescripcion,
        espanolDescripcion: c.espanolDescripcion,
        imagen: c.imagen,
        namtrikAudio: c.namtrikAudio,
        espanolAudio: c.espanolAudio,
        posicion: c.posicion,
        nivel: 'campo',
        totalTerminos: campoTotalTerminos,
        totalHijos: subNodes.length,
        hijos: subNodes,
      });
    }

    return tree;
  }

  // ================= CAMPO SEMÁNTICO =================

  async crearCampo(dto: CreateCampoDTO, actor: ActorAuditoria) {
    const existing = await this.prisma.campoSemantico.findFirst({
      where: {
        OR: [{ codigo: dto.codigo }, { slug: dto.slug }],
        deletedAt: null,
      },
    });
    if (existing) {
      throw new AppError(
        `Ya existe un campo semántico con el código "${dto.codigo}" o slug "${dto.slug}"`,
        409,
      );
    }

    const normNamtrik = normalizarNamtrik(dto.namtrikTermino).valor;

    const created = await this.prisma.campoSemantico.create({
      data: {
        codigo: dto.codigo,
        slug: dto.slug,
        namtrikTermino: normNamtrik,
        namtrikDescripcion: dto.namtrikDescripcion ?? null,
        namtrikAudio: dto.namtrikAudio ?? null,
        espanolTermino: dto.espanolTermino,
        espanolDescripcion: dto.espanolDescripcion ?? null,
        espanolAudio: dto.espanolAudio ?? null,
        imagen: dto.imagen ?? null,
        posicion: dto.posicion,
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'create',
      entity: 'campo_semantico',
      entityId: created.id.toString(),
      oldData: null,
      newData: { codigo: created.codigo, slug: created.slug },
    });

    return created;
  }

  async actualizarCampo(id: string, dto: UpdateCampoDTO, actor: ActorAuditoria) {
    const campoId = BigInt(id);
    const existing = await this.prisma.campoSemantico.findUnique({
      where: { id: campoId },
    });
    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    const normNamtrik = dto.namtrikTermino
      ? normalizarNamtrik(dto.namtrikTermino).valor
      : undefined;

    const updateData: {
      namtrikTermino?: string;
      namtrikDescripcion?: string | null;
      namtrikAudio?: string | null;
      espanolTermino?: string;
      espanolDescripcion?: string | null;
      espanolAudio?: string | null;
      imagen?: string | null;
      posicion?: number;
      ultimoEditorId: bigint;
      ultimoEditorAt: Date;
    } = {
      ultimoEditorId: actor.userId,
      ultimoEditorAt: new Date(),
    };
    if (normNamtrik !== undefined) updateData.namtrikTermino = normNamtrik;
    if (dto.namtrikDescripcion !== undefined)
      updateData.namtrikDescripcion = dto.namtrikDescripcion;
    if (dto.namtrikAudio !== undefined) updateData.namtrikAudio = dto.namtrikAudio;
    if (dto.espanolTermino !== undefined) updateData.espanolTermino = dto.espanolTermino;
    if (dto.espanolDescripcion !== undefined)
      updateData.espanolDescripcion = dto.espanolDescripcion;
    if (dto.espanolAudio !== undefined) updateData.espanolAudio = dto.espanolAudio;
    if (dto.imagen !== undefined) updateData.imagen = dto.imagen;
    if (dto.posicion !== undefined) updateData.posicion = dto.posicion;

    const updated = await this.prisma.campoSemantico.update({
      where: { id: campoId },
      data: updateData,
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'update',
      entity: 'campo_semantico',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { codigo: updated.codigo },
    });

    return updated;
  }

  async eliminarCampo(id: string, actor: ActorAuditoria) {
    const campoId = BigInt(id);
    const existing = await this.prisma.campoSemantico.findUnique({
      where: { id: campoId },
      include: {
        subcampos: { where: { deletedAt: null }, select: { id: true } },
        sentidosUbicacion: { select: { id: true } },
      },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    if (existing.subcampos.length > 0) {
      throw new AppError(
        `No es posible eliminar el campo "${existing.codigo}": contiene ${existing.subcampos.length} subcampos activos. Elimine o reubique los subcampos primero.`,
        409,
      );
    }

    if (existing.sentidosUbicacion.length > 0) {
      throw new AppError(
        `No es posible eliminar el campo "${existing.codigo}": contiene ${existing.sentidosUbicacion.length} términos léxicos asociados directamente.`,
        409,
      );
    }

    await this.prisma.campoSemantico.update({
      where: { id: campoId },
      data: {
        deletedAt: new Date(),
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'delete',
      entity: 'campo_semantico',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { deletedAt: new Date() },
    });

    return { success: true, message: `Campo ${existing.codigo} eliminado correctamente` };
  }

  // ================= SUBCAMPO SEMÁNTICO =================

  async crearSubcampo(dto: CreateSubcampoDTO, actor: ActorAuditoria) {
    const campoId = BigInt(dto.campoSemanticoId);
    const campo = await this.prisma.campoSemantico.findUnique({
      where: { id: campoId },
    });
    if (!campo || campo.deletedAt !== null) {
      throw new AppError('Campo semántico contenedor no encontrado', 404);
    }

    const existing = await this.prisma.subcampoSemantico.findFirst({
      where: {
        OR: [{ codigo: dto.codigo }, { slug: dto.slug }],
        deletedAt: null,
      },
    });
    if (existing) {
      throw new AppError(
        `Ya existe un subcampo semántico con el código "${dto.codigo}" o slug "${dto.slug}"`,
        409,
      );
    }

    const normNamtrik = normalizarNamtrik(dto.namtrikTermino).valor;

    const created = await this.prisma.subcampoSemantico.create({
      data: {
        campoSemanticoId: campoId,
        codigo: dto.codigo,
        slug: dto.slug,
        namtrikTermino: normNamtrik,
        namtrikDescripcion: dto.namtrikDescripcion ?? null,
        namtrikAudio: dto.namtrikAudio ?? null,
        espanolTermino: dto.espanolTermino,
        espanolDescripcion: dto.espanolDescripcion ?? null,
        espanolAudio: dto.espanolAudio ?? null,
        imagen: dto.imagen ?? null,
        posicion: dto.posicion,
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'create',
      entity: 'subcampo_semantico',
      entityId: created.id.toString(),
      oldData: null,
      newData: { codigo: created.codigo, slug: created.slug },
    });

    return created;
  }

  async actualizarSubcampo(id: string, dto: UpdateSubcampoDTO, actor: ActorAuditoria) {
    const subcampoId = BigInt(id);
    const existing = await this.prisma.subcampoSemantico.findUnique({
      where: { id: subcampoId },
    });
    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    const normNamtrik = dto.namtrikTermino
      ? normalizarNamtrik(dto.namtrikTermino).valor
      : undefined;

    const updateData: {
      namtrikTermino?: string;
      namtrikDescripcion?: string | null;
      namtrikAudio?: string | null;
      espanolTermino?: string;
      espanolDescripcion?: string | null;
      espanolAudio?: string | null;
      imagen?: string | null;
      posicion?: number;
      ultimoEditorId: bigint;
      ultimoEditorAt: Date;
    } = {
      ultimoEditorId: actor.userId,
      ultimoEditorAt: new Date(),
    };
    if (normNamtrik !== undefined) updateData.namtrikTermino = normNamtrik;
    if (dto.namtrikDescripcion !== undefined)
      updateData.namtrikDescripcion = dto.namtrikDescripcion;
    if (dto.namtrikAudio !== undefined) updateData.namtrikAudio = dto.namtrikAudio;
    if (dto.espanolTermino !== undefined) updateData.espanolTermino = dto.espanolTermino;
    if (dto.espanolDescripcion !== undefined)
      updateData.espanolDescripcion = dto.espanolDescripcion;
    if (dto.espanolAudio !== undefined) updateData.espanolAudio = dto.espanolAudio;
    if (dto.imagen !== undefined) updateData.imagen = dto.imagen;
    if (dto.posicion !== undefined) updateData.posicion = dto.posicion;

    const updated = await this.prisma.subcampoSemantico.update({
      where: { id: subcampoId },
      data: updateData,
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'update',
      entity: 'subcampo_semantico',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { codigo: updated.codigo },
    });

    return updated;
  }

  async eliminarSubcampo(id: string, actor: ActorAuditoria) {
    const subcampoId = BigInt(id);
    const existing = await this.prisma.subcampoSemantico.findUnique({
      where: { id: subcampoId },
      include: {
        microcampos: { where: { deletedAt: null }, select: { id: true } },
        sentidosUbicacion: { select: { id: true } },
      },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    if (existing.microcampos.length > 0) {
      throw new AppError(
        `No es posible eliminar el subcampo "${existing.codigo}": contiene ${existing.microcampos.length} microcampos activos. Elimine o reubique los microcampos primero.`,
        409,
      );
    }

    if (existing.sentidosUbicacion.length > 0) {
      throw new AppError(
        `No es posible eliminar el subcampo "${existing.codigo}": contiene ${existing.sentidosUbicacion.length} términos léxicos asociados directamente.`,
        409,
      );
    }

    await this.prisma.subcampoSemantico.update({
      where: { id: subcampoId },
      data: {
        deletedAt: new Date(),
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'delete',
      entity: 'subcampo_semantico',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { deletedAt: new Date() },
    });

    return { success: true, message: `Subcampo ${existing.codigo} eliminado correctamente` };
  }

  // ================= MICROCAMPO Y SUBNIVEL =================

  async crearMicrocampo(dto: CreateMicrocampoDTO, actor: ActorAuditoria) {
    const subcampoId = BigInt(dto.subcampoSemanticoId);
    const subcampo = await this.prisma.subcampoSemantico.findUnique({
      where: { id: subcampoId },
    });
    if (!subcampo || subcampo.deletedAt !== null) {
      throw new AppError('Subcampo semántico contenedor no encontrado', 404);
    }

    let padreId: bigint | null = null;
    let profundidad = 0;

    if (dto.padreId) {
      padreId = BigInt(dto.padreId);
      const padre = await this.prisma.microcampo.findUnique({
        where: { id: padreId },
      });
      if (!padre || padre.deletedAt !== null) {
        throw new AppError('Microcampo padre no encontrado', 404);
      }
      profundidad = padre.profundidad + 1;
    }

    const existing = await this.prisma.microcampo.findFirst({
      where: {
        OR: [{ codigo: dto.codigo }, { slug: dto.slug }],
        deletedAt: null,
      },
    });
    if (existing) {
      throw new AppError(
        `Ya existe un microcampo con el código "${dto.codigo}" o slug "${dto.slug}"`,
        409,
      );
    }

    const normNamtrik = dto.namtrikTermino ? normalizarNamtrik(dto.namtrikTermino).valor : null;

    const created = await this.prisma.microcampo.create({
      data: {
        subcampoSemanticoId: subcampoId,
        padreId,
        profundidad,
        codigo: dto.codigo,
        slug: dto.slug,
        namtrikTermino: normNamtrik,
        namtrikDescripcion: dto.namtrikDescripcion ?? null,
        namtrikAudio: dto.namtrikAudio ?? null,
        espanolTermino: dto.espanolTermino,
        espanolDescripcion: dto.espanolDescripcion ?? null,
        espanolAudio: dto.espanolAudio ?? null,
        imagen: dto.imagen ?? null,
        posicion: dto.posicion,
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'create',
      entity: 'microcampo',
      entityId: created.id.toString(),
      oldData: null,
      newData: { codigo: created.codigo, slug: created.slug },
    });

    return created;
  }

  async actualizarMicrocampo(id: string, dto: UpdateMicrocampoDTO, actor: ActorAuditoria) {
    const microcampoId = BigInt(id);
    const existing = await this.prisma.microcampo.findUnique({
      where: { id: microcampoId },
    });
    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    const normNamtrik = dto.namtrikTermino
      ? normalizarNamtrik(dto.namtrikTermino).valor
      : undefined;

    const updateData: {
      namtrikTermino?: string | null;
      namtrikDescripcion?: string | null;
      namtrikAudio?: string | null;
      espanolTermino?: string;
      espanolDescripcion?: string | null;
      espanolAudio?: string | null;
      imagen?: string | null;
      posicion?: number;
      ultimoEditorId: bigint;
      ultimoEditorAt: Date;
    } = {
      ultimoEditorId: actor.userId,
      ultimoEditorAt: new Date(),
    };
    if (normNamtrik !== undefined) updateData.namtrikTermino = normNamtrik;
    if (dto.namtrikDescripcion !== undefined)
      updateData.namtrikDescripcion = dto.namtrikDescripcion;
    if (dto.namtrikAudio !== undefined) updateData.namtrikAudio = dto.namtrikAudio;
    if (dto.espanolTermino !== undefined) updateData.espanolTermino = dto.espanolTermino;
    if (dto.espanolDescripcion !== undefined)
      updateData.espanolDescripcion = dto.espanolDescripcion;
    if (dto.espanolAudio !== undefined) updateData.espanolAudio = dto.espanolAudio;
    if (dto.imagen !== undefined) updateData.imagen = dto.imagen;
    if (dto.posicion !== undefined) updateData.posicion = dto.posicion;

    const updated = await this.prisma.microcampo.update({
      where: { id: microcampoId },
      data: updateData,
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'update',
      entity: 'microcampo',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { codigo: updated.codigo },
    });

    return updated;
  }

  async eliminarMicrocampo(id: string, actor: ActorAuditoria) {
    const microcampoId = BigInt(id);
    const existing = await this.prisma.microcampo.findUnique({
      where: { id: microcampoId },
      include: {
        subniveles: { where: { deletedAt: null }, select: { id: true } },
        sentidosUbicacion: { select: { id: true } },
        palabrasM1: { select: { palabraId: true } },
        palabrasM2: { select: { palabraId: true } },
      },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    if (existing.subniveles.length > 0) {
      throw new AppError(
        `No es posible eliminar el microcampo "${existing.codigo}": contiene ${existing.subniveles.length} subniveles activos. Elimine o reubique los subniveles primero.`,
        409,
      );
    }

    const totalTerminos =
      existing.sentidosUbicacion.length + existing.palabrasM1.length + existing.palabrasM2.length;

    if (totalTerminos > 0) {
      throw new AppError(
        `No es posible eliminar el microcampo "${existing.codigo}": contiene ${totalTerminos} términos léxicos asociados.`,
        409,
      );
    }

    await this.prisma.microcampo.update({
      where: { id: microcampoId },
      data: {
        deletedAt: new Date(),
        ultimoEditorId: actor.userId,
        ultimoEditorAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'delete',
      entity: 'microcampo',
      entityId: id,
      oldData: { codigo: existing.codigo },
      newData: { deletedAt: new Date() },
    });

    return { success: true, message: `Microcampo ${existing.codigo} eliminado correctamente` };
  }
}
