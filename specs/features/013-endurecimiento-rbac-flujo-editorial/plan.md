---
id: 013-endurecimiento-rbac-flujo-editorial
version: 1.0.0
status: approved
---

# Plan Técnico — 013 Endurecimiento de RBAC, Enrutamiento de Sesión y Máquina de Estados Editorial

## Diseño

La solución corrige de raíz las fallas del flujo editorial y de sesión administrativa en cuatro ejes arquitectónicos sin requerir migraciones de base de datos:

1. **Contrato Único de Rutas Administrativas (`apps/web-client/src/shared/adminRoutes.ts`)**:
   - Define `ADMIN_ROUTE_POLICIES` mapeando cada ruta (`/admin/dashboard`, `/admin/sentidos`, `/admin/taxonomia`, `/admin/medios`, `/admin/revision`, `/admin/papelera`, `/admin/usuarios`, `/admin/auditoria`, `/admin/ajustes`) con su permiso canónico de `PERMISSIONS`.
   - Expone `getRequiredPermissionForAdminPath(pathname)`, `canAccessAdminPath(user, pathname)` y centraliza el cálculo de `firstAllowedRoute(user)`.
   - Alinea `/admin/dashboard` a `PERMISSIONS.DICCIONARIO_LEER` y `/admin/revision` (lectura) a `PERMISSIONS.DICCIONARIO_LEER` (con botones de mutación condicionados a `taxonomy:ratify` y `taxonomy:revert`).
2. **Higiene de Redirección en Login y Logout (`LoginPage.tsx`, `CambiarPasswordPage.tsx`, `AdminLayout.tsx`, `RequireAuth.tsx`)**:
   - `LoginPage` y `CambiarPasswordPage` validan `fromPath` con `canAccessAdminPath(user, fromPath)` antes de navegar; si el usuario entrante no tiene acceso a `fromPath`, navegan a `firstAllowedRoute(user)`.
   - `AdminLayout.handleLogout` navega a `/admin/login` con `state: null` y limpia la sesión de forma atómica sin que `RequireAuth` sobreescriba `location.state.from`.
3. **Máquina de Estados Editorial con Concurrencia Optimista Estricta y Lote por Código (`RevisionPage.tsx`, `useAdmin.ts`, `adminGovernanceRoutes.ts`, `RatificarLoteUseCase.ts`)**:
   - `useRatificarSentido` exige `{ id: string; version: number }` y `useRevertirSentido` exige `{ id: string; version: number; motivo: string }` (sin `?? 1`).
   - En `onError`, si el código HTTP es `409`, se invalidan `['admin', 'sentidos']` y `['admin', 'progreso']` para refrescar la vista con la versión vigente.
   - `RevisionPage` añade selector de vista (`borrador` vs `ratificado`) para que «Ratificar» solo aparezca sobre borradores (`canRatify`) y «Revertir» solo sobre sentidos ratificados (`canRevert`), cumpliendo R-003 y R-013.
   - Para la ratificación por lote, `RevisionPage` construye el `snapshot` real con los sentidos en borrador del microcampo seleccionado y el backend (`adminGovernanceRoutes` / `RatificarLoteUseCase`) acepta tanto ID numérico como código jerárquico (`C1.S1.M2`).
4. **Endurecimiento de Middlewares, Permisos por Endpoint y Medios (`backend-service`)**:
   - `AppError` incorpora `code?: string` y `app.ts` lo expone en las respuestas JSON de error.
   - `requirePasswordChanged` valida además `isActive: true` y `deletedAt: null` en base de datos, devolviendo `403` con `code: 'AUTH_ACCOUNT_SUSPENDED'` si la cuenta fue desactivada tras emitirse el JWT.
   - `adminSentidoRoutes`: `DELETE /:id` exige `dictionary:delete`; `POST /:id/revertir` exige `taxonomy:revert`.
   - `adminPapeleraRoutes`: el hook de lectura/restauración exige `dictionary:delete` (`DELETE /:nivel/:id` mantiene `requireSuperAdmin`).
   - `adminSettingsRoutes`: reemplaza `requireSuperAdmin` por `requirePermission(PERMISSIONS.AJUSTES_GESTIONAR)`.
   - `adminMediaRoutes`: extrae `userId` desde `request.user.userId ?? request.user.id` y soporta tanto `/:id/ratificar` como `/:id/ratify` y `/:id/metadatos` como `PATCH /:id`.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| ------- | ------ | --------- |
| `apps/web-client/src/shared/adminRoutes.ts` | Nuevo módulo canónico con `ADMIN_ROUTE_POLICIES`, `getRequiredPermissionForAdminPath`, `canAccessAdminPath` y `resolveFirstAllowedRoute`. | R-005, R-007 |
| `apps/web-client/src/stores/authStore.ts` | Delegar `firstAllowedRoute` y exponer `canAccessAdminPath`; evaluar `user.permissions` como fuente primaria en `hasPermission`. | R-005, R-007, R-010 |
| `apps/web-client/src/router/index.tsx` | Alinear `/admin/dashboard` y `/admin/revision` a `PERMISSIONS.DICCIONARIO_LEER` según `ADMIN_ROUTE_POLICIES`. | R-003, R-007 |
| `apps/web-client/src/components/admin/AdminLayout.tsx` | Alinear `NAV_ITEMS` (`Dashboard` y `Cola de Revisión` con `dictionary:read`; `Ajustes` con `settings:manage` sin restricción exclusiva de `super_admin`) y evitar carrera en `handleLogout`. | R-003, R-006, R-007, R-008 |
| `apps/web-client/src/pages/admin/LoginPage.tsx` | Validar `fromPath` con `canAccessAdminPath(res.user, fromPath)` en login y cambio de contraseña. | R-005 |
| `apps/web-client/src/pages/admin/CambiarPasswordPage.tsx` | Redirigir usando `firstAllowedRoute` validado tras cambio de clave. | R-005 |
| `apps/web-client/src/hooks/useAdmin.ts` | Exigir `version: number` en `useRatificarSentido` y `useRevertirSentido`; invalidar cachés en `409`; enviar `snapshot` y `checklist` en `useRatificarLote`; alinear rutas de medios (`/ratificar`, `/metadatos`). | R-001, R-002, R-004, R-009 |
| `apps/web-client/src/pages/admin/RevisionPage.tsx` | Pasar `version: ratifyTarget.version` y `revertTarget.version`; filtrar acciones según `sentido.estado` (con filtro `borrador`/`ratificado`); enviar `snapshot` real en ratificación por lote. | R-001, R-003, R-004 |
| `apps/backend-service/src/shared/errors/AppError.ts` | Añadir propiedad opcional `public readonly code?: string`. | R-002 |
| `apps/backend-service/src/app.ts` | Propagar `error.code` en la respuesta JSON del error handler global. | R-002 |
| `apps/backend-service/src/application/use-cases/admin/{RatificarSentido,RevertirRatificacion,UpdateSentido,RatificarNodo,RatificarLote}UseCase.ts` | Incluir códigos tipados (`VERSION_CONFLICT`, `SELF_RATIFICATION_FORBIDDEN`, `ALREADY_RATIFIED`, `INVALID_EDITORIAL_STATE`, `BATCH_RATIFICATION_CONFLICT`) y permitir resolución de nodo por código en `RatificarLoteUseCase`. | R-002, R-004 |
| `apps/backend-service/src/api/admin/routes/adminGovernanceRoutes.ts` | Permitir identificador numérico o código jerárquico (`C1.S1.M2`) en `/ratificar-lote` y propagar `code` en `409`. | R-002, R-004 |
| `apps/backend-service/src/api/admin/routes/adminSentidoRoutes.ts` | Exigir `PERMISSIONS.DICCIONARIO_BORRAR` en `DELETE /:id` y `PERMISSIONS.TAXONOMIA_REVERTIR` en `POST /:id/revertir`. | R-008 |
| `apps/backend-service/src/api/admin/routes/adminPapeleraRoutes.ts` | Exigir `PERMISSIONS.DICCIONARIO_BORRAR` en el hook del plugin de papelera. | R-008 |
| `apps/backend-service/src/api/admin/routes/adminSettingsRoutes.ts` | Reemplazar `requireSuperAdmin` por `requirePermission(PERMISSIONS.AJUSTES_GESTIONAR)`. | R-008 |
| `apps/backend-service/src/api/admin/routes/adminMediaRoutes.ts` | Resolver `userId` desde `request.user.userId ?? request.user.id` y registrar alias `/:id/ratify` y `PATCH /:id`. | R-009 |
| `apps/backend-service/src/presentation/middleware/authorizationMiddleware.ts` | Verificar cuenta activa en `requirePasswordChanged` y retornar `403` tipado si la cuenta está inactiva. | R-010 |

## Contratos de UI/API

- **Mutación Ratificar Sentido**:
  - Request: `POST /api/admin/dictionary/sentidos/:id/ratificar` con `{ version: number }` (`int >= 1`).
  - Error `409`: `{ statusCode: 409, error: "AppError", code: "VERSION_CONFLICT" | "SELF_RATIFICATION_FORBIDDEN" | "ALREADY_RATIFIED", message: string }`.
- **Mutación Revertir Sentido**:
  - Request: `POST /api/admin/dictionary/sentidos/:id/revertir` (permiso `taxonomy:revert`) con `{ version: number, motivo: string }` (`motivo.trim().length >= 10`).
  - Error `409`: `{ statusCode: 409, error: "AppError", code: "VERSION_CONFLICT" | "INVALID_EDITORIAL_STATE", message: string }`.
- **Mutación Ratificar Lote**:
  - Request: `POST /api/admin/governance/nodos/:nivel/:idOrCodigo/ratificar-lote` (y alias `/api/admin/governance/ratificar-lote/:nivel/:idOrCodigo`) con `{ checklist: { ortografia: true, categorias: true, glosas: true, cientificos: true }, snapshot: Array<{ id: string, version: number }> }`.

## Decisiones tomadas

- **`ADR-0009`**: Fuente única `ADMIN_ROUTE_POLICIES` para rutas administrativas, obligatoriedad de `version` sin fallback, códigos de error tipados sobre HTTP `409` para conflictos de estado/concurrencia/autorratificación, y apertura de `/api/admin/settings` al permiso `settings:manage` (`super_admin` y `admin`).
- **Notas de errata en `Spec 006` y `Spec 008`**: Se documenta la referencia cruzada hacia `Spec 013` y `ADR-0009` sin alterar el estado `archived` de dichas especificaciones.

## Riesgos y mitigación

- **Riesgo 1**: Tests existentes en frontend que llamaban a `useRatificarSentido({ id })` sin `version` o que esperaban `/admin/usuarios` como fallback para `super_admin` con `permissions: []`.
  - *Mitigación*: En `hasPermission`, si `user.permissions` está vacío pero `user.roles` incluye `'super_admin'` (caso de tests unitarios sintéticos), se conserva el fallback para `super_admin`, mientras que para cualquier otro rol se evalúa estrictamente `user.permissions`. Se actualizan y amplían las suites de tests.
- **Riesgo 2**: Un usuario filtra la cola de revisión por texto y pulsa «Ratificar lote» sin que haya sentidos cargados para el microcampo indicado.
  - *Mitigación*: `RevisionPage` filtra los sentidos en borrador pertenecientes al código de microcampo ingresado; si no hay sentidos en borrador cargados en la vista para ese microcampo, consulta al endpoint de sentidos en borrador de ese nodo antes de enviar el `snapshot` o informa claramente que no existen borradores pendientes en dicho microcampo.
