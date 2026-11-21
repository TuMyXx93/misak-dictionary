---
id: 006-panel-admin-gobierno-tasks
version: 1.0.0
status: archived
spec: 006-panel-admin-gobierno@1.0.1
plan: 006-panel-admin-gobierno-plan@1.0.1
---

# 006 — Tareas: Panel administrativo y gobierno editorial del léxico

**Convenciones**: una tarea = una acción verificable con contexto mínimo (la tarea + su requisito).
Orden por dependencia (datos → aplicación → rutas en backend; primitivas → composición en cliente).
Cada requisito con Gherkin lleva su test **antes o junto a** la implementación (C2.3).
Agentes: `[arq]` architect · `[back]` backend · `[front]` frontend · `[test]` tester · `[ops]` devops · `[rev]` reviewer.
Commits: Conventional Commits con trailer `Refs: specs/features/006-panel-admin-gobierno`; en WSL, `HUSKY=0`.

## PR A — Fundaciones y gobierno editorial (backend)

### A0. Decisiones y dependencias

| ID    | Tarea                                                                                                                                          | Requisito             | Estado  |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- | :------ |
| T-001 | [arq] Ejecutar `/version-gate`, resolver RK-1 (`SameSite`) y redactar `specs/adr/0004-sesion-admin-y-gobierno-editorial.md` (formato Nygard)  | R-002, R-010, R-012, R-025 | done    |
| T-002 | [back] Instalar `@fastify/cookie` con versión fija (tras gate de seguridad) y registrarlo en `app.ts`                                          | R-002, R-024          | done    |

### A1. Datos y permisos

| ID    | Tarea                                                                                                                                                                         | Requisito                       | Estado  |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ | :------ |
| T-003 | [back] Crear migración `0009_gobierno_editorial`: columnas de editor/ratificación, `estado` en subcampos y microcampos, CHECKs, `users.must_change_password`, `system_settings`, índices | R-010..R-015, R-019, R-025, R-026, R-028 | done    |
| T-004 | [back] Actualizar `schema.prisma` (+ modelo `SystemSetting`), aplicar `0009` en `:5434`, regenerar el cliente y verificar que los conteos (1.351 sentidos, 1.451 formas, 65 nodos) no cambian | R-010..R-015, R-026             | done    |
| T-005 | [test] Test de integración (`RUN_INTEGRATION=1`): CHECK `estado='ratificado' ⇔ ratificado_at`, backfill en `borrador` y `ultimo_editor_id` nulo                              | R-010, R-025                    | pending |
| T-006 | [back] Añadir `dictionary:read` y `audit:read` a `permissions.ts` con la matriz de roles; actualizar seed idempotente (permisos, `system_settings`) y sus tests                | R-006, R-014, R-019             | done    |
| T-007 | [back] Implementar `requireAnyPermission(...)` en `authorizationMiddleware.ts` con tests (403 sin ninguno, pasa con alguno)                                                   | R-004, R-006, R-014             | done    |
| T-008 | [back] Añadir `AuditService.recordInTx(tx, …)` con tests (la auditoría se revierte junto con la mutación)                                                                     | R-020, R-025                    | done    |

### A2. Autenticación

| ID    | Tarea                                                                                                                                                   | Requisito             | Estado  |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------- | :------ |
| T-009 | [test] Escribir tests rojos de auth: modo cookie (`X-Client: web-admin`), cuerpo sin `refreshToken`, rechazo por `Origin` no permitido, modo legado intacto | R-001, R-002, R-005   | done    |
| T-010 | [back] Implementar modo cookie opt-in en `AuthController`/`authRoutes` (login, refresh con rotación, logout) con cookie `misak_rt` y verificación de `Origin`  | R-001, R-002, R-005   | done    |
| T-011 | [back] Implementar `GET /auth/me` (`userId`, `username`, `roles[]`, `permissions[]` resueltos en servidor) con tests                                    | R-003                 | done    |
| T-012 | [back] Implementar `POST /auth/change-password` y bloqueo de rutas admin mientras `must_change_password = true`; `RootBootstrapService` lo activa, con tests | R-028                 | done    |

### A3. Casos de uso de gobierno editorial

| ID    | Tarea                                                                                                                                                                              | Requisito              | Estado  |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- | :------ |
| T-013 | [back] `ListSentidosAdminUseCase` + tests: filtros por nodo (con descendientes), `estado`, `tipo`, texto sin diacríticos, cursor, incluye borradores                                 | R-006                  | done    |
| T-014 | [back] `CreateSentidoUseCase` + tests: `codigo` `<nodo>.E<NNN>` bajo `pg_advisory_xact_lock`, una sola ubicación, estado `borrador`, `ultimo_editor_*`                               | R-008                  | done    |
| T-015 | [back] `UpdateSentidoUseCase` + tests: `version` obligatoria (`409`), reemplazo ordenado de formas, normalización `ɵ` solo en campos Namtrik, regreso a `borrador` en edición cultural | R-007, R-010, R-022    | done    |
| T-016 | [back] `DeleteSentidoUseCase` (borrado lógico auditado en transacción) + tests                                                                                                     | R-009, R-020           | done    |
| T-017 | [back] `RatificarSentidoUseCase` y `RevertirRatificacionUseCase` + tests: solo `borrador→ratificado`, bloqueo de auto-ratificación (salvo `super_admin`), motivo ≥ 10 al revertir   | R-011, R-012, R-013    | done    |
| T-018 | [back] Ajustar `ManageSemanticFieldsUseCase` (campos, subcampos, microcampos) para registrar último editor y reiniciar la ratificación del nodo; añadir `RatificarNodoUseCase` + tests | R-009, R-010, R-015    | done    |
| T-019 | [back] `RatificarLoteUseCase` + tests: transacción única, checklist de 4 casillas, `snapshot` de versiones, `409` con códigos en conflicto, 1 auditoría de lote + 1 por sentido      | R-012, R-025           | done    |
| T-020 | [back] `ProgresoRatificacionUseCase` + tests (`ratificados/total` por campo, subcampo y microcampo)                                                                                 | R-014, R-027           | done    |
| T-021 | [back] `PurgarPapeleraUseCase` + tests: solo `super_admin`, retención `RETENCION_PAPELERA_DIAS` (30), `confirmCodigo`, sin dependencias, auditoría con snapshot completo            | R-017                  | done    |
| T-022 | [back] `ListUsersUseCase` y `ListAuditUseCase` + tests: sin hashes ni tokens, lista blanca de campos, cursor `id DESC`                                                              | R-018, R-019           | done    |
| T-023 | [back] `SystemSettingsService` (`PUBLIC_ONLY_RATIFIED`, cache TTL 30 s, invalidación al escribir, auditoría) + tests                                                                | R-026                  | done    |

### A4. Rutas y verificación

| ID    | Tarea                                                                                                                                                      | Requisito                    | Estado  |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- | :------ |
| T-024 | [back] `adminSentidoRoutes.ts` con esquemas Zod (listar, crear, `PATCH`, borrar, ratificar, revertir) y tests `app.inject` de `403/409`                       | R-004, R-006..R-013          | done    |
| T-025 | [back] `adminGovernanceRoutes.ts` (ratificar nodo, ratificar lote, progreso) con tests `app.inject`                                                         | R-014, R-015, R-025, R-027   | done    |
| T-026 | [back] Rutas de purga (`DELETE /papelera/:nivel/:id`), `GET /api/admin/users`, `GET /api/admin/audit` y `settings/public-only-ratified` con tests            | R-017, R-018, R-019, R-026   | done    |
| T-027 | [back] Cabecera `Cache-Control: no-store` en respuestas autenticadas y registro de todos los plugins nuevos en `app.ts`                                      | R-024                        | done    |
| T-028 | [test] Integración PostgreSQL: concurrencia de `version`, atomicidad del lote, purga con dependencias y retención                                           | R-007, R-017, R-025          | done    |
| T-029 | [ops] Runbook del `super_admin` inicial (cuenta del Equipo Namtrik, segundo `super_admin` nominal, cambio de contraseña) y test de búsqueda de secretos      | R-028                        | done    |
| T-030 | [rev] Verificación de PR A: `biome ci`, `tsc -b`, tests, `/version-gate`, `/docs-gate`, `/review`; abrir PR A a `dev` y confirmar CI 3/3                    | R-001..R-028 (backend)       | done    |

## PR B — Exposición pública del estado

| ID    | Tarea                                                                                                                                              | Requisito | Estado  |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- | :------ |
| T-031 | [back] `CampoSemanticoRepository` y `PalabraRepository`: exponer `estado` y filtrar `ratificado` solo con la bandera activa; tests de ambos modos        | R-026     | done    |
| T-032 | [front] `ApiSentido`, `Term` y `adaptSemanticField` con `estado` + tests                                                                           | R-026     | done    |
| T-033 | [front] Insignia «En revisión» en `TermRow` (texto + icono, contraste AA, `aria-label`) + tests                                                    | R-026, R-021 | done    |
| T-034 | [rev] Verificación de PR B (`biome ci`, `tsc -b`, tests, build, `/review`); abrir PR B a `dev` y confirmar CI 3/3                                  | R-026     | done    |

## PR C — Panel administrativo (cliente)

### C1. Infraestructura del cliente

| ID    | Tarea                                                                                                                                                               | Requisito     | Estado  |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------ | :------ |
| T-035 | [front] `vite.config.ts`: `manualChunks: admin`, `globIgnores` del chunk admin, `/^\/auth\//` en la denylist; `public/robots.txt` con `Disallow: /admin`; test del SW generado | R-023, R-024  | done    |
| T-036 | [ops] `scripts/check-bundle-size.mjs` y paso en `build.yml`: falla si el chunk principal crece > 5 % respecto a `v0.4.0-alpha.0`                                    | R-023         | done    |
| T-037 | [front] `authStore` (solo memoria) y `adminHttp` (401 → refresh single-flight, un reintento, cierre local) + tests                                                  | R-002         | done    |
| T-038 | [front] `RequireAuth` y `RequirePermission` (redirección a login; «Sin permiso» sin disparar peticiones de datos) + tests                                          | R-001, R-004  | done    |
| T-039 | [AdminLayout]: `noindex`, skip-link, navegación según permisos, botón de cerrar sesión (`POST /auth/logout`) + tests                                        | R-005, R-021, R-024 | done    |
| T-040 | [front] `CampoNamtrik` (`lang="gum"`, NFC, sin transformación, botones ɵ/Ɵ) + tests de preservación de `ɵ` y diacríticos                                           | R-022         | done    |
| T-041 | [front] Hooks de React Query del panel (`useAdminSentidos`, `useRatificar`, `usePapelera`, …) con invalidación de caché + tests                                     | R-006..R-019  | done    |

### C2. Páginas

| ID    | Tarea                                                                                                                                                                      | Requisito             | Estado  |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- | :------ |
| T-042 | [front] `LoginPage` con mensaje genérico ante credenciales inválidas y cambio de contraseña obligatorio + tests                                                            | R-001, R-028          | done    |
| T-043 | [front] `SentidosPage`: listado, filtros por nodo/estado/tipo/texto, paginación + tests                                                                                    | R-006                 | done    |
| T-044 | [front] `SentidoEditorPage` (crear/editar con `react-hook-form` + Zod) y `ConflictoVersionDialog` para `409` + tests                                                       | R-007, R-008, R-010   | done    |
| T-045 | [front] `RevisionPage`: cola de borradores, ratificar y revertir por sentido, `ChecklistRatificacion` y lote por microcampo con manejo de conflictos + tests                | R-011, R-013, R-014, R-025 | done    |
| T-046 | [front] `DashboardPage`: progreso de ratificación por campo, subcampo y microcampo con filtro «con pendientes» + tests                                                      | R-027                 | done    |
| T-047 | [front] `PapeleraPage`: listar, restaurar con confirmación y purga con `ConfirmarPorCodigo` (solo `super_admin`) + tests                                                    | R-016, R-017          | done    |
| T-048 | [front] `UsuariosPage`: listado con roles, asignar/revocar y error `409` del último `super_admin` + tests                                                                   | R-018                 | done    |
| T-049 | [front] `AuditoriaPage` con filtros y paginación por cursor + tests                                                                                                        | R-019                 | done    |
| T-050 | [front] `AjustesPage`: bandera `PUBLIC_ONLY_RATIFIED` (solo `super_admin`) + tests                                                                                         | R-026                 | done    |
| T-051 | [front] Rutas `/admin/*` con `React.lazy` en `router/index.tsx` + tests de redirección y guardas                                                                           | R-001, R-004, R-023   | done    |

### C3. Calidad y cierre

| ID    | Tarea                                                                                                                                                                         | Requisito             | Estado  |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- | :------ |
| T-052 | [test] Auditoría de accesibilidad del panel: tap targets ≥ 48 px, `prefers-reduced-motion`, operación solo con teclado, foco visible y `aria-label` en controles icónicos     | R-021                 | done    |
| T-053 | [rev] Verificación de PR C (`biome ci`, `tsc -b`, tests, build, chequeo de bundle, `/review`); prueba manual de extremo a extremo con los 6 roles; abrir PR C a `dev`         | R-001..R-028 (cliente) | done    |
| T-054 | [arq] Cierre: mover la spec a `specs/archive/`, actualizar `README`/glosario si aplica (`/docs-gate`), y `mem_session_summary` en Engram                                       | R-001..R-028          | done    |

## Cobertura de requisitos

| Requisito | Tareas |
| :-- | :-- |
| R-001 | T-009, T-010, T-038, T-042, T-051 |
| R-002 | T-001, T-002, T-009, T-010, T-037 |
| R-003 | T-011 |
| R-004 | T-007, T-024, T-038, T-051 |
| R-005 | T-009, T-010, T-039 |
| R-006 | T-006, T-007, T-013, T-024, T-043 |
| R-007 | T-015, T-024, T-028, T-044 |
| R-008 | T-014, T-024, T-044 |
| R-009 | T-016, T-018 |
| R-010 | T-001, T-003..T-005, T-015, T-018, T-044 |
| R-011 | T-017, T-024, T-045 |
| R-012 | T-001, T-017, T-019 |
| R-013 | T-017, T-024, T-045 |
| R-014 | T-006, T-007, T-020, T-025, T-045 |
| R-015 | T-003, T-018, T-025 |
| R-016 | T-047 |
| R-017 | T-021, T-026, T-028, T-047 |
| R-018 | T-022, T-026, T-048 |
| R-019 | T-006, T-022, T-026, T-049 |
| R-020 | T-008, T-016, T-019 |
| R-021 | T-033, T-039, T-052 |
| R-022 | T-015, T-040 |
| R-023 | T-035, T-036, T-051 |
| R-024 | T-002, T-027, T-035, T-039 |
| R-025 | T-001, T-005, T-008, T-019, T-025, T-028, T-045 |
| R-026 | T-004, T-023, T-026, T-031..T-033, T-050 |
| R-027 | T-020, T-025, T-046 |
| R-028 | T-003, T-012, T-029, T-042 |
