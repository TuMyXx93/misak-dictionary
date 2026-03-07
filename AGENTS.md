# AGENTS.md — Orquestador del Proyecto

> Este archivo es la **fuente de verdad** del proyecto y el punto de entrada para todos los agentes.
> Define las convenciones del codigo, la arquitectura, y orquesta el despacho de tareas hacia
> los agentes especializados, skills y commands configurados en `.opencode/`.

## Project Overview

pnpm monorepo for a Misak Cultural Dictionary. Two active apps:

- **`apps/web-client`** -- React 19 + Vite 7 + TailwindCSS 4 + Framer Motion (PWA)
- **`apps/backend-service`** -- Fastify 5 + Prisma 7 + PostgreSQL (Clean Architecture)

Shared packages in `packages/` (planned). Node 22, TypeScript 5.9, ESM throughout.

## Build / Lint / Test Commands

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `pnpm install`         | Install all dependencies (npm/yarn are blocked) |
| `pnpm dev:web`         | Start frontend dev server (Vite)                |
| `pnpm dev:backend`     | Start backend dev server (tsx watch)            |
| `pnpm build:web`       | Build frontend for production                   |
| `pnpm build:backend`   | Build backend (tsc)                             |
| `pnpm lint`            | Biome lint across entire monorepo               |
| `pnpm lint:fix`        | Biome lint with auto-fix                        |
| `pnpm format`          | Biome format (write)                            |
| `pnpm format:check`    | Biome format check (CI)                         |
| `pnpm check`           | Biome check (lint + format + organize imports)  |
| `pnpm check:fix`       | Biome check with auto-fix                       |
| `pnpm ci`              | Biome CI mode (errors fail, used in CI/hooks)   |
| `pnpm test`            | Run web-client tests (Vitest, watch mode)       |
| `pnpm test:coverage`   | Run web-client tests with coverage              |
| `pnpm test:backend`    | Run backend-service tests (Vitest)              |
| `pnpm test:all`        | Run frontend and backend tests                  |
| `pnpm prisma:generate` | Generate Prisma client                          |
| `pnpm db:push`         | Push Prisma schema to database                  |
| `pnpm build:all`       | Build frontend and backend                      |
| `pnpm ci:promote`      | Run promotion safety suite before merge/push    |

### Running a Single Test

```sh
# Frontend -- single file
pnpm --filter web-client exec vitest run src/components/ui/Button.test.tsx

# Frontend -- match by name pattern
pnpm --filter web-client exec vitest run -t "renders correctly"

# Backend -- single file
pnpm --filter @misak/backend-service exec vitest run src/application/use-cases/auth/LoginUseCase.test.ts

# Backend -- match by name pattern
pnpm --filter @misak/backend-service exec vitest run -t "should authenticate"
```

### Git Hooks (Husky)

- **pre-commit**: runs `lint-staged` (Biome check --write on staged files)
- **commit-msg**: runs `commitlint` (validates Conventional Commits format)
- **pre-push**: runs `biome ci .`, `test:all` and `build:all`

### CI Pipelines (GitHub Actions)

Three workflows: `test.yml` (frontend + backend Vitest + Codecov frontend), `lint.yml` (Biome CI + tsc --noEmit), `build.yml` (frontend + backend production builds). All use pnpm 10 + Node 22 with `--frozen-lockfile`.

## Code Style Guidelines

### Formatting (Biome)

- 100 char print width, 2-space indent, LF line endings
- Single quotes, trailing commas (all), semicolons always
- Arrow parens always, bracket spacing on
- Configured in root `biome.json` (single config for entire monorepo)

### Imports

Three-group ordering (not enforced by plugin but followed consistently):

1. External/third-party packages
2. Internal path aliases
3. Relative imports

Use `import type` for type-only imports:

```ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
```

**Frontend** uses path aliases without extensions: `@/`, `@components/`, `@pages/`, `@hooks/`, `@utils/`, `@types/`.
**Backend** uses relative paths with explicit `.js` extensions (NodeNext module resolution): `'./services/TokenService.js'`.

### Naming Conventions

| Element                             | Convention                    | Example                             |
| ----------------------------------- | ----------------------------- | ----------------------------------- |
| Variables, functions, properties    | camelCase                     | `isPasswordValid`, `findByUsername` |
| Classes, React components           | PascalCase                    | `LoginUseCase`, `HeroSection`       |
| Service contract interfaces (ports) | `I` prefix + PascalCase       | `IUserRepository`, `ITokenService`  |
| Data shape interfaces               | PascalCase (no prefix)        | `TokenPayload`, `LoginInput`        |
| Constants                           | UPPER_SNAKE_CASE + `as const` | `IMAGES`, `VIDEOS`, `TEXTS`         |
| Component/class files               | PascalCase                    | `AuthController.ts`, `Button.tsx`   |
| Utility/middleware/route files      | camelCase                     | `authMiddleware.ts`, `cn.ts`        |
| Hooks                               | `use` prefix + camelCase      | `useLazyImage.ts`                   |
| Test files                          | Source name + `.test.ts(x)`   | `LoginUseCase.test.ts`              |
| Directories                         | kebab-case or camelCase       | `use-cases/`, `scrollytelling/`     |

### TypeScript

- **Strict mode** everywhere. Backend uses maximum strictness (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`).
- Prefer `interface` over `type`. Use `type` only for Zod inferences (`z.infer<>`) and utility types (`Omit`, `Pick`).
- Backend functions must have explicit return type annotations. Frontend components may rely on inference.
- Never use `any` without a `biome-ignore` comment and a justification.

### Exports

- **Named exports everywhere.** Default exports only in config files (vite.config, vitest.config).
- Barrel files (`index.ts`) re-export from component directories.
- Constants use `as const` assertions.

### Error Handling

**Backend:** Custom `AppError` class (in `src/shared/errors/AppError.ts`) with `statusCode` and `isOperational`. Controllers use `instanceof` checks:

```ts
if (error instanceof AppError) {
  return reply.status(error.statusCode).send({ error: error.message });
}
```

Use cases throw plain `Error` for business rule violations. Services return `null` for expected failures (e.g., invalid tokens).

**Frontend:** React `ErrorBoundary` class component wrapping the app. Components handle loading/error states locally.

### Async Patterns

- Use `async/await` exclusively. No `.then()` chains.
- Use `Promise.all` for parallel independent operations (e.g., concurrent DB queries).

### React Components

- Functional arrow components with named export: `export const MyComponent = () => { ... };`
- Use `forwardRef` for UI primitives (Button, Input). Set `displayName` after.
- Props interfaces defined in the same file, immediately above the component.
- Code splitting with `React.lazy` + `Suspense` + `LoadingScreen` fallback.
- Custom hooks in `src/hooks/` following `use*` naming.

### Backend Architecture (Clean Architecture)

| Layer          | Directory             | Contains                                        |
| -------------- | --------------------- | ----------------------------------------------- |
| Domain         | `src/domain/`         | Entities, port interfaces (`I*`)                |
| Application    | `src/application/`    | Use cases, DTOs (Zod schemas)                   |
| Infrastructure | `src/infrastructure/` | Repositories (Prisma), auth services (adapters) |
| Presentation   | `src/presentation/`   | Controllers, middleware, route registration     |
| API            | `src/api/`            | Route groups with dedicated controllers/DTOs    |

- Manual constructor-based dependency injection. Wiring done in route files.
- Input validation via Zod schemas: `Schema.parse(request.body)` in controllers.
- Environment variables validated at startup with Zod (`src/shared/config/env.ts`).

### API Response Shape

```ts
// Success
{ statusCode: 200, message: 'Login successful', data: { ... } }
// Paginated
{ data: [...], pagination: { page, limit, total, totalPages } }
// Error
{ statusCode: 401, error: 'Unauthorized', message: '...' }
```

### Testing Conventions

- **Framework:** Vitest 4 with globals enabled (no need to import `describe`, `it`, `expect`).
- **Frontend tests:** Vitest + React Testing Library + `@testing-library/jest-dom` matchers.
- **Test files:** Colocated next to source files using `.test.ts` / `.test.tsx` suffix.
- **Pattern:** Arrange/Act/Assert. Use `describe` blocks per component/method, `it` blocks per behavior.
- **Coverage thresholds:** 70% (frontend), 80% (backend) for lines/functions/branches/statements.

### Comments and Documentation

- Every file starts with a JSDoc block describing module purpose and sprint context.
- Public interfaces and component props get `/** */` doc comments.
- Reusable components include `@example` with TSX snippets.
- Inline comments use numbered steps for procedural logic (Spanish).
- Section dividers in large files: `// ========== SECTION NAME ==========`

---

## Pre-Task Security Gate

> CRITICAL: Antes de despachar cualquier tarea que modifique codigo del proyecto a un agente,
> el orquestador DEBE verificar el estado del repositorio ejecutando `/version-gate`.

Si el gate **FALLA** (hay BLOCKERS):

1. Reportar los blockers al usuario
2. NO proceder con la tarea hasta resolver los issues
3. Delegar la resolucion al agente apropiado (`@devops` para hooks/config, direct para fixes)

Si el gate **PASA con WARNINGS**:

1. Reportar los warnings al usuario
2. Pedir confirmacion para proceder
3. Despachar la tarea al agente correspondiente

Si el gate **PASA LIMPIO**:

1. Proceder directamente con la tarea

Para ejecutar el gate manualmente: `/version-gate`
Para crear un release: `/version-bump <patch|minor|major|alpha|beta|first>`

---

## Agent Orchestration System

> Todo el sistema de agentes reside en `.opencode/`. Este AGENTS.md actua como orquestador:
> lee el contexto del proyecto, identifica el tipo de tarea, y despacha al agente, skill o
> command apropiado. Los agentes heredan el modelo activo de la sesion (model-agnostic).

### Agentes Disponibles

| Agente        | Modo     | Proposito                                                                             | Invocacion                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- | --------------------------- |
| **architect** | subagent | Meta-agente: crea y gestiona agentes, skills, commands y herramientas sobre la marcha | `@architect <instruccion>`  |
| **frontend**  | subagent | Especialista en React 19, Vite 7, TailwindCSS 4, Framer Motion, hooks y componentes   | `@frontend <tarea>`         |
| **backend**   | subagent | Especialista en Fastify 5, Prisma 7, Clean Architecture, Zod, PostgreSQL              | `@backend <tarea>`          |
| **reviewer**  | subagent | Code review en modo read-only. Analiza calidad, seguridad, performance, arquitectura  | `@reviewer <scope>`         |
| **tester**    | subagent | Testing con Vitest + React Testing Library. Genera y mejora tests                     | `@tester <archivo o scope>` |
| **devops**    | subagent | CI/CD, GitHub Actions, Docker, infraestructura y despliegue                           | `@devops <tarea>`           |

### Commands Disponibles

| Comando           | Argumentos                    | Descripcion                                                                         |
| ----------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `/gen-component`  | `$1` = NombreComponente       | Genera un componente React completo siguiendo las convenciones del proyecto         |
| `/gen-usecase`    | `$1` = NombreUseCase          | Genera un use case con Clean Architecture (domain, application, infrastructure)     |
| `/gen-test`       | `$1` = ruta/al/archivo        | Genera tests para el archivo indicado con cobertura completa                        |
| `/review`         | `$ARGUMENTS` = scope opcional | Ejecuta code review del scope indicado o de los cambios recientes                   |
| `/check-arch`     | ninguno                       | Valida que la estructura del proyecto respete Clean Architecture                    |
| `/db-migrate`     | `$1` = nombre-migracion       | Crea una migracion Prisma con nombre descriptivo                                    |
| `/docs-gate`      | `$1` = latest/tag/rango       | Valida si los cambios del changelog deben reflejarse en la documentacion canonica   |
| `/pre-merge-gate` | `$ARGUMENTS` = contexto extra | Valida si `dev` esta lista para promoverse a `main` sin modificar ramas             |
| `/merge-gate`     | `$ARGUMENTS` = contexto extra | Valida y ejecuta de forma segura el merge local `dev -> main` antes del push remoto |
| `/push-gate`      | `$ARGUMENTS` = contexto extra | Ejecuta push seguro de `main`, observa GitHub Actions y decide el retorno a `dev`   |
| `/promote-main`   | `$ARGUMENTS` = contexto extra | Orquesta `dev -> main -> push opcional -> retorno seguro a dev`                     |
| `/version-gate`   | `$ARGUMENTS` = contexto extra | Pre-task security gate: valida estado del repo antes de cualquier tarea             |
| `/version-bump`   | `$1` = tipo de bump           | Ejecuta version bump con changelog automatico y tag git                             |

### Skills Disponibles (carga bajo demanda)

| Skill                | Descripcion                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `react-component`    | Patron completo para componentes React con props, tipos, JSDoc, barrel export y test                        |
| `clean-arch-usecase` | Patron para use cases siguiendo Clean Architecture con entity, port, use case, repository, controller y DTO |
| `api-endpoint`       | Patron para endpoints Fastify con controller, Zod schema, middleware y registro de rutas                    |
| `prisma-migration`   | Patron para migraciones Prisma con schema, seed data y validacion                                           |
| `vitest-testing`     | Patron para tests con Vitest siguiendo Arrange/Act/Assert, mocks y cobertura                                |
| `agent-creator`      | Meta-skill que ensenya al architect a crear nuevos agentes, skills y commands                               |
| `versioning`         | Patron de versionamiento: semver, Conventional Commits, commitlint, changelog y security gate               |

### Reglas de Delegacion

CRITICAL: Cuando encuentres una tarea, sigue estas reglas de despacho:

0. **Pre-task validation** (antes de cualquier tarea que modifique codigo) → ejecutar `/version-gate`
1. **Generacion de codigo frontend** (componentes, hooks, pages, estilos) → usa `@frontend` o el skill `react-component`
2. **Generacion de codigo backend** (use cases, controllers, repositories, DTOs) → usa `@backend` o los skills `clean-arch-usecase` / `api-endpoint`
3. **Code review o analisis de calidad** → usa `@reviewer` (NUNCA modifica archivos, solo analiza)
4. **Generacion o mejora de tests** → usa `@tester` o el skill `vitest-testing`
5. **CI/CD, Docker, infraestructura** → usa `@devops`
6. **Crear nuevos agentes, skills o commands** → usa `@architect` con el skill `agent-creator`
7. **Tareas generales de desarrollo** → usa el agente Build (default) directamente
8. **Versioning, releases y tags** → usa `@devops` con el skill `versioning`

### Carga Lazy de Instrucciones

Cuando necesites instrucciones especificas para una tarea, carga el skill correspondiente usando la herramienta `skill()`.
NO precargues todos los skills al inicio — solo carga lo que necesites para la tarea actual.

### MCP Servers

- **context7**: Busqueda de documentacion de librerias. Usa `use context7` cuando necesites consultar docs de React, Fastify, Prisma, Vite, TailwindCSS u otras dependencias del proyecto.
