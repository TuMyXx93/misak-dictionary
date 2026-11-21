---
id: tech-stack
version: 1.2.0
status: active
description: >
  Stack técnico verificado del monorepo Diccionario Misak. Toda feature nueva se
  diseña dentro de estos límites. Introducir tecnología fuera de este documento
  requiere una ADR.
---

# Steering — Stack Técnico

**Última verificación:** 2026-11-11 · Monorepo pnpm · 3 workspaces (root + `apps/web-client` + `apps/backend-service`).

## Runtime y tooling base

| Componente             | Versión                                                                                        | Fuente                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Node                   | >=24.15.0 LTS (`.node-version`: `24.15.0`)                                                     | `engines` + `scripts/check-node-version.cjs` |
| pnpm                   | 10.20.0 (`packageManager`)                                                                     | raíz `package.json`                          |
| TypeScript             | ^5.9.3                                                                                         | raíz devDependencies                         |
| Biome                  | 2.4.6 (lint + format, config única `biome.json`)                                               | raíz devDependencies                         |
| Husky                  | ^9.1.7 — hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (ci + build) | raíz                                         |
| commit-and-tag-version | 12.6.1 (releases + CHANGELOG)                                                                  | raíz                                         |
| Docker                 | `node:24.15.0-slim` · `nginx:1.27-alpine` · `pgvector/pgvector:pg18`                           | `apps/*/Dockerfile` + `docker/compose*.yml`  |

## apps/web-client (PWA)

| Componente            | Versión                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| React                 | ^19.2.4                                                                  |
| Vite                  | ^8.0.0 (`8.3`, `Rolldown` + `Oxc`)                                       |
| TailwindCSS           | ^4.2.2 (`@tailwindcss/vite` + `Lightning CSS`, tokens en `src/index.css`) |
| Framer Motion         | 12.35.0                                                                  |
| react-router-dom      | 7.13.1                                                                   |
| @tanstack/react-query | 5.90.21                                                                  |
| zustand               | 5.0.11 (store de sesión en memoria)                                      |
| vite-plugin-pwa       | ^1.2.0 (`workbox-*` 7.4.0)                                               |
| Vitest                | ^4.1.0 + Testing Library + `jsdom` 28.1.0                                |

**Estructura:** `src/components/{ui,layouts,sections,features,media,admin,errors}`,
`src/contexts`, `src/hooks`, `src/pages/{*,admin/*}`, `src/router`, `src/services`,
`src/shared`, `src/stores`, `src/constants`, `src/types`, `src/utils`, `src/test`.

## apps/backend-service (API)

| Componente                 | Versión                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| Fastify                    | ^5.8.1 (`cookie`, `cors`, `helmet`, `multipart`, `rate-limit`, `sensible`) |
| Prisma (ORM)               | ^7.4.2 + `@prisma/adapter-pg` 7.4.2 (cliente en `src/generated/prisma/`)  |
| PostgreSQL (driver `pg`)   | 8.20.0 sobre PostgreSQL 18.6                                              |
| @node-rs/argon2 + bcryptjs | 2.2.2 (Argon2id primario) + ^2.4.3 (solo migración de hashes legacy)      |
| jsonwebtoken + zod         | ^9.0.3 + ^4.3.6                                                           |
| Vitest + Testcontainers    | ^4.1.0 + `@testcontainers/postgresql` 12.2.1                              |

**Arquitectura:** Clean Architecture — capas `presentation` / `api` (HTTP) →
`application` (use cases) → `domain` (entidades y puertos) ← `infrastructure`
(repositorios Prisma, Argon2id/JWT, almacenamiento local de medios). `app.ts`
compone; `server.ts` arranca.

## Ecosistema de agentes (OpenCode + Antigravity + Engram)

- `.opencode/agents/` (sincronizado a `.agents/` vía `pnpm agents:sync`) — architect, frontend, backend, reviewer (read-only), tester, devops
- `.opencode/commands/` — version-gate, docs-gate, merge-gate, gen-*, review, check-arch…
- `.opencode/skills/` — react-component, clean-arch-usecase, api-endpoint,
  prisma-migration, vitest-testing, agent-creator, versioning
- Engram — memoria persistente (`.engram/` gitignored); MCP `context7` para docs de librerías

## Límites

- Frontend no habla directamente con PostgreSQL; backend no renderiza UI.
- Prisma Client generado en `src/generated/prisma/` (excluido de Git y Biome).
- Sin dependencias de runtime nuevas sin ADR.
