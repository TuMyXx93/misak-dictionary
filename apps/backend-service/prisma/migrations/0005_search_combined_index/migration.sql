-- ================================================================
-- 0005_search_combined_index — Spec 003
-- El repositorio de búsqueda consultaba una columna search_vector que
-- nunca existió en el esquema (hallazgo del slice de integración).
-- Se alinea la búsqueda al patrón de índices-por-expresión de 0002
-- (to_tsvector de 2 argumentos es IMMUTABLE → indexable) y se crea
-- el índice que cubre namtrik + español + descripción.
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_palabras_m1_fts_combined
ON palabras_modelo_1
USING GIN (to_tsvector('spanish', immutable_unaccent(
  coalesce(namtrik_termino, '') || ' ' ||
  coalesce(espanol_termino, '') || ' ' ||
  coalesce(espanol_descripcion, '')
)));
