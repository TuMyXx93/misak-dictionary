---
id: 002-auth-rbac-tasks
version: 1.0.0
status: done
---

# 002 — Tareas

| ID    | Tarea                                                                                                   | Requisito     | Estado  |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------- | ------- |
| T-001 | Migración 0003: `audit_log` + columnas sesión (family_id, revoked_at, token_hash) + pgcrypto + backfill | R-006/007     | done |
| T-002 | Schema Prisma: modelo `AuditLog` y campos de `Session`; regenerar client                                | R-006/007     | done |
| T-003 | Env: ARGON2__, ROOT_BOOTSTRAP__, AUTH_RATE_LIMIT_*                                                      | R-003/004/008 | done |
| T-004 | PasswordService: Argon2id + verify legacy bcrypt + needsRehash + tests                                  | R-004/005     | done |
| T-005 | SessionRepository: familyId, tokenHash, revocar familia, findByTokenHash                                | R-006         | done |
| T-006 | AuditService + escritura en audit_log                                                                   | R-007/012     | done |
| T-007 | LoginUseCase: rehash transparente + auditoría de intentos + tests                                       | R-005/012     | done |
| T-008 | RefreshTokenUseCase: rotación + detección de reuso + tests                                              | R-006         | done |
| T-009 | LogoutUseCase: invalidar + auditar                                                                      | R-010         | done |
| T-010 | RootBootstrapService + invocación en server.ts                                                          | R-008/009     | done |
| T-011 | Rate limit por-ruta en /auth/login y /auth/refresh                                                      | R-003         | done |
| T-012 | ManageUserRolesUseCase + rutas admin de roles + tests                                                   | R-007         | done |
| T-013 | Verificación: migrate deploy en contenedor, suite completa, build                                       | —             | done |
