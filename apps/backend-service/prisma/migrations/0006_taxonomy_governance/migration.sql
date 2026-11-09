-- ================================================================
-- 0006_taxonomy_governance
-- Taxonomía gobernada (PDF de estructura), botones del home en BD,
-- borrado con restauración y cambio de contraseña obligatorio.
-- Cambios no destructivos: las filas existentes reciben código y slug
-- de respaldo (LEG-*) para poder limpiarlas explícitamente en desarrollo.
-- ================================================================

-- 1) Unicidades globales/por borrado que no protegían lo correcto
DROP INDEX IF EXISTS "campos_semanticos_namtrik_unique";
DROP INDEX IF EXISTS "campos_semanticos_espanol_unique";
DROP INDEX IF EXISTS "subcampos_unique_namtrik";
DROP INDEX IF EXISTS "subcampos_unique_espanol";
DROP INDEX IF EXISTS "microcampos_unique_namtrik";
DROP INDEX IF EXISTS "microcampos_unique_espanol";

-- 2) Columnas nuevas
ALTER TABLE "campos_semanticos"
  ADD COLUMN "codigo" TEXT,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "posicion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'borrador',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "ratificado_por" TEXT,
  ADD COLUMN "ratificado_at" TIMESTAMPTZ(3),
  ADD CONSTRAINT "campos_estado_check" CHECK ("estado" IN ('borrador', 'revision', 'ratificado', 'archivado'));

ALTER TABLE "subcampos_semanticos"
  ADD COLUMN "codigo" TEXT,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "posicion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "microcampos"
  ADD COLUMN "padre_id" BIGINT,
  ADD COLUMN "codigo" TEXT,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "posicion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- 3) Backfill de filas legacy (slug ASCII + sufijo id para evitar colisiones)
UPDATE "campos_semanticos" SET
  "codigo" = 'LEG-C-' || "id",
  "slug" = btrim(regexp_replace(lower(unaccent(translate("namtrik_termino", 'ɵƟəƏʊɔƆ', 'oOeEuoO'))), '[^a-z0-9]+', '-', 'g'), '-') || '-' || "id"
WHERE "codigo" IS NULL;

UPDATE "subcampos_semanticos" SET
  "codigo" = 'LEG-S-' || "id",
  "slug" = btrim(regexp_replace(lower(unaccent(translate("namtrik_termino", 'ɵƟəƏʊɔƆ', 'oOeEuoO'))), '[^a-z0-9]+', '-', 'g'), '-') || '-' || "id"
WHERE "codigo" IS NULL;

UPDATE "microcampos" SET
  "codigo" = 'LEG-M-' || "id",
  "slug" = btrim(regexp_replace(lower(unaccent(translate(coalesce("namtrik_termino", "espanol_termino"), 'ɵƟəƏʊɔƆ', 'oOeEuoO'))), '[^a-z0-9]+', '-', 'g'), '-') || '-' || "id"
WHERE "codigo" IS NULL;

-- 4) Restricciones NOT NULL / descripciones opcionales
ALTER TABLE "campos_semanticos" ALTER COLUMN "codigo" SET NOT NULL, ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "namtrik_descripcion" DROP NOT NULL, ALTER COLUMN "espanol_descripcion" DROP NOT NULL;
ALTER TABLE "subcampos_semanticos" ALTER COLUMN "codigo" SET NOT NULL, ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "namtrik_descripcion" DROP NOT NULL, ALTER COLUMN "espanol_descripcion" DROP NOT NULL;
ALTER TABLE "microcampos" ALTER COLUMN "codigo" SET NOT NULL, ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "namtrik_termino" DROP NOT NULL,
  ALTER COLUMN "namtrik_descripcion" DROP NOT NULL, ALTER COLUMN "espanol_descripcion" DROP NOT NULL;
ALTER TABLE "microcampos" ADD CONSTRAINT "microcampos_nombre_presente"
  CHECK ("namtrik_termino" IS NOT NULL OR "espanol_termino" IS NOT NULL);

-- 5) Subniveles de microcampo (un nivel adicional)
ALTER TABLE "microcampos" ADD CONSTRAINT "microcampos_padre_id_fkey"
  FOREIGN KEY ("padre_id") REFERENCES "microcampos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "microcampos_padre_id_idx" ON "microcampos"("padre_id");

-- 6) Unicidad parcial: solo filas activas (deleted_at IS NULL)
CREATE UNIQUE INDEX "campos_codigo_activo" ON "campos_semanticos"("codigo") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "campos_slug_activo" ON "campos_semanticos"("slug") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "campos_namtrik_activo" ON "campos_semanticos"("namtrik_termino") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "campos_espanol_activo" ON "campos_semanticos"("espanol_termino") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "subcampos_codigo_activo" ON "subcampos_semanticos"("codigo") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "subcampos_slug_activo" ON "subcampos_semanticos"("campo_semantico_id", "slug") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "subcampos_namtrik_activo" ON "subcampos_semanticos"("campo_semantico_id", "namtrik_termino") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "microcampos_codigo_activo" ON "microcampos"("codigo") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "microcampos_slug_activo" ON "microcampos"("subcampo_semantico_id", "slug") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "microcampos_espanol_activo" ON "microcampos"("subcampo_semantico_id", "espanol_termino") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "microcampos_namtrik_activo" ON "microcampos"("subcampo_semantico_id", "namtrik_termino") WHERE "deleted_at" IS NULL AND "namtrik_termino" IS NOT NULL;

-- 7) Botones del home (siete posiciones; la asignación de campos llega por el importador)
CREATE TABLE "home_slots" (
  "id" BIGSERIAL NOT NULL,
  "clave" TEXT NOT NULL,
  "etiqueta" TEXT NOT NULL,
  "posicion" INTEGER NOT NULL,
  "campo_semantico_id" BIGINT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_slots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "home_slots_clave_key" ON "home_slots"("clave");
CREATE INDEX "home_slots_campo_semantico_id_idx" ON "home_slots"("campo_semantico_id");
ALTER TABLE "home_slots" ADD CONSTRAINT "home_slots_campo_semantico_id_fkey"
  FOREIGN KEY ("campo_semantico_id") REFERENCES "campos_semanticos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "home_slots" ("clave", "etiqueta", "posicion") VALUES
  ('ya', 'Ya', 1),
  ('ya-tul', 'Ya Tul', 2),
  ('kaumpu-ushamera', 'Kaumpu Ushamera', 3),
  ('tusrmera', 'Tusrmera', 4),
  ('namui-nu-piro', 'Namui Nu Pirɵ', 5),
  ('namui-nu-isuik', 'Namui Nu Isuik', 6),
  ('sro-wammera', 'Srɵ Wammera', 7);

-- 8) Usuarios: cambio de contraseña obligatorio (altas por API, reseteos)
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;
