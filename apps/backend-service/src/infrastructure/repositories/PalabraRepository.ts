/**
 * PalabraRepository
 * Sprint 3 - Dictionary API
 * Repositorio para palabras del diccionario con búsqueda full-text
 */

import type { Prisma } from '../../generated/prisma/client.js';
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
  codigo?: string;
  estado?: string;
  namtrik_termino: string;
  espanol_termino: string;
  namtrik_descripcion: string | null;
  espanol_descripcion: string | null;
  namtrik_audio: string | null;
  espanol_audio: string | null;
  imagen: string | null;
  medios?: ReturnType<typeof mapearMedioPublico>[];
  rank?: number;
}

export class PalabraRepository {
  private readonly settingsService: SystemSettingsService;

  constructor(
    private readonly prisma = defaultPrisma,
    settingsService?: SystemSettingsService,
  ) {
    this.settingsService = settingsService ?? new SystemSettingsService(prisma as any);
  }

  /**
   * Buscar palabras (Modelo 1) con full-text search
   */
  async searchModelo1(params: SearchParams): Promise<PaginatedResult<RawWordResult>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: Prisma.PalabraModelo1WhereInput = {
      deletedAt: null,
    };

    // Filtro por microcampo
    if (params.microcampoId) {
      where.microcampos = {
        some: {
          microcampoId: params.microcampoId,
        },
      };
    }

    // Full-text search (spec 003: expresión indexada, ver migración 0005).
    // plainto_tsquery evita rupturas por caracteres especiales del input.
    if (params.query) {
      const words = await this.prisma.$queryRaw<RawWordResult[]>`
        SELECT id, namtrik_termino, espanol_termino,
               namtrik_descripcion, espanol_descripcion,
               namtrik_audio, espanol_audio, imagen,
               ts_rank(
                 to_tsvector('spanish', immutable_unaccent(
                   coalesce(namtrik_termino, '') || ' ' ||
                   coalesce(espanol_termino, '') || ' ' ||
                   coalesce(espanol_descripcion, '')
                 )),
                 plainto_tsquery('spanish', immutable_unaccent(${params.query}))
               ) as rank
        FROM palabras_modelo_1
        WHERE to_tsvector('spanish', immutable_unaccent(
                coalesce(namtrik_termino, '') || ' ' ||
                coalesce(espanol_termino, '') || ' ' ||
                coalesce(espanol_descripcion, '')
              )) @@ plainto_tsquery('spanish', immutable_unaccent(${params.query}))
          AND deleted_at IS NULL
        ORDER BY rank DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      const total = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM palabras_modelo_1
        WHERE to_tsvector('spanish', immutable_unaccent(
                coalesce(namtrik_termino, '') || ' ' ||
                coalesce(espanol_termino, '') || ' ' ||
                coalesce(espanol_descripcion, '')
              )) @@ plainto_tsquery('spanish', immutable_unaccent(${params.query}))
          AND deleted_at IS NULL
      `;

      if (Number(total[0]?.count || 0) === 0 && this.prisma.sentidoLexico) {
        const onlyRatified = await this.settingsService.getPublicOnlyRatified();
        const medioWhere = onlyRatified
          ? { deletedAt: null, estado: 'ratificado' }
          : { deletedAt: null };
        const mediosInclude = {
          where: medioWhere,
          orderBy: { createdAt: 'asc' as const },
        };
        const queryNormTheta = params.query.replace(/[oøəɔ]/gi, 'ɵ');
        const queryNormO = params.query.replace(/[ɵøəɔ]/gi, 'o');
        const sentidoWhere: Prisma.SentidoLexicoWhereInput = {
          deletedAt: null,
          ...(onlyRatified ? { estado: 'ratificado' } : {}),
          OR: [
            { espanolGlosa: { contains: params.query, mode: 'insensitive' } },
            { espanolGlosa: { contains: queryNormO, mode: 'insensitive' } },
            { espanolExplicacion: { contains: params.query, mode: 'insensitive' } },
            { namtrikContexto: { contains: params.query, mode: 'insensitive' } },
            { nombreCientifico: { contains: params.query, mode: 'insensitive' } },
            {
              formas: {
                some: {
                  lema: { contains: params.query, mode: 'insensitive' },
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
              // Contrato canónico camelCase
              namtrikTermino: lemaTexto,
              espanolTermino: s.espanolGlosa,
              categoriaGramatical: categoria,
              namtrikDescripcion: s.namtrikContexto,
              espanolDescripcion: s.espanolExplicacion,
              ubicacion,
              // Alias snake_case para retrocompatibilidad
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
            data: mappedWords,
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
          total: Number(total[0]?.count || 0),
          totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
        },
      };
    }

    // Sin búsqueda full-text, usar Prisma normal
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
