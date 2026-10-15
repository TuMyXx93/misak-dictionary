---
id: tech-stack
version: 1.0.0
status: active
description: >
  Stack técnico verificado del monorepo. Toda feature nueva se diseña dentro de
  estos límites. Introducir tecnología fuera de este documento requiere una ADR.
---

# Steering — Stack Técnico

**Última verificación:** 2026-10-14 · Monorepo pnpm · 3 workspaces (root + 2 apps).

## Runtime y tooling base

| Componente             | Versión                                                                                        | Fuente                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Node                   | >=24.15.0 LTS                                                                                  | `engines` + `scripts/check-node-version.cjs` |
| pnpm                   | 10.20.0 (`packageManager`)                                                                     | raíz `package.json`                          |
| TypeScript             | ^5.9.3                                                                                         | raíz devDependencies                         |
| Biome                  | 2.4.6 (lint + format, config única `biome.json`)                                               | raíz devDependencies                         |
| Husky                  | ^9.1.7 — hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (ci + build) | raíz                                         |
| commit-and-tag-version | 12.6.1 (releases + CHANGELOG)                                                                  | raíz                                         |

## apps/web-client (PWA)

| Componente            | Versión                                        |
| --------------------- | ---------------------------------------------- |
| React                 | ^19.2.4                                        |
| Vite                  | ^7.3.1                                         |
| TailwindCSS           | 4.2.1 (tokens en `src/index.css` vía `@theme`) |
| Framer Motion         | 12.35.0                                        |
| react-router-dom      | 7.13.1                                         |
| @tanstack/react-query | ^5.90.21                                       |
| @hookform/resolvers   | ^5.2.2                                         |
| Vitest                | 4.0.18 + Testing Library                       |

**Estructura:** `src/components/{ui,layouts,sections,features,errors}`, `src/hooks`,
`src/pages`, `src/router`, `src/constants`, `src/data`, `src/types`, `src/utils`, `src/test`.

## apps/backend-service (API)

| Componente               | Versión                                                |
| ------------------------ | ------------------------------------------------------ |
| Fastify                  | ^5.8.1                                                 |
| Prisma (ORM)             | ^7.4.2 (cliente `@prisma/client`; schema en `prisma/`) |
| PostgreSQL (driver `pg`) | 8.20.0                                                 |

**Arquitectura:** Clean Architecture — capas `presentation` (HTTP) → `application`
(use cases) → `domain` (entidades) ← `infrastructure` (repositorios Prisma,
bordes externos). `api/` monta rutas; `app.ts` compone; `server.ts` arranca.

## Ecosistema de agentes (OpenCode + Engram)

- `.opencode/agents/` — architect, frontend, backend, reviewer (read-only), tester, devops
- `.opencode/commands/` — version-gate, docs-gate, merge-gate, gen-*, review, check-arch…
- `.opencode/skills/` — react-component, clean-arch-usecase, api-endpoint,
  prisma-migration, vitest-testing, agent-creator, versioning
- Engram — memoria persistente (`.engram/` gitignored); MCP `context7` para docs de librerías

## Límites

- Frontend no habla directamente con PostgreSQL; backend no renderiza UI.
- Prisma Client generado en rutas `src/generated/` (excluidas de Biome).
- Sin dependencias de runtime nuevas sin ADR (las animaciones usan Framer Motion ya instalado).
