-- ================================================================
-- 0010_medios_culturales
-- Tabla de medios culturales (audios de pronunciación e ilustraciones),
-- relaciones con sentidos_lexicos y formas_namtrik, restricciones CHECK,
-- auditoría de ratificación e índices de búsqueda/rendimiento (Spec 007).
-- ================================================================

-- 1) Crear tabla de medios culturales
CREATE TABLE IF NOT EXISTS "medios_culturales" (
  "id" BIGSERIAL PRIMARY KEY,
  "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sentido_id" BIGINT,
  "forma_id" BIGINT,
  "tipo" TEXT NOT NULL,
  "proposito" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "mimetype" TEXT NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "hash_sha256" TEXT NOT NULL,
  "duracion_segundos" DOUBLE PRECISION,
  "ancho_px" INTEGER,
  "alto_px" INTEGER,
  "estado" TEXT NOT NULL DEFAULT 'borrador',
  "hablante_autor" TEXT,
  "variante_dialectal" TEXT,
  "descripcion_espanol" TEXT,
  "descripcion_namtrik" TEXT,
  "licencia_comunitaria" TEXT NOT NULL DEFAULT 'Propiedad Intelectual Colectiva del Pueblo Misak',
  "subido_por_id" BIGINT,
  "ratificado_por_id" BIGINT,
  "ratificado_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(3)
);

-- 2) Clave única sobre uuid
CREATE UNIQUE INDEX IF NOT EXISTS "medios_culturales_uuid_key" ON "medios_culturales"("uuid");

-- 3) Claves foráneas con integridad referencial
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_sentido_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_sentido_id_fkey"
      FOREIGN KEY ("sentido_id") REFERENCES "sentidos_lexicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_forma_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_forma_id_fkey"
      FOREIGN KEY ("forma_id") REFERENCES "formas_namtrik"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_subido_por_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_subido_por_id_fkey"
      FOREIGN KEY ("subido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_ratificado_por_id_fkey'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_ratificado_por_id_fkey"
      FOREIGN KEY ("ratificado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Restricciones CHECK para integridad semántica y gobernanza
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_tipo_check'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_tipo_check"
      CHECK ("tipo" IN ('audio', 'imagen'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_proposito_check'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_proposito_check"
      CHECK ("proposito" IN (
        'pronunciacion_lema',
        'contexto_oracion',
        'pregunta_dialogo',
        'respuesta_dialogo',
        'ilustracion_cultural',
        'fotografia_territorio'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_estado_check'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_estado_check"
      CHECK ("estado" IN ('borrador', 'ratificado'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_ratificado_check'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_ratificado_check"
      CHECK (("estado" = 'ratificado') = ("ratificado_at" IS NOT NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medios_culturales_asociacion_check'
  ) THEN
    ALTER TABLE "medios_culturales"
      ADD CONSTRAINT "medios_culturales_asociacion_check"
      CHECK ("sentido_id" IS NOT NULL OR "forma_id" IS NOT NULL);
  END IF;
END $$;

-- 5) Índices para rendimiento de consultas
CREATE INDEX IF NOT EXISTS "medios_culturales_sentido_id_idx" ON "medios_culturales"("sentido_id");
CREATE INDEX IF NOT EXISTS "medios_culturales_forma_id_idx" ON "medios_culturales"("forma_id");
CREATE INDEX IF NOT EXISTS "medios_culturales_estado_idx" ON "medios_culturales"("estado");
CREATE INDEX IF NOT EXISTS "medios_culturales_tipo_idx" ON "medios_culturales"("tipo");
CREATE INDEX IF NOT EXISTS "medios_culturales_hash_sha256_idx" ON "medios_culturales"("hash_sha256");
