-- ================================================================
-- 0011_medios_video_taxonomia
-- Ampliación de medios_culturales para soportar video (hasta 100 MB),
-- asociación taxonómica (campo, subcampo, microcampo), póster UUID,
-- metadatos extensibles JSONB, tipos futuros (documento, modelo_3d)
-- y subida al catálogo general sin restricción de asociación obligatoria.
-- ================================================================

-- 1) Nuevas columnas en medios_culturales (idempotente)
ALTER TABLE "medios_culturales" ADD COLUMN IF NOT EXISTS "campo_semantico_id" BIGINT;
ALTER TABLE "medios_culturales" ADD COLUMN IF NOT EXISTS "subcampo_semantico_id" BIGINT;
ALTER TABLE "medios_culturales" ADD COLUMN IF NOT EXISTS "microcampo_id" BIGINT;
ALTER TABLE "medios_culturales" ADD COLUMN IF NOT EXISTS "poster_uuid" UUID;
ALTER TABLE "medios_culturales" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 2) Claves foráneas hacia la jerarquía taxonómica (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_campo_semantico_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_campo_semantico_id_fkey"
      FOREIGN KEY ("campo_semantico_id") REFERENCES "campos_semanticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_subcampo_semantico_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_subcampo_semantico_id_fkey"
      FOREIGN KEY ("subcampo_semantico_id") REFERENCES "subcampos_semanticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_microcampo_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_microcampo_id_fkey"
      FOREIGN KEY ("microcampo_id") REFERENCES "microcampos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) Índices sobre claves foráneas taxonómicas (idempotente)
CREATE INDEX IF NOT EXISTS "medios_culturales_campo_semantico_id_idx" ON "medios_culturales"("campo_semantico_id");
CREATE INDEX IF NOT EXISTS "medios_culturales_subcampo_semantico_id_idx" ON "medios_culturales"("subcampo_semantico_id");
CREATE INDEX IF NOT EXISTS "medios_culturales_microcampo_id_idx" ON "medios_culturales"("microcampo_id");

-- 4) Actualización de restricciones CHECK para tipos y propósitos extendidos
ALTER TABLE "medios_culturales" DROP CONSTRAINT IF EXISTS "medios_culturales_tipo_check";
ALTER TABLE "medios_culturales"
  ADD CONSTRAINT "medios_culturales_tipo_check"
  CHECK ("tipo" IN ('audio', 'imagen', 'video', 'documento', 'modelo_3d'));

ALTER TABLE "medios_culturales" DROP CONSTRAINT IF EXISTS "medios_culturales_proposito_check";
ALTER TABLE "medios_culturales"
  ADD CONSTRAINT "medios_culturales_proposito_check"
  CHECK ("proposito" IN (
    'pronunciacion_lema',
    'contexto_oracion',
    'pregunta_dialogo',
    'respuesta_dialogo',
    'ilustracion_cultural',
    'fotografia_territorio',
    'registro_practica_cultural',
    'relato_oral_video',
    'demostracion_uso',
    'recorrido_territorial',
    'documento_etnolinguistico'
  ));

-- 5) Eliminación de obligatoriedad de sentido/forma para permitir asociación
--    a campo/subcampo/microcampo o subida directa al catálogo general (/admin/medios)
ALTER TABLE "medios_culturales" DROP CONSTRAINT IF EXISTS "medios_culturales_asociacion_check";
