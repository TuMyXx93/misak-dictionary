# AGENTS.md — Thin Router del Proyecto

> Mantener este archivo compacto. Los detalles de implementación viven en
> `.opencode/agents/`, `.opencode/commands/` y `.opencode/skills/`.

## Project Overview

Monorepo pnpm del Misak Cultural Dictionary:

- `apps/web-client` — React 19, Vite 7, TailwindCSS 4, Framer Motion (PWA)
- `apps/backend-service` — Fastify 5, Prisma 7, PostgreSQL (Clean Architecture)

Runtime: Node 24.15.0 LTS, TypeScript 5.9, ESM.

## Global Commands

| Command                                 | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| `pnpm install`                          | Instala dependencias (npm/yarn bloqueados) |
| `pnpm dev:web` / `pnpm dev:backend`     | Desarrollo frontend/backend                |
| `pnpm build:web` / `pnpm build:backend` | Build de apps                              |
| `pnpm ci`                               | Validación Biome en modo CI                |
| `pnpm test` / `pnpm test:coverage`      | Testing del frontend                       |
| `pnpm prisma:generate` / `pnpm db:push` | Operaciones Prisma backend                 |

## Quality Baseline

- Formato/linting: `biome.json` (no duplicar reglas aquí)
- Exports: named exports por defecto
- Hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (ci + build)

## Agent Orchestration

### Agentes

| Agent       | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| `architect` | Crea/mainiene agents, skills, commands y tooling        |
| `frontend`  | React/Vite/Tailwind/Framer Motion                       |
| `backend`   | Fastify/Prisma/Clean Architecture                       |
| `reviewer`  | Read-only: quality, architecture, security, performance |
| `tester`    | Vitest/RTL: unit + integration tests                    |
| `devops`    | CI/CD, Docker, infra, releases, versioning              |

### Commands

| Command          | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `/gen-component` | Genera componente React                  |
| `/gen-usecase`   | Genera backend use case (Clean Arch)     |
| `/gen-test`      | Genera tests del scope indicado          |
| `/specify`       | Crea spec de feature (EARS + Gherkin)    |
| `/plan`          | Plan técnico desde spec aprobada         |
| `/tasks`         | Descompone plan en tareas atómicas       |
| `/review`        | Code review del scope indicado           |
| `/check-arch`    | Valida estructura backend                |
| `/db-migrate`    | Crea migración Prisma                    |
| `/version-gate`  | Pre-task security gate                   |
| `/docs-gate`     | Valida docs antes de integrar            |
| `/merge-gate`    | Gate de merge seguro a `dev`             |
| `/version-bump`  | Release: version bump + changelog + tags |

### Skills (Lazy Loading — solo cuando se necesitan)

`react-component` · `clean-arch-usecase` · `api-endpoint` · `prisma-migration` · `vitest-testing` · `agent-creator` · `versioning`

### Delegation Rules

0. **Antes de modificar código:** `/version-gate`
1. Frontend (componentes, hooks, pages, estilos) → `@frontend` o `react-component`
2. Backend (use cases, controllers, repositories, DTOs) → `@backend` o `clean-arch-usecase`
3. Quality review → `@reviewer` (read-only)
4. Tests → `@tester` o `vitest-testing`
5. CI/CD/infra → `@devops`
6. Agents/skills/commands → `@architect` + `agent-creator`
7. Releases → `@devops` + `versioning`

## MCP Servers

| Server     | Purpose                                      |
| ---------- | -------------------------------------------- |
| `context7` | Documentación actualizada de librerías       |
| `engram`   | Memoria persistente (sessions, observations) |

## Engram Memory Protocol

| Action                  | When                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `mem_context`           | Inicio de sesión nueva o tras compaction                                                  |
| `mem_search <keywords>` | Falta contexto; búsqueda proactiva                                                        |
| `mem_save`              | Inmediatamente tras: bugfix, decisión arquitectura, patrón, configuración, descubrimiento |
| `mem_session_summary`   | **Obligatorio antes de cerrar sesión**                                                    |
| `mem_judge`             | Resolver conflictos de memoria detectados tras `mem_save`                                 |
| `mem_compare`           | Comparar dos observaciones existentes y persistir veredicto                               |
| `mem_delete`            | Eliminar observación por ID                                                               |
| `mem_capture_passive`   | Captura pasiva de aprendizados de output de sub-agents                                    |
| `mem_current_project`   | Confirmar proyecto detectado antes de escribir                                            |
| `mem_doctor`            | Diagnósticos del sistema de memoria                                                       |

**Formato para `mem_save`:** `What / Why / Where / Learned` con `topic_key` estable para updates.

**Resolución de conflictos:**

- `mem_save` retorna `candidates[]` cuando detecta memorias similares
- Relationes: `related`, `compatible`, `scoped`, `conflicts_with`, `supersedes`, `not_conflict`
- Preguntar al usuario si confidence < 0.7 o relation es `supersedes`/`conflicts_with` en tipo `architecture`/`policy`/`decision`

## Pre-Task Security Gate

`/version-gate` antes de cualquier tarea que modifique código:

| Result            | Action                       |
| ----------------- | ---------------------------- |
| `FAIL`            | Reportar blockers, detener   |
| `PASS` + warnings | Reportar, pedir confirmación |
| `PASS` limpio     | Proceder                     |
