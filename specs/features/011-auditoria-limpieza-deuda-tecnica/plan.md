# Plan Técnico — 011-auditoria-limpieza-deuda-tecnica

> **Spec:** `specs/features/011-auditoria-limpieza-deuda-tecnica/spec.md` (approved)
> **ADR:** `specs/adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md`

---

## Diseño

El plan ejecuta un saneamiento integral y libre de regresiones del monorepo Misak Cultural Dictionary estructurado en cuatro dominios desacoplados: **Higiene del Workspace y Prisma**, **Frontend (`apps/web-client`)**, **Backend (`apps/backend-service` bajo Opción B)** y **Gobernanza Documental y SDD (`docs/` + `specs/`)**.

### 1. Higiene del Workspace, Artefactos Temporales y Paquetes Huérfanos (Fase 1)
- **Raíz y directorios ocultos**: Eliminación definitiva de `.npmrc.bak`, del directorio `.kilo/` y de los artefactos de gestión de paquetes ajenos a `pnpm` dentro de `.opencode/` (`bun.lock`, `package-lock.json`, `package.json` y `node_modules/`), preservando intactas las definiciones canónicas `.opencode/{agents,commands,skills}/`.
- **Workspace `pnpm`**: Eliminación del directorio `packages/` (`shared-types` y `ui-components`, carentes de `package.json` y código fuente) y actualización de `pnpm-workspace.yaml` para declarar únicamente `apps/*`.
- **Artefactos de base de datos y prototipos**: Eliminación de los archivos compilados `apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}` (preservando `seed.ts`), del archivo suelto `apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql` y del directorio `infrastructure/` (prototipos SQL pre-Prisma). Se añaden reglas de exclusión en `.gitignore` para impedir que futuras compilaciones depositen `.js`, `.js.map` o `.d.ts` dentro de `prisma/`.

### 2. Saneamiento de Código Muerto y Unificación de `contexts` en Frontend (Fase 2A)
- **Eliminación de componentes sin consumidores**: Retiro definitivo de `apps/web-client/src/components/features/scrollytelling/` (`ScrollIndicator.tsx` y `ScrollIndicator.test.tsx`) y `apps/web-client/src/components/features/social/` (`SocialLinks.tsx` y `SocialLinks.test.tsx`).
- **Unificación en `src/contexts/`**: Traslado de `AudioPlayerContext.tsx` y `AudioPlayerContext.test.tsx` desde `src/context/` hacia `src/contexts/`, eliminación del directorio `src/context/`, y actualización de los 6 puntos de importación activos en `apps/web-client/src/` (`main.tsx`, `AudioPlayButton.tsx`, `AudioPlayButton.test.tsx`, `CulturalVideoPlayer.tsx`, `CulturalVideoPlayer.test.tsx`, `CulturalResourceRegistry.test.tsx` y `TermRow.test.tsx`).

### 3. Saneamiento Documental Profundo y Ciclo de Vida SDD (Fase 2B)
- **Eliminación definitiva de documentación histórica (Cero Archivado Innecesario)**: Borrado permanente de `docs/PRE-MERGE-ANALYSIS.md`, `docs/archive/`, `docs/design/`, `docs/development/`, `docs/reports/`, `docs/testing/`, `apps/web-client/docs/` y `apps/backend-service/docs/`.
- **Depuración y sincronización de los 5 documentos canónicos activos**:
  - `README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md` y `apps/backend-service/README.md` se actualizan para erradicar enlaces hacia archivos eliminados, referencias a tecnologías inexistentes (`ElasticSearch`, `Redis`, `Cloudinary`, `Jotai`, `Headless UI`, `Storybook`, `Bcrypt`, `prototypes/*.sql`) o componentes retirados (`ScrollIndicator`, `SocialLinks`), reflejando con fidelidad el stack real vigente.
- **Alineación cultural del glosario (`cultural-gate`)**: Corrección en `specs/steering/glossary.md` de los campos C3 y C4 a **Tra Tul** (`tra-tul` — *La Huerta Lejana*) y **Kau Ushamera** (`kau-ushamera` — *Animales Originarios*) en correspondencia exacta con `data/taxonomy/v1/taxonomia.yaml`.
- **Archivo del ciclo SDD**: Traslado de las 8 carpetas de especificaciones ya completadas (`002` a `005` y `007` a `010`) desde `specs/features/` hacia `specs/archive/`, ampliando la expresión regular de `commitlint-plugin-spec-refs.mjs` para admitir tanto `specs/features/NNN-slug` como `specs/archive/NNN-slug`.

### 4. Retiro de Capa Administrativa Obsoleta en Backend — Estrategia Opción B (Fase 3A)
- **Eliminación de utilidad sin uso**: Retiro de `apps/backend-service/src/utils/postgres18-helpers.ts` y `postgres18-helpers.test.ts`.
- **Eliminación de pila administrativa `PalabraModelo1`**: Retiro de `adminDictionaryRoutes.ts`, `AdminDictionaryController.ts` (+ `.test.ts`), `AdminDictionaryDto.ts` (+ `.test.ts`), `CreateWordModel1UseCase.ts` (+ `.test.ts`), `UpdateWordModel1UseCase.ts` (+ `.test.ts`), `DeleteWordUseCase.ts` (+ `.test.ts`) y `ManageSemanticFieldsUseCase.ts` (+ `.test.ts`).
- **Unificación de puntos de montaje en `app.ts` y alineación de tests**:
  - Retiro en `app.ts` del registro de `adminDictionaryRoutes` y del registro duplicado de `adminGovernanceRoutes` bajo `/api/admin/dictionary`, manteniendo el prefijo único `/api/admin/governance` (ya consumido por `apps/web-client/src/hooks/useAdmin.ts`) y actualizando el índice informativo de `/api`.
  - Alineación de `adminGovernanceRoutes.ts` (comentarios de ruta) y `adminGovernanceRoutes.test.ts` al prefijo canónico `/api/admin/governance`.
  - Alineación de `adminMaintenanceRoutes.test.ts` para montar `adminPapeleraRoutes` bajo `/api/admin/papelera` (eliminando los mocks residuales de los casos de uso de Modelo 1).
- **Invariante de Base de Datos (Opción B)**: `apps/backend-service/prisma/schema.prisma`, `PalabraRepository.ts` y las migraciones `0001`–`0013` no sufren modificaciones destructivas.

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `.npmrc.bak` | Eliminar archivo de respaldo obsoleto. | R-002 |
| `.kilo/**` | Eliminar directorio foráneo completo (`package.json`, `package-lock.json`, `node_modules/`). | R-002 |
| `.opencode/{bun.lock,package-lock.json,package.json,node_modules}` | Eliminar lockfiles y dependencias ajenas a `pnpm`, preservando `.opencode/{agents,commands,skills}/`. | R-001, R-002 |
| `apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}` | Eliminar artefactos compilados junto a `seed.ts`. | R-002 |
| `.gitignore` | Añadir exclusión para artefactos compilados en `apps/backend-service/prisma/` (`*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map`). | R-002 |
| `apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql` | Eliminar script SQL suelto fuera de carpetas numeradas de migración. | R-002 |
| `infrastructure/**` | Eliminar directorio de prototipos SQL pre-Prisma (`database-schema-admin.*`, `database-schema_dictionary.*`). | R-002 |
| `packages/**` | Eliminar directorios vacíos `packages/shared-types` y `packages/ui-components`. | R-003 |
| `pnpm-workspace.yaml` | Actualizar definición del workspace únicamente a `apps/*`. | R-003 |
| `apps/web-client/src/components/features/scrollytelling/**` | Eliminar `ScrollIndicator.tsx` y `ScrollIndicator.test.tsx`. | R-004 |
| `apps/web-client/src/components/features/social/**` | Eliminar `SocialLinks.tsx` y `SocialLinks.test.tsx`. | R-004 |
| `apps/web-client/src/contexts/AudioPlayerContext.{tsx,test.tsx}` | Mover desde `src/context/` hacia `src/contexts/` y eliminar el directorio `src/context/`. | R-004 |
| `apps/web-client/src/{main.tsx,components/ui/AudioPlayButton.tsx,components/ui/AudioPlayButton.test.tsx,components/media/CulturalVideoPlayer.tsx,components/media/CulturalVideoPlayer.test.tsx,components/media/CulturalResourceRegistry.test.tsx,components/features/semantic-fields/TermRow.test.tsx}` | Actualizar rutas de importación y mocks de `@/context/AudioPlayerContext` a `@/contexts/AudioPlayerContext`. | R-004 |
| `apps/backend-service/src/utils/postgres18-helpers.{ts,test.ts}` | Eliminar módulo de utilidades sin uso en runtime y su suite de test. | R-005 |
| `docs/{PRE-MERGE-ANALYSIS.md,archive/**,design/**,development/**,reports/**,testing/**}` | Eliminar de forma definitiva reportes históricos y guías obsoletas de 2025. | R-006 |
| `apps/web-client/docs/**` | Eliminar `DESIGN-ANALYSIS.md` y `optimization-report.md`. | R-006 |
| `apps/backend-service/docs/**` | Eliminar `PG18-QUICK-START.md` y `POSTGRESQL18-FEATURES.md`. | R-006 |
| `README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md`, `apps/backend-service/README.md` | Depurar enlaces rotos, tecnologías inexistentes y referencias históricas; sincronizar con la arquitectura y métricas actuales. | R-006 |
| `specs/steering/glossary.md` | Actualizar C3 (`tra-tul` — *Tra Tul* / La Huerta Lejana) y C4 (`kau-ushamera` — *Kau Ushamera* / Animales Originarios). | R-006 |
| `specs/features/{002..005,007..010}*` → `specs/archive/` | Mover las 8 carpetas de especificaciones cerradas a `specs/archive/`. | R-006 |
| `commitlint-plugin-spec-refs.mjs` | Permitir referencias válidas a `specs/archive/NNN-slug` además de `specs/features/NNN-slug` y `specs/adr/NNNN-slug`. | R-006, R-008 |
| `apps/backend-service/src/application/use-cases/admin/{CreateWordModel1UseCase,UpdateWordModel1UseCase,DeleteWordUseCase,ManageSemanticFieldsUseCase}.{ts,test.ts}` | Eliminar casos de uso administrativos heredados de `PalabraModelo1` y sus tests. | R-007 |
| `apps/backend-service/src/application/dtos/AdminDictionaryDto.{ts,test.ts}` | Eliminar DTO Zod exclusivo del CRUD administrativo legado. | R-007 |
| `apps/backend-service/src/api/admin/controllers/AdminDictionaryController.{ts,test.ts}` | Eliminar controlador administrativo legado y su duplicado privado de `serializeBigInt`. | R-007 |
| `apps/backend-service/src/api/admin/routes/adminDictionaryRoutes.ts` | Eliminar archivo de rutas administrativas legadas. | R-007 |
| `apps/backend-service/src/app.ts` | Retirar registro de `adminDictionaryRoutes` y el registro duplicado de `adminGovernanceRoutes` en `/api/admin/dictionary`, conservando `/api/admin/governance`. | R-007 |
| `apps/backend-service/src/api/admin/routes/{adminGovernanceRoutes.ts,adminGovernanceRoutes.test.ts,adminMaintenanceRoutes.test.ts}` | Alinear comentarios y pruebas de inyección a los prefijos canónicos `/api/admin/governance` y `/api/admin/papelera`. | R-007, R-008 |

---

## Contratos de UI/API

### 1. Contrato de Importación de Contextos en Frontend (`apps/web-client`)
- Ruta canónica unificada:
  - `@/contexts/AudioPlayerContext` → exporta `AudioPlayerProvider`, `useAudioPlayer`, `useOptionalAudioPlayer`, `type AudioPlayerContextValue`.
  - `@/contexts/AdminThemeContext` → exporta `AdminThemeProvider`, `useAdminTheme`.

### 2. Mapa Canónico de Prefijos HTTP Administrativos en Fastify (`apps/backend-service`)
Tras retirar `adminDictionaryRoutes` y el montaje duplicado en `app.ts`, la frontera HTTP administrativa queda 1:1 con `apps/web-client/src/hooks/useAdmin.ts`:
- `/api/admin/dictionary/sentidos` → `adminSentidoRoutes` (CRUD, ratificación y reversión de sentidos léxicos).
- `/api/admin/governance` → `adminGovernanceRoutes` (`GET /progreso`, `POST /nodos/:nivel/:id/ratificar`, `POST /ratificar-lote/:nivel/:id` y alias `/nodos/:nivel/:id/ratificar-lote`).
- `/api/admin/papelera` → `adminPapeleraRoutes` (`GET /`, `POST /:nivel/:id/restaurar`, `POST /:id/restaurar`, `DELETE /:nivel/:id`).
- `/api/admin/users` → `adminUserRoutes`.
- `/api/admin/audit` → `adminAuditRoutes`.
- `/api/admin/settings` → `adminSettingsRoutes`.
- `/api/admin/media` → `adminMediaRoutes`.

### 3. Invariante de Esquema Prisma (Opción B)
- Sin alteraciones en `apps/backend-service/prisma/schema.prisma` ni nuevas migraciones SQL.

---

## Decisiones tomadas

- **ADR-0007** (`specs/adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md`): Formaliza la unificación en `src/contexts/`, la adopción de la Opción B (retiro de capa admin Modelo 1 sin `DROP TABLE`), la higiene de lockfiles/paquetes del monorepo y la política de eliminación definitiva de documentación histórica.
- **ADR-0001**, **ADR-0003**, **ADR-0004** y **ADR-0006**: Se mantienen vigentes y pasan a ser la referencia arquitectónica directa reflejada por los 5 documentos canónicos activos.

---

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Cambios previos sin commitear en el árbol de trabajo (`apps/web-client` SVGs C1–C4 y Hero 3-zonas) mezclados con los commits de limpieza de Spec 011 | Medio | Antes de ejecutar `T-001`, aislar/consolidar en su propio commit atómico los cambios verificados de SVG/Hero en `dev` (o rama dedicada) para mantener trazabilidad limpia en Git. |
| Ruptura de `pnpm install` al actualizar `pnpm-workspace.yaml` eliminando `packages/*` | Bajo | `packages/*` no contenía ningún `package.json`, por lo que `pnpm-lock.yaml` no registra ningún workspace allí; se validará inmediatamente con `pnpm install --frozen-lockfile`. |
| Falla en tests de rutas de mantenimiento (`adminMaintenanceRoutes.test.ts`) tras eliminar `adminDictionaryRoutes.ts` | Medio | La tarea dedicada en Fase 3A migra el bloque de purga de `adminMaintenanceRoutes.test.ts` hacia `adminPapeleraRoutes` (`/api/admin/papelera`), que implementa exactamente el mismo contrato `DELETE /:nivel/:id` con `requireSuperAdmin`. |
| Enlaces rotos residuales en `README.md` o fallo futuro en `/docs-gate` al borrar reportes de `docs/` | Bajo | Se conservan y depuran los 5 archivos exactos requeridos por `/docs-gate` (`README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md`, `apps/backend-service/README.md`) y se verifica ausencia de enlaces muertos mediante barrido estático. |
