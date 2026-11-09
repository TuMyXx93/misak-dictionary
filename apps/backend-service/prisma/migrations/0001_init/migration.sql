-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" CITEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "resource" CITEXT NOT NULL,
    "action" CITEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos_semanticos" (
    "id" BIGSERIAL NOT NULL,
    "namtrik_termino" CITEXT NOT NULL,
    "namtrik_descripcion" TEXT NOT NULL,
    "namtrik_audio" TEXT,
    "espanol_termino" CITEXT NOT NULL,
    "espanol_descripcion" TEXT NOT NULL,
    "espanol_audio" TEXT,
    "imagen" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "campos_semanticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcampos_semanticos" (
    "id" BIGSERIAL NOT NULL,
    "campo_semantico_id" BIGINT NOT NULL,
    "namtrik_termino" CITEXT NOT NULL,
    "namtrik_descripcion" TEXT NOT NULL,
    "namtrik_audio" TEXT,
    "espanol_termino" CITEXT NOT NULL,
    "espanol_descripcion" TEXT NOT NULL,
    "espanol_audio" TEXT,
    "imagen" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "subcampos_semanticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microcampos" (
    "id" BIGSERIAL NOT NULL,
    "subcampo_semantico_id" BIGINT NOT NULL,
    "namtrik_termino" CITEXT NOT NULL,
    "namtrik_descripcion" TEXT NOT NULL,
    "namtrik_audio" TEXT,
    "espanol_termino" CITEXT NOT NULL,
    "espanol_descripcion" TEXT NOT NULL,
    "espanol_audio" TEXT,
    "imagen" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "microcampos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabras_modelo_1" (
    "id" BIGSERIAL NOT NULL,
    "namtrik_termino" CITEXT NOT NULL,
    "namtrik_descripcion" TEXT NOT NULL,
    "namtrik_audio" TEXT,
    "espanol_termino" CITEXT NOT NULL,
    "espanol_descripcion" TEXT NOT NULL,
    "espanol_audio" TEXT,
    "imagen" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "palabras_modelo_1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabras_modelo_2" (
    "id" BIGSERIAL NOT NULL,
    "namtrik_termino_pregunta" CITEXT NOT NULL,
    "namtrik_contexto_pregunta" TEXT,
    "namtrik_audio_pregunta" TEXT,
    "espanol_traduccion_pregunta" TEXT NOT NULL,
    "namtrik_termino_respuesta" CITEXT NOT NULL,
    "namtrik_contexto_respuesta" TEXT,
    "namtrik_audio_respuesta" TEXT,
    "espanol_traduccion_respuesta" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "espanol_audio_pregunta" TEXT,
    "espanol_audio_respuesta" TEXT,
    "imagen_pregunta" TEXT,
    "imagen_respuesta" TEXT,

    CONSTRAINT "palabras_modelo_2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palabrasm1_microcampos" (
    "palabra_id" BIGINT NOT NULL,
    "microcampo_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palabrasm1_microcampos_pkey" PRIMARY KEY ("palabra_id","microcampo_id")
);

-- CreateTable
CREATE TABLE "palabrasm2_microcampos" (
    "palabra_id" BIGINT NOT NULL,
    "microcampo_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palabrasm2_microcampos_pkey" PRIMARY KEY ("palabra_id","microcampo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "campos_semanticos_namtrik_unique" ON "campos_semanticos"("namtrik_termino");

-- CreateIndex
CREATE UNIQUE INDEX "campos_semanticos_espanol_unique" ON "campos_semanticos"("espanol_termino");

-- CreateIndex
CREATE INDEX "campos_semanticos_namtrik_termino_idx" ON "campos_semanticos"("namtrik_termino");

-- CreateIndex
CREATE INDEX "campos_semanticos_espanol_termino_idx" ON "campos_semanticos"("espanol_termino");

-- CreateIndex
CREATE INDEX "campos_semanticos_created_at_idx" ON "campos_semanticos"("created_at" DESC);

-- CreateIndex
CREATE INDEX "subcampos_semanticos_campo_semantico_id_idx" ON "subcampos_semanticos"("campo_semantico_id");

-- CreateIndex
CREATE UNIQUE INDEX "subcampos_unique_namtrik" ON "subcampos_semanticos"("campo_semantico_id", "namtrik_termino", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "subcampos_unique_espanol" ON "subcampos_semanticos"("campo_semantico_id", "espanol_termino", "deleted_at");

-- CreateIndex
CREATE INDEX "microcampos_subcampo_semantico_id_idx" ON "microcampos"("subcampo_semantico_id");

-- CreateIndex
CREATE UNIQUE INDEX "microcampos_unique_namtrik" ON "microcampos"("subcampo_semantico_id", "namtrik_termino", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "microcampos_unique_espanol" ON "microcampos"("subcampo_semantico_id", "espanol_termino", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "palabras_m1_namtrik_unique" ON "palabras_modelo_1"("namtrik_termino");

-- CreateIndex
CREATE UNIQUE INDEX "palabras_m1_espanol_unique" ON "palabras_modelo_1"("espanol_termino");

-- CreateIndex
CREATE INDEX "palabras_modelo_1_namtrik_termino_idx" ON "palabras_modelo_1"("namtrik_termino");

-- CreateIndex
CREATE INDEX "palabras_modelo_1_espanol_termino_idx" ON "palabras_modelo_1"("espanol_termino");

-- CreateIndex
CREATE INDEX "palabras_modelo_2_namtrik_termino_pregunta_idx" ON "palabras_modelo_2"("namtrik_termino_pregunta");

-- CreateIndex
CREATE INDEX "palabras_modelo_2_namtrik_termino_respuesta_idx" ON "palabras_modelo_2"("namtrik_termino_respuesta");

-- CreateIndex
CREATE INDEX "idx_palabrasm1_microcampos_compound" ON "palabrasm1_microcampos"("microcampo_id", "palabra_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcampos_semanticos" ADD CONSTRAINT "subcampos_semanticos_campo_semantico_id_fkey" FOREIGN KEY ("campo_semantico_id") REFERENCES "campos_semanticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microcampos" ADD CONSTRAINT "microcampos_subcampo_semantico_id_fkey" FOREIGN KEY ("subcampo_semantico_id") REFERENCES "subcampos_semanticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabrasm1_microcampos" ADD CONSTRAINT "palabrasm1_microcampos_microcampo_id_fkey" FOREIGN KEY ("microcampo_id") REFERENCES "microcampos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabrasm1_microcampos" ADD CONSTRAINT "palabrasm1_microcampos_palabra_id_fkey" FOREIGN KEY ("palabra_id") REFERENCES "palabras_modelo_1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabrasm2_microcampos" ADD CONSTRAINT "palabrasm2_microcampos_microcampo_id_fkey" FOREIGN KEY ("microcampo_id") REFERENCES "microcampos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palabrasm2_microcampos" ADD CONSTRAINT "palabrasm2_microcampos_palabra_id_fkey" FOREIGN KEY ("palabra_id") REFERENCES "palabras_modelo_2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

