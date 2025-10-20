-- ============================================================================
-- DICCIONARIO CULTURAL MISAK - ESQUEMA DE BASE DE DATOS
-- ============================================================================
-- Descripción: Esquema PostgreSQL 17+ profesional para diccionario cultural
-- Proyecto: Diccionario Misak - Preservación Cultural Digital
-- Fecha: 2025-10-20
-- Autor: Tumi Dev Team
--
-- CARACTERÍSTICAS IMPLEMENTADAS:
-- 1. Índices optimizados en claves foráneas y timestamps
-- 2. Índice vectorial HNSW para búsqueda semántica
-- 3. Full-text search (tsvector + GIN) e índices trigram
-- 4. Timestamps automáticos (created_at, updated_at, deleted_at)
-- 5. Soft delete con índices únicos parciales
-- 6. Unicidad case-insensitive con citext
-- 7. Políticas de cascada en claves foráneas
-- 8. Sistema completo de auditoría (audit trail)
-- 9. Validaciones mediante CHECK constraints
-- 10. Seguridad: Row Level Security (RLS) preparado
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: CONFIGURACIÓN DE BASE DE DATOS
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- SECCIÓN 2: ESQUEMAS (SCHEMAS)
-- ============================================================================

-- Schema meta: tablas de infraestructura (embeddings, migraciones, auditoría)
CREATE SCHEMA IF NOT EXISTS meta;
ALTER SCHEMA meta OWNER TO postgres;

-- Schema audit: auditoría y seguimiento de cambios
CREATE SCHEMA IF NOT EXISTS audit;
ALTER SCHEMA audit OWNER TO postgres;

COMMENT ON SCHEMA meta IS 'Infraestructura: embeddings, migraciones, metadatos';
COMMENT ON SCHEMA audit IS 'Auditoría: cambios en registros, acciones de usuarios';

-- ============================================================================
-- SECCIÓN 3: EXTENSIONES
-- ============================================================================

-- Extensión vector para búsqueda semántica (pgvector)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
COMMENT ON EXTENSION vector IS 'Tipo de dato vector y métodos de acceso HNSW/IVFFlat';

-- Tipo de texto case-insensitive (sin distinción mayúsculas/minúsculas)
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
COMMENT ON EXTENSION citext IS 'Tipo de texto case-insensitive';

-- Similitud trigram para optimización de LIKE/ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
COMMENT ON EXTENSION pg_trgm IS 'Similitud trigram para búsqueda difusa de texto';

-- Generación de UUID (disponible para uso futuro)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'Funciones de generación de UUID';

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================================================
-- SECCIÓN 4: FUNCIONES REUTILIZABLES
-- ============================================================================

-- Función: Actualizar automáticamente el timestamp updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Función trigger para actualizar automáticamente la columna updated_at';

-- ============================================================================
-- SECCIÓN 5: TABLAS DEL SCHEMA META
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: meta.embeddings
-- Propósito: Almacenar embeddings vectoriales para búsqueda semántica
-- -----------------------------------------------------------------------------
CREATE TABLE meta.embeddings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    content text NOT NULL,
    embedding vector(384) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT chk_embeddings_content_len CHECK (char_length(content) >= 1)
);

ALTER TABLE meta.embeddings OWNER TO postgres;

COMMENT ON TABLE meta.embeddings IS 'Embeddings vectoriales para búsqueda semántica (384 dimensiones)';
COMMENT ON COLUMN meta.embeddings.embedding IS 'Vector embedding (384 dimensiones, normalizado)';
COMMENT ON COLUMN meta.embeddings.metadata IS 'Metadatos adicionales (origen, tipo, etc.)';

-- Índices para embeddings
CREATE INDEX idx_embeddings_created_at ON meta.embeddings(created_at DESC);

-- Índice HNSW para búsqueda rápida de vecinos aproximados (similitud coseno)
CREATE INDEX idx_embeddings_hnsw_cosine 
  ON meta.embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

COMMENT ON INDEX idx_embeddings_hnsw_cosine IS 'Índice HNSW para búsqueda de similitud vectorial (distancia coseno)';

-- -----------------------------------------------------------------------------
-- Tabla: meta.migrations
-- Propósito: Rastrear migraciones de base de datos (puede ser reemplazado por Prisma)
-- -----------------------------------------------------------------------------
CREATE TABLE meta.migrations (
    version text PRIMARY KEY,
    name text,
    applied_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_migrations_version_format CHECK (version ~ '^[0-9]{12}$')
);

ALTER TABLE meta.migrations OWNER TO postgres;

COMMENT ON TABLE meta.migrations IS 'Rastreo de migraciones (ad-hoc, puede ser reemplazado por Prisma)';

-- Registro inicial de migración
INSERT INTO meta.migrations (version, name, applied_at) 
VALUES ('202410200001', 'initial_schema', now())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- SECCIÓN 6: TABLAS DEL SCHEMA AUDIT
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: audit.row_changes
-- Propósito: Auditoría completa de todos los cambios en datos
-- -----------------------------------------------------------------------------
CREATE TABLE audit.row_changes (
    id bigserial PRIMARY KEY,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id bigint,
    old_data jsonb,
    new_data jsonb,
    changed_at timestamptz NOT NULL DEFAULT now(),
    changed_by text DEFAULT current_user,
    client_ip inet,
    
    CONSTRAINT chk_audit_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

ALTER TABLE audit.row_changes OWNER TO postgres;

COMMENT ON TABLE audit.row_changes IS 'Auditoría: rastrea todas las operaciones INSERT/UPDATE/DELETE';

-- Índices para consultas de auditoría
CREATE INDEX idx_audit_table ON audit.row_changes(schema_name, table_name);
CREATE INDEX idx_audit_changed_at ON audit.row_changes(changed_at DESC);
CREATE INDEX idx_audit_row_id ON audit.row_changes(row_id);

-- Función trigger de auditoría
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit.row_changes(schema_name, table_name, operation, row_id, new_data)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit.row_changes(schema_name, table_name, operation, row_id, old_data, new_data)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit.row_changes(schema_name, table_name, operation, row_id, old_data)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit.log_changes() IS 'Función trigger para registrar todos los cambios de filas en audit.row_changes';

-- ============================================================================
-- SECCIÓN 7: SCHEMA PUBLIC - TABLAS PRINCIPALES DEL DOMINIO
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: public.campos_semanticos
-- Propósito: Campos semánticos de primer nivel (raíz de taxonomía jerárquica)
-- -----------------------------------------------------------------------------
CREATE TABLE public.campos_semanticos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Contenido bilingüe (Namtrik - Español)
    namtrik_termino public.citext NOT NULL,
    namtrik_descripcion text,
    namtrik_audio text,
    
    espanol_termino public.citext NOT NULL,
    espanol_descripcion text,
    espanol_audio text,
    
    -- Multimedia
    imagen text,
    
    -- Timestamps y soft delete
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Restricciones
    CONSTRAINT chk_campos_namtrik_len CHECK (char_length(namtrik_termino::text) >= 1),
    CONSTRAINT chk_campos_espanol_len CHECK (char_length(espanol_termino::text) >= 1),
    CONSTRAINT chk_campos_audio_url CHECK (
      namtrik_audio IS NULL OR namtrik_audio ~* '^https?://'
    ),
    CONSTRAINT chk_campos_imagen_url CHECK (
      imagen IS NULL OR imagen ~* '^https?://'
    )
);

ALTER TABLE public.campos_semanticos OWNER TO postgres;

COMMENT ON TABLE public.campos_semanticos IS 'Campos semánticos de primer nivel (raíz de taxonomía)';
COMMENT ON COLUMN public.campos_semanticos.namtrik_termino IS 'Término en lengua Namtrik (case-insensitive)';
COMMENT ON COLUMN public.campos_semanticos.espanol_termino IS 'Término en español (case-insensitive)';

-- Restricciones de unicidad (case-insensitive, respetando soft deletes)
CREATE UNIQUE INDEX campos_semanticos_namtrik_termino_uq 
  ON public.campos_semanticos(namtrik_termino) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX campos_semanticos_espanol_termino_uq 
  ON public.campos_semanticos(espanol_termino) 
  WHERE deleted_at IS NULL;

-- Índices de rendimiento
CREATE INDEX idx_campos_created_at ON public.campos_semanticos(created_at DESC);
CREATE INDEX idx_campos_deleted_at ON public.campos_semanticos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices trigram para búsqueda difusa
CREATE INDEX idx_campos_namtrik_trgm ON public.campos_semanticos USING gin(namtrik_termino gin_trgm_ops);
CREATE INDEX idx_campos_espanol_trgm ON public.campos_semanticos USING gin(espanol_termino gin_trgm_ops);

-- Trigger de actualización automática
CREATE TRIGGER trg_campos_updated_at
  BEFORE UPDATE ON public.campos_semanticos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger de auditoría
CREATE TRIGGER trg_campos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.campos_semanticos
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- -----------------------------------------------------------------------------
-- Tabla: public.subcampos_semanticos
-- Propósito: Subcampos semánticos de segundo nivel (capa media de taxonomía)
-- -----------------------------------------------------------------------------
CREATE TABLE public.subcampos_semanticos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campo_semantico_id bigint NOT NULL,
    
    -- Contenido bilingüe
    namtrik_termino public.citext NOT NULL,
    namtrik_descripcion text,
    namtrik_audio text,
    
    espanol_termino public.citext NOT NULL,
    espanol_descripcion text,
    espanol_audio text,
    
    imagen text,
    
    -- Timestamps y soft delete
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Restricciones
    CONSTRAINT chk_subcampos_namtrik_len CHECK (char_length(namtrik_termino::text) >= 1),
    CONSTRAINT chk_subcampos_espanol_len CHECK (char_length(espanol_termino::text) >= 1),
    CONSTRAINT chk_subcampos_audio_url CHECK (
      namtrik_audio IS NULL OR namtrik_audio ~* '^https?://'
    ),
    CONSTRAINT chk_subcampos_imagen_url CHECK (
      imagen IS NULL OR imagen ~* '^https?://'
    )
);

ALTER TABLE public.subcampos_semanticos OWNER TO postgres;

COMMENT ON TABLE public.subcampos_semanticos IS 'Subcampos semánticos de segundo nivel (capa media de taxonomía)';

-- Restricciones de unicidad
CREATE UNIQUE INDEX subcampos_semanticos_namtrik_termino_uq 
  ON public.subcampos_semanticos(namtrik_termino) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX subcampos_semanticos_espanol_termino_uq 
  ON public.subcampos_semanticos(espanol_termino) 
  WHERE deleted_at IS NULL;

-- Clave foránea con cascada
ALTER TABLE public.subcampos_semanticos
  ADD CONSTRAINT subcampos_semanticos_campo_semantico_id_fkey
  FOREIGN KEY (campo_semantico_id) 
  REFERENCES public.campos_semanticos(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices de rendimiento
CREATE INDEX idx_subcampos_campo_id ON public.subcampos_semanticos(campo_semantico_id);
CREATE INDEX idx_subcampos_created_at ON public.subcampos_semanticos(created_at DESC);
CREATE INDEX idx_subcampos_deleted_at ON public.subcampos_semanticos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices trigram
CREATE INDEX idx_subcampos_namtrik_trgm ON public.subcampos_semanticos USING gin(namtrik_termino gin_trgm_ops);
CREATE INDEX idx_subcampos_espanol_trgm ON public.subcampos_semanticos USING gin(espanol_termino gin_trgm_ops);

-- Triggers
CREATE TRIGGER trg_subcampos_updated_at
  BEFORE UPDATE ON public.subcampos_semanticos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subcampos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.subcampos_semanticos
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- -----------------------------------------------------------------------------
-- Tabla: public.microcampos
-- Propósito: Microcampos de tercer nivel (nodos hoja de taxonomía)
-- -----------------------------------------------------------------------------
CREATE TABLE public.microcampos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subcampo_semantico_id bigint NOT NULL,
    
    -- Contenido bilingüe
    namtrik_termino public.citext NOT NULL,
    namtrik_descripcion text,
    namtrik_audio text,
    
    espanol_termino public.citext NOT NULL,
    espanol_descripcion text,
    espanol_audio text,
    
    imagen text,
    
    -- Timestamps and soft delete
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT chk_microcampos_namtrik_len CHECK (char_length(namtrik_termino::text) >= 1),
    CONSTRAINT chk_microcampos_espanol_len CHECK (char_length(espanol_termino::text) >= 1),
    CONSTRAINT chk_microcampos_audio_url CHECK (
      namtrik_audio IS NULL OR namtrik_audio ~* '^https?://'
    ),
    CONSTRAINT chk_microcampos_imagen_url CHECK (
      imagen IS NULL OR imagen ~* '^https?://'
    )
);

ALTER TABLE public.microcampos OWNER TO postgres;

COMMENT ON TABLE public.microcampos IS 'Microcampos de tercer nivel (nodos hoja de taxonomía)';

-- Unique constraints
CREATE UNIQUE INDEX microcampos_namtrik_termino_uq 
  ON public.microcampos(namtrik_termino) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX microcampos_espanol_termino_uq 
  ON public.microcampos(espanol_termino) 
  WHERE deleted_at IS NULL;

-- Clave foránea con cascada
ALTER TABLE public.microcampos
  ADD CONSTRAINT microcampos_subcampo_semantico_id_fkey
  FOREIGN KEY (subcampo_semantico_id) 
  REFERENCES public.subcampos_semanticos(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices de rendimiento
CREATE INDEX idx_microcampos_subcampo_id ON public.microcampos(subcampo_semantico_id);
CREATE INDEX idx_microcampos_created_at ON public.microcampos(created_at DESC);
CREATE INDEX idx_microcampos_deleted_at ON public.microcampos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices trigram
CREATE INDEX idx_microcampos_namtrik_trgm ON public.microcampos USING gin(namtrik_termino gin_trgm_ops);
CREATE INDEX idx_microcampos_espanol_trgm ON public.microcampos USING gin(espanol_termino gin_trgm_ops);

-- Triggers
CREATE TRIGGER trg_microcampos_updated_at
  BEFORE UPDATE ON public.microcampos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_microcampos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.microcampos
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- -----------------------------------------------------------------------------
-- Tabla: public.palabras_modelo_1
-- Propósito: Dictionary words (Model 1: simple term-description)
-- -----------------------------------------------------------------------------
CREATE TABLE public.palabras_modelo_1 (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Contenido bilingüe
    namtrik_termino public.citext NOT NULL,
    namtrik_descripcion text,
    namtrik_audio text,
    
    espanol_termino public.citext NOT NULL,
    espanol_descripcion text,
    espanol_audio text,
    
    imagen text,
    
    -- Full-text search (auto-generado)
    search_vector tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(namtrik_termino::text, '')), 'A') ||
      setweight(to_tsvector('spanish', coalesce(espanol_termino::text, '')), 'A') ||
      setweight(to_tsvector('spanish', coalesce(espanol_descripcion, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(namtrik_descripcion, '')), 'B')
    ) STORED,
    
    -- Timestamps and soft delete
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT chk_p1_namtrik_len CHECK (char_length(namtrik_termino::text) >= 1),
    CONSTRAINT chk_p1_espanol_len CHECK (char_length(espanol_termino::text) >= 1),
    CONSTRAINT chk_p1_audio_url CHECK (
      namtrik_audio IS NULL OR namtrik_audio ~* '^https?://'
    ),
    CONSTRAINT chk_p1_imagen_url CHECK (
      imagen IS NULL OR imagen ~* '^https?://'
    )
);

ALTER TABLE public.palabras_modelo_1 OWNER TO postgres;

COMMENT ON TABLE public.palabras_modelo_1 IS 'Palabras del diccionario - Modelo 1 (término-descripción simple)';
COMMENT ON COLUMN public.palabras_modelo_1.search_vector IS 'tsvector auto-generado para full-text search';

-- Unique constraints
CREATE UNIQUE INDEX palabras_modelo_1_namtrik_termino_uq 
  ON public.palabras_modelo_1(namtrik_termino) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX palabras_modelo_1_espanol_termino_uq 
  ON public.palabras_modelo_1(espanol_termino) 
  WHERE deleted_at IS NULL;

-- Índice de full-text search (GIN)
CREATE INDEX idx_p1_search_vector ON public.palabras_modelo_1 USING gin(search_vector);

-- Índices de rendimiento
CREATE INDEX idx_p1_created_at ON public.palabras_modelo_1(created_at DESC);
CREATE INDEX idx_p1_deleted_at ON public.palabras_modelo_1(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices trigram for LIKE/ILIKE optimization
CREATE INDEX idx_p1_namtrik_trgm ON public.palabras_modelo_1 USING gin(namtrik_termino gin_trgm_ops);
CREATE INDEX idx_p1_espanol_trgm ON public.palabras_modelo_1 USING gin(espanol_termino gin_trgm_ops);

-- Triggers
CREATE TRIGGER trg_p1_updated_at
  BEFORE UPDATE ON public.palabras_modelo_1
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_p1_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.palabras_modelo_1
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- -----------------------------------------------------------------------------
-- Tabla: public.palabras_modelo_2
-- Propósito: Dictionary words (Model 2: question-answer pairs)
-- -----------------------------------------------------------------------------
CREATE TABLE public.palabras_modelo_2 (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Pregunta en Namtrik
    namtrik_termino_pregunta public.citext NOT NULL,
    namtrik_contexto_pregunta text,
    namtrik_audio_pregunta text,
    
    -- Traducción de la pregunta
    espanol_traduccion_pregunta public.citext NOT NULL,
    
    -- Respuesta en Namtrik
    namtrik_termino_respuesta public.citext NOT NULL,
    namtrik_contexto_respuesta text,
    namtrik_audio_respuesta text,
    
    -- Traducción de la respuesta
    espanol_traduccion_respuesta public.citext NOT NULL,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(namtrik_termino_pregunta::text, '')), 'A') ||
      setweight(to_tsvector('spanish', coalesce(espanol_traduccion_pregunta::text, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(namtrik_termino_respuesta::text, '')), 'B') ||
      setweight(to_tsvector('spanish', coalesce(espanol_traduccion_respuesta::text, '')), 'B')
    ) STORED,
    
    -- Timestamps and soft delete
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT chk_p2_pregunta_len CHECK (char_length(namtrik_termino_pregunta::text) >= 1),
    CONSTRAINT chk_p2_respuesta_len CHECK (char_length(namtrik_termino_respuesta::text) >= 1),
    CONSTRAINT chk_p2_audio_pregunta_url CHECK (
      namtrik_audio_pregunta IS NULL OR namtrik_audio_pregunta ~* '^https?://'
    ),
    CONSTRAINT chk_p2_audio_respuesta_url CHECK (
      namtrik_audio_respuesta IS NULL OR namtrik_audio_respuesta ~* '^https?://'
    )
);

ALTER TABLE public.palabras_modelo_2 OWNER TO postgres;

COMMENT ON TABLE public.palabras_modelo_2 IS 'Palabras del diccionario - Modelo 2 (pares pregunta-respuesta)';
COMMENT ON COLUMN public.palabras_modelo_2.search_vector IS 'tsvector auto-generado para full-text search';

-- Índice de full-text search
CREATE INDEX idx_p2_search_vector ON public.palabras_modelo_2 USING gin(search_vector);

-- Índices de rendimiento
CREATE INDEX idx_p2_created_at ON public.palabras_modelo_2(created_at DESC);
CREATE INDEX idx_p2_deleted_at ON public.palabras_modelo_2(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices trigram
CREATE INDEX idx_p2_pregunta_trgm ON public.palabras_modelo_2 USING gin(namtrik_termino_pregunta gin_trgm_ops);
CREATE INDEX idx_p2_respuesta_trgm ON public.palabras_modelo_2 USING gin(namtrik_termino_respuesta gin_trgm_ops);

-- Triggers
CREATE TRIGGER trg_p2_updated_at
  BEFORE UPDATE ON public.palabras_modelo_2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_p2_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.palabras_modelo_2
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- -----------------------------------------------------------------------------
-- Tabla: public.palabrasm1_microcampos
-- Propósito: Many-to-many: palabras_modelo_1 ↔ microcampos
-- -----------------------------------------------------------------------------
CREATE TABLE public.palabrasm1_microcampos (
    palabra_id bigint NOT NULL,
    microcampo_id bigint NOT NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    
    PRIMARY KEY (palabra_id, microcampo_id)
);

ALTER TABLE public.palabrasm1_microcampos OWNER TO postgres;

COMMENT ON TABLE public.palabrasm1_microcampos IS 'Relación muchos a muchos: palabras_modelo_1 ↔ microcampos';

-- Claves foráneas con cascada al eliminar
ALTER TABLE public.palabrasm1_microcampos
  ADD CONSTRAINT palabrasm1_microcampos_palabra_id_fkey
  FOREIGN KEY (palabra_id) 
  REFERENCES public.palabras_modelo_1(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.palabrasm1_microcampos
  ADD CONSTRAINT palabrasm1_microcampos_microcampo_id_fkey
  FOREIGN KEY (microcampo_id) 
  REFERENCES public.microcampos(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices de rendimiento (reverse lookup)
CREATE INDEX idx_p1m_microcampo_id ON public.palabrasm1_microcampos(microcampo_id);
CREATE INDEX idx_p1m_palabra_id ON public.palabrasm1_microcampos(palabra_id);

-- -----------------------------------------------------------------------------
-- Tabla: public.palabrasm2_microcampos
-- Propósito: Many-to-many: palabras_modelo_2 ↔ microcampos
-- -----------------------------------------------------------------------------
CREATE TABLE public.palabrasm2_microcampos (
    palabra_id bigint NOT NULL,
    microcampo_id bigint NOT NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    
    PRIMARY KEY (palabra_id, microcampo_id)
);

ALTER TABLE public.palabrasm2_microcampos OWNER TO postgres;

COMMENT ON TABLE public.palabrasm2_microcampos IS 'Relación muchos a muchos: palabras_modelo_2 ↔ microcampos';

-- Claves foráneas con cascada
ALTER TABLE public.palabrasm2_microcampos
  ADD CONSTRAINT palabrasm2_microcampos_palabra_id_fkey
  FOREIGN KEY (palabra_id) 
  REFERENCES public.palabras_modelo_2(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.palabrasm2_microcampos
  ADD CONSTRAINT palabrasm2_microcampos_microcampo_id_fkey
  FOREIGN KEY (microcampo_id) 
  REFERENCES public.microcampos(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices de rendimiento
CREATE INDEX idx_p2m_microcampo_id ON public.palabrasm2_microcampos(microcampo_id);
CREATE INDEX idx_p2m_palabra_id ON public.palabrasm2_microcampos(palabra_id);

-- ============================================================================
-- SECCIÓN 8: MEJORAS DE VALIDACIÓN Y FUNCIONES AUXILIARES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Índices Parciales Adicionales
-- Propósito: Optimizar queries comunes de palabras activas y jerarquías
-- -----------------------------------------------------------------------------

-- Índice para consultas de "palabras activas recientes" (query muy común en listados)
CREATE INDEX idx_p1_active_recent 
ON public.palabras_modelo_1(created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_p2_active_recent 
ON public.palabras_modelo_2(created_at DESC) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_p1_active_recent IS 'Índice parcial para listados de palabras activas ordenadas por fecha';
COMMENT ON INDEX idx_p2_active_recent IS 'Índice parcial para listados de palabras activas ordenadas por fecha';

-- Índice para búsquedas por campo semántico (query frecuente en navegación jerárquica)
CREATE INDEX idx_microcampos_subcampo_active 
ON public.microcampos(subcampo_semantico_id) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_microcampos_subcampo_active IS 'Índice parcial para navegación de microcampos activos por subcampo';

-- -----------------------------------------------------------------------------
-- Constraints Mejorados de Validación
-- Propósito: Prevenir datos inconsistentes desde la base de datos
-- -----------------------------------------------------------------------------

-- Validación estricta de URLs de audio (solo HTTPS, dominio válido)
ALTER TABLE public.palabras_modelo_1
  DROP CONSTRAINT IF EXISTS chk_p1_audio_url,
  ADD CONSTRAINT chk_p1_audio_url CHECK (
    namtrik_audio IS NULL OR 
    namtrik_audio ~* '^https://[a-z0-9\-\.]+\.[a-z]{2,}'
  );

ALTER TABLE public.palabras_modelo_1
  DROP CONSTRAINT IF EXISTS chk_p1_espanol_audio_url,
  ADD CONSTRAINT chk_p1_espanol_audio_url CHECK (
    espanol_audio IS NULL OR 
    espanol_audio ~* '^https://[a-z0-9\-\.]+\.[a-z]{2,}'
  );

ALTER TABLE public.palabras_modelo_2
  DROP CONSTRAINT IF EXISTS chk_p2_audio_pregunta_url,
  ADD CONSTRAINT chk_p2_audio_pregunta_url CHECK (
    namtrik_audio_pregunta IS NULL OR 
    namtrik_audio_pregunta ~* '^https://[a-z0-9\-\.]+\.[a-z]{2,}'
  );

ALTER TABLE public.palabras_modelo_2
  DROP CONSTRAINT IF EXISTS chk_p2_audio_respuesta_url,
  ADD CONSTRAINT chk_p2_audio_respuesta_url CHECK (
    namtrik_audio_respuesta IS NULL OR 
    namtrik_audio_respuesta ~* '^https://[a-z0-9\-\.]+\.[a-z]{2,}'
  );

-- Validar que las descripciones no sean solo espacios en blanco
ALTER TABLE public.palabras_modelo_1
  ADD CONSTRAINT chk_p1_descripcion_no_empty CHECK (
    namtrik_descripcion IS NULL OR trim(namtrik_descripcion) != ''
  ),
  ADD CONSTRAINT chk_p1_espanol_descripcion_no_empty CHECK (
    espanol_descripcion IS NULL OR trim(espanol_descripcion) != ''
  );

ALTER TABLE public.campos_semanticos
  ADD CONSTRAINT chk_campos_descripcion_no_empty CHECK (
    namtrik_descripcion IS NULL OR trim(namtrik_descripcion) != ''
  ),
  ADD CONSTRAINT chk_campos_espanol_descripcion_no_empty CHECK (
    espanol_descripcion IS NULL OR trim(espanol_descripcion) != ''
  );

ALTER TABLE public.subcampos_semanticos
  ADD CONSTRAINT chk_subcampos_descripcion_no_empty CHECK (
    namtrik_descripcion IS NULL OR trim(namtrik_descripcion) != ''
  ),
  ADD CONSTRAINT chk_subcampos_espanol_descripcion_no_empty CHECK (
    espanol_descripcion IS NULL OR trim(espanol_descripcion) != ''
  );

ALTER TABLE public.microcampos
  ADD CONSTRAINT chk_microcampos_descripcion_no_empty CHECK (
    namtrik_descripcion IS NULL OR trim(namtrik_descripcion) != ''
  ),
  ADD CONSTRAINT chk_microcampos_espanol_descripcion_no_empty CHECK (
    espanol_descripcion IS NULL OR trim(espanol_descripcion) != ''
  );

-- -----------------------------------------------------------------------------
-- Función Auxiliar: Soft Delete en Cascada
-- Propósito: Soft delete de toda la jerarquía de campos semánticos
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.soft_delete_campo_semantico(campo_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  affected_subcampos int;
  affected_microcampos int;
BEGIN
  -- Validar que el campo exista y no esté ya eliminado
  IF NOT EXISTS (
    SELECT 1 FROM public.campos_semanticos 
    WHERE id = campo_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Campo semántico % no existe o ya está eliminado', campo_id;
  END IF;

  -- Soft delete de microcampos relacionados
  UPDATE public.microcampos 
  SET deleted_at = now() 
  WHERE subcampo_semantico_id IN (
    SELECT id FROM public.subcampos_semanticos WHERE campo_semantico_id = campo_id
  ) AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_microcampos = ROW_COUNT;
  
  -- Soft delete de subcampos
  UPDATE public.subcampos_semanticos 
  SET deleted_at = now() 
  WHERE campo_semantico_id = campo_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_subcampos = ROW_COUNT;
  
  -- Soft delete del campo semántico
  UPDATE public.campos_semanticos 
  SET deleted_at = now() 
  WHERE id = campo_id AND deleted_at IS NULL;
  
  RAISE NOTICE 'Soft delete completado: 1 campo, % subcampos, % microcampos', 
    affected_subcampos, affected_microcampos;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_campo_semantico IS 
  'Soft delete en cascada de un campo semántico y toda su jerarquía (subcampos y microcampos). Útil para panel de administración.';

-- ============================================================================
-- SECCIÓN 9: ROW LEVEL SECURITY (RLS) - OPCIONAL
-- ============================================================================
-- Descomentar para habilitar RLS para multi-tenant o control de acceso basado en roles

/*
-- Habilitar RLS en tablas sensibles
ALTER TABLE public.palabras_modelo_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palabras_modelo_2 ENABLE ROW LEVEL SECURITY;

-- Política: Acceso de lectura público (respetando soft deletes)
CREATE POLICY palabras_modelo_1_select_policy
  ON public.palabras_modelo_1
  FOR SELECT
  USING (deleted_at IS NULL);

-- Política: Acceso completo para administradores
CREATE POLICY palabras_modelo_1_admin_policy
  ON public.palabras_modelo_1
  FOR ALL
  TO admin_role
  USING (true)
  WITH CHECK (true);
*/

-- ============================================================================
-- SECCIÓN 10: DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================
-- Descomentar para insertar datos de ejemplo para desarrollo

/*
INSERT INTO public.campos_semanticos (namtrik_termino, espanol_termino, namtrik_descripcion, espanol_descripcion)
VALUES 
  ('Misak', 'Pueblo Misak', 'Namtrik description', 'Descripción en español'),
  ('Namuy Wam', 'Territorio', 'Territorio ancestral', 'Ancestral territory')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- SECCIÓN 11: VACUUM Y ANALYZE
-- ============================================================================
-- Ejecutar después de la carga inicial para planificación óptima de consultas

-- VACUUM ANALYZE;

-- ============================================================================
-- SECCIÓN 12: RECOMENDACIONES DE RENDIMIENTO
-- ============================================================================
/*
RECOMENDACIONES PARA PRODUCCIÓN:

1. Connection Pooling: Use PgBouncer (transaction mode)
2. Monitoring: Enable pg_stat_statements extension
3. Autovacuum: Tune autovacuum settings for high-write tables
4. Partitioning: Consider time-based partitioning for audit.row_changes
5. Read Replicas: Route read queries to replicas
6. Cache Layer: Implement Redis for frequently accessed data
7. Backup: Schedule daily pg_dump with retention policy
8. Vector Index: Monitor HNSW recall/latency and tune ef_search parameter
9. FTS: Periodically run VACUUM FULL on tables with tsvector
10. Security: Review and enable RLS policies before production

CONSULTAS DE AJUSTE DE RENDIMIENTO:

-- Verificar uso de índices
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Verificar bloat de tablas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Consultas lentas (requiere pg_stat_statements)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
*/

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================