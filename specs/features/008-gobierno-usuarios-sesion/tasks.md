# Tareas de Implementación — Feature 008

**Feature:** `008-gobierno-usuarios-sesion`  
**Estrategia:** Descomposición atómica trazable ordenada por capas de dependencia

## Tareas

- [x] **T-001: Catálogo canónico de permisos y roles en backend** (R-002)
  - Actualizar `apps/backend-service/src/shared/auth/permissions.ts` con permisos faltantes (`users:manage`, `settings:manage`, `dictionary:delete`, `taxonomy:revert`), inclusión de `media_admin` y asignación de `users:manage` al rol `admin`.
  - Actualizar `prisma/seed.ts` para que siembre los nuevos permisos y relaciones.
  - Ejecutar seed en la base de datos local y verificar consistencia.

- [x] **T-002: Errores tipados de autenticación y mapeo en AuthController** (R-003)
  - Crear `apps/backend-service/src/domain/errors/AuthErrors.ts` con jerarquía de errores (`InvalidCredentialsError`, `AccountLockedError`, `AccountSuspendedError`).
  - Actualizar `LoginUseCase.ts` para lanzar los errores tipados.
  - Actualizar `AuthController.ts` para capturar errores tipados y emitir respuestas estructuradas con código semántico.
  - Mapear errores de inicialización de Prisma en `app.ts` hacia código HTTP 503 (`SERVICE_UNAVAILABLE`).

- [x] **T-003: Contrato de refresh en modo cookie y ajuste de rate limits** (R-001)
  - Modificar `AuthController.refresh` para que en modo cookie devuelva `{ data: { tokens: { accessToken, expiresIn }, user } }` con los datos de usuario resueltos por `GetAuthMeUseCase`.
  - Configurar rate limit diferenciado para `/auth/refresh` en `authRoutes.ts`.

- [x] **T-004: Casos de uso de suspensión y reseteo de clave en backend** (R-004, R-005)
  - Crear `ToggleUserStatusUseCase.ts` con revocación de sesiones, protección de auto-suspensión y registro de motivo en auditoría.
  - Crear `ResetUserPasswordUseCase.ts` para generación de clave temporal con `mustChangePassword: true`, revocación de sesiones y auditoría.
  - Registrar endpoints en `adminUserRoutes.ts` protegidos con `users:manage` y tests unitarios.

- [x] **T-005: Cliente HTTP, restauración de sesión en F5 y enrutamiento inteligente** (R-001, R-007)
  - Actualizar `adminHttp.ts` para enviar `X-Client: web-admin` en refresh y logout, implementar `restoreSession()` y enriquecer `AdminApiError` con `code` y `retryAfterSeconds`.
  - Modificar `RequireAuth.tsx` para usar `restoreSession()` al detectar recarga y añadir ruta `/admin/cambiar-password`.
  - Implementar `firstAllowedRoute()` en `authStore.ts` e integrarlo en `LoginPage.tsx` y `router/index.tsx`.

- [x] **T-006: Alinear permisos en rutas y layout frontend** (R-002)
  - Crear `apps/web-client/src/shared/permissions.ts` con el catálogo canónico idéntico al backend.
  - Reemplazar cadenas `taxonomy:read`, `taxonomy:write`, `system:*` en `router/index.tsx`, `AdminLayout.tsx` y páginas administrativas.
  - Crear test de contrato automatizado `permissions.contract.test.ts`.

- [x] **T-007: Interfaz de Login con mensajes semánticos y cuenta regresiva** (R-003)
  - Actualizar `LoginPage.tsx` para interpretar los códigos de error tipados emitidos por `adminHttp`.
  - Implementar temporizador regresivo visible para `AUTH_ACCOUNT_LOCKED` y `RATE_LIMITED`.

- [x] **T-008: Definición de copys humanizados y catálogo de 6 roles en español** (R-006)
  - Crear `userCopy.ts` con la totalidad de los textos aprobados para el módulo.
  - Crear `roleCatalog.ts` con los 6 roles en español, etiquetas de nivel y esquema de color.

- [x] **T-009: Componentes modulares del formulario de usuario** (R-006)
  - Crear `UserFormFields.tsx` (grilla unificada en 2 columnas, documento visible completo, placeholders con `Ej.`).
  - Crear `PasswordFields.tsx` (visibilidad de contraseña con icono de ojo, botón de copiado).
  - Crear `RoleSelector.tsx` (6 roles completos sin doble barra de scroll).

- [x] **T-010: Diálogo de suspensión de cuenta y panel de clave temporal** (R-004, R-005)
  - Crear `SuspendUserDialog.tsx` con foco accesible y captura de motivo opcional.
  - Crear `ResetPasswordPanel.tsx` con generación de clave temporal, visualización única y copiado seguro.

- [x] **T-011: Refactor de UsuariosPage y actualización de hooks** (R-004, R-005, R-006)
  - Refactorizar `UsuariosPage.tsx` integrando los nuevos componentes y hooks.
  - Actualizar `useAdmin.ts` con las mutaciones de `resetPassword` y `toggleStatus` con motivo.
  - Eliminar etiquetas técnicas en inglés de la tabla principal y sustituirlas por las píldoras en español.

- [x] **T-012: Batería de pruebas y verificación de calidad integral** (R-001 a R-007)
  - Ejecutar suites unitarias y de integración en backend y frontend.
  - Validar cobertura global $\ge 70\%$ en web-client.
  - Ejecutar `tsc -b` y `biome ci .`.
  - Crear checklist replicable para los demás módulos en `specs/steering/module-review-checklist.md`.
