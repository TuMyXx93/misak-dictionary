-- ================================================================
-- 0003_auth_hardening — Spec 002 (Auth RBAC)
-- audit_log + rotación de sesiones con detección de reuso
-- ================================================================

-- pgcrypto: digest() para el hash SHA-256 de refresh tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Auditoría (R-007, R-010, R-012) ─────────────────────────────
CREATE TABLE "audit_log" (
    "id"             BIGSERIAL   NOT NULL,
    "actor_user_id"  BIGINT,
    "actor_username" TEXT,
    "action"         TEXT        NOT NULL,
    "entity"         TEXT        NOT NULL,
    "entity_id"      TEXT,
    "old_data"       JSONB,
    "new_data"       JSONB,
    "ip_address"     INET,
    "user_agent"     TEXT,
    "created_at"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_log_actor_created" ON "audit_log"("actor_user_id", "created_at" DESC);
CREATE INDEX "idx_audit_log_entity" ON "audit_log"("entity", "entity_id");

-- ── Sesiones: familia de rotación + reuso (R-006) ───────────────
ALTER TABLE "sessions" ADD COLUMN "family_id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "sessions" ADD COLUMN "revoked_at" TIMESTAMPTZ(3);
ALTER TABLE "sessions" ADD COLUMN "token_hash" TEXT;

CREATE INDEX "idx_sessions_family" ON "sessions"("family_id");
CREATE UNIQUE INDEX "idx_sessions_token_hash" ON "sessions"("token_hash") WHERE "token_hash" IS NOT NULL;

-- Backfill idempotente: hashear tokens existentes (los clientes deberán re-login)
UPDATE "sessions"
SET "token_hash" = encode(digest("token", 'sha256'), 'hex')
WHERE "token_hash" IS NULL;
