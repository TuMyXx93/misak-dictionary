/**
 * PalabraRepository
 * Spec 003 — Diccionario API: Repositorio para palabras modelo 1 y modelo 2
 * Spec 006 — Modo dual: Búsqueda unificada sobre Modelo 1 y sentidos_lexicos
 * Spec 009 — Enmienda 0.2.0: Búsqueda bilingüe vectorizada multi-nivel con ranking Misak
 */

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../shared/config/prisma.js';
import { SystemSettingsService } from '../../shared/settings/SystemSettingsService.js';
import { mapearMedioPublico } from './CampoSemanticoRepository.js';

export interface SearchParams {
  query?: string;
  microcampoId?: bigint;
  page?: number;
  limit?: number;
  orderBy?: 'namtrik' | 'espanol' | 'recent';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RawWordResult {
  id: bigint;
  namtrik_termino: string;
  espanol_termino: string;
  namtrik_descripcion: string | null;
  espanol_descripcion: string | null;
  namtrik_audio: string | null;
  espanol_audio: string | null;
  imagen: string | null;
  rank?: number;
  codigo?: string | null;
  estado?: string | null;
  coincidencia?: 'exacta' | 'prefijo' | 'aproximada';
  namtrikTermino?: string;
  espanolTermino?: string;
  categoriaGramatical?: string | null;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  ubicacion?:
    | {
        campoSlug: string;
        campoNombre: string;
        subcampoSlug?: string | undefined;
        subcampoNombre?: string | undefined;
        microcampoSlug?: string | undefined;
        microcampoNombre?: string | undefined;
        ruta: string;
      }
    | null
    | undefined;
  medios?: unknown[];
  microcampos?: unknown[];
}

export class PalabraRepository {
  private prisma: PrismaClient;
  private settingsService: SystemSettingsService;

  constructor(prismaClient?: PrismaClient, settingsService?: SystemSettingsService) {
    this.prisma = prismaClient || defaultPrisma;
    this.settingsService = settingsService || new SystemSettingsService(this.prisma);
  }

  /**
   * Búsqueda bilingüe de palabras y sentidos léxicos con paginación
   */
  async searchModelo1(params: SearchParams): Promise<PaginatedResult<RawWordResult>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where clause para Modelo 1
    const where: Prisma.PalabraModelo1WhereInput = {
      deletedAt: null,
    };

    if (params.microcampoId) {
      where.microcampos = {
        some: {
          microcampoId: params.microcampoId,
        },
      };
    }

    if (params.query) {
      const cleanQuery = params.query.trim();
      if (!cleanQuery) {
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }

      // 1. Intentar búsqueda en palabras_modelo_1 (spec 003 y tests unitarios)
      let words: RawWordResult[] = [];
      let total: [{ count: bigint }] = [{ count: BigInt(0) }];
      try {
        words = await this.prisma.$queryRaw<RawWordResult[]>`
          SELECT id, namtrik_termino, espanol_termino,
                 namtrik_descripcion, espanol_descripcion,
                 namtrik_audio, espanol_audio, imagen,
                 ts_rank(
                   to_tsvector('spanish', immutable_unaccent(
                     coalesce(namtrik_termino, '') || ' ' ||
                     coalesce(espanol_termino, '') || ' ' ||
                     coalesce(espanol_descripcion, '')
                   )),
                   plainto_tsquery('spanish', immutable_unaccent(${cleanQuery}))
                 ) as rank
          FROM palabras_modelo_1
          WHERE to_tsvector('spanish', immutable_unaccent(
                  coalesce(namtrik_termino, '') || ' ' ||
                  coalesce(espanol_termino, '') || ' ' ||
                  coalesce(espanol_descripcion, '')
                )) @@ plainto_tsquery('spanish', immutable_unaccent(${cleanQuery}))
            AND deleted_at IS NULL
          ORDER BY rank DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;

        total = await this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM palabras_modelo_1
          WHERE to_tsvector('spanish', immutable_unaccent(
                  coalesce(namtrik_termino, '') || ' ' ||
                  coalesce(espanol_termino, '') || ' ' ||
                  coalesce(espanol_descripcion, '')
                )) @@ plainto_tsquery('spanish', immutable_unaccent(${cleanQuery}))
            AND deleted_at IS NULL
        `;
      } catch (_err) {
        words = [];
        total = [{ count: BigInt(0) }];
      }

      const totalCount = Number(total?.[0]?.count ?? 0);
      if (totalCount > 0 && words.length > 0) {
        return {
          data: words,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      }

      // 2. Si palabras_modelo_1 no arroja resultados, buscar en sentidos_lexicos (Modelo 2 canónico)
      if (this.prisma.sentidoLexico) {
        const onlyRatified = await this.settingsService.getPublicOnlyRatified();
        const medioWhere = onlyRatified
          ? { deletedAt: null, estado: 'ratificado' }
          : { deletedAt: null };
        const mediosInclude = {
          where: medioWhere,
          orderBy: { createdAt: 'asc' as const },
        };

        // Búsqueda bilingüe vectorizada multi-nivel con ranking Misak (Spec 009 Enmienda 0.2.0)
        interface RankedSentidoRow {
          sentido_id: bigint;
          best_nivel: number;
          max_sim: number;
          total_count: bigint;
        }

        let rankedRows: RankedSentidoRow[] = [];
        try {
          const res = await this.prisma.$queryRaw<RankedSentidoRow[]>`
            WITH matched_forms AS (
              SELECT
                s.id AS sentido_id,
                s.codigo,
                f.lema,
                s.espanol_glosa,
                CASE
                  WHEN public.immutable_normalize_namtrik_es(f.lema) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                  WHEN public.immutable_normalize_namtrik_es(f.lema) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                  WHEN public.immutable_normalize_namtrik_es(f.lema) ~ ('\m' || public.immutable_normalize_namtrik_es(${cleanQuery})) THEN 3
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                  WHEN public.immutable_normalize_namtrik_es(s.espanol_glosa) ~ ('\m' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '\M') THEN 5
                  WHEN similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  WHEN similarity(public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  WHEN length(public.immutable_normalize_namtrik_es(${cleanQuery})) >= 4
                       AND to_tsvector('spanish', public.immutable_normalize_namtrik_es(coalesce(s.espanol_explicacion, '') || ' ' || coalesce(s.namtrik_contexto, '')))
                           @@ plainto_tsquery('spanish', public.immutable_normalize_namtrik_es(${cleanQuery})) THEN 7
                  ELSE 99
                END AS nivel,
                GREATEST(
                  similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${cleanQuery})),
                  similarity(public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)), public.immutable_normalize_namtrik_es(${cleanQuery}))
                ) AS sim,
                public.misak_sort_key(f.lema) AS sort_key
              FROM sentidos_lexicos s
              JOIN formas_namtrik f ON f.sentido_id = s.id
              WHERE s.deleted_at IS NULL
                AND (${onlyRatified} = false OR s.estado = 'ratificado')
            ),
            ranked_sentidos AS (
              SELECT
                sentido_id,
                MIN(nivel) AS best_nivel,
                MAX(sim) AS max_sim,
                MIN(sort_key) AS min_sort_key
              FROM matched_forms
              WHERE nivel < 99
              GROUP BY sentido_id
            )
            SELECT
              sentido_id,
              best_nivel,
              max_sim,
              COUNT(*) OVER() AS total_count
            FROM ranked_sentidos
            ORDER BY
              best_nivel ASC,
              max_sim DESC,
              min_sort_key ASC
            LIMIT ${limit}
            OFFSET ${skip};
          `;
          rankedRows = Array.isArray(res) ? res : [];
        } catch (_err) {
          rankedRows = [];
        }

        if (rankedRows.length > 0 && rankedRows[0]?.sentido_id !== undefined) {
          const ids = rankedRows.map((r) => r.sentido_id as bigint);
          const nivelMap = new Map(
            rankedRows.map((r) => [r.sentido_id?.toString() ?? '', r.best_nivel ?? 99]),
          );
          const totalSentidos = Number(rankedRows[0]?.total_count || 0);

          const sentidos = await this.prisma.sentidoLexico.findMany({
            where: { id: { in: ids } },
            include: {
              formas: {
                orderBy: { orden: 'asc' },
                include: { medios: mediosInclude },
              },
              medios: mediosInclude,
              ubicaciones: {
                include: {
                  campo: true,
                  subcampo: { include: { campoSemantico: true } },
                  microcampo: {
                    include: {
                      subcampoSemantico: { include: { campoSemantico: true } },
                    },
                  },
                },
              },
            },
          });

          const sentidoMap = new Map(sentidos.map((s) => [s.id.toString(), s]));
          const sortedSentidos = ids
            .map((id) => sentidoMap.get(id.toString()))
            .filter((s): s is NonNullable<typeof s> => Boolean(s));

          const mappedWords = sortedSentidos.map((s) => {
            const nivel = nivelMap.get(s.id.toString()) ?? 99;
            const coincidencia: 'exacta' | 'prefijo' | 'aproximada' =
              nivel <= 2 ? 'exacta' : nivel <= 4 ? 'prefijo' : 'aproximada';

            const ub = s.ubicaciones?.[0];
            const micro = ub?.microcampo;
            const sub = ub?.subcampo ?? micro?.subcampoSemantico;
            const campo = ub?.campo ?? sub?.campoSemantico;

            const campoSlug = campo?.slug ?? '';
            const campoNombre = campo?.namtrikTermino ?? campo?.espanolTermino ?? '';
            const subcampoSlug = sub?.slug ?? undefined;
            const subcampoNombre = sub?.namtrikTermino ?? sub?.espanolTermino ?? undefined;
            const microcampoSlug = micro?.slug ?? undefined;
            const microcampoNombre = micro?.namtrikTermino ?? micro?.espanolTermino ?? undefined;

            let ruta = '/campos';
            if (campoSlug) {
              if (microcampoSlug && subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}/${microcampoSlug}#term-${s.id}`;
              } else if (subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}#term-${s.id}`;
              } else {
                ruta = `/campos/${campoSlug}#term-${s.id}`;
              }
            }

            const ubicacion = campoSlug
              ? {
                  campoSlug,
                  campoNombre,
                  subcampoSlug,
                  subcampoNombre,
                  microcampoSlug,
                  microcampoNombre,
                  ruta,
                }
              : null;

            const mediosRaw = [...(s.medios ?? []), ...s.formas.flatMap((f) => f.medios ?? [])];
            const seenUuids = new Set<string>();
            const medios = mediosRaw
              .filter((m) => {
                if (seenUuids.has(m.uuid)) return false;
                seenUuids.add(m.uuid);
                return true;
              })
              .map(mapearMedioPublico);

            const lemaTexto = s.formas.map((f) => f.lema).join(', ');
            const categoria = s.formas[0]?.categoriaGramatical ?? null;

            return {
              id: s.id,
              codigo: s.codigo,
              estado: s.estado,
              coincidencia,
              namtrikTermino: lemaTexto,
              espanolTermino: s.espanolGlosa,
              categoriaGramatical: categoria,
              namtrikDescripcion: s.namtrikContexto,
              espanolDescripcion: s.espanolExplicacion,
              ubicacion,
              namtrik_termino: lemaTexto,
              espanol_termino: s.espanolGlosa,
              categoria_gramatical: categoria,
              namtrik_descripcion: s.namtrikContexto,
              espanol_descripcion: s.espanolExplicacion,
              namtrik_audio: null,
              espanol_audio: null,
              imagen: null,
              medios,
              microcampos: micro
                ? [
                    {
                      microcampoId: micro.id,
                      microcampo: {
                        id: micro.id,
                        slug: micro.slug,
                        namtrikTermino: micro.namtrikTermino,
                        subcampoSemantico: sub
                          ? {
                              id: sub.id,
                              slug: sub.slug,
                              namtrikTermino: sub.namtrikTermino,
                              campoSemantico: campo
                                ? {
                                    id: campo.id,
                                    slug: campo.slug,
                                    namtrikTermino: campo.namtrikTermino,
                                  }
                                : undefined,
                            }
                          : undefined,
                      },
                    },
                  ]
                : [],
            };
          });

          return {
            data: mappedWords as unknown as RawWordResult[],
            pagination: {
              page,
              limit,
              total: totalSentidos,
              totalPages: Math.ceil(totalSentidos / limit),
            },
          };
        }

        // 3. Fallback con Prisma findMany (usado si $queryRaw falla o en tests que mockean findMany)
        const queryNormTheta = cleanQuery.replace(/[oøəɔ]/gi, 'ɵ');
        const queryNormO = cleanQuery.replace(/[ɵøəɔ]/gi, 'o');
        const sentidoWhere: Prisma.SentidoLexicoWhereInput = {
          deletedAt: null,
          ...(onlyRatified ? { estado: 'ratificado' } : {}),
          OR: [
            { espanolGlosa: { contains: cleanQuery, mode: 'insensitive' } },
            { espanolGlosa: { contains: queryNormO, mode: 'insensitive' } },
            { espanolExplicacion: { contains: cleanQuery, mode: 'insensitive' } },
            { namtrikContexto: { contains: cleanQuery, mode: 'insensitive' } },
            {
              formas: {
                some: {
                  lema: { contains: cleanQuery, mode: 'insensitive' },
                },
              },
            },
            {
              formas: {
                some: {
                  lema: { contains: queryNormTheta, mode: 'insensitive' },
                },
              },
            },
            {
              formas: {
                some: {
                  lema: { contains: queryNormO, mode: 'insensitive' },
                },
              },
            },
          ],
        };

        const sentidos = await this.prisma.sentidoLexico.findMany({
          where: sentidoWhere,
          skip,
          take: limit,
          include: {
            formas: {
              orderBy: { orden: 'asc' },
              include: { medios: mediosInclude },
            },
            medios: mediosInclude,
            ubicaciones: {
              include: {
                campo: true,
                subcampo: { include: { campoSemantico: true } },
                microcampo: {
                  include: {
                    subcampoSemantico: { include: { campoSemantico: true } },
                  },
                },
              },
            },
          },
          orderBy: { codigo: 'asc' },
        });

        const totalSentidos = await this.prisma.sentidoLexico.count({
          where: sentidoWhere,
        });

        if (sentidos.length > 0) {
          // biome-ignore lint/suspicious/noExplicitAny: mapeo a estructura esperada por el cliente
          const mappedWords: any[] = sentidos.map((s) => {
            const ub = s.ubicaciones?.[0];
            const micro = ub?.microcampo;
            const sub = ub?.subcampo ?? micro?.subcampoSemantico;
            const campo = ub?.campo ?? sub?.campoSemantico;

            const campoSlug = campo?.slug ?? '';
            const campoNombre = campo?.namtrikTermino ?? campo?.espanolTermino ?? '';
            const subcampoSlug = sub?.slug ?? undefined;
            const subcampoNombre = sub?.namtrikTermino ?? sub?.espanolTermino ?? undefined;
            const microcampoSlug = micro?.slug ?? undefined;
            const microcampoNombre = micro?.namtrikTermino ?? micro?.espanolTermino ?? undefined;

            let ruta = '/campos';
            if (campoSlug) {
              if (microcampoSlug && subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}/${microcampoSlug}#term-${s.id}`;
              } else if (subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}#term-${s.id}`;
              } else {
                ruta = `/campos/${campoSlug}#term-${s.id}`;
              }
            }

            const ubicacion = campoSlug
              ? {
                  campoSlug,
                  campoNombre,
                  subcampoSlug,
                  subcampoNombre,
                  microcampoSlug,
                  microcampoNombre,
                  ruta,
                }
              : null;

            const mediosRaw = [...(s.medios ?? []), ...s.formas.flatMap((f) => f.medios ?? [])];
            const seenUuids = new Set<string>();
            const medios = mediosRaw
              .filter((m) => {
                if (seenUuids.has(m.uuid)) return false;
                seenUuids.add(m.uuid);
                return true;
              })
              .map(mapearMedioPublico);

            const lemaTexto = s.formas.map((f) => f.lema).join(', ');
            const categoria = s.formas[0]?.categoriaGramatical ?? null;

            return {
              id: s.id,
              codigo: s.codigo,
              estado: s.estado,
              coincidencia: 'aproximada',
              namtrikTermino: lemaTexto,
              espanolTermino: s.espanolGlosa,
              categoriaGramatical: categoria,
              namtrikDescripcion: s.namtrikContexto,
              espanolDescripcion: s.espanolExplicacion,
              ubicacion,
              namtrik_termino: lemaTexto,
              espanol_termino: s.espanolGlosa,
              categoria_gramatical: categoria,
              namtrik_descripcion: s.namtrikContexto,
              espanol_descripcion: s.espanolExplicacion,
              namtrik_audio: null,
              espanol_audio: null,
              imagen: null,
              medios,
              microcampos: micro
                ? [
                    {
                      microcampoId: micro.id,
                      microcampo: {
                        id: micro.id,
                        slug: micro.slug,
                        namtrikTermino: micro.namtrikTermino,
                        subcampoSemantico: sub
                          ? {
                              id: sub.id,
                              slug: sub.slug,
                              namtrikTermino: sub.namtrikTermino,
                              campoSemantico: campo
                                ? {
                                    id: campo.id,
                                    slug: campo.slug,
                                    namtrikTermino: campo.namtrikTermino,
                                  }
                                : undefined,
                            }
                          : undefined,
                      },
                    },
                  ]
                : [],
            };
          });

          return {
            data: mappedWords as unknown as RawWordResult[],
            pagination: {
              page,
              limit,
              total: totalSentidos,
              totalPages: Math.ceil(totalSentidos / limit),
            },
          };
        }
      }

      return {
        data: words,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }

    // Sin búsqueda por texto, usar Prisma findMany directo
    const [words, total] = await Promise.all([
      this.prisma.palabraModelo1.findMany({
        where,
        skip,
        take: limit,
        include: {
          microcampos: {
            include: {
              microcampo: true,
            },
          },
        },
        orderBy: this.getOrderBy(params.orderBy),
      }),
      this.prisma.palabraModelo1.count({ where }),
    ]);

    return {
      data: words as unknown as RawWordResult[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener palabra Modelo 1 por ID con relaciones
   */
  async findModelo1ById(id: bigint) {
    return this.prisma.palabraModelo1.findUnique({
      where: { id },
      include: {
        microcampos: {
          include: {
            microcampo: {
              include: {
                subcampoSemantico: {
                  include: {
                    campoSemantico: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Obtener palabra Modelo 2 por ID con relaciones
   */
  async findModelo2ById(id: bigint) {
    return this.prisma.palabraModelo2.findUnique({
      where: { id },
      include: {
        microcampos: {
          include: {
            microcampo: {
              include: {
                subcampoSemantico: {
                  include: {
                    campoSemantico: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Helper para determinar ordenamiento
   */
  private getOrderBy(orderBy?: string): Prisma.PalabraModelo1OrderByWithRelationInput {
    switch (orderBy) {
      case 'namtrik':
        return { namtrikTermino: 'asc' };
      case 'espanol':
        return { espanolTermino: 'asc' };
      case 'recent':
        return { createdAt: 'desc' };
      default:
        return { namtrikTermino: 'asc' };
    }
  }
}
