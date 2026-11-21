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

export type SearchMatchField =
  | 'lema'
  | 'glosa'
  | 'explicacion'
  | 'equivalencia'
  | 'cientifico'
  | 'taxonomia';

export type SearchResultType = 'campo' | 'subcampo' | 'microcampo' | 'subnivel' | 'termino';

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

interface MicrocampoChainNode {
  slug: string;
  namtrikTermino: string | null;
  espanolTermino: string;
  subcampoSemantico?: {
    id?: bigint;
    slug: string;
    namtrikTermino: string | null;
    espanolTermino?: string;
    campoSemantico?: {
      id?: bigint;
      slug: string;
      namtrikTermino: string | null;
      espanolTermino?: string;
    } | null;
  } | null;
  padre?: MicrocampoChainNode | null;
}

function resolveRootMicrocampo(
  micro: MicrocampoChainNode | null | undefined,
): MicrocampoChainNode | null {
  if (!micro) return null;
  let current: MicrocampoChainNode = micro;
  while (current.padre) {
    current = current.padre;
  }
  return current;
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
  categoria_gramatical?: string | null;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  tipoResultado?: SearchResultType;
  tipo_resultado?: SearchResultType;
  nivelJerarquico?: number;
  nivel_jerarquico?: number;
  totalTerminos?: number;
  total_terminos?: number;
  nombreCientifico?: string | null;
  nombre_cientifico?: string | null;
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
        // Opción A: los medios públicos siempre se filtran a 'ratificado' aunque PUBLIC_ONLY_RATIFIED sea false,
        // evitando exponer reproductores/miniaturas cuyo stream privado responde 403 al visitante público.
        const medioWhere = { deletedAt: null, estado: 'ratificado' };
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
              -- 0. Nombre Científico
              SELECT
                s.id AS sentido_id,
                CASE
                  WHEN public.immutable_normalize_namtrik_es(s.nombre_cientifico) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                  WHEN public.immutable_normalize_namtrik_es(s.nombre_cientifico) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                  WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(s.nombre_cientifico), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                  ELSE 99
                END AS nivel,
                'cientifico'::text AS match_source,
                NULL::text AS termino_equivalente,
                0.0::float8 AS peso_eq,
                similarity(public.immutable_normalize_namtrik_es(s.nombre_cientifico), public.immutable_normalize_namtrik_es(${cleanQuery})) AS sim_lema,
                0.0::float8 AS sim_glosa,
                0.0::float8 AS sim_eq,
                'zzz' AS sort_key
              FROM sentidos_lexicos s
              WHERE s.deleted_at IS NULL
                AND (${onlyRatified} = false OR s.estado = 'ratificado')
                AND s.nombre_cientifico IS NOT NULL

              UNION ALL

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
                    WHEN match_source = 'cientifico' AND nivel <= 3 THEN 2
                    WHEN match_source = 'equivalencia' THEN 3
                    WHEN match_source = 'glosa' THEN 4
                    WHEN match_source = 'cientifico' THEN 5
                    ELSE 6
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

        interface TaxonomyMatchRow {
          tipo_resultado: SearchResultType;
          nivel_jerarquico: number;
          id: bigint;
          codigo: string;
          slug: string;
          namtrik_termino: string;
          espanol_termino: string;
          namtrik_descripcion: string | null;
          espanol_descripcion: string | null;
          imagen: string | null;
          campo_slug: string;
          campo_nombre: string;
          subcampo_slug: string | null;
          subcampo_nombre: string | null;
          microcampo_slug: string | null;
          microcampo_nombre: string | null;
          ruta: string;
          total_terminos: number;
          match_level: number;
        }

        let taxonomyRows: TaxonomyMatchRow[] = [];
        if (!params.microcampoId) {
          try {
            const taxRes = await this.prisma.$queryRaw<TaxonomyMatchRow[]>`
              WITH RECURSIVE micro_roots AS (
                SELECT
                  id,
                  slug AS root_slug,
                  COALESCE(namtrik_termino, espanol_termino) AS root_nombre
                FROM microcampos
                WHERE padre_id IS NULL AND deleted_at IS NULL
                UNION ALL
                SELECT
                  child.id,
                  mr.root_slug,
                  mr.root_nombre
                FROM microcampos child
                JOIN micro_roots mr ON child.padre_id = mr.id
                WHERE child.deleted_at IS NULL
              ),
              taxonomy_nodes AS (
                SELECT
                  'campo'::text AS tipo_resultado,
                  1 AS nivel_jerarquico,
                  c.id,
                  c.codigo,
                  c.slug,
                  COALESCE(c.namtrik_termino, '') AS namtrik_termino,
                  c.espanol_termino,
                  c.namtrik_descripcion,
                  c.espanol_descripcion,
                  c.imagen,
                  c.slug AS campo_slug,
                  COALESCE(c.namtrik_termino, c.espanol_termino) AS campo_nombre,
                  NULL::text AS subcampo_slug,
                  NULL::text AS subcampo_nombre,
                  NULL::text AS microcampo_slug,
                  NULL::text AS microcampo_nombre,
                  '/campos/' || c.slug AS ruta,
                  (
                    SELECT COUNT(DISTINCT su.sentido_id)
                    FROM sentidos_ubicaciones su
                    JOIN sentidos_lexicos sl ON sl.id = su.sentido_id
                    LEFT JOIN subcampos_semanticos sub ON sub.id = su.subcampo_semantico_id
                    LEFT JOIN microcampos m ON m.id = su.microcampo_id
                    LEFT JOIN subcampos_semanticos msub ON msub.id = m.subcampo_semantico_id
                    WHERE sl.deleted_at IS NULL
                      AND (
                        su.campo_semantico_id = c.id
                        OR sub.campo_semantico_id = c.id
                        OR msub.campo_semantico_id = c.id
                      )
                  )::int AS total_terminos,
                  CASE
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(c.namtrik_termino, '')) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                    WHEN public.immutable_normalize_namtrik_es(c.espanol_termino) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(c.namtrik_termino, '')) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                    WHEN public.immutable_normalize_namtrik_es(c.espanol_termino) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(c.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(c.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    ELSE 99
                  END AS match_level
                FROM campos_semanticos c
                WHERE c.deleted_at IS NULL
                  AND (
                    public.immutable_normalize_namtrik_es(COALESCE(c.namtrik_termino, '')) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR public.immutable_normalize_namtrik_es(c.espanol_termino) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(c.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(c.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                  )

                UNION ALL

                SELECT
                  'subcampo'::text AS tipo_resultado,
                  2 AS nivel_jerarquico,
                  s.id,
                  s.codigo,
                  s.slug,
                  COALESCE(s.namtrik_termino, '') AS namtrik_termino,
                  s.espanol_termino,
                  s.namtrik_descripcion,
                  s.espanol_descripcion,
                  s.imagen,
                  c.slug AS campo_slug,
                  COALESCE(c.namtrik_termino, c.espanol_termino) AS campo_nombre,
                  s.slug AS subcampo_slug,
                  COALESCE(s.namtrik_termino, s.espanol_termino) AS subcampo_nombre,
                  NULL::text AS microcampo_slug,
                  NULL::text AS microcampo_nombre,
                  '/campos/' || c.slug || '/' || s.slug AS ruta,
                  (
                    SELECT COUNT(DISTINCT su.sentido_id)
                    FROM sentidos_ubicaciones su
                    JOIN sentidos_lexicos sl ON sl.id = su.sentido_id
                    LEFT JOIN microcampos m ON m.id = su.microcampo_id
                    WHERE sl.deleted_at IS NULL
                      AND (
                        su.subcampo_semantico_id = s.id
                        OR m.subcampo_semantico_id = s.id
                      )
                  )::int AS total_terminos,
                  CASE
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(s.namtrik_termino, '')) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                    WHEN public.immutable_normalize_namtrik_es(s.espanol_termino) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(s.namtrik_termino, '')) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                    WHEN public.immutable_normalize_namtrik_es(s.espanol_termino) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(s.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(s.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    ELSE 99
                  END AS match_level
                FROM subcampos_semanticos s
                JOIN campos_semanticos c ON c.id = s.campo_semantico_id
                WHERE s.deleted_at IS NULL
                  AND (
                    public.immutable_normalize_namtrik_es(COALESCE(s.namtrik_termino, '')) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR public.immutable_normalize_namtrik_es(s.espanol_termino) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(s.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(s.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                  )

                UNION ALL

                SELECT
                  CASE WHEN m.padre_id IS NULL THEN 'microcampo'::text ELSE 'subnivel'::text END AS tipo_resultado,
                  CASE WHEN m.padre_id IS NULL THEN 3 ELSE 4 END AS nivel_jerarquico,
                  m.id,
                  m.codigo,
                  m.slug,
                  COALESCE(m.namtrik_termino, '') AS namtrik_termino,
                  m.espanol_termino,
                  m.namtrik_descripcion,
                  m.espanol_descripcion,
                  m.imagen,
                  c.slug AS campo_slug,
                  COALESCE(c.namtrik_termino, c.espanol_termino) AS campo_nombre,
                  s.slug AS subcampo_slug,
                  COALESCE(s.namtrik_termino, s.espanol_termino) AS subcampo_nombre,
                  COALESCE(mr.root_slug, m.slug) AS microcampo_slug,
                  COALESCE(mr.root_nombre, m.namtrik_termino, m.espanol_termino) AS microcampo_nombre,
                  CASE
                    WHEN m.padre_id IS NULL THEN '/campos/' || c.slug || '/' || s.slug || '/' || m.slug
                    ELSE '/campos/' || c.slug || '/' || s.slug || '/' || COALESCE(mr.root_slug, m.slug) || '#subnivel-' || m.slug
                  END AS ruta,
                  (
                    SELECT COUNT(DISTINCT su.sentido_id)
                    FROM sentidos_ubicaciones su
                    JOIN sentidos_lexicos sl ON sl.id = su.sentido_id
                    WHERE su.microcampo_id = m.id AND sl.deleted_at IS NULL
                  )::int AS total_terminos,
                  CASE
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(m.namtrik_termino, '')) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 1
                    WHEN public.immutable_normalize_namtrik_es(m.espanol_termino) = public.immutable_normalize_namtrik_es(${cleanQuery}) THEN 2
                    WHEN public.immutable_normalize_namtrik_es(COALESCE(m.namtrik_termino, '')) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 3
                    WHEN public.immutable_normalize_namtrik_es(m.espanol_termino) LIKE (public.immutable_normalize_namtrik_es(${cleanQuery}) || '%') THEN 4
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(m.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    WHEN NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(m.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35 THEN 6
                    ELSE 99
                  END AS match_level
                FROM microcampos m
                LEFT JOIN micro_roots mr ON mr.id = m.id
                JOIN subcampos_semanticos s ON s.id = m.subcampo_semantico_id
                JOIN campos_semanticos c ON c.id = s.campo_semantico_id
                WHERE m.deleted_at IS NULL
                  AND (
                    public.immutable_normalize_namtrik_es(COALESCE(m.namtrik_termino, '')) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR public.immutable_normalize_namtrik_es(m.espanol_termino) LIKE ('%' || public.immutable_normalize_namtrik_es(${cleanQuery}) || '%')
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(COALESCE(m.namtrik_termino, '')), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                    OR (NOT ${isSingleChar} AND similarity(public.immutable_normalize_namtrik_es(m.espanol_termino), public.immutable_normalize_namtrik_es(${cleanQuery})) >= 0.35)
                  )
              )
              SELECT * FROM taxonomy_nodes WHERE match_level < 99 ORDER BY match_level ASC, nivel_jerarquico ASC LIMIT 20;
            `;
            if (Array.isArray(taxRes)) {
              taxonomyRows = taxRes;
            }
          } catch (_err) {
            taxonomyRows = [];
          }
        }

        const taxWords: RawWordResult[] = (taxonomyRows ?? []).map((t) => ({
          id: t.id,
          codigo: t.codigo,
          estado: 'ratificado',
          tipoResultado: t.tipo_resultado,
          tipo_resultado: t.tipo_resultado,
          nivelJerarquico: Number(t.nivel_jerarquico),
          nivel_jerarquico: Number(t.nivel_jerarquico),
          totalTerminos: Number(t.total_terminos || 0),
          total_terminos: Number(t.total_terminos || 0),
          coincidencia:
            Number(t.match_level) <= 2
              ? 'exacta'
              : Number(t.match_level) <= 4
                ? 'prefijo'
                : 'aproximada',
          campoCoincidencia: 'taxonomia',
          campo_coincidencia: 'taxonomia',
          terminoEquivalente: null,
          termino_equivalente: null,
          extractoCoincidencia: null,
          extracto_coincidencia: null,
          namtrikTermino: t.namtrik_termino || t.espanol_termino,
          espanolTermino: t.espanol_termino,
          categoriaGramatical: null,
          categoria_gramatical: null,
          namtrikDescripcion: t.namtrik_descripcion,
          espanolDescripcion: t.espanol_descripcion,
          namtrik_termino: t.namtrik_termino || t.espanol_termino,
          espanol_termino: t.espanol_termino,
          namtrik_descripcion: t.namtrik_descripcion,
          espanol_descripcion: t.espanol_descripcion,
          namtrik_audio: null,
          espanol_audio: null,
          imagen: t.imagen,
          medios: [],
          microcampos: [],
          rrfScore:
            1.0 / (60.0 + Number(t.match_level)) + (Number(t.match_level) <= 2 ? 0.05 : 0.0),
          rrf_score:
            1.0 / (60.0 + Number(t.match_level)) + (Number(t.match_level) <= 2 ? 0.05 : 0.0),
          ubicacion: {
            campoSlug: t.campo_slug,
            campoNombre: t.campo_nombre,
            subcampoSlug: t.subcampo_slug ?? undefined,
            subcampoNombre: t.subcampo_nombre ?? undefined,
            microcampoSlug: t.microcampo_slug ?? undefined,
            microcampoNombre: t.microcampo_nombre ?? undefined,
            ruta: t.ruta,
          },
        }));

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
                      padre: {
                        include: {
                          subcampoSemantico: { include: { campoSemantico: true } },
                          padre: {
                            include: {
                              subcampoSemantico: { include: { campoSemantico: true } },
                              padre: {
                                include: {
                                  subcampoSemantico: { include: { campoSemantico: true } },
                                },
                              },
                            },
                          },
                        },
                      },
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
              (s.nombreCientifico && normalizeNamtrikEsQuery(s.nombreCientifico).includes(normQuery)
                ? 'cientifico'
                : nivel === 1 || nivel === 3
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
            const rootMicro = resolveRootMicrocampo(micro);
            const sub = ub?.subcampo ?? micro?.subcampoSemantico ?? rootMicro?.subcampoSemantico;
            const campo = ub?.campo ?? sub?.campoSemantico;

            const campoSlug = campo?.slug ?? '';
            const campoNombre = campo?.namtrikTermino ?? campo?.espanolTermino ?? '';
            const subcampoSlug = sub?.slug ?? undefined;
            const subcampoNombre = sub?.namtrikTermino ?? sub?.espanolTermino ?? undefined;
            const rootMicroSlug = rootMicro?.slug ?? micro?.slug ?? undefined;
            const microcampoSlug = micro?.slug ?? undefined;
            const microcampoNombre = micro?.namtrikTermino ?? micro?.espanolTermino ?? undefined;

            let ruta = '/campos';
            if (campoSlug) {
              if (rootMicroSlug && subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}/${rootMicroSlug}#term-${s.id}`;
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
              tipoResultado: 'termino' as SearchResultType,
              tipo_resultado: 'termino' as SearchResultType,
              nivelJerarquico: 5,
              nivel_jerarquico: 5,
              totalTerminos: 1,
              total_terminos: 1,
              nombreCientifico: s.nombreCientifico ?? null,
              nombre_cientifico: s.nombreCientifico ?? null,
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

          const combined = [...taxWords, ...mappedWords];
          if (taxWords.length > 0) {
            combined.sort((a, b) => {
              const aExact = a.coincidencia === 'exacta' ? 1 : a.coincidencia === 'prefijo' ? 2 : 3;
              const bExact = b.coincidencia === 'exacta' ? 1 : b.coincidencia === 'prefijo' ? 2 : 3;
              if (aExact !== bExact) return aExact - bExact;

              const aRrf = a.rrfScore ?? 0;
              const bRrf = b.rrfScore ?? 0;
              if (Math.abs(bRrf - aRrf) > 0.0001) return bRrf - aRrf;

              const aNivel = a.nivelJerarquico ?? 5;
              const bNivel = b.nivelJerarquico ?? 5;
              if (aNivel !== bNivel) return aNivel - bNivel;

              return (a.namtrikTermino ?? '').localeCompare(b.namtrikTermino ?? '');
            });
          }
          const totalCombined = totalSentidos + taxWords.length;

          return {
            data: combined as unknown as RawWordResult[],
            pagination: {
              page,
              limit,
              total: totalCombined,
              totalPages: Math.ceil(totalCombined / limit),
            },
          };
        }

        if (taxWords.length > 0) {
          return {
            data: taxWords,
            pagination: {
              page,
              limit,
              total: taxWords.length,
              totalPages: Math.ceil(taxWords.length / limit),
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
            { nombreCientifico: { contains: cleanQuery, mode: 'insensitive' } },
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
                    padre: {
                      include: {
                        subcampoSemantico: { include: { campoSemantico: true } },
                        padre: {
                          include: {
                            subcampoSemantico: { include: { campoSemantico: true } },
                            padre: {
                              include: {
                                subcampoSemantico: { include: { campoSemantico: true } },
                              },
                            },
                          },
                        },
                      },
                    },
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
            const rootMicro = resolveRootMicrocampo(micro);
            const sub = ub?.subcampo ?? micro?.subcampoSemantico ?? rootMicro?.subcampoSemantico;
            const campo = ub?.campo ?? sub?.campoSemantico;

            const campoSlug = campo?.slug ?? '';
            const campoNombre = campo?.namtrikTermino ?? campo?.espanolTermino ?? '';
            const subcampoSlug = sub?.slug ?? undefined;
            const subcampoNombre = sub?.namtrikTermino ?? sub?.espanolTermino ?? undefined;
            const rootMicroSlug = rootMicro?.slug ?? micro?.slug ?? undefined;
            const microcampoSlug = micro?.slug ?? undefined;
            const microcampoNombre = micro?.namtrikTermino ?? micro?.espanolTermino ?? undefined;

            let ruta = '/campos';
            if (campoSlug) {
              if (rootMicroSlug && subcampoSlug) {
                ruta = `/campos/${campoSlug}/${subcampoSlug}/${rootMicroSlug}#term-${s.id}`;
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
              tipoResultado: 'termino' as SearchResultType,
              tipo_resultado: 'termino' as SearchResultType,
              nivelJerarquico: 5,
              nivel_jerarquico: 5,
              totalTerminos: 1,
              total_terminos: 1,
              nombreCientifico: s.nombreCientifico ?? null,
              nombre_cientifico: s.nombreCientifico ?? null,
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

          const combined = [...taxWords, ...mappedWords];
          if (taxWords.length > 0) {
            combined.sort((a, b) => {
              const aExact = a.coincidencia === 'exacta' ? 1 : a.coincidencia === 'prefijo' ? 2 : 3;
              const bExact = b.coincidencia === 'exacta' ? 1 : b.coincidencia === 'prefijo' ? 2 : 3;
              if (aExact !== bExact) return aExact - bExact;

              const aRrf = a.rrfScore ?? 0;
              const bRrf = b.rrfScore ?? 0;
              if (Math.abs(bRrf - aRrf) > 0.0001) return bRrf - aRrf;

              const aNivel = a.nivelJerarquico ?? 5;
              const bNivel = b.nivelJerarquico ?? 5;
              if (aNivel !== bNivel) return aNivel - bNivel;

              return (a.namtrikTermino ?? '').localeCompare(b.namtrikTermino ?? '');
            });
          }
          const totalCombined = totalSentidos + taxWords.length;

          return {
            data: combined as unknown as RawWordResult[],
            pagination: {
              page,
              limit,
              total: totalCombined,
              totalPages: Math.ceil(totalCombined / limit),
            },
          };
        }

        if (taxWords.length > 0) {
          return {
            data: taxWords,
            pagination: {
              page,
              limit,
              total: taxWords.length,
              totalPages: Math.ceil(taxWords.length / limit),
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
