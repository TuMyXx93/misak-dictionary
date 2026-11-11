---
id: 011-auditoria-limpieza-deuda-tecnica
version: 1.0.0
status: done
cultural-gate: true
---

# 011 — Auditoría Técnica y Saneamiento Profundo de Deuda Técnica

## Contexto

Tras completar las iteraciones fundacionales y verticales del Diccionario Misak (Specs 001 a 010: autenticación RBAC con Argon2id, taxonomía recursiva de 65 nodos, modelo canónico `SentidoLexico` + `FormaNamtrik`, gobierno editorial, medios escalonados, gestión de usuarios/sesiones, rediseño UX/búsqueda bilingüe vectorizada y tipografía identitaria Namtrik), el monorepo acumulaba código obsoleto, prototipos heredados, desalineaciones de configuración y documentación histórica de etapas pre-SDD (Sprints 1–4 / Weeks 1–4 de 2025) que generaban ruido cognitivo y técnico tanto para desarrolladores como para agentes de IA.

Con el fin de alinear íntegramente el entorno antes de las fases finales de optimización previas al lanzamiento, esta especificación establece un **Protocolo de Depuración, Alineación Técnica y Limpieza Profunda** bajo las siguientes directrices confirmadas:

1. **Unificación de Contextos en Frontend**: Consolidación de todos los contextos de React bajo `apps/web-client/src/contexts/` (plural), eliminando `apps/web-client/src/context/` y los componentes sin consumidores (`ScrollIndicator`, `SocialLinks`).
2. **Estrategia de Saneamiento Backend (Opción B — Sin `DROP TABLE`)**: Eliminación definitiva del código, controlador, DTO, casos de uso y rutas administrativas obsoletas de `PalabraModelo1` junto con la unificación de `adminGovernanceRoutes` en `/api/admin/governance`, **conservando intacto `prisma/schema.prisma`** en esta iteración (diferiendo la purga física de tablas legadas a `Spec 012`), más la poda de dependencias y variables de entorno muertas.
3. **Eliminación de Prototipos Residuales (`infrastructure/` y `apps/prototypes/`)**: Retiro definitivo tanto de los prototipos SQL manuales pre-Prisma como de los prototipos HTML estáticos y notas de migración obsoletas en `apps/prototypes/`, dejando `apps/` exclusivamente con los dos paquetes productivos (`web-client` y `backend-service`).
4. **Alineación Técnica y Documentación de Infraestructura Docker**: Corrección de inconsistencias reales en `nginx.conf`, `Dockerfile` y `docker/compose*.yml` (enrutamiento mismo-origen de `/api/` y `/auth/`, límite de carga multimedia de 100 MB, streaming `HTTP 206` sin buffering y volumen persistente `media_data` compatible con `read_only: true`), acompañada de documentación técnica moderna y detallada de Docker.
5. **Política de Cero Ruido Histórico, Fidelidad Cromática/PWA y Unificación Institucional de Marca ("Diccionario Misak")**: Eliminación definitiva de reportes históricos de sprints; reescritura profesional y fiel al código de `apps/backend-service/README.md`, `apps/web-client/README.md` (con la paleta oficial de 4 colores Misak `#e52d6d`, `#0055aa`, `#ffffff`, `#000000` sincronizada también en el manifiesto e iconos PWA), `README.md`, `docs/CURRENT-STATE.md` y `docs/project.md`; alineación de agentes/steering; y estandarización del nombre del producto a **Diccionario Misak** (`Wamtɵrmarɵpik — Diccionario Misak`) en documentación activa, metadatos y UI administrativa.

## Requisitos (EARS)

- **R-001** (Ubiquitous): El repositorio **debe** preservar intactos todos los módulos de producción activos (`apps/web-client`, `apps/backend-service`), los esquemas de base de datos en `prisma/schema.prisma`, las migraciones numeradas `0001`–`0013`, el historial cerrado (`CHANGELOG.md`, `specs/archive/*`), el corpus cultural canónico (`data/taxonomy/v1/*`, `data/lexicon/v1/*`) y la paridad `.opencode/` ↔ `.agents/`, garantizando cero regresiones funcionales.
- **R-002** (Event-driven): **Cuando** se ejecute el saneamiento de artefactos temporales, prototipos SQL y residuos de herramientas (Fase 1), el sistema **debe** eliminar de forma definitiva:
  1. `.npmrc.bak` en la raíz del repositorio.
  2. El directorio `.kilo/` completo (`package.json`, `package-lock.json`, `.gitignore`, `node_modules/`).
  3. Los archivos de gestión de paquetes ajenos a `pnpm` dentro de `.opencode/`: `.opencode/bun.lock`, `.opencode/package-lock.json`, `.opencode/package.json` y `.opencode/node_modules/`.
  4. Los artefactos compilados en `apps/backend-service/prisma/`: `seed.js`, `seed.js.map`, `seed.d.ts` y `seed.d.ts.map`, añadiendo reglas en `.gitignore` (`apps/backend-service/prisma/*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map`) para impedir su regeneración en el árbol de trabajo.
  5. El script SQL suelto `apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql`.
  6. El árbol de prototipos SQL pre-Prisma `infrastructure/` (`infrastructure/database/prototypes/database-schema-admin.{sql,md}` y `database-schema_dictionary.{sql,md}`).
- **R-003** (Event-driven): **Cuando** se ejecute la limpieza de paquetes huérfanos del monorepo (Fase 1), el sistema **debe** eliminar el directorio `packages/` (`packages/shared-types` y `packages/ui-components`, que solo contienen binarios residuales en `node_modules`) y actualizar `pnpm-workspace.yaml` para declarar exclusivamente `apps/*`.
- **R-004** (Event-driven): **Cuando** se ejecute la limpieza y unificación del frontend en `apps/web-client` (Fase 2), el sistema **debe**:
  1. Eliminar definitivamente los componentes sin consumidores en producción `src/components/features/scrollytelling/ScrollIndicator.tsx` (+ `ScrollIndicator.test.tsx`) y `src/components/features/social/SocialLinks.tsx` (+ `SocialLinks.test.tsx`), junto con sus carpetas contenedoras `scrollytelling/` y `social/`.
  2. Trasladar `src/context/AudioPlayerContext.tsx` y `src/context/AudioPlayerContext.test.tsx` hacia `src/contexts/`, eliminar el directorio `src/context/` y actualizar todas las importaciones en `apps/web-client/src/` hacia `@/contexts/AudioPlayerContext`.
- **R-005** (Event-driven): **Cuando** se ejecute la limpieza de utilidades sin uso en el backend `apps/backend-service` (Fase 2), el sistema **debe** eliminar definitivamente `src/utils/postgres18-helpers.ts`, `src/utils/postgres18-helpers.test.ts` y el directorio contenedor `src/utils/` si queda vacío.
- **R-006** (Event-driven): **Cuando** se ejecute el Protocolo de Depuración Documental Profunda (Fase 2 y Fase 4), el sistema **debe**:
  1. **Eliminar de forma definitiva** (sin archivar) todos los documentos históricos, reportes de sprints y análisis obsoletos:
     - `docs/PRE-MERGE-ANALYSIS.md`
     - `docs/archive/WEEK1-FINAL-REPORT.md` y `docs/archive/WEEK2-FINAL-REPORT.md` (y el directorio `docs/archive/`)
     - `docs/design/DESIGN-SUMMARY.md` (y el directorio `docs/design/`)
     - `docs/development/GITHUB-ACTIONS-STATUS.md`, `docs/development/SESSION-SUMMARY-2025-10-04.md` y `docs/development/prototype-migration-plan.md` (y el directorio `docs/development/`)
     - `docs/reports/ACCESSIBILITY-AUDIT-SPRINT3.md`, `docs/reports/COVERAGE-REPORT-SPRINT4.md`, `docs/reports/LIGHTHOUSE-SEO-READINESS-SPRINT4.md` y `docs/reports/audit-2025-10-04-repository-state.md` (y el directorio `docs/reports/`)
     - `docs/testing/TESTING-GUIDE.md` (y el directorio `docs/testing/`)
     - `apps/web-client/docs/DESIGN-ANALYSIS.md` y `apps/web-client/docs/optimization-report.md` (y el directorio `apps/web-client/docs/`)
     - `apps/backend-service/docs/PG18-QUICK-START.md` y `apps/backend-service/docs/POSTGRESQL18-FEATURES.md` (y el directorio `apps/backend-service/docs/`)
  2. **Depurar y actualizar íntegramente los 5 documentos canónicos activos** (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md` y `apps/backend-service/README.md`) para:
     - Eliminar todos los enlaces hacia los archivos eliminados y toda narrativa histórica innecesaria de `Weeks` o `Sprints` de 2025.
     - Eliminar menciones a tecnologías descartadas o inexistentes en producción (`ElasticSearch`, `Redis`, `Cloudinary`, `Twilio`, `S3`, `Jotai`, `Headless UI`, `Storybook`, `CQRS + Event Sourcing`, `RS256`, `React Compiler`, `Terser`, `tailwind.config.js`), paquetes eliminados (`@packages/shared-types`, `ui-components`, `services/dictionary-service`) y componentes o rutas retiradas (`ScrollIndicator`, `SocialLinks`, `/api/admin/dictionary/words/modelo1`).
     - Reflejar con exactitud el estado real vigente: React 19 + Vite 7 + TailwindCSS 4 (`@tailwindcss/vite` + `Lightning CSS`), tipografía compuesta `Spline Sans` armonizada métricamente con `Noto Sans` (`ADR-0006`), Sistema Cromático Oficial Misak (`#e52d6d`, `#0055aa`, `#ffffff`, `#000000`), Fastify 5 + Prisma 7 + PostgreSQL 18, Argon2id (`@node-rs/argon2`) + JWT + cookies `httpOnly` + RBAC de 6 roles, taxonomía v1 de 65 nodos, 1.351 sentidos / 1.451 formas léxicas, medios escalonados con streaming `HTTP 206` y despliegue Docker multi-stage.
  3. **Corregir la desalineación cultural en `specs/steering/glossary.md`**: Actualizar las entradas de los campos semánticos C3 y C4 a **Tra Tul** (`tra-tul` — *La Huerta Lejana*) y **Kau Ushamera** (`kau-ushamera` — *Animales Originarios*) conforme a `data/taxonomy/v1/taxonomia.yaml`.
  4. **Cerrar el ciclo de vida en `specs/features/`**: Trasladar las especificaciones ya implementadas y fusionadas en `dev` (`002-auth-rbac`, `003-integracion-vertical`, `004-esquema-contenido`, `005-sentido-formas-lexico`, `007-medios-escalonados`, `008-gobierno-usuarios-sesion`, `009-rediseno-ux-home-navegacion-busqueda` y `010-tipografia-identidad-grafema-namtrik`) hacia `specs/archive/`, actualizando `commitlint-plugin-spec-refs.mjs` para admitir referencias tanto a `specs/features/` como a `specs/archive/`.
- **R-007** (State-driven): **Mientras** se ejecute la Fase 3A de retiro de la capa administrativa obsoleta de `PalabraModelo1` (Estrategia Opción B), el sistema **debe**:
  1. Eliminar definitivamente `apps/backend-service/src/api/admin/routes/adminDictionaryRoutes.ts`, `src/api/admin/controllers/AdminDictionaryController.ts` (+ `.test.ts`), `src/application/dtos/AdminDictionaryDto.ts` (+ `.test.ts`), `src/application/use-cases/admin/CreateWordModel1UseCase.ts` (+ `.test.ts`), `src/application/use-cases/admin/UpdateWordModel1UseCase.ts` (+ `.test.ts`), `src/application/use-cases/admin/DeleteWordUseCase.ts` (+ `.test.ts`) y `src/application/use-cases/admin/ManageSemanticFieldsUseCase.ts` (+ `.test.ts`).
  2. Unificar el montaje de `adminGovernanceRoutes` en `apps/backend-service/src/app.ts` exclusivamente bajo `/api/admin/governance` (prefijo ya consumido por `apps/web-client/src/hooks/useAdmin.ts`), alineando los comentarios y pruebas en `adminGovernanceRoutes.ts`, `adminGovernanceRoutes.test.ts`, `adminMaintenanceRoutes.test.ts` (`/api/admin/papelera`) y `app.test.ts`.
  3. Conservar intactos los modelos de `apps/backend-service/prisma/schema.prisma` sin ejecutar `DROP TABLE` en PostgreSQL durante esta iteración.
- **R-008** (Unwanted behavior): **Si** cualquier operación de limpieza o alineación modifica o elimina archivos del repositorio, **entonces** el sistema **no debe** producir errores en `pnpm run ci`, `pnpm run agents:check`, `pnpm run build:web`, `pnpm run build:backend`, ni en la ejecución completa de las suites de tests activas de `web-client` y `backend-service`.
- **R-009** (Event-driven): **Cuando** se ejecute el saneamiento de directorios de aplicaciones (Fase 4A), el sistema **debe** eliminar de forma definitiva el directorio `apps/prototypes/` completo (`README.md`, `current/index.html`, `migration-notes/components-mapping.md` y `migration-notes/routes-structure.md`), de modo que `apps/` contenga exclusivamente `apps/web-client` y `apps/backend-service`.
- **R-010** (Event-driven): **Cuando** se ejecute la alineación técnica y documental de la infraestructura Docker (Fase 4B), el sistema **debe**:
  1. Corregir el proxy inverso en `apps/web-client/nginx.conf`, `apps/web-client/Dockerfile` y `docker/compose.prod.yml` utilizando `VITE_API_URL=""` (mismo origen en producción), `location /api/ { proxy_pass http://api:3000; }` (sin recortar `/api/`), `location /auth/ { proxy_pass http://api:3000; }`, `client_max_body_size 105m;` (acorde al límite de 100 MB de `@fastify/multipart` en `Spec 007`) y `proxy_buffering off;` para streaming `HTTP 206` en `/api/media/`.
  2. Declarar y montar el volumen persistente `media_data` para `uploads/media` en `docker/compose.yml` y `docker/compose.prod.yml` de modo que la carga de medios funcione sobre el filesystem inmutable (`read_only: true`) del contenedor `api`.
  3. Depurar entradas y comentarios obsoletos en `.dockerignore` (`.kilo`) y `apps/backend-service/Dockerfile` (nota legacy sobre `argon2`).
  4. Integrar una sección técnica, moderna y detallada sobre **Infraestructura y Despliegue con Docker** en `README.md` (raíz) y su guía operativa en `apps/backend-service/README.md`, documentando los stages multi-stage, red y puertos de host (`postgres:5434` con `pgvector/pgvector:pg18`, servicio one-shot `migrate`, `api:3001`, `web:8080`, `pgadmin:5051` bajo `--profile tools`), volúmenes (`postgres_data`, `media_data`), `.env.docker` y hardening de producción (`read_only`, `cap_drop: ALL`, `no-new-privileges`, `init: true`).
- **R-011** (Event-driven): **Cuando** se ejecute la higiene técnica y reescritura documental del backend (Fase 4C), el sistema **debe**:
  1. Retirar de `apps/backend-service/package.json` las dependencias sin ningún consumidor en código (`@fastify/auth`, `@fastify/jwt`, `@fastify/static`) sincronizando `pnpm-lock.yaml`.
  2. Depurar `apps/backend-service/.env.example` y `apps/backend-service/src/shared/config/env.ts` eliminando variables de servicios inexistentes (`CLOUDINARY_*`, `SMTP_*`, `TWILIO_*`, `REDIS_*`, `BCRYPT_ROUNDS`) y documentando fielmente las variables reales (`DATABASE_URL`, `JWT_*`, `ARGON2_*`, `AUTH_RATE_LIMIT_*`, `ROOT_BOOTSTRAP_*`, `CORS_ORIGIN`, `RATE_LIMIT_*`, `LOG_LEVEL`).
  3. Reescribir `apps/backend-service/README.md` como documentación técnica concisa, profesional y libre de referencias a `Weeks` o `Sprints`, reflejando exactamente el stack, arquitectura Clean Architecture, los endpoints reales (públicos, `/auth/*`, `/api/media/*` y los 7 módulos `/api/admin/*`), los 6 roles RBAC, el modelo canónico (`SentidoLexico`, `FormaNamtrik`, `SentidoUbicacion`, `MedioCultural`, con nota explícita de las tablas legadas retenidas bajo Opción B), los scripts de ingesta cultural y las suites de pruebas.
- **R-012** (Event-driven): **Cuando** se ejecute la alineación visual, PWA y reescritura documental del frontend (Fase 4D), el sistema **debe**:
  1. Actualizar en `apps/web-client/vite.config.ts` el manifiesto PWA a la marca y paleta vigente (`name: 'Wamtɵrmarɵpik — Diccionario Misak'`, `short_name: 'Diccionario Misak'`, `theme_color: '#000000'`, `background_color: '#000000'`) y retirar la regla huérfana de Workbox para `res.cloudinary.com`.
  2. Actualizar `apps/web-client/public/icon.svg` al Sistema Cromático Oficial Misak (`#000000`, `#e52d6d`, `#0055aa`, `#ffffff`) y regenerar como archivos binarios PNG/ICO reales y válidos `icon-192x192.png`, `icon-512x512.png`, `icon-maskable-192x192.png`, `icon-maskable-512x512.png`, `apple-touch-icon.png` y `favicon.ico`.
  3. Reescribir `apps/web-client/README.md` (versión `0.5.0-alpha.0`, fecha `2026-10-31`) documentando fielmente el Sistema Cromático Oficial Misak (ámbito público oscuro y ámbito administrativo Light/Dark WCAG 2.2 AA), la tipografía compuesta `Spline Sans` + `Noto Sans` (`ADR-0006`), el pipeline `@tailwindcss/vite` + `Lightning CSS`, la arquitectura real de rutas/componentes/contextos/servicios, el ecosistema multimedia accesible, el panel administrativo aislado en el chunk `admin` y las métricas vigentes.
- **R-013** (Event-driven): **Cuando** se ejecute la estandarización institucional de nombre y alineación transversal del repositorio (Fase 4E), el sistema **debe**:
  1. Estandarizar la denominación del proyecto a **Diccionario Misak** (o **`Wamtɵrmarɵpik — Diccionario Misak`** en títulos bilingües de marca), reemplazando `"Diccionario Cultural Misak"` y `"Misak Cultural Dictionary"` en los 5 documentos canónicos, `AGENTS.md`, `package.json` (raíz —eliminando también `"main": "index.js"`— y `apps/backend-service/package.json`), `apps/backend-service/src/{app.ts,server.ts}` (alineando también la versión reportada a `0.5.0-alpha.0`), `apps/web-client/src/components/admin/AdminLayout.tsx` (eliminando además la etiqueta interna `(Spec 006)` del pie de página visible) y comentarios cabecera de `Home.tsx` y `PublicHeader.tsx`.
  2. Reescribir y depurar `README.md` (raíz), `docs/CURRENT-STATE.md` y `docs/project.md` eliminando todos los enlaces muertos, hitos de `Weeks/Sprints` obsoletos y bloques pre-SDD de 2025 para consolidar una fuente documental ligera, directa y 100% coherente con el código actual.
  3. Alinear `.opencode/agents/{backend,devops}.md` (Node `24.15.0 LTS`, `node:24.15.0-slim`, `@node-rs/argon2`, monorepo sin `packages/`) ejecutando `pnpm agents:sync`, y actualizar `specs/steering/tech-stack.md` con la estructura de carpetas y versiones reales.

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
Cuando se eliminan dichos módulos junto con sus tests y directorios contenedores vacíos ("scrollytelling/", "social/", "apps/backend-service/src/utils/")
Y se traslada "AudioPlayerContext.tsx" (y su test) a "apps/web-client/src/contexts/" eliminando "apps/web-client/src/context/"
Entonces todas las importaciones de contextos en "apps/web-client/src/" apuntan a "@/contexts/*"
Y el compilador TypeScript y Vitest pasan al 100% en "web-client" y "backend-service".
```

### Escenario 3: Fase 2 — Eliminación de reportes históricos, alineación del glosario y archivo SDD (R-006.1, R-006.3, R-006.4)
```gherkin
Dado el protocolo de cero ruido histórico en la documentación del proyecto
Cuando se eliminan de forma definitiva "docs/PRE-MERGE-ANALYSIS.md", "docs/archive/", "docs/design/", "docs/development/", "docs/reports/", "docs/testing/", "apps/web-client/docs/" y "apps/backend-service/docs/"
Y se actualiza "specs/steering/glossary.md" con "Tra Tul" y "Kau Ushamera" en C3 y C4 y se trasladan las specs cerradas a "specs/archive/"
Entonces el directorio "docs/" conserva únicamente "CURRENT-STATE.md" y "project.md"
Y "specs/features/" conserva únicamente la especificación activa en curso.
```

### Escenario 4: Fase 3A (Opción B) — Retiro de rutas y casos de uso administrativos legados de Modelo 1 sin tocar el esquema de base de datos (R-001, R-007, R-008)
```gherkin
Dado que se adoptó oficialmente la Opción B (ejecutar Fase 3A manteniendo intacto "prisma/schema.prisma")
Cuando se eliminan "adminDictionaryRoutes.ts", "AdminDictionaryController.ts", "AdminDictionaryDto.ts", "CreateWordModel1UseCase.ts", "UpdateWordModel1UseCase.ts", "DeleteWordUseCase.ts" y "ManageSemanticFieldsUseCase.ts" (junto con sus tests)
Y se unifica "adminGovernanceRoutes" bajo "/api/admin/governance" en "app.ts", "adminGovernanceRoutes.ts" y sus suites de prueba
Entonces el panel administrativo opera íntegramente sobre "/api/admin/dictionary/sentidos", "/api/admin/governance", "/api/admin/papelera", "/api/admin/users", "/api/admin/audit", "/api/admin/settings" y "/api/admin/medios"
Y no se ejecuta ninguna migración destructiva ("DROP TABLE") sobre PostgreSQL.
```

### Escenario 5: Fase 4A — Eliminación definitiva del directorio "apps/prototypes/" (R-009)
```gherkin
Dado que "apps/prototypes/" contiene únicamente prototipos HTML estáticos y notas de migración de 2025 sin ningún consumidor en el monorepo
Cuando se elimina por completo el directorio "apps/prototypes/"
Entonces "apps/" contiene exclusivamente los paquetes productivos "apps/web-client" y "apps/backend-service"
Y ninguna búsqueda en el repositorio activo referencia "apps/prototypes".
```

### Escenario 6: Fase 4B — Alineación técnica y documentación profesional de infraestructura Docker (R-010, R-008)
```gherkin
Dado el stack de contenedores en "docker/compose.yml", "docker/compose.prod.yml", "apps/*/Dockerfile" y "apps/web-client/nginx.conf"
Cuando se corrige el enrutamiento mismo-origen ("VITE_API_URL=''", proxy "/api/" y "/auth/" sin recorte de prefijo, "client_max_body_size 105m", streaming sin buffering) y se monta el volumen persistente "media_data"
Y se incorpora la sección técnica de Docker en "README.md" y "apps/backend-service/README.md"
Entonces "docker compose --env-file .env.docker.example -f docker/compose.yml config" y su override "compose.prod.yml" validan sin errores
Y la documentación refleja con exactitud los stages, puertos, volúmenes y medidas de seguridad reales del despliegue.
```

### Escenario 7: Fase 4C y 4D — Reescritura profesional de README Backend y Frontend y sincronización cromática/PWA (R-006.2, R-011, R-012, R-008)
```gherkin
Dado el estado desactualizado de "apps/backend-service/README.md" y "apps/web-client/README.md" y los residuos de configuración en ambos paquetes
Cuando se eliminan las dependencias y variables de entorno muertas en "backend-service", se actualiza el manifiesto e iconos binarios PWA en "web-client" a la paleta oficial Misak ("#e52d6d", "#0055aa", "#ffffff", "#000000") y se reescriben ambos READMEs sin referencias a "Weeks" o tecnologías descartadas
Entonces ambos READMEs coinciden estrictamente con los endpoints, roles, modelos, paleta cromática, componentes, scripts y métricas vigentes del código fuente
Y los iconos en "apps/web-client/public/" son binarios PNG/ICO válidos libres de la paleta verde obsoleta "#38e07b".
```

### Escenario 8: Fase 4E — Unificación institucional a "Diccionario Misak", depuración de documentos maestros y paridad de agentes (R-006.2, R-013, R-008)
```gherkin
Dada la directriz de unificar la denominación a "Diccionario Misak" y erradicar el ruido pre-SDD restante
Cuando se estandariza el nombre en los 5 documentos canónicos, "AGENTS.md", metadatos de "package.json", banner/root de "backend-service" y pie de "AdminLayout.tsx"
Y se depuran "README.md", "docs/CURRENT-STATE.md", "docs/project.md", "specs/steering/tech-stack.md" y ".opencode/agents/{backend,devops}.md" ejecutando "pnpm agents:sync"
Entonces no existen enlaces rotos ni referencias a "Diccionario Cultural Misak" en la documentación activa ni en la interfaz administrativa
Y "pnpm run ci", "pnpm run agents:check", los builds de producción, las suites completas de tests y "/docs-gate" finalizan en estado PASS.
```

## Fuera de alcance

- Ejecutar migraciones `DROP TABLE` en PostgreSQL o eliminar modelos de `apps/backend-service/prisma/schema.prisma` (pospuesto explícitamente bajo la **Opción B** para abordarse de forma aislada en `Spec 012`).
- Modificar o eliminar las migraciones numeradas históricas de Prisma (`0001_init` a `0013_search_ranking_misak`) o entradas pasadas de `CHANGELOG.md` y `specs/archive/`.
- Alterar el corpus cultural canónico en `data/taxonomy/v1/` o `data/lexicon/v1/`.
- Modificar la lógica de negocio activa de sentidos léxicos, formas Namtrik, medios culturales, autenticación RBAC o búsqueda bilingüe vectorizada.

## Trazabilidad

- **Principios constitucionales**:
  - `C1.1`, `C1.2` y `C1.3` (Soberanía lingüística, fidelidad al glosario *Tra Tul* / *Kau Ushamera* e identidad cromática/tipográfica Misak).
  - `C2.1`, `C2.2` y `C2.4` (Convenciones por Biome, fronteras tipadas en Clean Architecture sin rutas ni dependencias huérfanas y gates obligatorios `version-gate` / `docs-gate`).
  - `C4.1`, `C4.2`, `C4.3` y `C4.4` (Flujo SDD con specs vivas, archivo auditable en `specs/archive/` y coherencia documental libre de ruido histórico).
- **ADRs relacionados**:
  - `ADR-0001` (Adopción de Spec-Driven Development).
  - `ADR-0002` (Tooling multi-agente OpenCode y Antigravity).
  - `ADR-0003` (Modelo Sentido + Formas Léxicas y Ubicación Multinivel).
  - `ADR-0004` (Sesión Administrativa y Gobierno Editorial).
  - `ADR-0005` (Medios Culturales, Almacenamiento Local y Streaming HTTP 206).
  - `ADR-0006` (Tipografía Compuesta y Armonización del Grafema Namtrik).
  - `ADR-0007` (Saneamiento de Deuda Técnica, Alineación Docker/PWA y Documentación Canónica).
