-- ================================================================
-- 0008_sentido_formas_lexico
-- Modelo léxico «Sentido + Formas» y ubicación multinivel en el
-- árbol taxonómico (Campo, Subcampo, Microcampo / Subnivel).
-- Garantías en la base de datos:
--  · código único entre sentidos activos (deleted_at IS NULL)
--  · 1..N formas namtrik ordenadas por sentido
--  · cada ubicación apunta exactamente a un nivel contenedor
--    (CHECK num_nonnulls(campo, subcampo, microcampo) = 1)
-- ================================================================

-- 1) Sentidos léxicos (estándar y dialógico para Saludos)
CREATE TABLE "sentidos_lexicos" (
  "id" BIGSERIAL NOT NULL,
  "codigo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'estandar',
  "namtrik_contexto" TEXT,
  "espanol_glosa" CITEXT NOT NULL,
  "espanol_explicacion" TEXT,
  "nombre_cientifico" TEXT,
  "respuesta_namtrik" CITEXT,
  "respuesta_namtrik_contexto" TEXT,
  "respuesta_espanol_glosa" TEXT,
  "respuesta_espanol_explicacion" TEXT,
  "observacion_editorial" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'borrador',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "sentidos_lexicos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sentidos_lexicos_tipo_check" CHECK ("tipo" IN ('estandar', 'dialogico')),
  CONSTRAINT "sentidos_lexicos_estado_check" CHECK ("estado" IN ('borrador', 'ratificado'))
);

CREATE UNIQUE INDEX "sentidos_lexicos_codigo_activo"
  ON "sentidos_lexicos"("codigo")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "sentidos_lexicos_espanol_glosa_idx" ON "sentidos_lexicos"("espanol_glosa");
CREATE INDEX "sentidos_lexicos_nombre_cientifico_idx" ON "sentidos_lexicos"("nombre_cientifico");

-- 2) Formas namtrik (1..N por sentido)
CREATE TABLE "formas_namtrik" (
  "id" BIGSERIAL NOT NULL,
  "sentido_id" BIGINT NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 1,
  "lema" CITEXT NOT NULL,
  "acepcion_homonima" INTEGER,
  "categoria_gramatical" TEXT,
  "variante" TEXT,
  "es_neologismo" BOOLEAN NOT NULL DEFAULT false,
  "rasgos_gramaticales" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "etiqueta_original" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "formas_namtrik_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "formas_namtrik_sentido_id_fkey"
    FOREIGN KEY ("sentido_id") REFERENCES "sentidos_lexicos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "formas_namtrik_sentido_orden_key" ON "formas_namtrik"("sentido_id", "orden");
CREATE INDEX "formas_namtrik_lema_idx" ON "formas_namtrik"("lema");

-- 3) Ubicaciones multinivel del sentido en el árbol taxonómico
CREATE TABLE "sentidos_ubicaciones" (
  "id" BIGSERIAL NOT NULL,
  "sentido_id" BIGINT NOT NULL,
  "campo_semantico_id" BIGINT,
  "subcampo_semantico_id" BIGINT,
  "microcampo_id" BIGINT,
  "posicion" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sentidos_ubicaciones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sentidos_ubicaciones_un_solo_nivel_check"
    CHECK (num_nonnulls("campo_semantico_id", "subcampo_semantico_id", "microcampo_id") = 1),
  CONSTRAINT "sentidos_ubicaciones_sentido_id_fkey"
    FOREIGN KEY ("sentido_id") REFERENCES "sentidos_lexicos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sentidos_ubicaciones_campo_semantico_id_fkey"
    FOREIGN KEY ("campo_semantico_id") REFERENCES "campos_semanticos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sentidos_ubicaciones_subcampo_semantico_id_fkey"
    FOREIGN KEY ("subcampo_semantico_id") REFERENCES "subcampos_semanticos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sentidos_ubicaciones_microcampo_id_fkey"
    FOREIGN KEY ("microcampo_id") REFERENCES "microcampos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sentidos_ubicaciones_campo_key"
  ON "sentidos_ubicaciones"("sentido_id", "campo_semantico_id")
  WHERE "campo_semantico_id" IS NOT NULL;
CREATE UNIQUE INDEX "sentidos_ubicaciones_subcampo_key"
  ON "sentidos_ubicaciones"("sentido_id", "subcampo_semantico_id")
  WHERE "subcampo_semantico_id" IS NOT NULL;
CREATE UNIQUE INDEX "sentidos_ubicaciones_microcampo_key"
  ON "sentidos_ubicaciones"("sentido_id", "microcampo_id")
  WHERE "microcampo_id" IS NOT NULL;

CREATE INDEX "sentidos_ubicaciones_campo_pos_idx"
  ON "sentidos_ubicaciones"("campo_semantico_id", "posicion")
  WHERE "campo_semantico_id" IS NOT NULL;
CREATE INDEX "sentidos_ubicaciones_subcampo_pos_idx"
  ON "sentidos_ubicaciones"("subcampo_semantico_id", "posicion")
  WHERE "subcampo_semantico_id" IS NOT NULL;
CREATE INDEX "sentidos_ubicaciones_microcampo_pos_idx"
  ON "sentidos_ubicaciones"("microcampo_id", "posicion")
  WHERE "microcampo_id" IS NOT NULL;
