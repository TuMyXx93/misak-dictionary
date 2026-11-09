-- ================================================================
-- 0012_search_vector_sentidos_trgm — Spec 009
-- Búsqueda bilingüe vectorizada de alto rendimiento sobre
-- Sentidos Léxicos (Spec 005) y Formas Namtrik con normalización
-- fonética/ortográfica insensible a variantes (ɵ, ø, ə, ɔ, o, ɨ, i)
-- y tildes, con índices GIN de trigramas (pg_trgm) y FTS (tsvector).
-- ================================================================

-- 1. Función inmutable de normalización fonética y ortográfica bilingüe
CREATE OR REPLACE FUNCTION public.immutable_normalize_namtrik_es(input_text text)
RETURNS text AS $$
SELECT translate(
  lower(public.immutable_unaccent(coalesce(input_text, ''))),
  'ɵøəɔɨ',
  'ooooi'
);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

COMMENT ON FUNCTION public.immutable_normalize_namtrik_es IS
  'Normaliza texto en Namtrik y Español unificando alógrafas vocálicas (ɵ/ø/ə/ɔ/o y ɨ/i) y acentos para indexación GIN';

-- 2. Índice GIN de trigramas sobre formas namtrik (búsqueda y autocompletado rápido)
CREATE INDEX IF NOT EXISTS idx_formas_namtrik_lema_trgm
ON formas_namtrik
USING GIN (public.immutable_normalize_namtrik_es(lema::text) gin_trgm_ops);

-- 3. Índice GIN de trigramas sobre glosa en español de sentidos léxicos activos
CREATE INDEX IF NOT EXISTS idx_sentidos_glosa_trgm
ON sentidos_lexicos
USING GIN (public.immutable_normalize_namtrik_es(espanol_glosa::text) gin_trgm_ops)
WHERE deleted_at IS NULL;

-- 4. Índice GIN Full-Text Search sobre glosa, explicación y contexto del sentido
CREATE INDEX IF NOT EXISTS idx_sentidos_fts_vector
ON sentidos_lexicos
USING GIN (to_tsvector('spanish', public.immutable_normalize_namtrik_es(
  coalesce(espanol_glosa::text, '') || ' ' ||
  coalesce(espanol_explicacion, '') || ' ' ||
  coalesce(namtrik_contexto, '')
)))
WHERE deleted_at IS NULL;
