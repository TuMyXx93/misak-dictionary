---
id: 002-auth-rbac-plan
version: 1.0.0
status: archived
---

# 002 — Plan técnico: Auth RBAC

## Diseño

**Estrategia**: evolucionar el módulo de auth existente (LoginUseCase, TokenService,
SessionRepository, PasswordService) para cumplir la spec 002 sin reescribirlo. El stack
Docker de la spec de infra ya provee la BD pgvector y las migraciones formales.

**Hash de contraseñas (R-004/005/011)**: `@node-rs/argon2` (binarios preconstruidos
napi-rs — compatible con `--ignore-scripts` del Dockerfile y la imagen slim, a
diferencia del paquete `argon2` con node-gyp). Argon2id con parámetros por entorno
(defaults OWASP: 64MiB, t=3, p=4). `PasswordService.compare` detecta hash legacy
bcrypt (`$2a$`/`$2b$`), verifica con bcryptjs y señaliza `needsRehash` para migración
transparente en el próximo login exitoso.

**Sesiones y refresh (R-006/010)**: la tabla `sessions` gana `family_id` (UUID),
`revoked_at` y `token_hash` (SHA-256 vía pgcrypto, backfill de tokens existentes).
Rotación: el refresh presentado se marca `revoked_at` y se emite uno nuevo en la misma
familia. **Detección de reuso**: si el token presentado no está activo pero existe como
revocado → se revoca toda la familia (invalidación masiva) y se audita el evento.

**Auditoría (R-007/010/012)**: nueva tabla `audit_log` (actor, acción, entidad,
old/new JSONB, IP, user-agent). Servicio `AuditService` fire-and-forget con await en
use cases críticos (login/permisos). Nunca persiste contraseñas ni tokens.

**Rate limiting de auth (R-003)**: configuración por-ruta en `/auth/login` y
`/auth/refresh` (max 5 / 15 min por defecto) con `keyGenerator` IP+username, más
estricta que el límite global existente.

**RBAC y root (R-007/008/009)**: roles existentes (`super_admin`, `admin`, `editor`).
Bootstrap al arranque: si `ROOT_BOOTSTRAP_EMAIL/PASSWORD` definidos y no existe ningún
`super_admin`, se crea el usuario root con hash Argon2id. Los endpoints de gestión de
permisos (`/api/admin/users/:id/roles`) requieren `super_admin`: sin root creado,
ningún token puede portar el rol → endpoints efectivamente cerrados (equivalente al 503
de la spec; se documenta la desviación).

**Control de acceso (R-001/002)**: `authMiddleware` + `requireRoles` ya devuelven
401/403 sin revelar existencia del recurso; se mantiene y se cubre con tests.

## Cambios por archivo

| Archivo                                                 | Cambio                                                                    | Requisito     |
| ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------- |
| `prisma/migrations/0003_auth_hardening/migration.sql`   | `audit_log`, columnas de sesión, pgcrypto, backfill                       | R-006/007/012 |
| `prisma/schema.prisma`                                  | Modelo `AuditLog`; campos `Session` (familyId, revokedAt, tokenHash)      | ídem          |
| `shared/config/env.ts`                                  | ARGON2__, ROOT_BOOTSTRAP__, AUTH_RATE_LIMIT_*                             | R-003/004/008 |
| `infrastructure/auth/PasswordService.ts`                | Argon2id + verify legacy bcrypt + `needsRehash`                           | R-004/005     |
| `infrastructure/auth/PasswordService.test.ts`           | Formato/params argon2, verify legacy, needsRehash                         | R-004/005     |
| `infrastructure/repositories/SessionRepository.ts`      | familyId, tokenHash lookup, revocar familia, findByTokenHash, findRevoked | R-006         |
| `shared/audit/AuditService.ts`                          | Escritura en `audit_log`                                                  | R-007/010/012 |
| `application/use-cases/auth/LoginUseCase.ts`            | Rehash transparente + auditoría de intentos                               | R-005/012     |
| `application/use-cases/auth/RefreshTokenUseCase.ts`     | Rotación + detección de reuso                                             | R-006         |
| `application/use-cases/auth/LogoutUseCase.ts`           | Invalidar sesión + auditoría                                              | R-010         |
| `application/use-cases/auth/RootBootstrapService.ts`    | Creación de root al arranque                                              | R-008/009     |
| `application/use-cases/admin/ManageUserRolesUseCase.ts` | Asignar/revocar roles con auditoría                                       | R-007         |
| `presentation/routes/authRoutes.ts`                     | Rate limit por-ruta en login/refresh                                      | R-003         |
| `presentation/routes/adminUserRoutes.ts`                | CRUD de roles de usuario (super_admin)                                    | R-007         |
| `app.ts` /rutas                                         | Registro de rutas admin de usuarios                                       | R-007         |
| `server.ts`                                             | Invocación del bootstrap de root                                          | R-008         |

## Contratos de UI/API

- `POST /auth/login` `{ username, password }` → `{ user, tokens }` · 401 genérico · 429 tras 5 intentos/15min
- `POST /auth/refresh` `{ refreshToken }` → `{ tokens }` · reuso → familia revocada
- `POST /auth/logout` `{ refreshToken }` → 204
- `POST /api/admin/users/:id/roles` `{ role }` (super_admin) → 200 + audit_log
- `DELETE /api/admin/users/:id/roles/:role` (super_admin) → 200 + audit_log

## Decisiones tomadas

- **`@node-rs/argon2` sobre `argon2`**: evita compilación nativa en la imagen slim con
  `--ignore-scripts` (lección del Dockerfile Prisma 7).
- **SHA-256 para token_hash** (pgcrypto): los refresh tokens son JWT de alta entropía;
  el hash protege ante filtración de BD sin necesidad de parámetros de costo.
- **Backfill en migración**: sesiones existentes se hashean in-situ (los clientes deben
  re-loguear; acceptable en esta fase sin datos de producción).
- **Requisito R-009**: se implementa como "endpoints inaccesibles sin rol" (403) en
  lugar de 503 — equivalente funcional, menos código de estado especial.

## Riesgos y mitigación

| Riesgo                                                  | Mitigación                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Migración 0003 sobre BD con sesiones activas            | Backfill idempotente; sesiones previas quedan ahí hasta expiry natural |
| Configuración argon2 demasiado agresiva en CI (memoria) | Defaults por entorno; CI usa valores moderados                         |
| Bootstrap duplica root en deploys                       | Condición "no existe super_admin" + ejecución idempotente              |
| Rate limit por-ruta rompe tests de auth existentes      | Límites configurables por entorno (1000 en test)                       |
