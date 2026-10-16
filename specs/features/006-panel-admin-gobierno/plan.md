---
id: 006-panel-admin-gobierno-plan
version: 1.0.0
status: draft
spec: 006-panel-admin-gobierno@1.0.1
---

# 006 — Plan técnico: Panel administrativo y gobierno editorial del léxico

## Hallazgos verificados que condicionan el diseño

La revisión del código (`dev` @ `bd80a68`) mostró brechas que la spec asumía resueltas:

| # | Hallazgo | Evidencia | Consecuencia |
| :-- | :-- | :-- | :-- |
| H-1 | El refresh token viaja **en el cuerpo JSON** (login/refresh/logout). No hay cookies ni `@fastify/cookie`. | `AuthController.ts` L86-L147, `package.json` | R-002 exige moverlo a cookie `HttpOnly` → dependencia nueva + cambio de contrato compatible. |
| H-2 | Solo `CampoSemantico` tiene `estado`/`ratificado_por`/`ratificado_at`. `SubcampoSemantico` y `Microcampo` **no tienen `estado`**; `SentidoLexico` tiene `estado` pero **no** `ratificado_*`. | `schema.prisma` L143-L233, L320-L344 | R-011/R-015 requieren migración `0009`. (La spec afirmaba que ya existían; corregido en spec v1.0.1.) |
| H-3 | No existe columna de **último editor**. | `schema.prisma` | R-012 (sin auto-ratificación) es imposible sin `ultimo_editor_id`. |
| H-4 | `requirePermission` acepta un solo permiso y los permisos existentes son solo `dictionary:write` y `taxonomy:ratify`. Un `cultural_reviewer` **no puede leer** borradores hoy (todas las rutas admin exigen `dictionary:write`). | `permissions.ts`, `adminDictionaryRoutes.ts` L47-L48 | Hacen falta `dictionary:read` y `audit:read`, y un guard «cualquiera de». |
| H-5 | El SW solo excluye `/api/` del `navigateFallback`; `/auth/*` no. `globPatterns` precachea **todo** `.js` (incluiría el chunk admin para todo visitante). | `vite.config.ts` L52, L97-L98 | R-023/R-024: ampliar denylist y excluir el chunk admin del precache. |
| H-6 | `AuditService.record` no admite ejecutarse dentro de una transacción Prisma externa (auditoría y mutación podrían divergir). | `PapeleraUseCase.ts` L107 | R-020/R-025: agregar variante transaccional. |
| H-7 | CORS con `credentials: true` ya existe; el origen del front puede diferir del API. | `app.ts` L52-L54 | Una cookie `SameSite=Strict` solo funciona si front y API son **same-site** (ver riesgo RK-1). |

## Diseño

**Estrategia**: Tres entregas independientes y revisables (PR separados) sobre una base común:
(A) fundaciones de backend + gobierno editorial, (B) exposición pública del estado,
(C) panel administrativo en el cliente. Se preserva Clean Architecture (`domain` →
`application` → `infrastructure` → `api/presentation`) y se reutilizan `PapeleraUseCase`,
`ManageUserRolesUseCase`, `AuditService` y `normalizarNamtrik`.

### 1. Datos — migración `0009_gobierno_editorial` (R-010..R-013, R-015, R-017, R-025, R-026)

- **Nodos y sentidos** (`campos_semanticos`, `subcampos_semanticos`, `microcampos`, `sentidos_lexicos`):
  - `ultimo_editor_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL`, `ultimo_editor_at TIMESTAMPTZ NULL`.
  - `ratificado_por_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL`, `ratificado_at TIMESTAMPTZ NULL`.
  - `estado TEXT NOT NULL DEFAULT 'borrador'` en `subcampos_semanticos` y `microcampos` (ya existe en los otros dos).
  - `CHECK (estado IN ('borrador','ratificado'))` y `CHECK ((estado = 'ratificado') = (ratificado_at IS NOT NULL))` — el invariante de R-010 queda **garantizado por PostgreSQL**, no solo por código.
  - Columna legada `campos_semanticos.ratificado_por` (texto) se conserva sin uso; se documenta como obsoleta.
- **Backfill**: filas existentes → `estado='borrador'`, `ultimo_editor_id = NULL` (la importación Spec 005 es del sistema; **editor nulo no bloquea la ratificación**).
- **`system_settings`**: `key TEXT PK`, `value JSONB NOT NULL`, `updated_by_id BIGINT NULL`, `updated_at`. Semilla: `PUBLIC_ONLY_RATIFIED = false`.
- **Índices**: `audit_log (created_at DESC)`, `audit_log (action, created_at DESC)`, `sentidos_lexicos (estado) WHERE deleted_at IS NULL`, y por ubicación para conteos de progreso.
- **Permisos (seed idempotente)**: `dictionary:read` (admin, content_admin, cultural_reviewer, super_admin) y `audit:read` (super_admin, analytics_viewer). `dictionary:write` y `taxonomy:ratify` no cambian → **separación de funciones intacta**.

### 2. Autenticación (R-001..R-005, R-024)

- **Refresh token en cookie** `misak_rt`: `HttpOnly`, `Secure` (producción), `SameSite=Strict`, `Path=/auth`, `Max-Age` = vigencia del refresh. El access token vive **solo en memoria** del cliente (nunca `localStorage`).
- **Modo cookie opt-in** con cabecera `X-Client: web-admin`: en ese modo `login`/`refresh` no devuelven `refreshToken` en el cuerpo, y `refresh`/`logout` lo leen de la cookie. Sin la cabecera, el comportamiento actual (cuerpo JSON) se mantiene → **sin ruptura** de tests ni clientes existentes.
- **Defensa CSRF** en modo cookie: la cabecera `X-Client` obliga a preflight CORS + verificación de `Origin` contra `corsOrigins`; `SameSite=Strict` como segunda capa.
- **`GET /auth/me`** (autenticado): `{ userId, username, roles[], permissions[] }`; permisos resueltos en servidor (`PermissionRepository`), igual que `requirePermission`.
- Cliente: **single-flight refresh** (una sola renovación concurrente), un reintento por petición, y al fallar → cierre local de sesión. Al recargar la página, un refresh silencioso restaura la sesión.

### 3. Gobierno editorial — backend (R-006..R-020, R-025, R-027)

Casos de uso nuevos en `application/use-cases/admin/` (sin lógica en controllers):

| Caso de uso | Reglas clave |
| :-- | :-- |
| `ListSentidosAdminUseCase` | Filtros: nodo (+descendientes por prefijo de `codigo`), `estado`, `tipo`, texto sin diacríticos; paginación por cursor; incluye borradores. |
| `CreateSentidoUseCase` | Genera `codigo` `<nodo>.E<NNN>` bajo bloqueo (`pg_advisory_xact_lock` por nodo) para evitar colisiones; exactamente una ubicación; estado `borrador`; `ultimo_editor_*`. |
| `UpdateSentidoUseCase` | `version` obligatoria; `updateMany WHERE id AND version` → `count=0` ⇒ `409`. Reemplazo ordenado de `formas`. Normaliza `ɵ` solo en campos Namtrik. Si cambia un **campo cultural** y estaba `ratificado` ⇒ `borrador`, limpia `ratificado_*` (R-010). |
| `RatificarSentidoUseCase` / `RevertirRatificacionUseCase` | Exigen `taxonomy:ratify`; solo `borrador→ratificado`; bloquea si `ultimo_editor_id = actor` y el actor no es `super_admin` (`409`); revertir exige motivo ≥ 10 caracteres. |
| `RatificarNodoUseCase` | Igual para nombre/descripción de campo, subcampo o microcampo (R-015). |
| `RatificarLoteUseCase` | **Una transacción**. Entrada: `checklist` (4 casillas obligatorias) + `snapshot: [{id, version}]` de lo revisado. Falla `409` si: hay sentidos del propio actor, **la versión cambió desde la revisión** o aparecieron sentidos nuevos. Todo o nada; 1 auditoría de lote + 1 por sentido. |
| `PurgarPapeleraUseCase` | `super_admin`; `deleted_at ≤ now − RETENCION_PAPELERA_DIAS` (30 por defecto); `confirmCodigo` debe coincidir; sin dependencias (nodos con hijos u ubicaciones ⇒ `409`); audita snapshot completo (sentido + formas + ubicaciones). |
| `ProgresoRatificacionUseCase` | Conteos `ratificados/total` por nodo agregados en memoria desde un `groupBy` (≈65 nodos). |
| `ListUsersUseCase`, `ListAuditUseCase` | Usuarios sin hashes; auditoría con **lista blanca de campos** y paginación por cursor `id DESC`. |
| `SystemSettingsService` | Lee/escribe `PUBLIC_ONLY_RATIFIED`; cache en memoria TTL 30 s con invalidación al escribir; cambio **solo `super_admin`** y auditado. |

`AuditService` gana `recordInTx(tx, …)` (H-6) para que mutación y auditoría sean atómicas.
Guard nuevo `requireAnyPermission(...)`.

### 4. Exposición pública (R-026)

- `ApiSentido` gana `estado`; `CampoSemanticoRepository` y `PalabraRepository` aplican `WHERE estado='ratificado'` solo cuando `PUBLIC_ONLY_RATIFIED` está activo (misma consulta, sin ramas de código distintas por modo).
- `TermRow` muestra la insignia **«En revisión»** (texto + icono, contraste AA, `aria-label`) en sentidos `borrador`.

### 5. Panel administrativo — cliente (R-001..R-005, R-021..R-024)

Estructura aislada en `apps/web-client/src/admin/` (cargada **bajo demanda**):

```
admin/
  auth/        authStore (memoria), adminHttp (401→refresh single-flight), RequireAuth, RequirePermission
  layout/      AdminLayout (noindex, skip-link, nav por permisos)
  pages/       LoginPage, DashboardPage (progreso), SentidosPage, SentidoEditorPage,
               RevisionPage (cola + lote por microcampo), PapeleraPage, UsuariosPage,
               AuditoriaPage, AjustesPage (bandera pública)
  components/  CampoNamtrik (lang="gum", NFC, botones ɵ/Ɵ), ConflictoVersionDialog,
               ChecklistRatificacion, ConfirmarPorCodigo
  hooks/       useAdminSentidos, useRatificar, usePapelera, …  (React Query)
```

- **Rutas** `/admin/*` con `React.lazy` + `manualChunks: admin`; `RequireAuth` redirige a `/admin/login`; `RequirePermission` muestra «Sin permiso» sin disparar peticiones de datos.
- **Formularios**: `react-hook-form` + Zod (ya en el proyecto). Los campos Namtrik **no se transforman** en cliente (sin trim interno ni transliteración); la normalización la aplica el servidor (R-022).
- **Conflicto de versión (`409`)**: diálogo que muestra qué cambió y ofrece recargar; nunca sobrescribe en silencio.
- **PWA**: `globIgnores: ['**/assets/admin-*.js']`; `navigateFallbackDenylist` + `/^\/auth\//`; ninguna regla `runtimeCaching` coincide con `/api/admin` ni `/auth`; `public/robots.txt` con `Disallow: /admin`.
- **Accesibilidad**: tap targets ≥ 48 px, `prefers-reduced-motion`, foco visible y teclado completo (C3.1–C3.4); idioma de interfaz: español.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :-- | :-- | :-- |
| `backend/prisma/migrations/0009_gobierno_editorial/migration.sql` | Columnas de editor/ratificación, `estado` en subcampos/microcampos, CHECKs, `system_settings`, índices | R-010..R-015, R-019, R-025, R-026 |
| `backend/prisma/schema.prisma` + `generated/` | Nuevos campos y modelo `SystemSetting` | R-010..R-015, R-026 |
| `backend/src/shared/auth/permissions.ts` | `dictionary:read`, `audit:read` y matriz de roles | R-006, R-014, R-019 |
| `backend/prisma/seed*.ts` | Sembrar permisos y `system_settings` (idempotente) | R-006, R-019, R-026 |
| `backend/src/presentation/middleware/authorizationMiddleware.ts` | `requireAnyPermission` | R-004, R-006, R-014 |
| `backend/src/shared/audit/AuditService.ts` | `recordInTx` | R-020, R-025 |
| `backend/src/presentation/controllers/AuthController.ts`, `authRoutes.ts` | Modo cookie, `GET /auth/me`, verificación de `Origin` | R-001..R-003, R-005 |
| `backend/package.json`, `app.ts` | Registrar `@fastify/cookie` | R-002, R-024 |
| `backend/src/application/use-cases/admin/*` (9 casos de uso nuevos + tests) | Ver tabla de la sección 3 | R-006..R-020, R-025, R-027 |
| `backend/src/api/admin/routes/adminSentidoRoutes.ts` (nuevo) | CRUD de sentidos y ratificación | R-006..R-013 |
| `backend/src/api/admin/routes/adminGovernanceRoutes.ts` (nuevo) | Ratificar nodo/lote, progreso, revertir | R-014, R-015, R-025, R-027 |
| `backend/src/api/admin/routes/adminDictionaryRoutes.ts` | `DELETE /papelera/:nivel/:id` (purga) | R-017 |
| `backend/src/api/admin/routes/adminUserRoutes.ts` | `GET /api/admin/users` | R-018 |
| `backend/src/api/admin/routes/adminAuditRoutes.ts`, `adminSettingsRoutes.ts` (nuevos) | Consulta de auditoría; bandera pública | R-019, R-026 |
| `backend/src/infrastructure/repositories/{CampoSemantico,Palabra}Repository.ts` | Filtro por `estado` según bandera; exponer `estado` | R-026 |
| `backend/src/application/use-cases/auth/RootBootstrapService.ts` + docs | Cambio de contraseña forzado en primer acceso (`mustChangePassword`) y runbook | R-028 |
| `web-client/src/admin/**` (nuevo) | Panel completo (sección 5) | R-001..R-005, R-014, R-016..R-019, R-021..R-023, R-027 |
| `web-client/src/router/index.tsx` | Rutas `/admin/*` lazy | R-001, R-004, R-023 |
| `web-client/src/services/dictionaryApi.ts`, `types/semanticField.ts` | `estado` en sentido/término | R-026 |
| `web-client/src/components/features/semantic-fields/TermRow.tsx` | Insignia «En revisión» | R-026 |
| `web-client/vite.config.ts`, `public/robots.txt` | `manualChunks`, `globIgnores`, denylist, robots | R-023, R-024 |
| `scripts/check-bundle-size.mjs` + `.github/workflows/build.yml` | Falla el CI si el chunk principal crece > 5 % | R-023 |
| `specs/adr/0004-sesion-admin-y-gobierno-editorial.md` | ADR nuevo | R-002, R-010, R-012, R-025 |

## Contratos de UI/API

Todas las rutas admin exigen `Authorization: Bearer` y devuelven el error estándar `{ statusCode, error, message }`.

| Método y ruta | Permiso | Cuerpo / parámetros (Zod) | Respuestas |
| :-- | :-- | :-- | :-- |
| `GET /auth/me` | sesión | — | `200 { userId, username, roles[], permissions[] }` |
| `GET /api/admin/dictionary/sentidos` | `dictionary:read` | `?nodo&estado&tipo&q&cursor&limit≤100` | `200 { items[], nextCursor }` |
| `POST /api/admin/dictionary/sentidos` | `dictionary:write` | `{ ubicacion:{nivel,id}, tipo, formas[1..N], espanolGlosa, … }` | `201`, `409` código |
| `PATCH /api/admin/dictionary/sentidos/:id` | `dictionary:write` | `{ version, …campos, formas? }` | `200 { version }`, `409` versión obsoleta |
| `DELETE /api/admin/dictionary/sentidos/:id` | `dictionary:write` | — | `204` |
| `POST …/sentidos/:id/ratificar` | `taxonomy:ratify` | `{ version }` | `200`, `403`, `409` (auto-ratificación / estado) |
| `POST …/sentidos/:id/revertir` | `taxonomy:ratify` | `{ version, motivo (≥10) }` | `200`, `400` |
| `POST …/nodos/:nivel/:id/ratificar` | `taxonomy:ratify` | `{ version }` | `200`, `409` |
| `POST …/nodos/:nivel/:id/ratificar-lote` | `taxonomy:ratify` | `{ checklist:{ortografia,categorias,glosas,cientificos:true}, snapshot:[{id,version}] }` | `200 { ratificados }`, `400` checklist, `409 { conflictos:[{codigo,motivo}] }` |
| `GET …/progreso` | `dictionary:read` | — | `200 [{ codigo, ratificados, total }]` |
| `DELETE …/papelera/:nivel/:id` | `super_admin` | `{ confirmCodigo }` | `204`, `403`, `409` retención/dependencias |
| `GET /api/admin/users` | `super_admin` | `?cursor` | `200 { items:[{id,username,email,isActive,roles[]}] }` |
| `GET /api/admin/audit` | `audit:read` | `?actor&entity&action&desde&hasta&cursor` | `200 { items[], nextCursor }` |
| `GET/PUT /api/admin/settings/public-only-ratified` | `super_admin` | `{ value:boolean }` | `200`, `403` |

Sin `dictionary:read`/permiso correspondiente: `403` (R-004). Cabeceras de respuesta autenticadas: `Cache-Control: no-store`.

## Decisiones tomadas

- **ADR nuevo `0004-sesion-admin-y-gobierno-editorial`** (a crear en la primera tarea): refresh token en cookie `HttpOnly` con modo opt-in; ratificación con auditoría transaccional, bloqueo de auto-ratificación y lote atómico con `snapshot`; bandera pública en base de datos.
- Referencia ADR-0003 (modelo Sentido + Formas) y Spec 002 (RBAC y auditoría).
- **Edición cultural** (dispara R-010): lema de formas, `espanolGlosa`, `espanolExplicacion`, `namtrikContexto`, `nombreCientifico` y los cuatro campos `respuesta*`. NO la disparan: `observacionEditorial`, orden de formas ni reubicación.
- **Alcance del lote**: sentidos ubicados **directamente** en el nodo indicado; los subniveles son nodos propios con su propio lote.
- **Bandera en BD y no en variable de entorno**: cambiarla no exige redespliegue y queda auditada.

## Estrategia de pruebas (Constitución C2.3)

Cada escenario Gherkin de la spec tiene al menos un test: casos de uso con repositorios simulados (Vitest), rutas con `app.inject` y verificación de `403/409`, y un test de integración contra PostgreSQL (`RUN_INTEGRATION=1`) para CHECKs, concurrencia de `version`, atomicidad del lote y purga. En el cliente: React Testing Library para guardas de ruta, conflicto de versión y formularios Namtrik (preservación de `ɵ`). Un test automatizado recorre el SW generado para confirmar que no cachea `/api/admin` ni `/auth`.

## Entrega propuesta (3 PR)

1. **PR A — Fundaciones y gobierno (backend)**: ADR-0004, migración `0009`, permisos, cookie + `/auth/me`, casos de uso y rutas de la sección 3.
2. **PR B — Exposición pública**: `estado` en API, filtro por bandera, insignia «En revisión».
3. **PR C — Panel administrativo (cliente)**: `admin/**`, rutas lazy, PWA, robots, chequeo de bundle.

## Riesgos y mitigación

| ID | Riesgo | Mitigación |
| :-- | :-- | :-- |
| RK-1 | Front y API en sitios distintos rompen la cookie `SameSite=Strict` | Desplegar bajo el mismo sitio (proxy inverso con `/api` y `/auth`); si no es posible, `SameSite=None; Secure` **más** verificación estricta de `Origin` y cabecera `X-Client`. Se decide en el ADR antes de implementar. |
| RK-2 | Ratificar contenido distinto al revisado (edición concurrente) | `snapshot` con versiones; cualquier divergencia ⇒ `409` y nada se ratifica. |
| RK-3 | Auditoría y mutación divergen ante un fallo | `recordInTx`: ambas en la misma transacción. |
| RK-4 | Corpus importado sin editor (`NULL`) permitiría auto-ratificación del importador | El importador es del sistema, no una persona; `NULL` se trata como «sin conflicto», documentado y probado. |
| RK-5 | Colisión de `codigo` al crear sentidos en paralelo | `pg_advisory_xact_lock` por nodo + índice único parcial ya existente (`409` si aun así ocurre). |
| RK-6 | El chunk admin se precachea en todos los visitantes o infla el bundle público | `globIgnores`, `manualChunks` y chequeo en CI (< 5 %). |
| RK-7 | La bandera pública queda desactualizada entre instancias | TTL 30 s y documentación; aceptable para una publicación editorial. |
| RK-8 | Contraseña del root débil o única persona con acceso | Cambio forzado en primer acceso, segundo `super_admin` nominal y runbook (R-028). |
| RK-9 | `@fastify/cookie` es dependencia nueva | Pasar `/version-gate`, versión fijada y revisión de seguridad antes de instalar. |
| RK-10 | La migración `0009` sobre 1.351 sentidos | Es solo aditiva (columnas nulas + `estado` con default); se prueba en dry-run sobre copia y se verifica el conteo antes/después. |
