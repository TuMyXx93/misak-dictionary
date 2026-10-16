-- ================================================================
-- 0007_microcampos_arbol
-- Los microcampos forman un árbol de profundidad arbitraria
-- (microcampo → subnivel → subnivel …). Garantías en la base de datos:
--  · un hijo pertenece al mismo subcampo que su padre (FK compuesta)
--  · profundidad = profundidad del padre + 1 (impide ciclos)
--  · nombres únicos entre hermanos (no en todo el subcampo)
-- Los slugs siguen siendo únicos por subcampo: una ruta pública
-- /campos/:campo/:subcampo/:slug resuelve cualquier nivel sin ambigüedad.
-- ================================================================

-- 1) Profundidad (0 = hijo directo del subcampo)
ALTER TABLE "microcampos" ADD COLUMN "profundidad" INTEGER NOT NULL DEFAULT 0;
UPDATE "microcampos" SET "profundidad" = 1 WHERE "padre_id" IS NOT NULL;
ALTER TABLE "microcampos" ADD CONSTRAINT "microcampos_profundidad_check"
  CHECK ("profundidad" >= 0 AND ("padre_id" IS NULL) = ("profundidad" = 0));

-- 2) El hijo debe compartir subcampo con su padre (FK compuesta)
CREATE UNIQUE INDEX "microcampos_id_subcampo_key" ON "microcampos"("id", "subcampo_semantico_id");
ALTER TABLE "microcampos" DROP CONSTRAINT "microcampos_padre_id_fkey";
ALTER TABLE "microcampos" ADD CONSTRAINT "microcampos_padre_mismo_subcampo_fkey"
  FOREIGN KEY ("padre_id", "subcampo_semantico_id")
  REFERENCES "microcampos"("id", "subcampo_semantico_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3) Profundidad coherente con el padre (un nivel por debajo; sin ciclos)
CREATE OR REPLACE FUNCTION "microcampos_validar_profundidad"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  profundidad_padre INTEGER;
BEGIN
  IF NEW."padre_id" IS NULL THEN
    IF NEW."profundidad" <> 0 THEN
      RAISE EXCEPTION 'microcampo sin padre debe tener profundidad 0';
    END IF;
  ELSE
    SELECT "profundidad" INTO profundidad_padre FROM "microcampos" WHERE "id" = NEW."padre_id";
    IF NEW."profundidad" <> profundidad_padre + 1 THEN
      RAISE EXCEPTION 'profundidad % inconsistente con el padre (profundidad %)',
        NEW."profundidad", profundidad_padre;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "microcampos_profundidad_trg"
  BEFORE INSERT OR UPDATE OF "padre_id", "profundidad" ON "microcampos"
  FOR EACH ROW EXECUTE FUNCTION "microcampos_validar_profundidad"();

-- 4) Nombres únicos entre hermanos (padre NULL agrupa a los hijos directos del subcampo)
DROP INDEX IF EXISTS "microcampos_espanol_activo";
DROP INDEX IF EXISTS "microcampos_namtrik_activo";
CREATE UNIQUE INDEX "microcampos_espanol_hermano_activo"
  ON "microcampos"("subcampo_semantico_id", COALESCE("padre_id", 0), "espanol_termino")
  WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "microcampos_namtrik_hermano_activo"
  ON "microcampos"("subcampo_semantico_id", COALESCE("padre_id", 0), "namtrik_termino")
  WHERE "deleted_at" IS NULL AND "namtrik_termino" IS NOT NULL;
