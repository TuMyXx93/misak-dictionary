/**
 * ManageAbreviaturasUseCase
 * Spec 012 v0.2.0 (R-012, R-017)
 * Gestión integral del catálogo de abreviaturas lingüísticas:
 * consulta pública, CRUD administrativo seguro con control de integridad referencial.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { DimensionAbreviatura } from '../../../shared/lexicon/abreviaturas.js';

export interface AbreviaturaAdminItem {
  id: string;
  codigo: string;
  etiquetaCompleta: string;
  descripcion: string | null;
  dimension: DimensionAbreviatura;
  orden: number;
  activo: boolean;
  usosCount: number;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAbreviaturaDTO {
  codigo: string;
  etiquetaCompleta: string;
  descripcion?: string | null;
  dimension?: DimensionAbreviatura;
  orden?: number;
  activo?: boolean;
}

export interface UpdateAbreviaturaDTO {
  codigo?: string;
  etiquetaCompleta?: string;
  descripcion?: string | null;
  dimension?: DimensionAbreviatura;
  orden?: number;
  activo?: boolean;
}

export interface ActorAuditoria {
  userId: bigint;
  username: string;
}

export class ManageAbreviaturasUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  /**
   * Catálogo público activo ordenado para tooltips y selectores en frontend.
   */
  async listarPublicas() {
    const list = await this.prisma.abreviaturaGramatical.findMany({
      where: { activo: true },
      orderBy: [{ dimension: 'asc' }, { orden: 'asc' }, { codigo: 'asc' }],
    });

    return list.map((a) => ({
      id: a.id.toString(),
      codigo: a.codigo,
      etiquetaCompleta: a.etiquetaCompleta,
      descripcion: a.descripcion,
      dimension: a.dimension as DimensionAbreviatura,
      orden: a.orden,
    }));
  }

  /**
   * Listado administrativo con conteo exacto de usos en formas léxicas.
   */
  async listarAdmin(params?: { dimension?: string; q?: string }): Promise<AbreviaturaAdminItem[]> {
    interface RawAbrevRow {
      id: bigint;
      codigo: string;
      etiqueta_completa: string;
      descripcion: string | null;
      dimension: string;
      orden: number;
      activo: boolean;
      created_at: Date;
      updated_at: Date;
      usos_count: bigint;
    }

    const rows = await this.prisma.$queryRaw<RawAbrevRow[]>`
      SELECT
        a.id,
        a.codigo,
        a.etiqueta_completa,
        a.descripcion,
        a.dimension,
        a.orden,
        a.activo,
        a.created_at,
        a.updated_at,
        (
          SELECT count(*)
          FROM formas_namtrik f
          WHERE f.categoria_gramatical = a.codigo
             OR a.codigo = ANY(f.rasgos_gramaticales)
        ) AS usos_count
      FROM abreviaturas_gramaticales a
      WHERE (${params?.dimension ?? null}::text IS NULL OR a.dimension = ${params?.dimension ?? null})
        AND (${params?.q ?? null}::text IS NULL
             OR a.codigo ILIKE ('%' || ${params?.q ?? ''} || '%')
             OR a.etiqueta_completa ILIKE ('%' || ${params?.q ?? ''} || '%')
             OR coalesce(a.descripcion, '') ILIKE ('%' || ${params?.q ?? ''} || '%'))
      ORDER BY a.dimension ASC, a.orden ASC, a.codigo ASC;
    `;

    return rows.map((r) => {
      const usos = Number(r.usos_count ?? 0);
      return {
        id: r.id.toString(),
        codigo: r.codigo,
        etiquetaCompleta: r.etiqueta_completa,
        descripcion: r.descripcion,
        dimension: r.dimension as DimensionAbreviatura,
        orden: r.orden,
        activo: r.activo,
        usosCount: usos,
        canDelete: usos === 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  /**
   * Crear nueva abreviatura.
   */
  async crear(dto: CreateAbreviaturaDTO, actor: ActorAuditoria): Promise<AbreviaturaAdminItem> {
    const cleanCodigo = dto.codigo.trim();
    if (!cleanCodigo) {
      throw new AppError('El código de la abreviatura es obligatorio', 400);
    }
    const cleanEtiqueta = dto.etiquetaCompleta.trim();
    if (!cleanEtiqueta) {
      throw new AppError('La etiqueta completa de la abreviatura es obligatoria', 400);
    }

    const existente = await this.prisma.abreviaturaGramatical.findUnique({
      where: { codigo: cleanCodigo },
    });
    if (existente) {
      throw new AppError(`Ya existe una abreviatura con el código "${cleanCodigo}"`, 409);
    }

    const created = await this.prisma.abreviaturaGramatical.create({
      data: {
        codigo: cleanCodigo,
        etiquetaCompleta: cleanEtiqueta,
        descripcion: dto.descripcion?.trim() ?? null,
        dimension: dto.dimension ?? 'categoria',
        orden: dto.orden ?? 99,
        activo: dto.activo ?? true,
      },
    });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'create',
      entity: 'abreviatura',
      entityId: created.id.toString(),
      newData: {
        codigo: created.codigo,
        etiquetaCompleta: created.etiquetaCompleta,
        dimension: created.dimension,
      },
    });

    return {
      id: created.id.toString(),
      codigo: created.codigo,
      etiquetaCompleta: created.etiquetaCompleta,
      descripcion: created.descripcion,
      dimension: created.dimension as DimensionAbreviatura,
      orden: created.orden,
      activo: created.activo,
      usosCount: 0,
      canDelete: true,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Actualizar abreviatura con propagación en cascada si cambia el código.
   */
  async actualizar(
    id: bigint,
    dto: UpdateAbreviaturaDTO,
    actor: ActorAuditoria,
  ): Promise<AbreviaturaAdminItem> {
    const actual = await this.prisma.abreviaturaGramatical.findUnique({ where: { id } });
    if (!actual) {
      throw new AppError('Abreviatura no encontrada', 404);
    }

    const nuevoCodigo = dto.codigo ? dto.codigo.trim() : actual.codigo;
    if (nuevoCodigo !== actual.codigo) {
      const colision = await this.prisma.abreviaturaGramatical.findUnique({
        where: { codigo: nuevoCodigo },
      });
      if (colision && colision.id !== id) {
        throw new AppError(`Ya existe otra abreviatura con el código "${nuevoCodigo}"`, 409);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Si cambia el código, actualizar las formas léxicas asociadas
      if (nuevoCodigo !== actual.codigo) {
        await tx.formaNamtrik.updateMany({
          where: { categoriaGramatical: actual.codigo },
          data: { categoriaGramatical: nuevoCodigo },
        });

        // Actualizar en rasgos_gramaticales (array)
        await tx.$executeRaw`
          UPDATE formas_namtrik
          SET rasgos_gramaticales = array_replace(rasgos_gramaticales, ${actual.codigo}, ${nuevoCodigo})
          WHERE ${actual.codigo} = ANY(rasgos_gramaticales);
        `;
      }

      const updated = await tx.abreviaturaGramatical.update({
        where: { id },
        data: {
          codigo: nuevoCodigo,
          etiquetaCompleta: dto.etiquetaCompleta?.trim() ?? actual.etiquetaCompleta,
          descripcion:
            dto.descripcion !== undefined ? (dto.descripcion?.trim() ?? null) : actual.descripcion,
          dimension: dto.dimension ?? actual.dimension,
          orden: dto.orden !== undefined ? dto.orden : actual.orden,
          activo: dto.activo !== undefined ? dto.activo : actual.activo,
        },
      });

      const usosCount = await tx.formaNamtrik.count({
        where: {
          OR: [
            { categoriaGramatical: updated.codigo },
            { rasgosGramaticales: { has: updated.codigo } },
          ],
        },
      });

      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'update',
        entity: 'abreviatura',
        entityId: id.toString(),
        oldData: {
          codigo: actual.codigo,
          etiquetaCompleta: actual.etiquetaCompleta,
          dimension: actual.dimension,
        },
        newData: {
          codigo: updated.codigo,
          etiquetaCompleta: updated.etiquetaCompleta,
          dimension: updated.dimension,
        },
      });

      return {
        id: updated.id.toString(),
        codigo: updated.codigo,
        etiquetaCompleta: updated.etiquetaCompleta,
        descripcion: updated.descripcion,
        dimension: updated.dimension as DimensionAbreviatura,
        orden: updated.orden,
        activo: updated.activo,
        usosCount,
        canDelete: usosCount === 0,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    });
  }

  /**
   * Eliminar abreviatura con verificación estricta de no-uso.
   */
  async eliminar(id: bigint, actor: ActorAuditoria): Promise<void> {
    const actual = await this.prisma.abreviaturaGramatical.findUnique({ where: { id } });
    if (!actual) {
      throw new AppError('Abreviatura no encontrada', 404);
    }

    const usos = await this.prisma.formaNamtrik.count({
      where: {
        OR: [
          { categoriaGramatical: actual.codigo },
          { rasgosGramaticales: { has: actual.codigo } },
        ],
      },
    });

    if (usos > 0) {
      throw new AppError(
        `No se puede eliminar la abreviatura "${actual.codigo}": está en uso por ${usos} forma(s) léxica(s) activa(s). Para eliminarla, reasigne primero las formas que la utilizan o desactívela.`,
        409,
      );
    }

    await this.prisma.abreviaturaGramatical.delete({ where: { id } });

    await this.auditService.record({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: 'delete',
      entity: 'abreviatura',
      entityId: id.toString(),
      oldData: {
        codigo: actual.codigo,
        etiquetaCompleta: actual.etiquetaCompleta,
      },
    });
  }
}
