---
id: 013-endurecimiento-rbac-flujo-editorial
version: 1.0.0
status: done
---

# Tareas — 013 Endurecimiento de RBAC, Enrutamiento de Sesión y Máquina de Estados Editorial

| ID    | Tarea                                                                                                                                      | Requisito      | Estado |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------ |
| T-001 | Extender `AppError` con `code?: string` y propagarlo en el error handler global de `app.ts`.                                               | R-002          | done   |
| T-002 | Añadir códigos tipados (`VERSION_CONFLICT`, `SELF_RATIFICATION_FORBIDDEN`, `ALREADY_RATIFIED`, `INVALID_EDITORIAL_STATE`) en casos de uso. | R-002          | done   |
| T-003 | Soportar resolución por código jerárquico (`C1.S1.M2`) además de ID numérico en `adminGovernanceRoutes.ts` y `RatificarLoteUseCase.ts`.    | R-004          | done   |
| T-004 | Alinear permisos en `adminSentidoRoutes.ts` (`dictionary:delete` en DELETE, `taxonomy:revert` en revertir).                                | R-008          | done   |
| T-005 | Alinear permisos en `adminPapeleraRoutes.ts` (`dictionary:delete`) y `adminSettingsRoutes.ts` (`settings:manage`).                         | R-008          | done   |
| T-006 | Corregir resolución de `request.user.userId` y registrar alias de rutas en `adminMediaRoutes.ts`.                                          | R-009          | done   |
| T-007 | Verificar estado activo de cuenta (`isActive`) en `authorizationMiddleware.ts` / `UserRepository.ts`.                                      | R-010          | done   |
| T-008 | Actualizar y ampliar tests de backend (`RatificarSentidoUseCase.test.ts`, `adminSentidoRoutes.test.ts`, `adminGovernanceRoutes.test.ts`, `adminMaintenanceRoutes.test.ts`, `adminMediaRoutes.test.ts`). | R-002, R-004, R-008, R-009, R-010 | done   |
| T-009 | Crear `apps/web-client/src/shared/adminRoutes.ts` con `ADMIN_ROUTE_POLICIES`, `canAccessAdminPath` y `resolveFirstAllowedRoute`.           | R-005, R-007   | done   |
| T-010 | Integrar `adminRoutes.ts` en `authStore.ts`, `router/index.tsx` y `AdminLayout.tsx`, y corregir `handleLogout` sin carrera de `from`.      | R-003, R-006, R-007, R-010 | done   |
| T-011 | Validar `fromPath` con `canAccessAdminPath` en `LoginPage.tsx` y `CambiarPasswordPage.tsx`.                                                | R-005          | done   |
| T-012 | Exigir `version: number` en `useRatificarSentido` / `useRevertirSentido`, invalidar caché en `409` y alinear rutas de medios en `useAdmin.ts`. | R-001, R-002, R-004, R-009 | done   |
| T-013 | Actualizar `RevisionPage.tsx` para enviar `version` real, filtrar acciones por estado (`borrador` vs `ratificado`) y enviar `snapshot` de lote. | R-001, R-003, R-004 | done   |
| T-014 | Actualizar y ampliar tests de frontend (`RevisionPage.test.tsx`, `useAdmin.test.tsx`, `LoginPage.test.tsx`, `authStore.test.ts`, `permissions.contract.test.ts`). | R-001..R-009   | done   |
| T-015 | Añadir notas de errata en `Spec 006` y `Spec 008`, sincronizar documentación canónica (`/docs-gate`) y verificar `pnpm run ci` + builds + tests. | R-001..R-010   | done   |
