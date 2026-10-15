-- Extensiones requeridas por schema.prisma (datasource db) y por las
-- migraciones avanzadas. Corre SOLO en la inicialización de una BD nueva
-- (docker-entrypoint-initdb.d). Idempotente por IF NOT EXISTS.
-- La imagen pgvector/pgvector:pg18 provee "vector"; el resto viene en
-- contrib de la imagen base de postgres.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
