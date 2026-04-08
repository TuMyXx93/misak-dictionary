# AGENTS.md — Thin Router del Proyecto

> Fuente de verdad para orquestacion. Este archivo mantiene solo invariantes globales y
> reglas de despacho. Los detalles de implementacion viven en `.opencode/agents/`,
> `.opencode/commands/` y `.opencode/skills/`.

## Project Overview

Monorepo pnpm del Misak Cultural Dictionary:

- `apps/web-client` — React 19, Vite 7, TailwindCSS 4, Framer Motion (PWA)
- `apps/backend-service` — Fastify 5, Prisma 7, PostgreSQL (Clean Architecture)

Runtime: Node 22, TypeScript 5.9, ESM.

## Global Commands

- `pnpm install` — instala dependencias (npm/yarn bloqueados)
- `pnpm dev:web` / `pnpm dev:backend` — desarrollo frontend/backend
- `pnpm build:web` / `pnpm build:backend` — build de apps
- `pnpm ci` — validacion Biome en modo CI
- `pnpm test` / `pnpm test:coverage` — testing del frontend
- `pnpm prisma:generate` / `pnpm db:push` — operaciones Prisma backend

## Global Quality Baseline

- Formato y linting los define `biome.json` (no duplicar reglas aqui).
- Convencion de exportacion: named exports por defecto.
- Hooks Husky vigentes:
  - `pre-commit`: `lint-staged`
  - `commit-msg`: `commitlint`
  - `pre-push`: `pnpm run ci` y `pnpm build:web`

## Pre-Task Security Gate (Obligatorio)

Antes de cualquier tarea que modifique codigo, ejecutar `/version-gate`.

- Si el gate da `FAIL`: reportar blockers y detener.
- Si el gate da `PASS` con warnings: reportar warnings y pedir confirmacion.
- Si el gate da `PASS` limpio: proceder.

Comandos relacionados:

- `/version-gate`
- `/version-bump <patch|minor|major|alpha|beta|first>`

## Agent Orchestration System

Todo el sistema de agentes reside en `.opencode/`.

### Agentes

| Agente      | Proposito                                                            |
| ----------- | -------------------------------------------------------------------- |
| `architect` | Crea y mantiene agentes, skills, commands y tooling de orquestacion  |
| `frontend`  | Implementacion React/Vite/Tailwind/Framer Motion                     |
| `backend`   | Implementacion Fastify/Prisma/Clean Architecture                     |
| `reviewer`  | Analisis read-only de calidad, arquitectura, seguridad y performance |
| `tester`    | Tests unitarios e integracion con Vitest/RTL                         |
| `devops`    | CI/CD, workflows, Docker, infraestructura, release y versioning      |

### Commands

| Comando          | Proposito                                                 |
| ---------------- | --------------------------------------------------------- |
| `/gen-component` | Genera componente frontend con convenciones del proyecto  |
| `/gen-usecase`   | Genera use case backend en Clean Architecture             |
| `/gen-test`      | Genera tests del archivo/scope indicado                   |
| `/review`        | Ejecuta code review del scope indicado                    |
| `/check-arch`    | Valida estructura y dependency rule de backend            |
| `/db-migrate`    | Crea migracion Prisma                                     |
| `/docs-gate`     | Valida sincronizacion changelog -> documentacion canonica |
| `/merge-gate`    | Valida y ejecuta merge local seguro `dev -> main`         |
| `/version-gate`  | Pre-task gate de seguridad operacional                    |
| `/version-bump`  | Release con version bump, changelog y tags                |

### Skills (Lazy Loading)

- `react-component`
- `clean-arch-usecase`
- `api-endpoint`
- `prisma-migration`
- `vitest-testing`
- `agent-creator`
- `versioning`

Regla: cargar solo el skill necesario para la tarea actual.

### Reglas de Delegacion

0. Antes de modificar codigo: `/version-gate`.
1. Frontend (componentes, hooks, pages, estilos) -> `@frontend` o `react-component`.
2. Backend (use cases, controllers, repositories, DTOs) -> `@backend` o `clean-arch-usecase` / `api-endpoint`.
3. Review de calidad -> `@reviewer` (read-only).
4. Tests -> `@tester` o `vitest-testing`.
5. CI/CD o infraestructura -> `@devops`.
6. Crear/ajustar agentes, skills o commands -> `@architect` + `agent-creator`.
7. Versioning/releases/tags -> `@devops` + `versioning`.

## MCP Servers

- `context7`: documentacion de librerias actualizada.
- `engram`: memoria persistente entre sesiones.

## Persistent Memory (Engram) — Reglas Obligatorias

### Cuándo buscar memoria

- Al inicio de sesiones nuevas o tras compaction: `mem_context`.
- Si falta contexto: `mem_search <keywords>` y `mem_get_observation <id>`.
- Antes de una feature que pudo trabajarse antes: `mem_search` proactivo.

### Cuándo guardar memoria

Guardar inmediatamente tras:

- bugfix
- decision de arquitectura
- patron/convention establecida
- cambio de configuracion
- descubrimiento no obvio

Usar formato `What / Why / Where / Learned` y `topic_key` estable cuando aplique.

### Cierre de sesion (obligatorio)

Antes de terminar: `mem_session_summary` con secciones:

- Goal
- Instructions
- Discoveries
- Accomplished
- Next Steps
- Relevant Files

## Principio de Contexto Minimo

Mantener este archivo deliberadamente compacto para reducir costo de inferencia,
evitar drift y mejorar cumplimiento de instrucciones. Los detalles deben vivir en
agentes, commands y skills especializados.
