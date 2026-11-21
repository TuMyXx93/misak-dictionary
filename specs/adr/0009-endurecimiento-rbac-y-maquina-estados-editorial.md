# ADR-0009: Endurecimiento RBAC, Política Unificada de Rutas y Códigos de Conflicto Editorial

- **Fecha**: 2026-11-11
- **Estado**: Aceptado
- **Relacionado con**: `specs/features/013-endurecimiento-rbac-flujo-editorial/spec.md`, `ADR-0004`

## Contexto

Tras la puesta en marcha de las Specs 006, 007 y 008 en pruebas integrales con usuarios reales por rol (`test.uno` como `content_admin` y `test.tres` como `cultural_reviewer`), la auditoría forense identificó tres vulnerabilidades estructurales de arquitectura:

1. **Fragmentación de la matriz de autorización en el cliente (`web-client`)**:
   - Las reglas de acceso a rutas administrativas estaban triplicadas de forma independiente en `router/index.tsx` (`RequirePermission`), `AdminLayout.tsx` (`NAV_ITEMS`) y `authStore.ts` (`firstAllowedRoute`), careciendo además de una función predicado `canAccessAdminPath(user, pathname)` que validara las redirecciones `location.state.from` tras el login.
   - Como resultado, cuando un usuario con privilegios elevados cerraba sesión o expiraba en `/admin/dashboard` o `/admin/usuarios`, el siguiente usuario con menor privilegio era redirigido forzosamente a esa ruta y bloqueado con «Sin permiso para acceder a esta sección».
2. **Pérdida del contrato de concurrencia optimista (`version`) y opacidad de errores `409 Conflict`**:
   - Los hooks `useRatificarSentido` y `useRevertirSentido` definían `version?: number` con fallback `version ?? 1`. `RevisionPage` omitía `version`, causando que toda entrada editada (`version >= 2`) fallara con `409 Conflict` al intentar ratificarla.
   - `AppError` en el backend carecía de un campo estructurado `code`, impidiendo distinguir programáticamente entre colisión de concurrencia (`VERSION_CONFLICT`), bloqueo por separación de funciones (`SELF_RATIFICATION_FORBIDDEN`) y estado editorial inválido (`ALREADY_RATIFIED` / `INVALID_EDITORIAL_STATE`).
3. **Asimetrías de permisos y de payload de identidad en el servidor (`backend-service`)**:
   - `DELETE /api/admin/dictionary/sentidos/:id` y `/api/admin/papelera` exigían `dictionary:write` en lugar de `dictionary:delete`.
   - `POST /api/admin/dictionary/sentidos/:id/revertir` exigía `taxonomy:ratify` en lugar de `taxonomy:revert`.
   - `/api/admin/settings` usaba `requireSuperAdmin` por rol en lugar del permiso `settings:manage` asignado también a `admin`.
   - `adminMediaRoutes.ts` leía `request.user.id` mientras que `TokenService` y `authMiddleware` inyectan `request.user.userId`, provocando respuestas `401` sistemáticas en la ratificación y eliminación de medios culturales.

---

## Decisión

### 1. Fuente Única de Verdad para Políticas de Rutas Administrativas (`ADMIN_ROUTE_POLICIES`)
- Se crea `apps/web-client/src/shared/adminRoutes.ts` como contrato único que declara para cada ruta administrativa su `path`, el permiso requerido (`permission`) y si participa como destino elegible en `firstAllowedRoute`.
- `router/index.tsx`, `AdminLayout.tsx`, `firstAllowedRoute(user)` y la nueva función `canAccessAdminPath(user, pathname)` consumen exclusivamente `ADMIN_ROUTE_POLICIES`.
- `LoginPage` y `CambiarPasswordPage` evalúan `canAccessAdminPath(user, fromPath)` antes de redirigir; si `fromPath` no es accesible para el usuario entrante, redirigen de forma segura a `firstAllowedRoute(user)`.
- `handleLogout` en `AdminLayout` marca la salida intencional y limpia `location.state` al navegar a `/admin/login`.
- La vista `/admin/dashboard` se alinea al permiso `dictionary:read` (coherente con `GET /api/admin/governance/progreso`, Spec 006 R-027) para que todos los roles editoriales visualicen el tablero de avance comunitario.

### 2. Tipado Estricto de `version` y Semántica RFC 9110 con `AppError.code`
- Se elimina todo valor por defecto `?? 1` en mutaciones con control de concurrencia optimista (`useRatificarSentido`, `useRevertirSentido`), convirtiendo `version: number` en propiedad obligatoria en tiempo de compilación.
- Se extiende `AppError` en el backend con `public readonly code?: string` y se propaga en el manejador global de errores de Fastify (`app.ts`).
- Se mantiene el código de estado HTTP `409 Conflict` (conforme a RFC 9110 §15.5.10 y `ADR-0004`) para los rechazos dependientes del estado del recurso, desambiguados mediante `code`:
  - `VERSION_CONFLICT`: la versión enviada no coincide con la versión persistida.
  - `SELF_RATIFICATION_FORBIDDEN`: el actor es el `ultimoEditorId` del registro y no posee el rol `super_admin` (R-012 / D-4).
  - `ALREADY_RATIFIED` / `INVALID_EDITORIAL_STATE`: transición de estado inválida (p. ej. ratificar un registro ya ratificado o revertir un borrador).
  - `BATCH_RATIFICATION_CONFLICT`: colisión atómica en ratificación por lote (`RatificarLoteError`).
- Se reserva `403 Forbidden` exclusivamente para fallos de autorización RBAC (`PERMISSION_DENIED`), obligación de cambio de clave (`PASSWORD_CHANGE_REQUIRED`) o cuenta suspendida (`AUTH_ACCOUNT_SUSPENDED`).

### 3. Alineación de Endpoints Backend, Lote por Código y Contrato de Medios
- `DELETE /api/admin/dictionary/sentidos/:id` y `/api/admin/papelera` (listar y restaurar) exigen `PERMISSIONS.DICCIONARIO_BORRAR` (`dictionary:delete`); la purga física irreversible conserva `requireSuperAdmin`.
- `POST /api/admin/dictionary/sentidos/:id/revertir` exige `PERMISSIONS.TAXONOMIA_REVERTIR` (`taxonomy:revert`).
- `/api/admin/settings/*` exige `requirePermission(PERMISSIONS.AJUSTES_GESTIONAR)` (`settings:manage`), habilitando tanto a `super_admin` como a `admin` (actualizando la cláusula 5 de `ADR-0004`).
- `adminGovernanceRoutes` y `RatificarLoteUseCase` aceptan tanto el `id` numérico como el `codigo` jerárquico del nodo (`C1`, `C1.S1`, `C1.S1.M2`), verificando además que los sentidos del `snapshot` pertenezcan al nodo indicado.
- `adminMediaRoutes` resuelve `user.userId ?? user.id` y registra alias compatibles (`/:id/ratificar` + `/:id/ratify`, `/:id/metadatos` + `PATCH /:id`).

---

## Consecuencias

### Positivas
- **Cero pantallas de falso «Sin permiso» post-login**: Ningún rol es redirigido a una ruta heredada inaccesible tras autenticarse.
- **Integridad del flujo Editor → Revisor**: La ratificación individual y por lote opera con la versión real de cada sentido y se recupera automáticamente ante ediciones concurrentes.
- **Principio de menor privilegio efectivo**: `content_admin` ya no puede borrar sentidos ni operar la papelera sin `dictionary:delete`, y `taxonomy:revert` gobierna efectivamente la reversión.
- **Verificabilidad continua**: Un test de contrato automatizado valida la correspondencia entre `ADMIN_ROUTE_POLICIES`, `PERMISSIONS` y `ROLE_CATALOG`.

### Negativas / Mitigaciones
- **Actualización de suites de tests existentes**: Los tests unitarios que invocaban `useRatificarSentido({ id })` sin `version` o que asumían `dictionary:write` para borrar sentidos deben actualizarse al contrato estricto.
  - *Mitigación*: El compilador TypeScript detecta todas las llamadas sin `version` de forma estática.
