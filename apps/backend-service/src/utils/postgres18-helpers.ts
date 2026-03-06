/**
 * PostgreSQL 18 Advanced Features - TypeScript Helpers
 * Diccionario Cultural Misak
 *
 * Este archivo contiene helpers y utilidades para aprovechar
 * las características avanzadas de PostgreSQL 18
 */

import type { PrismaClient } from '../generated/prisma/client.js';

// ================================================================
// TIPOS Y INTERFACES
// ================================================================

export interface FullTextSearchResult {
  id: bigint;
  namtrikTermino: string;
  espanolTermino: string;
  relevancia: number;
  tipoModelo: 'modelo_1' | 'modelo_2';
}

export interface FuzzySearchResult {
  id: bigint;
  termino: string;
  similarity: number;
  tipo: string;
}

export interface CampoSemanticoStats {
  id: bigint;
  namtrikTermino: string;
  espanolTermino: string;
  totalSubcampos: number;
  totalMicrocampos: number;
  totalPalabras: number;
  ultimaActualizacion: Date;
}

export interface SearchOptions {
  idioma?: 'spanish' | 'simple';
  limit?: number;
  offset?: number;
}

export interface FuzzySearchOptions {
  similarityThreshold?: number;
  limit?: number;
}

interface QueryPerformanceResult {
  query: string;
  calls: number;
  totalExecTime: number;
  meanExecTime: number;
  maxExecTime: number;
  stddevExecTime: number;
}

interface IndexUsageResult {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesFetched: number;
}

interface TableSizeResult {
  schemaName: string;
  tableName: string;
  totalSize: string;
  tableSize: string;
  indexesSize: string;
}

interface WeightedSearchResult {
  id: bigint;
  namtrikTermino: string;
  espanolTermino: string;
  relevancia: number;
}

interface VectorSearchResult {
  placeholder: number;
}

// ================================================================
// CLASE PRINCIPAL - PostgreSQL18Helper
// ================================================================

export class PostgreSQL18Helper {
  constructor(private prisma: PrismaClient) {}

  /**
   * Búsqueda full-text multilingüe usando funciones de PG18
   * Aprovecha índices GIN y configuración de idioma mejorada
   */
  async fullTextSearch(
    query: string,
    options: SearchOptions = {},
  ): Promise<FullTextSearchResult[]> {
    const { idioma = 'spanish', limit = 100, offset = 0 } = options;

    const results = await this.prisma.$queryRaw<FullTextSearchResult[]>`
      SELECT 
        id,
        namtrik_termino as "namtrikTermino",
        espanol_termino as "espanolTermino",
        relevancia,
        tipo_modelo as "tipoModelo"
      FROM search_palabras_fulltext(${query}, ${idioma})
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return results.map((row) => ({
      ...row,
      relevancia: parseFloat(row.relevancia),
    }));
  }

  /**
   * Búsqueda difusa usando trigrams (pg_trgm)
   * Útil para autocompletado y corrección de errores tipográficos
   */
  async fuzzySearch(query: string, options: FuzzySearchOptions = {}): Promise<FuzzySearchResult[]> {
    const { similarityThreshold = 0.3, limit = 50 } = options;

    const results = await this.prisma.$queryRaw<FuzzySearchResult[]>`
      SELECT 
        id,
        termino,
        similarity
      FROM search_palabras_fuzzy(${query}, ${similarityThreshold})
      LIMIT ${limit}
    `;

    return results.map((row) => ({
      ...row,
      similarity: parseFloat(row.similarity),
    }));
  }

  /**
   * Obtener estadísticas desde vista materializada
   * Alta performance para dashboards
   */
  async getCamposSemanticosStats(): Promise<CampoSemanticoStats[]> {
    const results = await this.prisma.$queryRaw<CampoSemanticoStats[]>`
      SELECT 
        id,
        namtrik_termino as "namtrikTermino",
        espanol_termino as "espanolTermino",
        total_subcampos as "totalSubcampos",
        total_microcampos as "totalMicrocampos",
        total_palabras as "totalPalabras",
        ultima_actualizacion as "ultimaActualizacion"
      FROM mv_stats_campos_semanticos
      ORDER BY total_palabras DESC
    `;

    return results;
  }

  /**
   * Refrescar vista materializada manualmente
   * Útil después de cambios grandes en datos
   */
  async refreshMaterializedView(concurrent = true): Promise<void> {
    if (concurrent) {
      await this.prisma.$executeRaw`
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_campos_semanticos
      `;
    } else {
      await this.prisma.$executeRaw`
        REFRESH MATERIALIZED VIEW mv_stats_campos_semanticos
      `;
    }
  }

  /**
   * Limpiar sesiones expiradas
   * Mantenimiento automático de la base de datos
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ cleanup_expired_sessions: number }]>`
      SELECT cleanup_expired_sessions() as cleanup_expired_sessions
    `;
    return result[0].cleanup_expired_sessions;
  }

  /**
   * Limpiar password resets antiguos
   */
  async cleanupOldPasswordResets(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ cleanup_old_password_resets: number }]>`
      SELECT cleanup_old_password_resets() as cleanup_old_password_resets
    `;
    return result[0].cleanup_old_password_resets;
  }

  /**
   * Búsqueda avanzada con similitud de vectores (pgvector)
   * Requiere embeddings previamente generados
   */
  async vectorSimilaritySearch(embedding: number[], limit = 10): Promise<VectorSearchResult[]> {
    // Esta función requiere que tengas una tabla con columnas de tipo vector
    // Por ahora es un placeholder para implementación futura
    const embeddingStr = `[${embedding.join(',')}]`;

    // Ejemplo de query con pgvector
    const results = await this.prisma.$queryRaw<VectorSearchResult[]>`
      -- SELECT id, termino, embedding <-> ${embeddingStr}::vector as distance
      -- FROM palabras_embeddings
      -- ORDER BY distance
      -- LIMIT ${limit}
      SELECT 1 as placeholder
    `;

    return results;
  }

  /**
   * Análisis de performance de queries
   * Usa pg_stat_statements para identificar queries lentas
   */
  async getQueryPerformanceStats(limit = 20): Promise<QueryPerformanceResult[]> {
    const results = await this.prisma.$queryRaw<QueryPerformanceResult[]>`
      SELECT 
        query,
        calls,
        total_exec_time as "totalExecTime",
        mean_exec_time as "meanExecTime",
        max_exec_time as "maxExecTime",
        stddev_exec_time as "stddevExecTime"
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY total_exec_time DESC
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Resetear estadísticas de performance
   */
  async resetQueryStats(): Promise<void> {
    await this.prisma.$executeRaw`SELECT pg_stat_statements_reset()`;
  }

  /**
   * Obtener información de índices y su uso
   * Útil para optimización
   */
  async getIndexUsageStats(schemaName = 'public'): Promise<IndexUsageResult[]> {
    const results = await this.prisma.$queryRaw<IndexUsageResult[]>`
      SELECT 
        schemaname as "schemaName",
        tablename as "tableName",
        indexname as "indexName",
        idx_scan as "indexScans",
        idx_tup_read as "tuplesRead",
        idx_tup_fetch as "tuplesFetched"
      FROM pg_stat_user_indexes
      WHERE schemaname = ${schemaName}
      ORDER BY idx_scan DESC
    `;

    return results;
  }

  /**
   * Obtener tamaño de tablas e índices
   * Útil para monitoreo de crecimiento
   */
  async getTableSizes(): Promise<TableSizeResult[]> {
    const results = await this.prisma.$queryRaw<TableSizeResult[]>`
      SELECT 
        schemaname as "schemaName",
        tablename as "tableName",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "totalSize",
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "tableSize",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "indexesSize"
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    return results;
  }

  /**
   * Ejecutar VACUUM ANALYZE en tablas específicas
   * Mejora performance de queries
   */
  async vacuumAnalyze(tableName?: string): Promise<void> {
    if (tableName) {
      await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE ${tableName}`);
    } else {
      await this.prisma.$executeRaw`VACUUM ANALYZE`;
    }
  }

  /**
   * Búsqueda con ranking ponderado
   * Combina full-text search con pesos personalizados
   */
  async weightedSearch(
    query: string,
    weights = {
      termino: 1.0,
      descripcion: 0.5,
    },
  ): Promise<WeightedSearchResult[]> {
    const results = await this.prisma.$queryRaw<WeightedSearchResult[]>`
      SELECT 
        id,
        namtrik_termino as "namtrikTermino",
        espanol_termino as "espanolTermino",
        (
          ts_rank(
            to_tsvector('spanish', espanol_termino),
            plainto_tsquery('spanish', ${query})
          ) * ${weights.termino} +
          ts_rank(
            to_tsvector('spanish', espanol_descripcion),
            plainto_tsquery('spanish', ${query})
          ) * ${weights.descripcion}
        ) as relevancia
      FROM palabras_modelo_1
      WHERE deleted_at IS NULL
        AND (
          to_tsvector('spanish', espanol_termino) @@ plainto_tsquery('spanish', ${query})
          OR to_tsvector('spanish', espanol_descripcion) @@ plainto_tsquery('spanish', ${query})
        )
      ORDER BY relevancia DESC
      LIMIT 50
    `;

    return results;
  }
}

// ================================================================
// FUNCIONES HELPER STANDALONE
// ================================================================

/**
 * Crear instancia del helper con Prisma Client existente
 */
export function createPG18Helper(prisma: PrismaClient): PostgreSQL18Helper {
  return new PostgreSQL18Helper(prisma);
}

/**
 * Sanitizar query para búsqueda full-text
 * Remueve caracteres especiales que pueden causar errores
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[&|!()]/g, ' ') // Remover operadores booleanos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .substring(0, 200); // Limitar longitud
}

/**
 * Convertir array de embeddings a formato vector de PostgreSQL
 */
export function arrayToVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Calcular similitud de texto usando algoritmo de Levenshtein
 * Útil para comparaciones locales antes de consultar BD
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Inicializar matriz con dimensiones fijas
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array.from({ length: len2 + 1 }, () => 0),
  );

  // Inicializar primera columna y fila
  for (let i = 0; i <= len1; i++) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0]![j] = j;
  }

  // Calcular distancia de Levenshtein
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        (matrix[i - 1]?.[j] ?? 0) + 1,
        (matrix[i]?.[j - 1] ?? 0) + 1,
        (matrix[i - 1]?.[j - 1] ?? 0) + cost,
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - (matrix[len1]?.[len2] ?? 0) / maxLen;
}

/**
 * Normalizar texto para búsqueda
 * Remueve acentos y convierte a minúsculas
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ================================================================
// CONSTANTES
// ================================================================

export const PG18_FEATURES = {
  FULL_TEXT_SEARCH: 'full_text_search',
  VECTOR_SIMILARITY: 'vector_similarity',
  TRIGRAM_SEARCH: 'trigram_search',
  MATERIALIZED_VIEWS: 'materialized_views',
  PARALLEL_QUERIES: 'parallel_queries',
  JSON_SCHEMA_VALIDATION: 'json_schema_validation',
} as const;

export const DEFAULT_SEARCH_CONFIG = {
  idioma: 'spanish' as const,
  limit: 100,
  offset: 0,
  similarityThreshold: 0.3,
};

// ================================================================
// EXPORT DEFAULT
// ================================================================

export default PostgreSQL18Helper;
