---
id: 013-endurecimiento-rbac-flujo-editorial
version: 1.0.0
status: done
cultural-gate: true
created: 2026-11-11
approved: 2026-11-11
---

# 013 — Endurecimiento de RBAC, Enrutamiento de Sesión y Máquina de Estados Editorial

## Contexto

La auditoría forense de extremo a extremo sobre el Panel Editorial Misak (`apps/web-client` y `apps/backend-service`) reveló dos fallas bloqueantes en el flujo operativo del equipo lingüístico y doce desalineaciones de control de acceso (RBAC):
1. **Fallo de concurrencia espurio al ratificar o revertir sentidos (`409 Conflict`)**: `RevisionPage.tsx` no propagaba `sentido.version` y `useAdmin.ts` inyectaba `version ?? 1`, provocando que todo sentido editado por un `content_admin` (`version >= 2`) fallara sistemáticamente cuando un `cultural_reviewer` intentaba ratificarlo. Asimismo, el lote enviaba códigos jerárquicos y snapshots vacíos.
2. **Bloqueo post-login («Sin permiso para acceder a esta sección»)**: `LoginPage.tsx` redirigía ciegamente a `location.state.from.pathname` heredado de sesiones previas (p. ej. `/admin/dashboard` o `/admin/usuarios` de un `super_admin`) sin validar si el nuevo usuario autenticado poseía el permiso requerido, agravado por una condición de carrera en `handleLogout` y por una puerta `audit:read` en el Dashboard cuyo único endpoint (`/api/admin/governance/progreso`) requiere `dictionary:read`.
3. **Desalineaciones RBAC y contrato de identidad en medios**: `adminMediaRoutes.ts` leía `user.id` en lugar de `user.userId` (causando `401` perpetuo al ratificar o eliminar medios), `DELETE /sentidos/:id` y `/api/admin/papelera` exigían `dictionary:write` en lugar de `dictionary:delete`, `/sentidos/:id/revertir` exigía `taxonomy:ratify` dejando `taxonomy:revert` sin efecto, y `/api/admin/settings` bloqueaba al rol `admin` pese a contar con `settings:manage`.

## Requisitos (EARS)

- **R-001 (Propagación obligatoria de versión en transiciones editoriales)** — CUANDO una persona con permiso `taxonomy:ratify` o `taxonomy:revert` ratifique o revierta un sentido léxico, EL SISTEMA DEBERÁ enviar obligatoriamente la `version` actual del registro (`version >= 1`, sin fallback implícito a `1`) hacia el backend.
- **R-002 (Recuperación automática y códigos tipados ante conflictos 409)** — CUANDO una transición editorial (`ratificar`, `revertir`, `actualizar` o `ratificar-lote`) sea rechazada con HTTP `409`, EL SISTEMA DEBERÁ clasificar el error mediante un código tipado (`VERSION_CONFLICT`, `SELF_RATIFICATION_FORBIDDEN`, `ALREADY_RATIFIED`, `INVALID_EDITORIAL_STATE`, `BATCH_RATIFICATION_CONFLICT`), invalidar automáticamente las cachés de sentidos y progreso en el cliente, y mostrar un mensaje específico diferenciando colisión de concurrencia frente a bloqueo por separación de funciones (auto-ratificación).
- **R-003 (Coherencia de acciones en la Cola de Revisión y acceso de lectura)** — MIENTRAS un sentido léxico se encuentre en estado `borrador`, EL SISTEMA NO DEBERÁ ofrecer la acción «Revertir» sobre dicha fila, y la vista `/admin/revision` DEBERÁ ser accesible en modo lectura con `dictionary:read` (habilitando los controles de ratificación únicamente a quienes posean `taxonomy:ratify` y los de reversión sobre sentidos ratificados a quienes posean `taxonomy:revert`).
- **R-004 (Ratificación por lote funcional con resolución de código y snapshot real)** — CUANDO una persona con `taxonomy:ratify` ejecute la ratificación por lote de un microcampo, EL SISTEMA DEBERÁ enviar el `checklist` explícito confirmado por la persona revisora y el `snapshot` real (`[{ id, version }]`) de los sentidos en borrador del nodo, y el backend DEBERÁ aceptar tanto el `id` numérico como el `codigo` jerárquico (p. ej. `C1.S1.M2`) del nodo taxonómico.
- **R-005 (Validación de permisos en redirección post-login y post-cambio de clave)** — CUANDO un usuario complete el inicio de sesión o el cambio obligatorio de contraseña existiendo una ruta previa en `location.state.from.pathname`, EL SISTEMA DEBERÁ verificar con `canAccessAdminPath(user, fromPath)` si el usuario autenticado posee los permisos requeridos por dicha ruta; SI carece de ellos, EL SISTEMA DEBERÁ redirigirlo a `firstAllowedRoute(user)` sin mostrar la pantalla «Sin permiso».
- **R-006 (Cierre de sesión limpio sin contaminación de historial)** — CUANDO un usuario cierre sesión voluntariamente desde `AdminLayout`, EL SISTEMA DEBERÁ limpiar el estado de sesión y navegar a `/admin/login` con `state: null` sin que `RequireAuth` inyecte la ruta saliente en `location.state.from`.
- **R-007 (Fuente única de verdad para permisos de rutas administrativas)** — EL SISTEMA DEBERÁ definir una matriz canónica `ADMIN_ROUTE_POLICIES` compartida por el router (`RequirePermission`), el menú lateral (`AdminLayout`), `canAccessAdminPath` y `firstAllowedRoute`, asignando `dictionary:read` a `/admin/dashboard` en alineación con `GET /api/admin/governance/progreso`.
- **R-008 (Alineación estricta de permisos por endpoint en Backend y Frontend)** — EL SISTEMA DEBERÁ exigir:
  1. `dictionary:delete` en `DELETE /api/admin/dictionary/sentidos/:id` y en las rutas de listado/restauración de `/api/admin/papelera` (manteniendo `super_admin` para la purga física irreversible).
  2. `taxonomy:revert` en `POST /api/admin/dictionary/sentidos/:id/revertir`.
  3. `settings:manage` en `/api/admin/settings/*` y en la vista `/admin/ajustes`, permitiendo tanto a `super_admin` como a `admin` gestionar los ajustes globales.
- **R-009 (Resolución canónica de identidad y rutas en Medios Culturales)** — CUANDO se procese una petición autenticada en `/api/admin/medios`, EL SISTEMA DEBERÁ resolver el identificador del actor desde `request.user.userId` (soportando `id` como fallback defensivo) y exponer los endpoints de ratificación (`/:id/ratificar` y alias `/:id/ratify`) y actualización de metadatos (`/:id/metadatos` y alias `/:id`), evitando falsos errores `401` o `404`.
- **R-010 (Verificación de cuenta activa en guardas de servidor y permisos explícitos en cliente)** — CUANDO una petición acceda a rutas administrativas protegidas por `requirePasswordChanged`, EL SISTEMA DEBERÁ verificar que la cuenta continúe activa (`isActive: true` y `deletedAt: null`) rechazando con `403` (`AUTH_ACCOUNT_SUSPENDED`) las cuentas suspendidas; asimismo, `hasPermission` en `authStore` DEBERÁ evaluar el arreglo `user.permissions` (con fallback a `super_admin` solo cuando `permissions` no esté hidratado).

## Criterios de aceptación (Gherkin)

### R-001 / R-002 — Ratificación de sentido editado (`version >= 2`) y manejo de conflictos

```gherkin
Escenario: Revisor cultural ratifica exitosamente un sentido editado en versión 2
  Dado un sentido en estado "borrador" con id "42", código "C4.S6.E021", version 2 y ultimoEditorId "10" (content_admin)
  Y una sesión activa en RevisionPage con el usuario "20" (cultural_reviewer, permiso "taxonomy:ratify")
  Cuando abre el diálogo de ratificación para "C4.S6.E021", confirma la lista de verificación y pulsa "Confirmar ratificación"
  Entonces el cliente envía POST "/api/admin/dictionary/sentidos/42/ratificar" con cuerpo '{"version":2}'
  Y el backend responde 200 con estado "ratificado" y version 3
  Y la interfaz muestra "Sentido C4.S6.E021 ratificado exitosamente."

Escenario: Conflicto de concurrencia real invalida la caché de sentidos y muestra mensaje tipado
  Dado que el sentido "42" cambió a version 3 en el servidor mientras el revisor visualizaba la version 2
  Cuando el revisor confirma la ratificación enviando version 2
  Entonces el backend responde 409 con code "VERSION_CONFLICT"
  Y el cliente invalida la consulta "['admin', 'sentidos']" y muestra el mensaje de conflicto de concurrencia
```

### R-003 / R-004 — Cola de revisión y ratificación por lote

```gherkin
Escenario: La cola de borradores no renderiza el botón Revertir y permite lectura a admin
  Dado un usuario autenticado con permiso "dictionary:read" en "/admin/revision"
  Cuando se listan los sentidos en estado "borrador"
  Entonces la tabla muestra los sentidos pendientes sin renderizar el botón "Revertir" en filas en borrador

Escenario: Ratificación por lote mediante código de microcampo y snapshot de sentidos visibles
  Dado que en "/admin/revision" existen 2 sentidos en borrador del microcampo "C1.S1.M2" con versiones 1 y 2
  Cuando el revisor con "taxonomy:ratify" ingresa "C1.S1.M2", marca el checklist y confirma el lote
  Entonces el cliente envía POST "/api/admin/governance/ratificar-lote/microcampo/C1.S1.M2" con el snapshot de los 2 sentidos y sus versiones reales
  Y el backend resuelve el microcampo por su código "C1.S1.M2" y ratifica ambos sentidos en una transacción
```

### R-005 / R-006 / R-007 — Redirección post-login segura y cierre de sesión limpio

```gherkin
Escenario: Login de Editor o Revisor con fromPath heredado no autorizado redirige a su primera ruta permitida
  Dado que location.state contiene from.pathname = "/admin/usuarios" (requiere "users:manage")
  Cuando el usuario "test.uno" ("content_admin", permisos "dictionary:read", "dictionary:write", "media:read", "media:write") inicia sesión
  Entonces canAccessAdminPath rechaza "/admin/usuarios" para "test.uno"
  Y el sistema redirige a "/admin/dashboard" (primera ruta permitida con "dictionary:read") sin mostrar "Sin permiso"

Escenario: Cierre de sesión voluntario no contamina location.state.from
  Dado un usuario autenticado en "/admin/usuarios"
  Cuando pulsa "Cerrar sesión"
  Entonces la navegación aterriza en "/admin/login" sin preservar "/admin/usuarios" como destino forzado para el siguiente usuario
```

### R-008 / R-009 / R-010 — Endurecimiento de endpoints Backend y Medios

```gherkin
Escenario: Borrado lógico de sentido y papelera exigen dictionary:delete
  Dado un usuario "content_admin" que posee "dictionary:write" pero NO "dictionary:delete"
  Cuando envía DELETE "/api/admin/dictionary/sentidos/50" o GET "/api/admin/papelera"
  Entonces el backend responde 403 Forbidden

Escenario: Reversión de sentido exige taxonomy:revert y Ajustes permite settings:manage
  Dado un usuario con "taxonomy:ratify" pero sin "taxonomy:revert"
  Cuando envía POST "/api/admin/dictionary/sentidos/50/revertir"
  Entonces el backend responde 403 Forbidden
  Y cuando un usuario "admin" con "settings:manage" envía GET o PUT a "/api/admin/settings/public-only-ratified"
  Entonces el backend responde 200 OK

Escenario: Ratificación y eliminación de medios culturales resuelven request.user.userId
  Dado un usuario autenticado cuyo token JWT inyecta request.user = { userId: 10n, username: "revisor", roles: ["cultural_reviewer"] }
  Cuando envía POST "/api/admin/medios/5/ratificar" con permiso "taxonomy:ratify"
  Entonces el backend ejecuta RatifyMediaUseCase con actorUserId = 10n y responde 200 OK
```

## Fuera de alcance

- Modificación del esquema relacional PostgreSQL o nuevas migraciones Prisma (el modelo de datos actual ya soporta `version`, `estado`, `ultimo_editor_id` y la matriz de permisos).
- Cambios en las vistas públicas del diccionario (`Home`, `CamposIndex`, `CampoPage`, `SubfieldPage`, `MicrofieldPage`).
- Alteración de términos en lengua Namtrik o glosas en español del corpus léxico (Constitución C1.1).

## Trazabilidad

| Requisito | Archivos | Tests |
| --------- | -------- | ----- |
| **R-001** | `apps/web-client/src/pages/admin/RevisionPage.tsx`, `apps/web-client/src/hooks/useAdmin.ts` | `RevisionPage.test.tsx`, `useAdmin.test.tsx` |
| **R-002** | `apps/backend-service/src/shared/errors/AppError.ts`, `apps/backend-service/src/app.ts`, `apps/backend-service/src/application/use-cases/admin/{RatificarSentido,RevertirRatificacion,UpdateSentido,RatificarNodo,RatificarLote}UseCase.ts`, `apps/web-client/src/hooks/useAdmin.ts` | `RatificarSentidoUseCase.test.ts`, `RevisionPage.test.tsx` |
| **R-003** | `apps/web-client/src/pages/admin/RevisionPage.tsx`, `apps/web-client/src/router/index.tsx`, `apps/web-client/src/components/admin/AdminLayout.tsx` | `RevisionPage.test.tsx`, `AdminLayout.test.tsx` |
| **R-004** | `apps/backend-service/src/api/admin/routes/adminGovernanceRoutes.ts`, `apps/backend-service/src/application/use-cases/admin/RatificarLoteUseCase.ts`, `apps/web-client/src/pages/admin/RevisionPage.tsx`, `apps/web-client/src/hooks/useAdmin.ts` | `adminGovernanceRoutes.test.ts`, `RevisionPage.test.tsx` |
| **R-005** | `apps/web-client/src/shared/adminRoutes.ts`, `apps/web-client/src/stores/authStore.ts`, `apps/web-client/src/pages/admin/LoginPage.tsx`, `apps/web-client/src/pages/admin/CambiarPasswordPage.tsx` | `authStore.test.ts`, `LoginPage.test.tsx` |
| **R-006** | `apps/web-client/src/components/admin/AdminLayout.tsx`, `apps/web-client/src/components/admin/RequireAuth.tsx` | `AdminLayout.test.tsx`, `guards.test.tsx` |
| **R-007** | `apps/web-client/src/shared/adminRoutes.ts`, `apps/web-client/src/router/index.tsx`, `apps/web-client/src/components/admin/AdminLayout.tsx`, `apps/web-client/src/stores/authStore.ts` | `permissions.contract.test.ts`, `authStore.test.ts` |
| **R-008** | `apps/backend-service/src/api/admin/routes/{adminSentidoRoutes,adminPapeleraRoutes,adminSettingsRoutes}.ts` | `adminSentidoRoutes.test.ts`, `adminMaintenanceRoutes.test.ts` |
| **R-009** | `apps/backend-service/src/api/admin/routes/adminMediaRoutes.ts`, `apps/web-client/src/hooks/useAdmin.ts` | `adminMediaRoutes.test.ts`, `useAdmin.test.tsx` |
| **R-010** | `apps/backend-service/src/presentation/middleware/authorizationMiddleware.ts`, `apps/backend-service/src/infrastructure/repositories/UserRepository.ts`, `apps/web-client/src/stores/authStore.ts` | `adminSentidoRoutes.test.ts`, `authStore.test.ts` |
