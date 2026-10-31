---
id: 011-auditoria-limpieza-deuda-tecnica
version: 0.1.0
status: ready
---

# Tareas de Implementación — 011-auditoria-limpieza-deuda-tecnica

> **Spec:** `specs/features/011-auditoria-limpieza-deuda-tecnica/spec.md`
> **Plan:** `specs/features/011-auditoria-limpieza-deuda-tecnica/plan.md`
> **ADR:** `specs/adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md`

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-001** | **Aislamiento Previo del Árbol Git y Creación de Rama de Saneamiento**: Consolidar o aislar los cambios pendientes de UI/SVG previos en `dev` y crear la rama de trabajo limpia `chore/011-limpieza-deuda-tecnica` verificando `/version-gate` en verde. | R-001, R-008 | done |
| **T-002** | **Fase 1A — Limpieza de Residuos de Herramientas y Lockfiles Foráneos**: Eliminar `.npmrc.bak`, el directorio `.kilo/` y los archivos ajenos a `pnpm` en `.opencode/` (`bun.lock`, `package-lock.json`, `package.json`, `node_modules/`), validando `pnpm agents:check`. | R-001, R-002, R-008 | done |
| **T-003** | **Fase 1B — Limpieza de Artefactos Compilados en Prisma y Prototipos SQL**: Eliminar `apps/backend-service/prisma/seed.{js,js.map,d.ts,d.ts.map}`, `apps/backend-service/prisma/migrations/postgresql18-advanced-features.sql` y el directorio `infrastructure/`, añadiendo reglas preventivas en `.gitignore`. | R-002 | done |
| **T-004** | **Fase 1C — Eliminación de Paquetes Vacíos y Ajuste de Workspace**: Eliminar el directorio `packages/` (`shared-types`, `ui-components`), actualizar `pnpm-workspace.yaml` únicamente a `apps/*` y verificar integridad con `pnpm install --frozen-lockfile`. | R-003, R-008 | done |
| **T-005** | **Fase 2A — Eliminación de Componentes Huérfanos en Frontend**: Eliminar `apps/web-client/src/components/features/scrollytelling/` (`ScrollIndicator.tsx` + test) y `apps/web-client/src/components/features/social/` (`SocialLinks.tsx` + test). | R-004 | done |
| **T-006** | **Fase 2B — Unificación de Contextos en `apps/web-client/src/contexts/`**: Mover `AudioPlayerContext.tsx` y `AudioPlayerContext.test.tsx` de `src/context/` a `src/contexts/`, eliminar `src/context/`, actualizar las importaciones en `main.tsx`, `AudioPlayButton`, `CulturalVideoPlayer`, `CulturalResourceRegistry.test.tsx` y `TermRow.test.tsx`, y ejecutar Vitest en `web-client`. | R-004, R-008 | done |
| **T-007** | **Fase 2C — Eliminación de Utilidad Sin Uso en Backend**: Eliminar `apps/backend-service/src/utils/postgres18-helpers.ts` y `apps/backend-service/src/utils/postgres18-helpers.test.ts`. | R-005 | done |
| **T-008** | **Fase 2D — Eliminación Definitiva de Documentación Histórica y Obsoleta**: Eliminar `docs/PRE-MERGE-ANALYSIS.md`, `docs/archive/`, `docs/design/`, `docs/development/`, `docs/reports/`, `docs/testing/`, `apps/web-client/docs/` y `apps/backend-service/docs/`. | R-006 | done |
| **T-009** | **Fase 2E — Depuración y Sincronización de los 5 Documentos Canónicos Activos**: Actualizar `README.md`, `docs/project.md`, `docs/CURRENT-STATE.md`, `apps/web-client/README.md` y `apps/backend-service/README.md` eliminando enlaces muertos y menciones a tecnologías/componentes descartados para reflejar exclusivamente el estado real vigente. | R-006 | done |
| **T-010** | **Fase 2F — Alineación Cultural del Glosario y Archivo de Specs Cerradas**: Corregir C3 (*Tra Tul*) y C4 (*Kau Ushamera*) en `specs/steering/glossary.md`, trasladar las carpetas cerradas (`002..005`, `007..010`) de `specs/features/` a `specs/archive/` y actualizar `commitlint-plugin-spec-refs.mjs` para admitir `specs/archive/NNN-slug`. | R-006, R-008 | done |
| **T-011** | **Fase 3A.1 — Retiro de Casos de Uso, DTO, Controlador y Rutas Admin Legadas de Modelo 1**: Eliminar `CreateWordModel1UseCase`, `UpdateWordModel1UseCase`, `DeleteWordUseCase`, `ManageSemanticFieldsUseCase`, `AdminDictionaryDto`, `AdminDictionaryController` (junto con sus tests) y `adminDictionaryRoutes.ts`. | R-007 | pending |
| **T-012** | **Fase 3A.2 — Unificación de Montaje en `app.ts` y Alineación de Tests de Rutas Admin**: Retirar `adminDictionaryRoutes` y el registro duplicado de `adminGovernanceRoutes` en `apps/backend-service/src/app.ts`, y alinear `adminGovernanceRoutes.ts`, `adminGovernanceRoutes.test.ts` y `adminMaintenanceRoutes.test.ts` a los prefijos canónicos `/api/admin/governance` y `/api/admin/papelera` ejecutando Vitest en `backend-service`. | R-007, R-008 | pending |
| **T-013** | **Validación Integral Final y Auditoría de Gates**: Ejecutar `pnpm run ci`, `pnpm run agents:check`, `pnpm run build:web`, `pnpm run build:backend`, suites completas de tests en `web-client` y `backend-service`, y verificación `/docs-gate` sin errores ni regresiones. | R-001..R-008 | pending |
