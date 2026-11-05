/**
 * PalabraRepository
 * Spec 003 — Diccionario API: Repositorio para palabras modelo 1 y modelo 2
 * Spec 006 — Modo dual: Búsqueda unificada sobre Modelo 1 y sentidos_lexicos
 * Spec 009 — Enmienda 0.2.0 / 0.4.0: Búsqueda bilingüe vectorizada multi-nivel con ranking Misak,
 *            parametrización segura de regex POSIX, soporte de monografemas y transparencia semántica
 */

import {
  type ISemanticEmbeddingProvider,
  NullEmbeddingProvider,
} from '../../domain/ports/ISemanticEmbeddingProvider.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../shared/config/prisma.js';
import { SystemSettingsService } from '../../shared/settings/SystemSettingsService.js';
import { mapearMedioPublico } from './CampoSemanticoRepository.js';

export type SearchMatchField = 'lema' | 'glosa' | 'explicacion' | 'equivalencia';

/**
 * Normaliza una cadena Namtrik o Castellano en memoria de forma equivalente a
 * `public.immutable_normalize_namtrik_es` en PostgreSQL.
 */
export function normalizeNamtrikEsQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[ɵƟθΘϴøØ∅əɔ]/g, 'o')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Escapa todos los metacaracteres de expresiones regulares POSIX ERE de PostgreSQL
 * para evitar errores de sintaxis SQL (p. ej. con `(`, `[`, `*`, `?`) al construir patrones `\m...\M`.
 */
export function escapePostgresRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Construye un extracto contextual compacto alrededor de la primera coincidencia
 * del término buscado dentro de una explicación o contexto.
 */
export function buildSearchExcerpt(
  text: string | null | undefined,
  query: string,
  maxLength = 140,
): string | null {
  const cleanText = text?.replace(/\s+/g, ' ').trim();
  if (!cleanText) return null;

  const normQuery = normalizeNamtrikEsQuery(query);
  if (!normQuery) return null;

  const nfcText = cleanText.normalize('NFC');
  const normText = normalizeNamtrikEsQuery(nfcText);

  let matchIdx = normText.indexOf(normQuery);
  if (matchIdx === -1 && normQuery.length >= 5) {
    const stemPrefix = normQuery.slice(0, normQuery.length - 2);
    matchIdx = normText.indexOf(stemPrefix);
  }
  if (matchIdx === -1) {
    return nfcText.length <= maxLength ? nfcText : `${nfcText.slice(0, maxLength).trimEnd()}…`;
  }

  if (nfcText.length <= maxLength) {
    return nfcText;
  }

  const halfWindow = Math.floor((maxLength - normQuery.length) / 2);
  let start = Math.max(0, matchIdx - halfWindow);
  let end = Math.min(nfcText.length, start + maxLength);

  if (end === nfcText.length) {
    start = Math.max(0, end - maxLength);
  }

  if (start > 0) {
    const nextSpace = nfcText.indexOf(' ', start);
    if (nextSpace !== -1 && nextSpace < matchIdx) {
      start = nextSpace + 1;
    }
  }

  if (end < nfcText.length) {
    const prevSpace = nfcText.lastIndexOf(' ', end);
    if (prevSpace > matchIdx + normQuery.length) {
      end = prevSpace;
    }
  }

  const prefix = start > 0 ? '…' : '';
  const suffix = end < nfcText.length ? '…' : '';
  return `${prefix}${nfcText.slice(start, end).trim()}${suffix}`;
}

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
  campoCoincidencia?: SearchMatchField;
  terminoEquivalente?: string | null;
  extractoCoincidencia?: string | null;
  campo_coincidencia?: SearchMatchField;
  termino_equivalente?: string | null;
  extracto_coincidencia?: string | null;
  rrfScore?: number;
  rrf_score?: number;
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
  private embeddingProvider: ISemanticEmbeddingProvider;
  private modelo1EmptyVerified = false;

  constructor(
    prismaClient?: PrismaClient,
    settingsService?: SystemSettingsService,
    embeddingProvider?: ISemanticEmbeddingProvider,
  ) {
    this.prisma = prismaClient || defaultPrisma;
    this.settingsService = settingsService || new SystemSettingsService(this.prisma);
    this.embeddingProvider = embeddingProvider || new NullEmbeddingProvider();
  }

  get isModelo1EmptyVerified(): boolean {
    return this.modelo1EmptyVerified;
  }

  get semanticEmbeddingProvider(): ISemanticEmbeddingProvider {
    return this.embeddingProvider;
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
      if (!this.modelo1EmptyVerified) {
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

      // Si no hubo resultados en palabras_modelo_1 y no se ha verificado el estado de la tabla,
      // verificar si está vacía para activar el cortocircuito en búsquedas posteriores
      if (!this.modelo1EmptyVerified && words.length === 0 && totalCount === 0) {
        try {
          const anyRow = await this.prisma.palabraModelo1?.findFirst?.({ select: { id: true } });
          if (!anyRow) {
            this.modelo1EmptyVerified = true;
          }
        } catch {
          // No interferir con mocks unitarios
        }
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

        // Búsqueda bilingüe híbrida con matriz de equivalencias y RRF (Spec 012 / ADR-0008)
        interface RankedSentidoRow {
          sentido_id: bigint;
          best_nivel: number;
          match_source: SearchMatchField;
          termino_equivalente: string | null;
          max_peso_eq: number;
          max_sim: number;
          max_sim_lema: number;
          max_sim_glosa: number;
          max_sim_eq: number;
          rrf_score: number;
          total_count: bigint;
        }

        const normQuery = normalizeNamtrikEsQuery(cleanQuery);
        const escapedRegexQuery = escapePostgresRegex(normQuery);
        const isSingleChar = normQuery.length <= 1;
        const wordPrefixRegex = `\\m${escapedRegexQuery}`;
        const wholeWordRegex = `\\m${escapedRegexQuery}\\M`;

        let rankedRows: RankedSentidoRow[] = [];
        let rawQueryExecuted = false;
        try {
          const res = await this.prisma.$queryRaw<RankedSentidoRow[]>`
            WITH candidate_matches AS (
              -- 1. Formas y Glosa
              SELECT
                s.id AS sentido_id,
                CASE
                  WHEN public.immutable_normalize_namtrik_es(f.lema) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                  WHEN public.immutable_normalize_namtrik_es(f.lema) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                  WHEN NOT ${isSingleChar} AND public.immutable_normalize_namtrik_es(f.lema) ~ ${wordPrefixRegex} THEN 3
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                  WHEN NOT ${isSingleChar} AND public.immutable_normalize_namtrik_es(s.espanol_glosa) ~ ${wholeWordRegex} THEN 5
                  WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  ELSE 99
                END AS nivel,
                CASE
                  WHEN public.immutable_normalize_namtrik_es(f.lema) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 'lema'
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 'glosa'
                  WHEN public.immutable_normalize_namtrik_es(f.lema) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 'lema'
                  WHEN NOT ${isSingleChar} AND public.immutable_normalize_namtrik_es(f.lema) ~ ${wordPrefixRegex} THEN 'lema'
                  WHEN public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 'glosa'
                  WHEN NOT ${isSingleChar} AND public.immutable_normalize_namtrik_es(s.espanol_glosa) ~ ${wholeWordRegex} THEN 'glosa'
                  ELSE 'glosa'
                END AS match_source,
                NULL::text AS termino_equivalente,
                0.0::float8 AS peso_eq,
                similarity(public.immutable_normalize_namtrik_es(f.lema), public.immutable_normalize_namtrik_es(${cleanQuery})) AS sim_lema,
                similarity(public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(s.espanol_glosa)), public.immutable_normalize_namtrik_es(${cleanQuery})) AS sim_glosa,
                0.0::float8 AS sim_eq,
                public.misak_sort_key(f.lema) AS sort_key
              FROM sentidos_lexicos s
              JOIN formas_namtrik f ON f.sentido_id = s.id
              WHERE s.deleted_at IS NULL
                AND (${onlyRatified} = false OR s.estado = 'ratificado')

              UNION ALL

              -- 2. Equivalencias bilingües
              SELECT
                s.id AS sentido_id,
                CASE
                  WHEN eq.tipo_relacion IN ('glosa_directa', 'sub_acepcion')
                       AND public.immutable_normalize_namtrik_es(eq.termino_es) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                  WHEN eq.tipo_relacion IN ('glosa_directa', 'sub_acepcion')
                       AND public.immutable_normalize_namtrik_es(eq.termino_es) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                  WHEN public.immutable_normalize_namtrik_es(eq.termino_es) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 5
                  WHEN public.immutable_normalize_namtrik_es(eq.termino_es) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 5
                  WHEN NOT ${isSingleChar} AND public.immutable_normalize_namtrik_es(eq.termino_es) ~ ${wordPrefixRegex} THEN 5
                  WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(eq.termino_es), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  ELSE 99
                END AS nivel,
                CASE
                  WHEN eq.tipo_relacion IN ('glosa_directa', 'sub_acepcion') THEN 'glosa'
                  ELSE 'equivalencia'
                END AS match_source,
                eq.termino_es AS termino_equivalente,
                eq.peso::float8 AS peso_eq,
                0.0::float8 AS sim_lema,
                0.0::float8 AS sim_glosa,
                similarity(public.immutable_normalize_namtrik_es(eq.termino_es), public.immutable_normalize_namtrik_es(${cleanQuery})) AS sim_eq,
                'zzz' AS sort_key
              FROM sentidos_lexicos s
              JOIN equivalencias_bilingues eq ON eq.sentido_id = s.id
              WHERE s.deleted_at IS NULL
                AND (${onlyRatified} = false OR s.estado = 'ratificado')

              UNION ALL

              -- 3. Documental FTS
              SELECT
                s.id AS sentido_id,
                CASE
                  WHEN length(public.immutable_normalize_namtrik_es(${cleanQuery})) >= 4
                       AND (
                         to_tsvector('spanish', public.immutable_normalize_namtrik_es(coalesce(s.espanol_explicacion, '')))
                           @@ plainto_tsquery('spanish', public.immutable_normalize_namtrik_es(${cleanQuery}))
                         OR
                         to_tsvector('simple', public.immutable_normalize_namtrik_es(coalesce(s.namtrik_contexto, '')))
                           @@ plainto_tsquery('simple', public.immutable_normalize_namtrik_es(${cleanQuery}))
                       ) THEN 7
                  ELSE 99
                END AS nivel,
                'explicacion' AS match_source,
                NULL::text AS termino_equivalente,
                0.0::float8 AS peso_eq,
                0.0::float8 AS sim_lema,
                0.0::float8 AS sim_glosa,
                0.0::float8 AS sim_eq,
                'zzz' AS sort_key
              FROM sentidos_lexicos s
              WHERE s.deleted_at IS NULL
                AND (${onlyRatified} = false OR s.estado = 'ratificado')
                AND length(public.immutable_normalize_namtrik_es(${cleanQuery})) >= 4
            ),
            valid_candidates AS (
              SELECT * FROM candidate_matches WHERE nivel < 99
            ),
            ranked_sentidos AS (
              SELECT
                sentido_id,
                MIN(nivel) AS best_nivel,
                (ARRAY_AGG(match_source ORDER BY
                  CASE
                    WHEN match_source = 'lema' AND nivel <= 3 THEN 1
                    WHEN match_source = 'glosa' AND nivel <= 2 THEN 2
                    WHEN match_source = 'equivalencia' THEN 3
                    WHEN match_source = 'glosa' THEN 4
                    ELSE 5
                  END ASC,
                  peso_eq DESC
                ))[1] AS match_source,
                (ARRAY_AGG(termino_equivalente ORDER BY
                  CASE
                    WHEN match_source = 'equivalencia' THEN 1
                    ELSE 2
                  END ASC,
                  peso_eq DESC
                ) FILTER (WHERE termino_equivalente IS NOT NULL))[1] AS termino_equivalente,
                COALESCE(MAX(peso_eq), 0.0) AS max_peso_eq,
                GREATEST(MAX(sim_lema), MAX(sim_glosa), MAX(sim_eq)) AS max_sim,
                MAX(sim_lema) AS max_sim_lema,
                MAX(sim_glosa) AS max_sim_glosa,
                MAX(sim_eq) AS max_sim_eq,
                MIN(sort_key) AS min_sort_key,
                (
                  (1.0 / (60.0 + MIN(nivel))) +
                  (COALESCE(MAX(peso_eq), 0.0) / (60.0 + CASE WHEN COALESCE(MAX(peso_eq), 0.0) > 0 THEN MIN(nivel) ELSE 100 END)) +
                  (0.6 / (60.0 + (1.0 - GREATEST(MAX(sim_lema), MAX(sim_glosa), MAX(sim_eq))) * 100.0))
                ) AS rrf_score
              FROM valid_candidates
              GROUP BY sentido_id
            )
            SELECT
              r.sentido_id,
              r.best_nivel,
              r.match_source,
              r.termino_equivalente,
              r.max_peso_eq,
              r.max_sim,
              r.max_sim_lema,
              r.max_sim_glosa,
              r.max_sim_eq,
              r.rrf_score,
              COUNT(*) OVER() AS total_count
            FROM ranked_sentidos r
            ORDER BY
              r.best_nivel ASC,
              r.rrf_score DESC,
              r.max_sim DESC,
              r.min_sort_key ASC
            LIMIT ${limit}
            OFFSET ${skip};
          `;
          if (Array.isArray(res)) {
            rankedRows = res;
            rawQueryExecuted = true;
          }
        } catch (_err) {
          rankedRows = [];
          rawQueryExecuted = false;
        }

        if (rankedRows.length > 0 && rankedRows[0]?.sentido_id !== undefined) {
          const ids = rankedRows.map((r) => r.sentido_id as bigint);
          const metaMap = new Map(
            rankedRows.map((r) => [
              r.sentido_id?.toString() ?? '',
              {
                best_nivel: Number(r.best_nivel ?? 99),
                match_source:
                  r.match_source ??
                  (Number(r.best_nivel) === 1 || Number(r.best_nivel) === 3
                    ? 'lema'
                    : Number(r.best_nivel) === 7
                      ? 'explicacion'
                      : 'glosa'),
                termino_equivalente: r.termino_equivalente ?? null,
                max_sim_lema: Number(r.max_sim_lema ?? 0),
                max_sim_glosa: Number(r.max_sim_glosa ?? 0),
                max_sim_eq: Number(r.max_sim_eq ?? 0),
                rrf_score: Number(r.rrf_score ?? 0),
              },
            ]),
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
            const rowMeta = metaMap.get(s.id.toString());
            const nivel = rowMeta?.best_nivel ?? 99;
            const coincidencia: 'exacta' | 'prefijo' | 'aproximada' =
              nivel <= 2 ? 'exacta' : nivel <= 4 ? 'prefijo' : 'aproximada';

            const campoCoincidencia: SearchMatchField =
              rowMeta?.match_source ??
              (nivel === 1 || nivel === 3
                ? 'lema'
                : nivel === 2 || nivel === 4 || nivel === 5
                  ? 'glosa'
                  : nivel === 6
                    ? (rowMeta?.max_sim_lema ?? 0) >= (rowMeta?.max_sim_glosa ?? 0)
                      ? 'lema'
                      : 'glosa'
                    : 'explicacion');

            const terminoEquivalente =
              campoCoincidencia === 'equivalencia' ? (rowMeta?.termino_equivalente ?? null) : null;

            const extractoCoincidencia =
              campoCoincidencia === 'explicacion'
                ? (buildSearchExcerpt(s.espanolExplicacion, cleanQuery) ??
                  buildSearchExcerpt(s.namtrikContexto, cleanQuery))
                : null;

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
              campoCoincidencia,
              terminoEquivalente,
              extractoCoincidencia,
              namtrikTermino: lemaTexto,
              espanolTermino: s.espanolGlosa,
              categoriaGramatical: categoria,
              namtrikDescripcion: s.namtrikContexto,
              espanolDescripcion: s.espanolExplicacion,
              ubicacion,
              campo_coincidencia: campoCoincidencia,
              termino_equivalente: terminoEquivalente,
              extracto_coincidencia: extractoCoincidencia,
              rrfScore: rowMeta?.rrf_score,
              rrf_score: rowMeta?.rrf_score,
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

        if (rawQueryExecuted) {
          return {
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
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
              campoCoincidencia: 'glosa',
              campo_coincidencia: 'glosa',
              terminoEquivalente: null,
              termino_equivalente: null,
              extractoCoincidencia: null,
              extracto_coincidencia: null,
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
