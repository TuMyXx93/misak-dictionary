-- ================================================================
-- PostgreSQL 18 Advanced Features Migration
-- Diccionario Cultural Misak
-- ================================================================
-- Este archivo contiene mejoras específicas de PostgreSQL 18
-- para aprovechar las últimas características del motor de BD
-- ================================================================

-- ================================================================
-- 1. EXTENSIONES ADICIONALES
-- ================================================================

-- Extensión para búsquedas difusas y corrección ortográfica
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Extensión para estadísticas de queries (monitoreo de performance)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ================================================================
-- 1.1 FUNCIÓN WRAPPER IMMUTABLE PARA UNACCENT
-- ================================================================
-- Necesaria para crear índices GIN con unaccent (unaccent no es IMMUTABLE por defecto)
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

COMMENT ON FUNCTION public.immutable_unaccent IS 'Wrapper IMMUTABLE de unaccent para uso en índices GIN';

-- ================================================================
-- 2. FUNCIONES DE BÚSQUEDA MEJORADAS (PostgreSQL 18)
-- ================================================================

-- Función para búsqueda full-text multilingüe mejorada
-- Aprovecha las mejoras de FTS en PG18 con mejor manejo de idiomas
-- Usa immutable_unaccent para compatibilidad con índices GIN y ::TEXT para citext
CREATE OR REPLACE FUNCTION public.search_palabras_fulltext(
    query_text TEXT,
    idioma TEXT DEFAULT 'spanish'
)
RETURNS TABLE (
    id BIGINT,
    namtrik_termino TEXT,
    espanol_termino TEXT,
    relevancia REAL,
    tipo_modelo TEXT
) AS $$
BEGIN
    -- Configuración de búsqueda según idioma
    RETURN QUERY
    WITH search_config AS (
        SELECT CASE 
            WHEN idioma = 'spanish' THEN 'spanish'::regconfig
            ELSE 'simple'::regconfig
        END as config
    ),
    m1_results AS (
        SELECT 
            pm1.id,
            pm1.namtrik_termino::TEXT,
            pm1.espanol_termino::TEXT,
            ts_rank(
                to_tsvector((SELECT config FROM search_config), 
                    immutable_unaccent(pm1.espanol_termino::TEXT || ' ' || pm1.espanol_descripcion)
                ),
                plainto_tsquery((SELECT config FROM search_config), immutable_unaccent(query_text))
            ) as relevancia,
            'modelo_1'::TEXT as tipo_modelo
        FROM palabras_modelo_1 pm1
        WHERE pm1.deleted_at IS NULL
          AND to_tsvector((SELECT config FROM search_config), 
              immutable_unaccent(pm1.espanol_termino::TEXT || ' ' || pm1.espanol_descripcion)
          ) @@ plainto_tsquery((SELECT config FROM search_config), immutable_unaccent(query_text))
    ),
    m2_results AS (
        SELECT 
            pm2.id,
            pm2.namtrik_termino_pregunta::TEXT as namtrik_termino,
            pm2.espanol_traduccion_pregunta::TEXT as espanol_termino,
            ts_rank(
                to_tsvector((SELECT config FROM search_config), 
                    immutable_unaccent(pm2.espanol_traduccion_pregunta || ' ' || pm2.espanol_traduccion_respuesta)
                ),
                plainto_tsquery((SELECT config FROM search_config), immutable_unaccent(query_text))
            ) as relevancia,
            'modelo_2'::TEXT as tipo_modelo
        FROM palabras_modelo_2 pm2
        WHERE pm2.deleted_at IS NULL
          AND to_tsvector((SELECT config FROM search_config), 
              immutable_unaccent(pm2.espanol_traduccion_pregunta || ' ' || pm2.espanol_traduccion_respuesta)
          ) @@ plainto_tsquery((SELECT config FROM search_config), immutable_unaccent(query_text))
    )
    SELECT * FROM m1_results
    UNION ALL
    SELECT * FROM m2_results
    ORDER BY relevancia DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Función para búsqueda difusa con similitud de trigrams
-- Útil para autocompletado y corrección de errores tipográficos
-- Usa ::TEXT para compatibilidad con campos citext
CREATE OR REPLACE FUNCTION public.search_palabras_fuzzy(
    query_text TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
    id BIGINT,
    termino TEXT,
    similarity REAL,
    tipo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm1.id,
        pm1.espanol_termino::TEXT as termino,
        similarity(pm1.espanol_termino::TEXT, query_text) as similarity,
        'modelo_1'::TEXT as tipo
    FROM palabras_modelo_1 pm1
    WHERE pm1.deleted_at IS NULL
      AND similarity(pm1.espanol_termino::TEXT, query_text) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- ================================================================
-- 3. ÍNDICES AVANZADOS PARA BÚSQUEDA
-- ================================================================

-- Índices GIN para búsqueda full-text (aprovecha mejoras de PG18)
-- Usa immutable_unaccent (wrapper IMMUTABLE) para compatibilidad con índices
CREATE INDEX IF NOT EXISTS idx_palabras_m1_fts_spanish 
ON palabras_modelo_1 
USING GIN (to_tsvector('spanish', immutable_unaccent(espanol_termino || ' ' || espanol_descripcion)))
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_palabras_m1_fts_simple 
ON palabras_modelo_1 
USING GIN (to_tsvector('simple', immutable_unaccent(namtrik_termino || ' ' || namtrik_descripcion)))
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_palabras_m2_fts_spanish 
ON palabras_modelo_2 
USING GIN (to_tsvector('spanish', 
    immutable_unaccent(espanol_traduccion_pregunta || ' ' || espanol_traduccion_respuesta)))
WHERE deleted_at IS NULL;

-- Índices GIN para búsqueda por trigrams (fuzzy search)
CREATE INDEX IF NOT EXISTS idx_palabras_m1_trigram_espanol 
ON palabras_modelo_1 
USING GIN (espanol_termino gin_trgm_ops)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_palabras_m1_trigram_namtrik 
ON palabras_modelo_1 
USING GIN (namtrik_termino gin_trgm_ops)
WHERE deleted_at IS NULL;

-- Índice compuesto para búsquedas por campo semántico + término
CREATE INDEX IF NOT EXISTS idx_palabrasm1_microcampos_compound
ON palabrasm1_microcampos (microcampo_id, palabra_id);

-- ================================================================
-- 4. VISTAS MATERIALIZADAS PARA PERFORMANCE
-- ================================================================

-- Vista materializada para estadísticas de campos semánticos
-- Útil para dashboards y reportes sin impactar performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_campos_semanticos AS
SELECT 
    cs.id,
    cs.namtrik_termino,
    cs.espanol_termino,
    COUNT(DISTINCT sc.id) as total_subcampos,
    COUNT(DISTINCT m.id) as total_microcampos,
    COUNT(DISTINCT pm1m.palabra_id) as total_palabras,
    MAX(cs.updated_at) as ultima_actualizacion
FROM campos_semanticos cs
LEFT JOIN subcampos_semanticos sc ON cs.id = sc.campo_semantico_id AND sc.deleted_at IS NULL
LEFT JOIN microcampos m ON sc.id = m.subcampo_semantico_id AND m.deleted_at IS NULL
LEFT JOIN palabrasm1_microcampos pm1m ON m.id = pm1m.microcampo_id
WHERE cs.deleted_at IS NULL
GROUP BY cs.id, cs.namtrik_termino, cs.espanol_termino;

-- Índice en la vista materializada
CREATE INDEX IF NOT EXISTS idx_mv_stats_campos_semanticos_id 
ON mv_stats_campos_semanticos (id);

-- ================================================================
-- 5. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ================================================================

-- Función trigger para refrescar vista materializada
CREATE OR REPLACE FUNCTION refresh_mv_stats_campos() 
RETURNS TRIGGER AS $$
BEGIN
    -- Refrescar concurrentemente (sin bloqueos) - feature de PG18 mejorada
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_campos_semanticos;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas después de cambios
CREATE OR REPLACE TRIGGER trg_refresh_stats_campos
AFTER INSERT OR UPDATE OR DELETE ON palabrasm1_microcampos
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_mv_stats_campos();

-- ================================================================
-- 6. POLÍTICAS DE RETENCIÓN Y MANTENIMIENTO
-- ================================================================

-- Función para soft-delete automático de sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpieza de password resets antiguos
CREATE OR REPLACE FUNCTION cleanup_old_password_resets()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_resets 
    WHERE expires_at < NOW() - INTERVAL '7 days'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. FUNCIONES DE AUDITORÍA (PostgreSQL 18)
-- ================================================================

-- Función mejorada para logging de cambios con JSONB Schema
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    audit_data JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        audit_data = jsonb_build_object(
            'schema', TG_TABLE_SCHEMA,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_data', row_to_json(OLD),
            'timestamp', NOW(),
            'user', current_user
        );
        -- Aquí se puede insertar en tabla de auditoría
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        audit_data = jsonb_build_object(
            'schema', TG_TABLE_SCHEMA,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW),
            'changes', jsonb_build_object(
                'updated_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(row_to_json(NEW)::jsonb)
                    WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb -> key)
                )
            ),
            'timestamp', NOW(),
            'user', current_user
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        audit_data = jsonb_build_object(
            'schema', TG_TABLE_SCHEMA,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'new_data', row_to_json(NEW),
            'timestamp', NOW(),
            'user', current_user
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. OPTIMIZACIONES DE PERFORMANCE (PG18 Specific)
-- ================================================================

-- Configurar parallel workers para queries grandes
ALTER TABLE palabras_modelo_1 SET (parallel_workers = 4);
ALTER TABLE palabras_modelo_2 SET (parallel_workers = 4);
ALTER TABLE campos_semanticos SET (parallel_workers = 2);

-- Configurar autovacuum agresivo para tablas con soft-delete
ALTER TABLE palabras_modelo_1 SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE sessions SET (
    autovacuum_vacuum_scale_factor = 0.1
);

-- ================================================================
-- 9. FUNCIONES HELPER PARA ESTADÍSTICAS
-- ================================================================

-- Obtener top palabras más consultadas (requiere implementación de tracking)
CREATE OR REPLACE FUNCTION get_top_palabras(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    palabra TEXT,
    tipo TEXT,
    consultas BIGINT
) AS $$
BEGIN
    -- Esta función se puede implementar con una tabla de tracking
    -- Por ahora retorna un placeholder
    RETURN QUERY
    SELECT 
        pm1.espanol_termino as palabra,
        'modelo_1'::TEXT as tipo,
        0::BIGINT as consultas
    FROM palabras_modelo_1 pm1
    WHERE pm1.deleted_at IS NULL
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================================================

COMMENT ON FUNCTION search_palabras_fulltext IS 
'Búsqueda full-text multilingüe optimizada para PostgreSQL 18 con soporte para Namtrik y Español';

COMMENT ON FUNCTION search_palabras_fuzzy IS 
'Búsqueda difusa usando trigrams para autocompletado y corrección de errores tipográficos';

COMMENT ON MATERIALIZED VIEW mv_stats_campos_semanticos IS 
'Vista materializada con estadísticas agregadas de campos semánticos para dashboards';

-- ================================================================
-- FIN DE MIGRACIONES
-- ================================================================

-- Refrescar vista materializada inicial
-- MOVIDO A POST-DATA: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_campos_semanticos;

-- Mensaje de éxito
DO $$ 
BEGIN 
    RAISE NOTICE 'PostgreSQL 18 advanced features applied successfully!';
END $$;
