# Adaptador Antigravity (App, CLI e IDE) — Misak Dictionary

Esta regla complementa a `AGENTS.md` cuando operas desde **Antigravity app**, **Antigravity CLI (`agy`)** o **Antigravity IDE**:

## Equivalencias de Invocación

| Concepto en `AGENTS.md` | En OpenCode | En Antigravity (App / CLI) |
| ----------------------- | ----------- | -------------------------- |
| Delegar a especialista (`@frontend`, `@backend`, `@reviewer`, `@tester`, `@devops`, `@architect`) | Mención `@<agent>` | Tool `invoke_subagent` con `TypeName: "<agent>"` y `Model: "inherit"` (o cambiar de agente con `/agents` en CLI) |
| Spec-Driven Development: especificar | `/specify <slug>` | `/sdd-specify <slug>` (skill `sdd-specify`) |
| Spec-Driven Development: planificar | `/plan <NNN-slug>` | `/sdd-plan <NNN-slug>` (skill `sdd-plan`; evita colisión con `/plan` nativo) |
| Spec-Driven Development: tareas | `/tasks <NNN-slug>` | `/sdd-tasks <NNN-slug>` (skill `sdd-tasks`; evita colisión con `/tasks` nativo de CLI) |
| Gates y generadores (`/version-gate`, `/docs-gate`, `/merge-gate`, `/version-bump`, `/gen-*`, `/db-migrate`, `/check-arch`, `/review`) | Slash command directo | Slash command idéntico o lectura del skill homónimo en `.agents/skills/` |

## Servidores MCP del Proyecto

- `engram`: Memoria persistente del proyecto (`project: "misak-dictionary"`).
- `context7`: Documentación actualizada de librerías.
- `misak-postgres`: Base de datos PostgreSQL local del diccionario Misak (`localhost:5434/misak_dictionary`, vía `scripts/mcp/misak-postgres.sh`).

## Seguridad y Sincronización

- **Prohibido leer archivos `.env` / `.env.*`** (excepto `*.example`): bloqueado por el hook `env-guard`.
- **Fuente canónica de agentes/skills/commands**: `.opencode/`. Si modificas cualquier archivo en `.opencode/`, ejecuta `pnpm agents:sync` para actualizar `.agents/`.
