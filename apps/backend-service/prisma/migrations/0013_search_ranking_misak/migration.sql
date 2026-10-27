-- ================================================================
-- 0013_search_ranking_misak — Spec 009 Enmienda 0.2.0
-- Normalización v2 bilingüe, extracción de cabeza de glosa,
-- clave de ordenamiento alfabético Misak (VBA Port) e índices GIN.
-- ================================================================

-- 1. Normalización fonética y ortográfica bilingüe Namtrik/Español v2
-- Unifica variantes de la vocal Misak: ɵ, Ɵ, θ, Θ, ϴ, ø, Ø, ∅, ə, ɔ -> o
-- Excluye el grafema ɨ (no usado en Namtrik) y elimina acentos y mayúsculas.
CREATE OR REPLACE FUNCTION public.immutable_normalize_namtrik_es(input_text text)
RETURNS text AS $$
SELECT translate(
  lower(public.immutable_unaccent(coalesce(input_text, ''))),
  'ɵƟθΘϴøØ∅əɔ',
  'oooooooooo'
);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

COMMENT ON FUNCTION public.immutable_normalize_namtrik_es IS
  'Normaliza texto en Namtrik y Español unificando alógrafas vocálicas (ɵ/Ɵ/θ/Θ/ϴ/ø/Ø/∅/ə/ɔ -> o), tildes y mayúsculas';

-- 2. Extracción de cabeza de glosa en español (término primario antes de paréntesis o puntuación)
CREATE OR REPLACE FUNCTION public.misak_glosa_cabeza(glosa text)
RETURNS text AS $$
SELECT trim(
  split_part(
    split_part(
      split_part(
        split_part(coalesce(glosa, ''), '(', 1),
        ',', 1
      ),
      ';', 1
    ),
    ':', 1
  )
);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

COMMENT ON FUNCTION public.misak_glosa_cabeza IS
  'Extrae el lema o término primario de la glosa en español antes de aclaraciones taxonómicas o paréntesis';

-- 3. Clave de ordenamiento Misak canónica (Port fiel del algoritmo VBA OrdenarBloqueMisak)
-- Secuencia alfabética Misak: 1:M, 2:W, 3:TR, 4:SR, 5:I, 6:K, 7:P, 8:SH, 9:TS, 10:Ɵ/Ø/O, 11:L, 12:U, 13:CH, 14:LL, 15:E, 16:Y, 17:N, 18:Ñ, 19:A, 20:T, 21:S, R interna: V
CREATE OR REPLACE FUNCTION public.misak_sort_key(input_text text)
RETURNS text AS $$
DECLARE
  clean text;
  len int;
  idx int := 1;
  res text := '';
  d2 text;
  c1 text;
BEGIN
  -- 1. Tomar lema antes del primer paréntesis
  clean := split_part(coalesce(input_text, ''), '(', 1);
  -- 2. Normalizar tildes, minúsculas y grafías vocálicas
  clean := public.immutable_normalize_namtrik_es(clean);
  -- 3. Conservar únicamente caracteres alfabéticos
  clean := regexp_replace(clean, '[^a-zñ]', '', 'g');
  len := length(clean);

  WHILE idx <= len LOOP
    d2 := substr(clean, idx, 2);
    c1 := substr(clean, idx, 1);

    -- Dígrafos prioritarios
    IF d2 = 'tr' THEN
      res := res || 'C'; idx := idx + 2;
    ELSIF d2 = 'sr' THEN
      res := res || 'D'; idx := idx + 2;
    ELSIF d2 = 'sh' THEN
      res := res || 'H'; idx := idx + 2;
    ELSIF d2 = 'ts' THEN
      res := res || 'I'; idx := idx + 2;
    ELSIF d2 = 'ch' THEN
      res := res || 'M'; idx := idx + 2;
    ELSIF d2 = 'll' THEN
      res := res || 'N'; idx := idx + 2;
    -- Monógrafos según secuencia alfabética Misak
    ELSIF c1 = 'm' THEN
      res := res || 'A'; idx := idx + 1;
    ELSIF c1 = 'w' THEN
      res := res || 'B'; idx := idx + 1;
    ELSIF c1 = 'i' THEN
      res := res || 'E'; idx := idx + 1;
    ELSIF c1 = 'k' THEN
      res := res || 'F'; idx := idx + 1;
    ELSIF c1 = 'p' THEN
      res := res || 'G'; idx := idx + 1;
    ELSIF c1 = 'o' THEN -- ɵ/ø/∅/o
      res := res || 'J'; idx := idx + 1;
    ELSIF c1 = 'l' THEN
      res := res || 'K'; idx := idx + 1;
    ELSIF c1 = 'u' THEN
      res := res || 'L'; idx := idx + 1;
    ELSIF c1 = 'e' THEN
      res := res || 'O'; idx := idx + 1;
    ELSIF c1 = 'y' THEN
      res := res || 'P'; idx := idx + 1;
    ELSIF c1 = 'n' THEN
      res := res || 'Q'; idx := idx + 1;
    ELSIF c1 = 'ñ' THEN
      res := res || 'R'; idx := idx + 1;
    ELSIF c1 = 'a' THEN
      res := res || 'S'; idx := idx + 1;
    ELSIF c1 = 't' THEN
      res := res || 'T'; idx := idx + 1;
    ELSIF c1 = 's' THEN
      res := res || 'U'; idx := idx + 1;
    ELSIF c1 = 'r' THEN -- 'r' vibrante interna tras el alfabeto
      res := res || 'V'; idx := idx + 1;
    ELSE
      res := res || 'Z' || c1; idx := idx + 1;
    END IF;
  END LOOP;

  RETURN res;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;

COMMENT ON FUNCTION public.misak_sort_key IS
  'Genera una clave de ordenamiento ASCII equivalente a la secuencia del alfabeto Misak del macro VBA';

-- 4. Índice GIN de trigramas sobre cabeza de glosa en español
CREATE INDEX IF NOT EXISTS idx_sentidos_glosa_cabeza_trgm
ON sentidos_lexicos
USING GIN (public.immutable_normalize_namtrik_es(public.misak_glosa_cabeza(espanol_glosa::text)) gin_trgm_ops)
WHERE deleted_at IS NULL;

-- 5. Reindexar índices existentes para aplicar la normalización v2
REINDEX INDEX idx_formas_namtrik_lema_trgm;
REINDEX INDEX idx_sentidos_glosa_trgm;
REINDEX INDEX idx_sentidos_fts_vector;
