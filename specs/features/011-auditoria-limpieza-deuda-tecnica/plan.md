# Plan Técnico — 011-auditoria-limpieza-deuda-tecnica

> **Spec:** `specs/features/011-auditoria-limpieza-deuda-tecnica/spec.md` (`v0.3.0`, approved)
> **ADR:** `specs/adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md`

---

## Diseño

El plan ejecuta un saneamiento integral, libre de regresiones y verificable del monorepo **Diccionario Misak**, organizado en **ocho bloques desacoplados**: los cuatro primeros ya consolidados en la rama `chore/011-limpieza-deuda-tecnica` (Fases 1 a 3A) y cuatro bloques de ampliación (`v0.3.0`, Fase 4A–4E) derivados de la auditoría cruzada de consistencia entre código, infraestructura Docker, activos PWA y documentación canónica.

### 1. Higiene del Workspace, Artefactos Temporales y Paquetes Huérfanos (Fase 1 — Completada)
- **Raíz y directorios ocultos**: Eliminación definitiva de `.npmrc.bak`, `.kilo/` y artefactos ajenos a `pnpm` en `.opencode/` (`bun.lock`, `package-lock.json`, `package.json`, `node_modules/`), preservando `.opencode/{agents,commands,skills}/`.
- **Workspace `pnpm`**: Eliminación de `packages/` (`shared-types`, `ui-components`) y ajuste de `pnpm-workspace.yaml` a `apps/*`.
- **Artefactos Prisma y prototipos SQL**: Eliminación de `apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}`, `postgresql18-advanced-features.sql` e `infrastructure/`, con protección en `.gitignore`.

### 2. Saneamiento de Código Muerto y Unificación de `contexts` en Frontend (Fase 2A — Completada)
- Retiro definitivo de `scrollytelling/ScrollIndicator` y `social/SocialLinks` (+ tests).
- Unificación de `AudioPlayerContext` (+ test) bajo `apps/web-client/src/contexts/` y actualización de todas las importaciones a `@/contexts/AudioPlayerContext`.

### 3. Borrado de Reportes Históricos, Glosario Cultural y Archivo SDD (Fase 2B — Completada)
- Eliminación permanente de los 16 archivos/directorios históricos en `docs/`, `apps/web-client/docs/` y `apps/backend-service/docs/`.
- Corrección cultural en `specs/steering/glossary.md` para C3 (*Tra Tul* / `tra-tul`) y C4 (*Kau Ushamera* / `kau-ushamera`).
- Traslado de las specs cerradas (`002..005`, `007..010`) a `specs/archive/` y soporte en `commitlint-plugin-spec-refs.mjs`.

### 4. Retiro de Capa Administrativa Obsoleta de `PalabraModelo1` — Opción B (Fase 3A — Completada + Cierre JSDoc)
- Eliminación de `postgres18-helpers.{ts,test.ts}` (y remoción del directorio vacío `apps/backend-service/src/utils/`).
- Eliminación de los 13 archivos administrativos legados (`adminDictionaryRoutes`, `AdminDictionaryController`, `AdminDictionaryDto` y los 4 casos de uso + tests).
- Unificación de `adminGovernanceRoutes` en `/api/admin/governance` en `app.ts`, cerrando los comentarios JSDoc pendientes en `adminGovernanceRoutes.ts` y la URL de prueba en `app.test.ts`.
- **Invariante Opción B**: `apps/backend-service/prisma/schema.prisma` y las migraciones `0001`–`0013` permanecen intactos sin `DROP TABLE`.

### 5. Eliminación de Prototipos HTML Obsoletos en `apps/prototypes/` (Fase 4A)
- Eliminación definitiva del directorio `apps/prototypes/` (`README.md`, `current/index.html`, `migration-notes/components-mapping.md`, `migration-notes/routes-structure.md`), garantizando que `apps/` aloje únicamente `apps/web-client` y `apps/backend-service`.

### 6. Alineación Operativa y Documentación Profesional de Infraestructura Docker (Fase 4B)
- **Alineación de proxy inverso y build de producción**:
  - Ajuste de `VITE_API_URL` por defecto a cadena vacía (`""`, mismo origen relativo) en `apps/web-client/Dockerfile`, `docker/compose.prod.yml` y `.env.docker.example` (comentario de producción), evitando duplicación `/api/api/...`.
  - Ajuste en `apps/web-client/nginx.conf`: `location /api/ { proxy_pass http://api:3000; ... }` (sin barra final para conservar `/api/`), nuevo bloque `location /auth/ { proxy_pass http://api:3000; ... }`, `client_max_body_size 105m;` (alineado al tope de 100 MB de `@fastify/multipart`) y `proxy_buffering off;` con soporte de `Range` para streaming `HTTP 206` en `/api/media/`.
- **Persistencia multimedia bajo contenedor inmutable**:
  - Declaración del volumen nombrado `media_data` en `docker/compose.yml` (`/app/apps/backend-service/uploads/media` en modo `dev`) y `docker/compose.prod.yml` (`/app/uploads/media` en modo `runner` con `read_only: true`), garantizando persistencia y compatibilidad con `LocalStorageService`.
- **Higiene de archivos de contenedor**: Limpieza de `.kilo` en `.dockerignore` y de la nota legacy de `argon2` en `apps/backend-service/Dockerfile`.
- **Documentación técnica de Docker**: Incorporación de una sección dedicada, moderna y rigurosa en `README.md` (raíz) y referencia operativa en `apps/backend-service/README.md`.

### 7. Consolidación Técnica y Reescritura Profesional de Backend y Frontend (Fase 4C y 4D)
- **Backend (`apps/backend-service`)**:
  - Retiro de dependencias muertas en `package.json` (`@fastify/auth`, `@fastify/jwt`, `@fastify/static`) y actualización limpia de `pnpm-lock.yaml`.
  - Depuración de `apps/backend-service/.env.example` y `src/shared/config/env.ts` retirando variables muertas (`CLOUDINARY_*`, `SMTP_*`, `TWILIO_*`, `REDIS_*`, `BCRYPT_ROUNDS`) y documentando los parámetros reales (`ARGON2_*`, `AUTH_RATE_LIMIT_*`, `ROOT_BOOTSTRAP_*`, `CORS_ORIGIN`, `DATABASE_URL`).
  - Reescritura integral de `apps/backend-service/README.md` eliminando referencias a `Weeks/Sprints`, tecnologías descartadas y endpoints eliminados, documentando el stack exacto, Clean Architecture, todos los endpoints reales, los 6 roles RBAC, el modelo canónico de datos, los scripts de ingesta y las pruebas.
- **Frontend (`apps/web-client`)**:
  - Sincronización en `vite.config.ts` del manifiesto PWA (`Wamtɵrmarɵpik — Diccionario Misak`, `#000000`) y retiro del runtime cache huérfano de `res.cloudinary.com`.
  - Rediseño de `public/icon.svg` con la paleta oficial de 4 colores Misak (`#000000`, `#e52d6d`, `#0055aa`, `#ffffff`) y generación de binarios PNG/ICO reales (`icon-192x192.png`, `icon-512x512.png`, `icon-maskable-*.png`, `apple-touch-icon.png`, `favicon.ico`) en sustitución de los SVGs de texto mal nombrados.
  - Reescritura integral de `apps/web-client/README.md` (`v0.5.0-alpha.0`, `2026-10-31`) con la paleta oficial Misak, tipografía `Spline Sans` + `Noto Sans` (`ADR-0006`), pipeline `@tailwindcss/vite` + `Lightning CSS`, árbol real de carpetas, rutas públicas y administrativas (`/admin/*`), multimedia accesible y métricas vigentes.

### 8. Unificación Institucional a "Diccionario Misak", Documentos Maestros y Agentes (Fase 4E)
- **Marca unificada**: Estandarización de **Diccionario Misak** / **`Wamtɵrmarɵpik — Diccionario Misak`** en `README.md`, `docs/CURRENT-STATE.md`, `docs/project.md`, `apps/web-client/README.md`, `apps/backend-service/README.md`, `AGENTS.md`, `package.json` (raíz —eliminando `"main": "index.js"`— y `backend-service`), `apps/backend-service/src/{app.ts,server.ts}` (sincronizando versión `0.5.0-alpha.0`), `AdminLayout.tsx` y comentarios cabecera de `Home.tsx` y `PublicHeader.tsx`.
- **Documentos maestros**: Reescritura ejecutiva y técnica de `README.md` (raíz), `docs/CURRENT-STATE.md` (eliminando los 7 enlaces rotos y bitácoras de `Week 1-2`) y `docs/project.md` (sustituyendo las ~2.000 líneas de brainstorming pre-SDD de 2025 por la especificación arquitectónica maestra real vigente).
- **Gobernanza de agentes y steering**: Actualización de `.opencode/agents/{backend,devops}.md` + sincronización automática a `.agents/` vía `pnpm agents:sync`, y ajuste de `specs/steering/tech-stack.md`.

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `.npmrc.bak`, `.kilo/**`, `.opencode/{bun.lock,package-lock.json,package.json,node_modules}` | Eliminados en Fase 1. | R-001, R-002 |
| `apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}`, `postgresql18-advanced-features.sql`, `.gitignore`, `infrastructure/**` | Eliminados y protegidos en Fase 1. | R-002 |
| `packages/**`, `pnpm-workspace.yaml` | Eliminados paquetes vacíos y ajustado workspace a `apps/*` en Fase 1. | R-003 |
| `apps/web-client/src/components/features/{scrollytelling,social}/**`, `src/contexts/AudioPlayerContext.{tsx,test.tsx}` + 7 consumidores | Eliminados componentes muertos y unificado `src/contexts/` en Fase 2. | R-004 |
| `apps/backend-service/src/utils/**` | Eliminado `postgres18-helpers.{ts,test.ts}` y remoción del directorio vacío `src/utils/`. | R-005 |
| `docs/{PRE-MERGE-ANALYSIS.md,archive,design,development,reports,testing}/**`, `apps/{web-client,backend-service}/docs/**` | Eliminados definitivamente los 16 documentos históricos en Fase 2. | R-006 |
| `specs/steering/glossary.md`, `specs/archive/{002..005,007..010}*`, `commitlint-plugin-spec-refs.mjs` | Glosario alineado y specs cerradas archivadas en Fase 2. | R-006, R-008 |
| `apps/backend-service/src/{api/admin/routes/adminDictionaryRoutes.ts,api/admin/controllers/AdminDictionaryController*,application/dtos/AdminDictionaryDto*,application/use-cases/admin/{CreateWordModel1,UpdateWordModel1,DeleteWord,ManageSemanticFields}UseCase*}` | Eliminados los 13 archivos legados en Fase 3A. | R-007 |
| `apps/backend-service/src/{app.ts,app.test.ts,api/admin/routes/adminGovernanceRoutes.ts,api/admin/routes/adminGovernanceRoutes.test.ts,api/admin/routes/adminMaintenanceRoutes.test.ts}` | Unificación en `/api/admin/governance` y `/api/admin/papelera`, completando JSDoc de `adminGovernanceRoutes.ts`, metadatos de `GET /` en `app.ts` y ruta en `app.test.ts`. | R-007, R-013 |
| `apps/prototypes/**` | Eliminar definitivamente `README.md`, `current/index.html` y `migration-notes/*.md`. | R-009 |
| `apps/web-client/nginx.conf` | Corregir proxy `/api/` sin recorte de prefijo, añadir `location /auth/`, `client_max_body_size 105m;` y streaming sin buffering para `/api/media/`. | R-010 |
| `apps/web-client/Dockerfile`, `docker/compose.yml`, `docker/compose.prod.yml`, `.env.docker.example`, `.dockerignore`, `apps/backend-service/Dockerfile` | Alinear `VITE_API_URL=""` en prod, añadir volumen `media_data` para `uploads/media` y limpiar comentarios/entradas obsoletas. | R-010 |
| `apps/backend-service/package.json`, `pnpm-lock.yaml` | Eliminar `@fastify/auth`, `@fastify/jwt` y `@fastify/static` sin uso; actualizar `description` a "Diccionario Misak". | R-011, R-013 |
| `apps/backend-service/.env.example`, `apps/backend-service/src/shared/config/env.ts`, `apps/backend-service/src/server.ts` | Retirar variables muertas (`CLOUDINARY_*`, `SMTP_*`, `TWILIO_*`, `REDIS_*`, `BCRYPT_ROUNDS`), documentar variables reales y alinear banner/versión en `server.ts`. | R-011, R-013 |
| `apps/backend-service/README.md` | Reescribir documentación técnica profesional, concisa, sin `Weeks/Sprints` y 100% fiel a endpoints, RBAC, modelos, scripts y Docker. | R-006, R-010, R-011, R-013 |
| `apps/web-client/vite.config.ts` | Actualizar manifiesto PWA (`Wamtɵrmarɵpik — Diccionario Misak`, `#000000`) y eliminar runtime cache de `res.cloudinary.com`. | R-012, R-013 |
| `apps/web-client/public/{icon.svg,icon-192x192.png,icon-512x512.png,icon-maskable-192x192.png,icon-maskable-512x512.png,apple-touch-icon.png,favicon.ico}` | Actualizar `icon.svg` a la paleta oficial Misak y generar binarios PNG/ICO reales válidos. | R-012 |
| `apps/web-client/src/{components/admin/AdminLayout.tsx,pages/Home.tsx,components/layouts/PublicHeader.tsx}` | Unificar denominación "Diccionario Misak" y retirar etiqueta interna `(Spec 006)` del pie administrativo. | R-013 |
| `apps/web-client/README.md` | Reescribir documentación técnica y visual con paleta oficial Misak, arquitectura real, rutas, PWA y métricas actuales (`2026-10-31`). | R-006, R-012, R-013 |
| `package.json`, `AGENTS.md`, `README.md`, `docs/CURRENT-STATE.md`, `docs/project.md` | Unificar marca "Diccionario Misak", limpiar `"main": "index.js"`, incorporar sección Docker detallada y depurar toda referencia o enlace obsoleto pre-SDD. | R-006, R-010, R-013 |
| `.opencode/agents/{backend,devops}.md`, `.agents/**`, `specs/steering/tech-stack.md` | Actualizar stack/runtime en agentes, ejecutar `pnpm agents:sync` y alinear `tech-stack.md`. | R-001, R-013 |

---

## Contratos de UI/API

### 1. Contrato Cromático y PWA en Frontend (`apps/web-client`)
- **4 pilares cromáticos oficiales Misak (`@theme` en `src/index.css`)**:
  - `--color-misak-magenta` / `--color-primary`: `#e52d6d`
  - `--color-misak-blue` / `--color-secondary`: `#0055aa`
  - `--color-misak-white` / `--color-text`: `#ffffff`
  - `--color-misak-black` / `--color-background`: `#000000`
- **Manifiesto PWA (`vite.config.ts`)**: `name: "Wamtɵrmarɵpik — Diccionario Misak"`, `short_name: "Diccionario Misak"`, `theme_color: "#000000"`, `background_color: "#000000"`, iconos PNG (`192x192`, `512x512`, `any` + `maskable`) binarios reales.
- **Importación unificada de contextos**: `@/contexts/AudioPlayerContext` y `@/contexts/AdminThemeContext`.

### 2. Contrato de Frontera HTTP y Proxy Nginx en Producción (`docker/` + `backend-service`)
- **Cliente Web en Producción**: `VITE_API_URL=""` (rutas relativas mismo-origen `/api/*` y `/auth/*`, idéntico al proxy de desarrollo en `vite.config.ts`).
- **Nginx (`apps/web-client/nginx.conf`)**:
  - `location /api/` → `http://api:3000` (preserva `/api/dictionary/*`, `/api/media/*`, `/api/admin/*`; `client_max_body_size 105m`).
  - `location /api/media/` → streaming con `proxy_buffering off` y cabeceras `Range` / `Accept-Ranges` intactas (`HTTP 206`).
  - `location /auth/` → `http://api:3000` (preserva `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/change-password` y cookies `httpOnly`).
- **Mapa Canónico de Prefijos Administrativos en Fastify (`app.ts`)**:
  - `/api/admin/dictionary/sentidos`, `/api/admin/governance`, `/api/admin/papelera`, `/api/admin/users`, `/api/admin/audit`, `/api/admin/settings`, `/api/admin/medios`.

### 3. Contrato de Volúmenes Docker y Esquema Prisma (Opción B)
- **Volúmenes nombrados**: `postgres_data` (`/var/lib/postgresql/data`) y `media_data` (`/app/uploads/media` en `runner` bajo `read_only: true`).
- **Esquema Prisma**: Sin alteraciones en `apps/backend-service/prisma/schema.prisma` ni nuevas migraciones SQL.

---

## Decisiones tomadas

- **ADR-0007** (`specs/adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md`): Actualizada para cubrir la eliminación de `apps/prototypes/`, la corrección operativa y documental de Docker/Nginx, la regeneración de activos PWA con la paleta oficial Misak, la poda de dependencias/env muertas en backend y la unificación institucional de nombre a **Diccionario Misak**.
- **ADR-0001** a **ADR-0006**: Vigentes y referenciados de forma coherente en los 5 documentos canónicos activos.

---

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Desincronización de `pnpm-lock.yaml` al retirar `@fastify/auth`, `@fastify/jwt` y `@fastify/static` de `apps/backend-service/package.json` | Medio | Actualizar el lockfile exclusivamente mediante `pnpm` y validar enseguida con `pnpm install --frozen-lockfile`, `tsc` y la suite completa de tests de `backend-service`. |
| Falla de validación en `env.ts` si un entorno local `.env` aún define variables antiguas eliminadas (`BCRYPT_ROUNDS`, `CLOUDINARY_*`, etc.) | Bajo | En Zod v4 `z.object()` aplica `strip` por defecto sobre claves desconocidas (no `strict`), por lo que variables extra en `.env` locales son ignoradas sin romper el arranque del servidor. |
| Iconos PWA inválidos si se generan sin cabeceras binarias PNG/ICO estándar | Bajo | Generar los PNG (`192x192`, `512x512`, `180x180`) y `favicon.ico` mediante script determinista verificando firmas mágicas (`89 50 4E 47` / `00 00 01 00`) y dimensiones reales antes de borrar el script temporal. |
| Desalineación residual entre `.opencode/` y `.agents/` tras editar `backend.md` y `devops.md` | Medio | Ejecutar `pnpm agents:sync` seguido de `pnpm agents:check` como paso obligatorio antes del commit. |
| Enlaces internos rotos tras reescribir los 5 documentos canónicos (`README.md`, `project.md`, `CURRENT-STATE.md`, `apps/*/README.md`) | Medio | Ejecutar un barrido automatizado de validación de todos los enlaces relativos Markdown en el repositorio y correr la auditoría `/docs-gate` en `T-020`. |
