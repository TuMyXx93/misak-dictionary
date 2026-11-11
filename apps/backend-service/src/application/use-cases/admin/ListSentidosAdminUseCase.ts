/**
 * ListSentidosAdminUseCase
 * Spec 006 (R-006) - Consulta paginada y filtrable de sentidos léxicos para administración.
 */

import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { normalizeNamtrikEsQuery } from '../../../infrastructure/repositories/PalabraRepository.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import type { ListSentidosAdminQuery } from '../../dtos/AdminSentidoDto.js';

export interface SentidoAdminItem {
  id: string;
  codigo: string;
  tipo: string;
  estado: string;
  version: number;
  espanolGlosa: string;
  espanolExplicacion: string | null;
  namtrikContexto: string | null;
  nombreCientifico: string | null;
  observacionEditorial: string | null;
  respuestaNamtrik: string | null;
  respuestaNamtrikContexto: string | null;
  respuestaEspanolGlosa: string | null;
  respuestaEspanolExplicacion: string | null;
  formas: Array<{
    id: string;
    orden: number;
    lema: string;
    acepcionHomonima: number | null;
    categoriaGramatical: string | null;
    variante: string | null;
    esNeologismo: boolean;
    rasgosGramaticales: string[];
    etiquetaOriginal: string | null;
  }>;
  ubicacion: {
    nivel: 'campo' | 'subcampo' | 'microcampo';
    id: string;
    codigo: string;
    termino: string;
  } | null;
  ultimoEditor: {
    id: string;
    username: string;
  } | null;
  ultimoEditorAt: Date | null;
  ratificadoPor: {
    id: string;
    username: string;
  } | null;
  ratificadoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSentidosAdminResult {
  items: SentidoAdminItem[];
  nextCursor: string | null;
}

export class ListSentidosAdminUseCase {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async execute(query: ListSentidosAdminQuery): Promise<ListSentidosAdminResult> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where: Prisma.SentidoLexicoWhereInput = {
      deletedAt: null,
    };

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.categoriaGramatical && query.categoriaGramatical.trim().length > 0) {
      where.formas = {
        some: {
          categoriaGramatical: {
            equals: query.categoriaGramatical.trim(),
            mode: 'insensitive',
          },
        },
      };
    }

    if (query.conNombreCientifico === 'true') {
      where.nombreCientifico = { not: null };
    } else if (query.conNombreCientifico === 'false') {
      where.nombreCientifico = null;
    }

    let matchingIds: bigint[] | null = null;
    if (query.q && query.q.trim().length > 0) {
      const termino = query.q.trim();
      const normTerm = normalizeNamtrikEsQuery(termino);
      const isSingle = normTerm.length <= 1;

      if (typeof this.prisma.$queryRaw === 'function') {
        try {
          const idRows = await this.prisma.$queryRaw<{ id: bigint }[]>`
            WITH matches AS (
              SELECT
                s.id,
                CASE
                  WHEN public.immutable_normalize_namtrik_es(f.lema) = public.immutable_normalize_namtrik_es(${termino}) THEN 1
                  WHEN public.immutable_normalize_namtrik_es(s.espanol_glosa) = public.immutable_normalize_namtrik_es(${termino}) THEN 2
                  WHEN public.immutable_normalize_namtrik_es(f.lema) LIKE (public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 3
                  WHEN public.immutable_normalize_namtrik_es(s.espanol_glosa) LIKE (public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 4
                  WHEN public.immutable_normalize_namtrik_es(COALESCE(s.nombre_cientifico, '')) LIKE (public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 4
                  WHEN public.immutable_normalize_namtrik_es(f.lema) LIKE ('%' || public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 5
                  WHEN public.immutable_normalize_namtrik_es(s.espanol_glosa) LIKE ('%' || public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 5
                  WHEN public.immutable_normalize_namtrik_es(COALESCE(s.nombre_cientifico, '')) LIKE ('%' || public.immutable_normalize_namtrik_es(${termino}) || '%') THEN 5
                  WHEN NOT ${isSingle} AND similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${termino})) >= 0.3 THEN 6
                  WHEN NOT ${isSingle} AND similarity(public.immutable_normalize_namtrik_es(s.espanol_glosa), public.immutable_normalize_namtrik_es(${termino})) >= 0.3 THEN 6
                  ELSE 99
                END AS match_rank,
                GREATEST(
                  similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${termino})),
                  similarity(public.immutable_normalize_namtrik_es(s.espanol_glosa), public.immutable_normalize_namtrik_es(${termino}))
                ) AS sim_score
              FROM sentidos_lexicos s
              LEFT JOIN formas_namtrik f ON f.sentido_id = s.id
              WHERE s.deleted_at IS NULL
            ),
            best_matches AS (
              SELECT id, MIN(match_rank) AS min_rank, MAX(sim_score) AS max_sim
              FROM matches
              WHERE match_rank < 99
              GROUP BY id
            )
            SELECT id
            FROM best_matches
            ORDER BY min_rank ASC, max_sim DESC
            LIMIT 200;
          `;
          if (Array.isArray(idRows)) {
            matchingIds = idRows.map((r) => r.id);
          }
        } catch (_err) {
          matchingIds = null;
        }
      }

      if (matchingIds !== null) {
        if (matchingIds.length === 0) {
          return { items: [], nextCursor: null };
        }
        where.id = { in: matchingIds };
      } else {
        where.OR = [
          { espanolGlosa: { contains: termino, mode: 'insensitive' } },
          { formas: { some: { lema: { contains: termino, mode: 'insensitive' } } } },
          { nombreCientifico: { contains: termino, mode: 'insensitive' } },
        ];
        if (/[ɵƟøØ∅oO]/i.test(termino)) {
          const qNormO = termino.replace(/[ɵøəɔ]/gi, 'o');
          const qNormTheta = termino.replace(/[oøəɔ]/gi, 'ɵ');
          if (qNormO !== termino) {
            where.OR.push({ espanolGlosa: { contains: qNormO, mode: 'insensitive' } });
            where.OR.push({
              formas: { some: { lema: { contains: qNormO, mode: 'insensitive' } } },
            });
          }
          if (qNormTheta !== termino) {
            where.OR.push({
              formas: { some: { lema: { contains: qNormTheta, mode: 'insensitive' } } },
            });
          }
        }
      }
    }

    if (query.nodo && query.nodo.trim().length > 0) {
      const nodoCondition = await this.resolverCondicionNodo(query.nodo.trim());
      if (!nodoCondition) {
        return { items: [], nextCursor: null };
      }
      where.ubicaciones = { some: nodoCondition };
    }

    if (query.cursor) {
      try {
        const cursorId = BigInt(query.cursor);
        where.id = { lt: cursorId };
      } catch {
        // Si el cursor no es un BigInt válido, se ignora
      }
    }

    const registros = await this.prisma.sentidoLexico.findMany({
      where,
      include: {
        formas: { orderBy: { orden: 'asc' } },
        ubicaciones: {
          include: {
            campo: { select: { id: true, codigo: true, espanolTermino: true } },
            subcampo: { select: { id: true, codigo: true, espanolTermino: true } },
            microcampo: { select: { id: true, codigo: true, espanolTermino: true } },
          },
        },
        ultimoEditor: { select: { id: true, username: true } },
        ratificadoPorUser: { select: { id: true, username: true } },
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = registros.length > limit;
    let itemsParaRetornar = hasMore ? registros.slice(0, limit) : registros;

    if (matchingIds !== null && matchingIds.length > 0) {
      const orderMap = new Map(matchingIds.map((id, index) => [id.toString(), index]));
      itemsParaRetornar = [...itemsParaRetornar].sort((a, b) => {
        const orderA = orderMap.get(a.id.toString()) ?? 9999;
        const orderB = orderMap.get(b.id.toString()) ?? 9999;
        return orderA - orderB;
      });
    }

    const ultimoSentido = itemsParaRetornar[itemsParaRetornar.length - 1];
    const nextCursor = hasMore && ultimoSentido ? ultimoSentido.id.toString() : null;

    const items: SentidoAdminItem[] = itemsParaRetornar.map((s) => {
      let ubicacion: SentidoAdminItem['ubicacion'] = null;
      const ub = s.ubicaciones[0];
      if (ub) {
        if (ub.campo) {
          ubicacion = {
            nivel: 'campo',
            id: ub.campo.id.toString(),
            codigo: ub.campo.codigo,
            termino: ub.campo.espanolTermino,
          };
        } else if (ub.subcampo) {
          ubicacion = {
            nivel: 'subcampo',
            id: ub.subcampo.id.toString(),
            codigo: ub.subcampo.codigo,
            termino: ub.subcampo.espanolTermino,
          };
        } else if (ub.microcampo) {
          ubicacion = {
            nivel: 'microcampo',
            id: ub.microcampo.id.toString(),
            codigo: ub.microcampo.codigo,
            termino: ub.microcampo.espanolTermino,
          };
        }
      }

      return {
        id: s.id.toString(),
        codigo: s.codigo,
        tipo: s.tipo,
        estado: s.estado,
        version: s.version,
        espanolGlosa: s.espanolGlosa,
        espanolExplicacion: s.espanolExplicacion,
        namtrikContexto: s.namtrikContexto,
        nombreCientifico: s.nombreCientifico,
        observacionEditorial: s.observacionEditorial,
        respuestaNamtrik: s.respuestaNamtrik,
        respuestaNamtrikContexto: s.respuestaNamtrikContexto,
        respuestaEspanolGlosa: s.respuestaEspanolGlosa,
        respuestaEspanolExplicacion: s.respuestaEspanolExplicacion,
        formas: s.formas.map((f) => ({
          id: f.id.toString(),
          orden: f.orden,
          lema: f.lema,
          acepcionHomonima: f.acepcionHomonima,
          categoriaGramatical: f.categoriaGramatical,
          variante: f.variante,
          esNeologismo: f.esNeologismo,
          rasgosGramaticales: f.rasgosGramaticales,
          etiquetaOriginal: f.etiquetaOriginal,
        })),
        ubicacion,
        ultimoEditor: s.ultimoEditor
          ? {
              id: s.ultimoEditor.id.toString(),
              username: s.ultimoEditor.username,
            }
          : null,
        ultimoEditorAt: s.ultimoEditorAt,
        ratificadoPor: s.ratificadoPorUser
          ? {
              id: s.ratificadoPorUser.id.toString(),
              username: s.ratificadoPorUser.username,
            }
          : null,
        ratificadoAt: s.ratificadoAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
    };
  }

  private async resolverCondicionNodo(
    codigo: string,
  ): Promise<Prisma.SentidoUbicacionWhereInput | null> {
    // 1. Probar Campo
    const campo = await this.prisma.campoSemantico.findFirst({
      where: { codigo, deletedAt: null },
      select: { id: true },
    });

    if (campo) {
      const subcampos = await this.prisma.subcampoSemantico.findMany({
        where: { campoSemanticoId: campo.id, deletedAt: null },
        select: { id: true },
      });
      const subcampoIds = subcampos.map((s) => s.id);

      const microcampos =
        subcampoIds.length > 0
          ? await this.prisma.microcampo.findMany({
              where: { subcampoSemanticoId: { in: subcampoIds }, deletedAt: null },
              select: { id: true },
            })
          : [];
      const microcampoIds = microcampos.map((m) => m.id);

      return {
        OR: [
          { campoSemanticoId: campo.id },
          ...(subcampoIds.length > 0 ? [{ subcampoSemanticoId: { in: subcampoIds } }] : []),
          ...(microcampoIds.length > 0 ? [{ microcampoId: { in: microcampoIds } }] : []),
        ],
      };
    }

    // 2. Probar Subcampo
    const subcampo = await this.prisma.subcampoSemantico.findFirst({
      where: { codigo, deletedAt: null },
      select: { id: true },
    });

    if (subcampo) {
      const microcampos = await this.prisma.microcampo.findMany({
        where: { subcampoSemanticoId: subcampo.id, deletedAt: null },
        select: { id: true },
      });
      const microcampoIds = microcampos.map((m) => m.id);

      return {
        OR: [
          { subcampoSemanticoId: subcampo.id },
          ...(microcampoIds.length > 0 ? [{ microcampoId: { in: microcampoIds } }] : []),
        ],
      };
    }

    // 3. Probar Microcampo
    const microcampo = await this.prisma.microcampo.findFirst({
      where: { codigo, deletedAt: null },
      select: { id: true, subcampoSemanticoId: true },
    });

    if (microcampo) {
      // Obtener todos los microcampos del subcampo para resolver el subárbol
      const todosMicrocampos = await this.prisma.microcampo.findMany({
        where: { subcampoSemanticoId: microcampo.subcampoSemanticoId, deletedAt: null },
        select: { id: true, padreId: true },
      });

      const descendientesIds = new Set<bigint>([microcampo.id]);
      let agregado = true;
      while (agregado) {
        agregado = false;
        for (const m of todosMicrocampos) {
          if (
            m.padreId !== null &&
            descendientesIds.has(m.padreId) &&
            !descendientesIds.has(m.id)
          ) {
            descendientesIds.add(m.id);
            agregado = true;
          }
        }
      }

      return {
        microcampoId: { in: Array.from(descendientesIds) },
      };
    }

    return null;
  }

  async findById(id: bigint): Promise<SentidoAdminItem | null> {
    const s = await this.prisma.sentidoLexico.findFirst({
      where: { id, deletedAt: null },
      include: {
        formas: { orderBy: { orden: 'asc' } },
        ubicaciones: {
          include: {
            campo: { select: { id: true, codigo: true, espanolTermino: true } },
            subcampo: { select: { id: true, codigo: true, espanolTermino: true } },
            microcampo: { select: { id: true, codigo: true, espanolTermino: true } },
          },
        },
        ultimoEditor: { select: { id: true, username: true } },
        ratificadoPorUser: { select: { id: true, username: true } },
      },
    });

    if (!s) return null;

    let ubicacion: SentidoAdminItem['ubicacion'] = null;
    const ub = s.ubicaciones[0];
    if (ub) {
      if (ub.campo) {
        ubicacion = {
          nivel: 'campo',
          id: ub.campo.id.toString(),
          codigo: ub.campo.codigo,
          termino: ub.campo.espanolTermino,
        };
      } else if (ub.subcampo) {
        ubicacion = {
          nivel: 'subcampo',
          id: ub.subcampo.id.toString(),
          codigo: ub.subcampo.codigo,
          termino: ub.subcampo.espanolTermino,
        };
      } else if (ub.microcampo) {
        ubicacion = {
          nivel: 'microcampo',
          id: ub.microcampo.id.toString(),
          codigo: ub.microcampo.codigo,
          termino: ub.microcampo.espanolTermino,
        };
      }
    }

    return {
      id: s.id.toString(),
      codigo: s.codigo,
      tipo: s.tipo,
      estado: s.estado,
      version: s.version,
      espanolGlosa: s.espanolGlosa,
      espanolExplicacion: s.espanolExplicacion,
      namtrikContexto: s.namtrikContexto,
      nombreCientifico: s.nombreCientifico,
      observacionEditorial: s.observacionEditorial,
      respuestaNamtrik: s.respuestaNamtrik,
      respuestaNamtrikContexto: s.respuestaNamtrikContexto,
      respuestaEspanolGlosa: s.respuestaEspanolGlosa,
      respuestaEspanolExplicacion: s.respuestaEspanolExplicacion,
      formas: s.formas.map((f) => ({
        id: f.id.toString(),
        orden: f.orden,
        lema: f.lema,
        acepcionHomonima: f.acepcionHomonima,
        categoriaGramatical: f.categoriaGramatical,
        variante: f.variante,
        esNeologismo: f.esNeologismo,
        rasgosGramaticales: f.rasgosGramaticales,
        etiquetaOriginal: f.etiquetaOriginal,
      })),
      ubicacion,
      ultimoEditor: s.ultimoEditor
        ? {
            id: s.ultimoEditor.id.toString(),
            username: s.ultimoEditor.username,
          }
        : null,
      ultimoEditorAt: s.ultimoEditorAt,
      ratificadoPor: s.ratificadoPorUser
        ? {
            id: s.ratificadoPorUser.id.toString(),
            username: s.ratificadoPorUser.username,
          }
        : null,
      ratificadoAt: s.ratificadoAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
