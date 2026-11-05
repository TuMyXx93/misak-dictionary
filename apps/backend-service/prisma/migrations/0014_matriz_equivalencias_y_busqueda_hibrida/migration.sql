-- ================================================================
-- 0014_matriz_equivalencias_y_busqueda_hibrida — Spec 012 / ADR-0008
-- Matriz de equivalencias bilingüe, índices funcionales BTREE/GIN,
-- columna vectorial pgvector vector(384) e índice HNSW.
-- ================================================================

-- 1. Crear tabla equivalencias_bilingues
CREATE TABLE IF NOT EXISTS equivalencias_bilingues (
    id BIGSERIAL PRIMARY KEY,
    sentido_id BIGINT NOT NULL,
    termino_es public.citext NOT NULL,
    termino_namtrik public.citext,
    tipo_relacion VARCHAR(50) NOT NULL,
    peso DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    origen VARCHAR(50) NOT NULL DEFAULT 'corpus_v1',
    ratificado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equivalencias_sentido FOREIGN KEY (sentido_id)
        REFERENCES sentidos_lexicos(id) ON DELETE CASCADE,
    CONSTRAINT uq_equivalencias_sentido_termino_tipo UNIQUE (sentido_id, termino_es, tipo_relacion)
);

-- 2. Índices de soporte para equivalencias_bilingues
CREATE INDEX IF NOT EXISTS idx_equivalencias_sentido_id ON equivalencias_bilingues(sentido_id);
CREATE INDEX IF NOT EXISTS idx_equivalencias_tipo_relacion ON equivalencias_bilingues(tipo_relacion);

CREATE INDEX IF NOT EXISTS idx_equivalencias_termino_es_norm_btree
    ON equivalencias_bilingues USING btree (public.immutable_normalize_namtrik_es(termino_es::text));

CREATE INDEX IF NOT EXISTS idx_equivalencias_termino_es_norm_trgm
    ON equivalencias_bilingues USING gin (public.immutable_normalize_namtrik_es(termino_es::text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_equivalencias_termino_nt_norm_btree
    ON equivalencias_bilingues USING btree (public.immutable_normalize_namtrik_es(coalesce(termino_namtrik::text, '')));

-- 3. Añadir columna vectorial en sentidos_lexicos e índice HNSW (pgvector)
ALTER TABLE sentidos_lexicos ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS idx_sentidos_embedding_hnsw
    ON sentidos_lexicos USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 4. Poblado inicial idempotente de equivalencias_bilingues desde el corpus v1

-- 4.1. Glosas directas principales (peso 1.0)
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    public.misak_glosa_cabeza(s.espanol_glosa::text)::public.citext,
    (SELECT f.lema FROM formas_namtrik f WHERE f.sentido_id = s.id ORDER BY f.orden ASC LIMIT 1),
    'glosa_directa',
    1.0,
    'corpus_v1',
    true
FROM sentidos_lexicos s
WHERE s.deleted_at IS NULL
  AND length(trim(public.misak_glosa_cabeza(s.espanol_glosa::text))) >= 2
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- 4.2. Sub-acepciones separadas por comas o punto y coma
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT DISTINCT
    s.id,
    trim(token)::public.citext,
    (SELECT f.lema FROM formas_namtrik f WHERE f.sentido_id = s.id ORDER BY f.orden ASC LIMIT 1),
    'sub_acepcion',
    0.95,
    'corpus_v1',
    true
FROM sentidos_lexicos s,
LATERAL regexp_split_to_table(split_part(s.espanol_glosa::text, '(', 1), '[,;]') AS token
WHERE s.deleted_at IS NULL
  AND length(trim(token)) >= 2
  AND trim(token) != public.misak_glosa_cabeza(s.espanol_glosa::text)
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- 4.3. Extracción de núcleos nominales de glosas descriptivas
-- "Representación de la/del <X>" -> "<X>" (p. ej. Kɵnchapik -> estrella)
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    trim(regexp_replace(s.espanol_glosa::text, '(?i)^representaci[oó]n\s+de\s+(?:la\s+|el\s+|los\s+|las\s+|del\s+)?', ''))::public.citext,
    (SELECT f.lema FROM formas_namtrik f WHERE f.sentido_id = s.id ORDER BY f.orden ASC LIMIT 1),
    'nucleo_nominal',
    0.95,
    'corpus_v1',
    true
FROM sentidos_lexicos s
WHERE s.deleted_at IS NULL
  AND s.espanol_glosa ~* '^representaci[oó]n\s+de'
  AND length(trim(regexp_replace(s.espanol_glosa::text, '(?i)^representaci[oó]n\s+de\s+(?:la\s+|el\s+|los\s+|las\s+|del\s+)?', ''))) >= 3
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- "Nuestro/a <X>" -> "<X>" (p. ej. Kɵrɵishik -> mundo)
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    trim(regexp_replace(s.espanol_glosa::text, '(?i)^nuestr[oa]s?\s+', ''))::public.citext,
    (SELECT f.lema FROM formas_namtrik f WHERE f.sentido_id = s.id ORDER BY f.orden ASC LIMIT 1),
    'nucleo_nominal',
    0.95,
    'corpus_v1',
    true
FROM sentidos_lexicos s
WHERE s.deleted_at IS NULL
  AND s.espanol_glosa ~* '^nuestr[oa]s?\s+'
  AND length(trim(regexp_replace(s.espanol_glosa::text, '(?i)^nuestr[oa]s?\s+', ''))) >= 3
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- 4.4. Raíces morfológicas Namtrik: familia "Pura" ↔ "maíz"
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT DISTINCT
    s.id,
    'maíz'::public.citext,
    'Pura'::public.citext,
    'raiz_morfologica',
    0.90,
    'derivacion_morfologica',
    true
FROM sentidos_lexicos s
JOIN formas_namtrik f ON f.sentido_id = s.id
WHERE s.deleted_at IS NULL
  AND public.immutable_normalize_namtrik_es(f.lema) LIKE 'pura%'
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- 4.5. Casos de equivalencia cultural canónicos curados
-- C1.S3.E013 Kɵnchapik -> estrella
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    'estrella'::public.citext,
    'Kɵnchapik'::public.citext,
    'nucleo_nominal',
    0.95,
    'curaduria_linguistica',
    true
FROM sentidos_lexicos s
WHERE s.codigo = 'C1.S3.E013'
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- C2.S4.E019 Kɵrɵishik -> mundo
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    'mundo'::public.citext,
    'Kɵrɵishik'::public.citext,
    'nucleo_nominal',
    0.95,
    'curaduria_linguistica',
    true
FROM sentidos_lexicos s
WHERE s.codigo = 'C2.S4.E019'
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;

-- C6.S5.E028 Ú -> flor
INSERT INTO equivalencias_bilingues (sentido_id, termino_es, termino_namtrik, tipo_relacion, peso, origen, ratificado)
SELECT
    s.id,
    'flor'::public.citext,
    'Ú'::public.citext,
    'glosa_directa',
    1.0,
    'curaduria_linguistica',
    true
FROM sentidos_lexicos s
WHERE s.codigo = 'C6.S5.E028'
ON CONFLICT (sentido_id, termino_es, tipo_relacion)
DO UPDATE SET peso = EXCLUDED.peso, ratificado = EXCLUDED.ratificado;
