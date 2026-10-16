#!/bin/sh
# Wrapper MCP de PostgreSQL para Misak Dictionary.
# Resuelve las credenciales desde .env.docker o apps/backend-service/.env sin exponer
# secretos en .agents/mcp_config.json (versionado en git).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

read_env_var() {
  file="$1"
  key="$2"
  if [ -f "$file" ]; then
    grep -E "^${key}=" "$file" | tail -n 1 | cut -d '=' -f 2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
  fi
}

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$REPO_ROOT/.env.docker" ]; then
    PG_USER="$(read_env_var "$REPO_ROOT/.env.docker" POSTGRES_USER)"
    PG_PASS="$(read_env_var "$REPO_ROOT/.env.docker" POSTGRES_PASSWORD)"
    PG_DB="$(read_env_var "$REPO_ROOT/.env.docker" POSTGRES_DB)"
    PG_PORT="$(read_env_var "$REPO_ROOT/.env.docker" POSTGRES_PORT)"
    PG_USER="${PG_USER:-misak}"
    PG_PASS="${PG_PASS:-change-me-strong-password}"
    PG_DB="${PG_DB:-misak_dictionary}"
    PG_PORT="${PG_PORT:-5434}"
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@localhost:${PG_PORT}/${PG_DB}"
  elif [ -f "$REPO_ROOT/apps/backend-service/.env" ]; then
    DATABASE_URL="$(read_env_var "$REPO_ROOT/apps/backend-service/.env" DATABASE_URL)"
  fi
fi

DATABASE_URL="${DATABASE_URL:-postgresql://misak:change-me-strong-password@localhost:5434/misak_dictionary}"

exec npx -y @modelcontextprotocol/server-postgres "$DATABASE_URL"
