# ADR-0002: Arquitectura Unificada de Agentes para OpenCode, Antigravity App y Antigravity CLI

- **Estado:** Aceptada
- **Fecha:** 2026-10-15
- **Autores:** sesión arquitectónica (agente + validación humana)

## Contexto

El repositorio `misak-dictionary` fue estructurado originalmente alrededor de **OpenCode** (`opencode.json`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/` y `AGENTS.md`), integrando el flujo Spec-Driven Development (`specs/`, ADR-0001) y la memoria persistente en **Engram**.

Al incorporar **Antigravity app (2.0)** y **Antigravity CLI (`agy`)** como entornos de desarrollo activo, se identificaron cinco brechas:

1. **Incompatibilidad de sintaxis de commands y subagentes:** OpenCode usa `.opencode/commands/*.md` (`$1`, `$ARGUMENTS`, `` !`cmd` ``, `agent:`) y `.opencode/agents/*.md` (`mode: subagent`, `permission:`), mientras que Antigravity descubre skills en `.agents/skills/<name>/SKILL.md` (convertidos automáticamente en `/slash-commands`) y agentes en `.agents/agents/<name>/agent.md`.
2. **Colisión de slash commands nativos:** `/plan` (app y CLI) y `/tasks` (CLI) son comandos nativos de Antigravity y entran en conflicto con los comandos homónimos del ciclo SDD.
3. **Aislamiento de servidores MCP por proyecto:** El archivo global `~/.gemini/config/mcp_config.json` contenía un servidor `postgres` apuntando a `tumifact_db:5432`, exponiendo la base de datos de otro proyecto en las sesiones de `misak-dictionary` (`localhost:5434/misak_dictionary`).
4. **Falta de bloqueo de lectura de `.env` en Antigravity:** Mientras `opencode.json` bloquea `*.env` y `*.env.*`, Antigravity permite por defecto leer archivos dentro del workspace salvo que un hook `PreToolUse` o regla explícita lo impida.
5. **Divergencia de formateador:** `opencode.json` invocaba `prettier`, pese a que el proyecto migró a **Biome v2**.

## Decisión

Adoptar un modelo de **Fuente Canónica Única con Proyección Determinista (`.opencode/` → `.agents/`)**:

1. **Fuente canónica (`.opencode/`):**
   - Los 6 agentes, 13 commands y 7 skills en `.opencode/` se mantienen como fuente de verdad.
   - `scripts/agents/sync-antigravity.mjs` (`pnpm agents:sync`) genera de forma determinista el árbol `.agents/` y `pnpm agents:check` verifica en `lint-staged` y CI que no exista desfase.
2. **Reutilización sin duplicación de skills de dominio:**
   - `.agents/skills.json` registra `{ "path": ".opencode/skills", "exclude": ["agent-creator"] }`, de modo que Antigravity app, CLI e IDE cargan directamente los skills de dominio sin duplicar archivos.
3. **Resolución de colisiones SDD:**
   - Los comandos `/specify`, `/plan` y `/tasks` se proyectan como `/sdd-specify`, `/sdd-plan` y `/sdd-tasks` en `.agents/skills/`.
4. **Herencia de modelo (`model: inherit`):**
   - Los 6 subagentes en `.agents/agents/<name>/agent.md` declaran `model: inherit`, `subagent: true`, `mainAgent: true` y `commandExecutionPolicy: sandbox` (con lista explícita de tools de solo lectura para `reviewer`).
5. **Hooks de ciclo de vida (`.agents/hooks.json`):**
   - `env-guard` (`PreToolUse` sobre `view_file`): bloquea la lectura de `.env` y `.env.*` (salvo `*.example`).
   - `biome-format` (`PostToolUse` sobre edición de archivos): ejecuta `biome format --write`.
   - `engram-protocol` (`SessionStart`): inyecta el recordatorio del protocolo Engram + `/version-gate`.
6. **Aislamiento de MCPs por alcance:**
   - Global (`~/.gemini/config/mcp_config.json`, compartido por app y CLI): solo servidores transversales (`engram`, `context7`).
   - Por proyecto (`.agents/mcp_config.json`): `misak-postgres` en `misak-dictionary` (vía wrapper `scripts/mcp/misak-postgres.sh` que lee `.env.docker` sin versionar credenciales), `tumifact-postgres` en `TumiFact` y `tumisuite-postgres` en `tumi-suite`.

## Consecuencias

**Positivas:**

- ~85 % de la configuración vive versionada en el repositorio y es descubierta automáticamente por OpenCode, Antigravity app, Antigravity CLI y Antigravity IDE.
- Cero mantenimiento manual doble gracias a `pnpm agents:sync` y al gate `pnpm agents:check` en CI y `lint-staged`.
- Aislamiento estricto de bases de datos PostgreSQL por workspace y protección uniforme de archivos `.env`.

**Negativas (aceptadas):**

- Los archivos generados en `.agents/` se versionan en Git para que Antigravity los descubra inmediatamente al clonar sin requerir un paso previo de build.
- La selección del modelo primario por defecto y los permisos globales continúan residiendo en cada superficie (`config.json` en la app y `settings.json` en la CLI).
