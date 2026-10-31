---
id: 011-auditoria-limpieza-deuda-tecnica
version: 0.2.0
status: approved
cultural-gate: true
---

# 011 — Auditoría Técnica y Saneamiento Profundo de Deuda Técnica

## Contexto

Tras completar las iteraciones fundacionales y verticales del Diccionario Cultural Misak (Specs 001 a 010: autenticación RBAC con Argon2id, taxonomía recursiva de 65 nodos, modelo canónico `SentidoLexico` + `FormaNamtrik`, gobierno editorial, medios escalonados, gestión de usuarios/sesiones, rediseño UX/búsqueda bilingüe vectorizada y tipografía identitaria Namtrik), el monorepo acumula código obsoleto, artefactos temporales y documentación histórica de etapas pre-SDD (Sprints 1–4 / Weeks 1–2 de 2025) que generan ruido cognitivo y técnico tanto para desarrolladores como para agentes de IA.

Con el fin de alinear íntegramente el entorno antes de las fases finales de optimización previas al lanzamiento, esta especificación establece un **Protocolo de Depuración y Limpieza Profunda** bajo las siguientes decisiones arquitectónicas confirmadas:

1. **Unificación de Contextos en Frontend**: Consolidación de todos los contextos de React bajo la estructura única `apps/web-client/src/contexts/` (plural), eliminando el directorio duplicado `apps/web-client/src/context/`.
2. **Estrategia de Saneamiento Backend (Opción B — Solo Fase 3A)**: Eliminación definitiva del código, controlador, DTO, casos de uso y rutas administrativas obsoletas de `PalabraModelo1` (reemplazados en producción por `adminSentidoRoutes.ts` y `adminPapeleraRoutes.ts`), junto con la unificación del montaje de `adminGovernanceRoutes` bajo `/api/admin/governance`. Las tablas en `prisma/schema.prisma` (`PalabraModelo1`, `PalabraModelo2`, `PalabraM1Microcampo`, `PalabraM2Microcampo`, `PasswordReset`) se mantienen sin ejecutar `DROP TABLE` en esta iteración para garantizar riesgo cero sobre la base de datos.
3. **Política de Cero Archivado Innecesario en Documentación**: Eliminación definitiva de toda la documentación histórica, reportes de sprints pasados, planes de migración de prototipos y análisis obsoletos en `docs/`, `apps/web-client/docs/` y `apps/backend-service/docs/`. Los documentos canónicos activos (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md`, `apps/backend-service/README.md` y `specs/steering/glossary.md`) se depuran para reflejar exclusivamente la arquitectura, el stack y la taxonomía reales y vigentes del proyecto.

## Requisitos (EARS)

- **R-001** (Ubiquitous): El repositorio **debe** preservar intactos todos los módulos de producción activos (`apps/web-client`, `apps/backend-service`), los esquemas de base de datos en `prisma/schema.prisma`, las migraciones numeradas `0001`–`0013`, el corpus cultural canónico (`data/taxonomy/v1/*`, `data/lexicon/v1/*`) y la configuración de agentes (`.opencode/` sincronizado hacia `.agents/`), garantizando cero regresiones funcionales.
- **R-002** (Event-driven): **Cuando** se ejecute el saneamiento de artefactos temporales, prototipos y residuos de herramientas (Fase 1), el sistema **debe** eliminar de forma definitiva:
  1. `.npmrc.bak` en la raíz del repositorio.
  2. El directorio `.kilo/` completo (`package.json`, `package-lock.json`, `.gitignore`, `node_modules/`).
  3. Los archivos de gestión de paquetes ajenos a pnpm dentro de `.opencode/`: `.opencode/bun.lock`, `.opencode/package-lock.json`, `.opencode/package.json` y `.opencode/node_modules/`.
  4. Los artefactos compilados en `apps/backend-service/prisma/`: `seed.js`, `seed.js.map`, `seed.d.ts` y `seed.d.ts.map`, añadiendo reglas en `.gitignore` (`apps/backend-service/prisma/*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map`) para impedir su regeneración en el árbol de trabajo.
  5. El script SQL suelto `apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql`.
  6. El árbol de prototipos SQL pre-Prisma `infrastructure/` (`infrastructure/database/prototypes/database-schema-admin.{sql,md}` y `database-schema_dictionary.{sql,md}`).
- **R-003** (Event-driven): **Cuando** se ejecute la limpieza de paquetes huérfanos del monorepo (Fase 1), el sistema **debe** eliminar el directorio `packages/` (`packages/shared-types` y `packages/ui-components`, que solo contienen binarios residuales en `node_modules`) y actualizar `pnpm-workspace.yaml` para declarar exclusivamente `apps/*`.
- **R-004** (Event-driven): **Cuando** se ejecute la limpieza y unificación del frontend en `apps/web-client` (Fase 2), el sistema **debe**:
  1. Eliminar definitivamente los componentes sin consumidores en producción `src/components/features/scrollytelling/ScrollIndicator.tsx` (+ `ScrollIndicator.test.tsx`) y `src/components/features/social/SocialLinks.tsx` (+ `SocialLinks.test.tsx`), junto con sus carpetas contenedoras `scrollytelling/` y `social/`.
  2. Trasladar `src/context/AudioPlayerContext.tsx` y `src/context/AudioPlayerContext.test.tsx` hacia `src/contexts/`, eliminar el directorio `src/context/` y actualizar todas las importaciones en `apps/web-client/src/` hacia `@/contexts/AudioPlayerContext`.
- **R-005** (Event-driven): **Cuando** se ejecute la limpieza de utilidades sin uso en el backend `apps/backend-service` (Fase 2), el sistema **debe** eliminar definitivamente `src/utils/postgres18-helpers.ts` y `src/utils/postgres18-helpers.test.ts`.
- **R-006** (Event-driven): **Cuando** se ejecute el Protocolo de Depuración Documental Profunda (Fase 2), el sistema **debe**:
  1. **Eliminar de forma definitiva** (sin archivar) todos los documentos históricos, reportes de sprints y análisis obsoletos:
     - `docs/PRE-MERGE-ANALYSIS.md`
     - `docs/archive/WEEK1-FINAL-REPORT.md` y `docs/archive/WEEK2-FINAL-REPORT.md` (y el directorio `docs/archive/`)
     - `docs/design/DESIGN-SUMMARY.md` (y el directorio `docs/design/`)
     - `docs/development/GITHUB-ACTIONS-STATUS.md`, `docs/development/SESSION-SUMMARY-2025-10-04.md` y `docs/development/prototype-migration-plan.md` (y el directorio `docs/development/`)
     - `docs/reports/ACCESSIBILITY-AUDIT-SPRINT3.md`, `docs/reports/COVERAGE-REPORT-SPRINT4.md`, `docs/reports/LIGHTHOUSE-SEO-READINESS-SPRINT4.md` y `docs/reports/audit-2025-10-04-repository-state.md` (y el directorio `docs/reports/`)
     - `docs/testing/TESTING-GUIDE.md` (y el directorio `docs/testing/`)
     - `apps/web-client/docs/DESIGN-ANALYSIS.md` y `apps/web-client/docs/optimization-report.md` (y el directorio `apps/web-client/docs/`)
     - `apps/backend-service/docs/PG18-QUICK-START.md` y `apps/backend-service/docs/POSTGRESQL18-FEATURES.md` (y el directorio `apps/backend-service/docs/`)
  2. **Depurar y actualizar los 5 documentos canónicos activos** (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md` y `apps/backend-service/README.md`) para:
     - Eliminar todos los enlaces hacia los archivos eliminados en el numeral anterior.
     - Eliminar menciones a tecnologías descartadas o inexistentes en el proyecto (`ElasticSearch`, `Redis`, `Cloudinary`, `Jotai`, `Headless UI`, `Storybook`, `Bcrypt`, `Spline Sans`), componentes retirados (`ScrollIndicator`, `SocialLinks`) y comandos sobre `infrastructure/database/prototypes/`.
     - Reflejar con exactitud el estado real vigente: React 19 + Vite 7 + TailwindCSS 4 (`@tailwindcss/vite` + Lightning CSS), tipografía compuesta `Plus Jakarta Sans` + `Noto Sans` (Spec 010), Fastify 5 + Prisma 7 + PostgreSQL 18, Argon2id + JWT + RBAC de 6 roles, taxonomía v1 de 65 nodos, 1.351 sentidos / 1.451 formas léxicas y medios culturales escalonados.
  3. **Corregir la desalineación cultural en `specs/steering/glossary.md`**: Actualizar las entradas de los campos semánticos C3 y C4 a **Tra Tul** (`tra-tul` — *La Huerta Lejana*) y **Kau Ushamera** (`kau-ushamera` — *Animales Originarios*) conforme a `data/taxonomy/v1/taxonomia.yaml`.
  4. **Cerrar el ciclo de vida en `specs/features/`**: Trasladar las especificaciones ya implementadas y fusionadas en `dev` (`002-auth-rbac`, `003-integracion-vertical`, `004-esquema-contenido`, `005-sentido-formas-lexico`, `007-medios-escalonados`, `008-gobierno-usuarios-sesion`, `009-rediseno-ux-home-navegacion-busqueda` y `010-tipografia-identidad-grafema-namtrik`) hacia `specs/archive/`, actualizando `commitlint-plugin-spec-refs.mjs` si fuera necesario para admitir referencias tanto a `specs/features/` como a `specs/archive/`.
- **R-007** (State-driven): **Mientras** se ejecute la Fase 3A de retiro de la capa administrativa obsoleta de `PalabraModelo1` (Estrategia Opción B), el sistema **debe**:
  1. Eliminar definitivamente `apps/backend-service/src/api/admin/routes/adminDictionaryRoutes.ts`, `src/api/admin/controllers/AdminDictionaryController.ts` (+ `.test.ts`), `src/application/dtos/AdminDictionaryDto.ts` (+ `.test.ts`), `src/application/use-cases/admin/CreateWordModel1UseCase.ts` (+ `.test.ts`), `src/application/use-cases/admin/UpdateWordModel1UseCase.ts` (+ `.test.ts`), `src/application/use-cases/admin/DeleteWordUseCase.ts` (+ `.test.ts`) y `src/application/use-cases/admin/ManageSemanticFieldsUseCase.ts` (+ `.test.ts`).
  2. Unificar el montaje de `adminGovernanceRoutes` en `apps/backend-service/src/app.ts` exclusivamente bajo `/api/admin/governance` (prefijo ya consumido por `apps/web-client/src/hooks/useAdmin.ts`), alineando `adminGovernanceRoutes.ts`, `adminGovernanceRoutes.test.ts` y `adminMaintenanceRoutes.test.ts` (hacia `adminPapeleraRoutes` en `/api/admin/papelera`).
  3. Conservar intactos los modelos de `apps/backend-service/prisma/schema.prisma` sin ejecutar `DROP TABLE` en PostgreSQL durante esta iteración.
- **R-008** (Unwanted behavior): **Si** cualquier operación de limpieza modifica o elimina archivos del repositorio, **entonces** el sistema **no debe** producir errores en `pnpm run ci`, `pnpm run agents:check`, `pnpm run build:web`, `pnpm run build:backend`, ni en la ejecución completa de las suites de tests activas de `web-client` y `backend-service`.

## Criterios de aceptación (Gherkin)

### Escenario 1: Fase 1 — Eliminación de artefactos temporales, prototipos SQL, residuos de gestores y paquetes vacíos (R-002, R-003, R-008)
```gherkin
Dado el árbol del monorepo en la rama de saneamiento
Cuando se eliminan ".npmrc.bak", ".kilo/", ".opencode/{bun.lock,package-lock.json,package.json,node_modules}", "apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}", "apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql", "infrastructure/" y "packages/"
Y se actualiza "pnpm-workspace.yaml" para contener únicamente "apps/*" y se protegen los artefactos compilados de "prisma/" en ".gitignore"
Entonces no existen archivos de lock ajenos a "pnpm-lock.yaml" en el repositorio
Y "pnpm run ci", "pnpm run build:web" y "pnpm run build:backend" finalizan con código 0.
```

### Escenario 2: Fase 2 — Eliminación de código muerto y unificación de "contexts" en Frontend y Backend (R-004, R-005, R-008)
```gherkin
Dado que "ScrollIndicator.tsx", "SocialLinks.tsx" y "postgres18-helpers.ts" carecen de consumidores en producción
Cuando se eliminan dichos módulos junto con sus tests y directorios contenedores
Y se traslada "AudioPlayerContext.tsx" (y su test) a "apps/web-client/src/contexts/" eliminando "apps/web-client/src/context/"
Entonces todas las importaciones de contextos en "apps/web-client/src/" apuntan a "@/contexts/*"
Y el compilador TypeScript y Vitest pasan al 100% en "web-client" y "backend-service".
```

### Escenario 3: Fase 2 — Depuración documental profunda sin archivado innecesario y alineación del glosario (R-006)
```gherkin
Dado el protocolo de cero ruido histórico en la documentación del proyecto
Cuando se eliminan de forma definitiva "docs/PRE-MERGE-ANALYSIS.md", "docs/archive/", "docs/design/", "docs/development/", "docs/reports/", "docs/testing/", "apps/web-client/docs/" y "apps/backend-service/docs/"
Y se actualizan "README.md", "docs/project.md", "docs/CURRENT-STATE.md", "apps/web-client/README.md", "apps/backend-service/README.md" y "specs/steering/glossary.md" (con "Tra Tul" y "Kau Ushamera" en C3 y C4)
Entonces el directorio "docs/" contiene únicamente documentos canónicos vigentes sin enlaces rotos ni referencias a tecnologías descartadas
Y "/docs-gate" reporta consistencia documental con el estado real del monorepo.
```

### Escenario 4: Fase 3A (Opción B) — Retiro de rutas y casos de uso administrativos legados de Modelo 1 sin tocar el esquema de base de datos (R-001, R-007, R-008)
```gherkin
Dado que se adoptó oficialmente la Opción B (ejecutar Fase 3A manteniendo intacto "prisma/schema.prisma")
Cuando se eliminan "adminDictionaryRoutes.ts", "AdminDictionaryController.ts", "AdminDictionaryDto.ts", "CreateWordModel1UseCase.ts", "UpdateWordModel1UseCase.ts", "DeleteWordUseCase.ts" y "ManageSemanticFieldsUseCase.ts" (junto con sus tests)
Y se unifica "adminGovernanceRoutes" bajo "/api/admin/governance" en "app.ts" y "useAdmin.ts"
Entonces el panel administrativo opera íntegramente sobre "/api/admin/sentidos", "/api/admin/governance", "/api/admin/papelera", "/api/admin/users", "/api/admin/audit", "/api/admin/settings" y "/api/admin/media"
Y no se requiere ninguna migración destructiva ("DROP TABLE") sobre PostgreSQL.
```

## Fuera de alcance

- Ejecutar migraciones `DROP TABLE` en PostgreSQL o eliminar modelos de `apps/backend-service/prisma/schema.prisma` (pospuesto explícitamente bajo la **Opción B**).
- Modificar o eliminar las migraciones numeradas históricas de Prisma (`0001_init` a `0013_search_ranking_misak`).
- Alterar el corpus cultural canónico en `data/taxonomy/v1/` o `data/lexicon/v1/`.
- Modificar la lógica de negocio activa de sentidos léxicos, formas Namtrik, medios culturales, autenticación RBAC o búsqueda bilingüe vectorizada.

## Trazabilidad

- **Principios constitucionales**:
  - `C1.1` y `C1.2` (Soberanía lingüística y fidelidad al corpus Misak al alinear `specs/steering/glossary.md` con *Tra Tul* y *Kau Ushamera*).
  - `C2.1` y `C2.2` (Separación estricta de capas Clean Architecture y fronteras tipadas sin rutas ni controladores huérfanos).
  - `C4.1`, `C4.2` y `C4.3` (Flujo SDD y coherencia documental libre de ruido histórico).
- **ADRs relacionados**:
  - `ADR-0001` (Adopción de Spec-Driven Development).
  - `ADR-0003` (Modelo Sentido + Formas Léxicas y Ubicación Multinivel).
  - `ADR-0004` (Sesión Administrativa y Gobierno Editorial).
  - `ADR-0006` (Tipografía Compuesta y Armonización del Grafema Namtrik).
