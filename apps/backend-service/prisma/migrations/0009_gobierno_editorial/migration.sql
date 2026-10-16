-- ================================================================
-- 0009_gobierno_editorial
-- Columnas de editor/ratificación, estado en subcampos y microcampos,
-- CHECKs relacionales, users.must_change_password, system_settings e índices.
-- ================================================================

-- 1) Flag de cambio obligatorio de contraseña en usuarios
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- 2) Gobierno editorial en campos semánticos
ALTER TABLE "campos_semanticos"
  ADD COLUMN IF NOT EXISTS "ultimo_editor_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ultimo_editor_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "ratificado_por_id" BIGINT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campos_semanticos_ultimo_editor_id_fkey'
  ) THEN
    ALTER TABLE "campos_semanticos"
      ADD CONSTRAINT "campos_semanticos_ultimo_editor_id_fkey"
      FOREIGN KEY ("ultimo_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campos_semanticos_ratificado_por_id_fkey'
  ) THEN
    ALTER TABLE "campos_semanticos"
      ADD CONSTRAINT "campos_semanticos_ratificado_por_id_fkey"
      FOREIGN KEY ("ratificado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campos_semanticos_estado_check'
  ) THEN
    ALTER TABLE "campos_semanticos"
      ADD CONSTRAINT "campos_semanticos_estado_check"
      CHECK ("estado" IN ('borrador', 'ratificado'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campos_semanticos_ratificado_check'
  ) THEN
    ALTER TABLE "campos_semanticos"
      ADD CONSTRAINT "campos_semanticos_ratificado_check"
      CHECK (("estado" = 'ratificado') = ("ratificado_at" IS NOT NULL));
  END IF;
END $$;

-- 3) Gobierno editorial en subcampos semánticos
ALTER TABLE "subcampos_semanticos"
  ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'borrador',
  ADD COLUMN IF NOT EXISTS "ultimo_editor_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ultimo_editor_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "ratificado_por_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ratificado_at" TIMESTAMPTZ(3);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subcampos_semanticos_ultimo_editor_id_fkey'
  ) THEN
    ALTER TABLE "subcampos_semanticos"
      ADD CONSTRAINT "subcampos_semanticos_ultimo_editor_id_fkey"
      FOREIGN KEY ("ultimo_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subcampos_semanticos_ratificado_por_id_fkey'
  ) THEN
    ALTER TABLE "subcampos_semanticos"
      ADD CONSTRAINT "subcampos_semanticos_ratificado_por_id_fkey"
      FOREIGN KEY ("ratificado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subcampos_semanticos_estado_check'
  ) THEN
    ALTER TABLE "subcampos_semanticos"
      ADD CONSTRAINT "subcampos_semanticos_estado_check"
      CHECK ("estado" IN ('borrador', 'ratificado'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subcampos_semanticos_ratificado_check'
  ) THEN
    ALTER TABLE "subcampos_semanticos"
      ADD CONSTRAINT "subcampos_semanticos_ratificado_check"
      CHECK (("estado" = 'ratificado') = ("ratificado_at" IS NOT NULL));
  END IF;
END $$;

-- 4) Gobierno editorial en microcampos
ALTER TABLE "microcampos"
  ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'borrador',
  ADD COLUMN IF NOT EXISTS "ultimo_editor_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ultimo_editor_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "ratificado_por_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ratificado_at" TIMESTAMPTZ(3);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'microcampos_ultimo_editor_id_fkey'
  ) THEN
    ALTER TABLE "microcampos"
      ADD CONSTRAINT "microcampos_ultimo_editor_id_fkey"
      FOREIGN KEY ("ultimo_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'microcampos_ratificado_por_id_fkey'
  ) THEN
    ALTER TABLE "microcampos"
      ADD CONSTRAINT "microcampos_ratificado_por_id_fkey"
      FOREIGN KEY ("ratificado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'microcampos_estado_check'
  ) THEN
    ALTER TABLE "microcampos"
      ADD CONSTRAINT "microcampos_estado_check"
      CHECK ("estado" IN ('borrador', 'ratificado'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'microcampos_ratificado_check'
  ) THEN
    ALTER TABLE "microcampos"
      ADD CONSTRAINT "microcampos_ratificado_check"
      CHECK (("estado" = 'ratificado') = ("ratificado_at" IS NOT NULL));
  END IF;
END $$;

-- 5) Gobierno editorial en sentidos léxicos
ALTER TABLE "sentidos_lexicos"
  ADD COLUMN IF NOT EXISTS "ultimo_editor_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ultimo_editor_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "ratificado_por_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "ratificado_at" TIMESTAMPTZ(3);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sentidos_lexicos_ultimo_editor_id_fkey'
  ) THEN
    ALTER TABLE "sentidos_lexicos"
      ADD CONSTRAINT "sentidos_lexicos_ultimo_editor_id_fkey"
      FOREIGN KEY ("ultimo_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sentidos_lexicos_ratificado_por_id_fkey'
  ) THEN
    ALTER TABLE "sentidos_lexicos"
      ADD CONSTRAINT "sentidos_lexicos_ratificado_por_id_fkey"
      FOREIGN KEY ("ratificado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sentidos_lexicos_ratificado_check'
  ) THEN
    ALTER TABLE "sentidos_lexicos"
      ADD CONSTRAINT "sentidos_lexicos_ratificado_check"
      CHECK (("estado" = 'ratificado') = ("ratificado_at" IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "sentidos_lexicos_estado_activo_idx"
  ON "sentidos_lexicos"("estado")
  WHERE "deleted_at" IS NULL;

-- 6) Tabla de configuraciones globales del sistema (system_settings)
CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updated_by_id" BIGINT,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "system_settings_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "system_settings" ("key", "value", "updated_at")
VALUES ('PUBLIC_ONLY_RATIFIED', 'false'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 7) Índices de auditoría para consulta paginada
CREATE INDEX IF NOT EXISTS "audit_log_created_at_desc_idx"
  ON "audit_log"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "audit_log_action_created_at_idx"
  ON "audit_log"("action", "created_at" DESC);
