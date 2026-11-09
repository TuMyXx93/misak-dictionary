# Backend Service — Diccionario Misak

**Última Actualización**: 2026-11-08  
**Versión**: `0.5.0-alpha.0`  
**Paquete**: `@misak/backend-service`

Servicio API HTTP del **Diccionario Misak** (`Wamtɵrmarɵpik`), implementado sobre **Fastify 5**, **Prisma 7** y **PostgreSQL 18** bajo principios estrictos de **Clean Architecture** y **ESM** en TypeScript 5.9.

---

## Stack Tecnológico

| Categoría | Tecnología | Detalle |
| --- | --- | --- |
| **Runtime & Lenguaje** | Node.js `>= 24.15.0` LTS · TypeScript `5.9` | ESM nativo (`"type": "module"`), `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| **Servidor HTTP** | Fastify `5.8` | `@fastify/sensible`, `@fastify/helmet` (CSP), `@fastify/cors`, `@fastify/cookie`, `@fastify/multipart` (100 MB), `@fastify/rate-limit` |
| **ORM & Base de Datos** | Prisma `7.4` + `@prisma/adapter-pg` · PostgreSQL `18.1` | Driver `pg 8.20`; cliente generado en `src/generated/prisma/`. Extensiones: `citext`, `pg_trgm`, `unaccent`, `btree_gin`, `btree_gist`, `uuid-ossp`, `pgvector`, `pg_stat_statements` |
| **Seguridad & Auth** | `@node-rs/argon2` · `jsonwebtoken` · `bcryptjs` | Hashing primario **Argon2id** (parámetros OWASP); `bcryptjs` reservado exclusivamente para verificación y rehash transparente de hashes heredados en login; access token JWT HS256 (15 min) + refresh token opaco en cookie `HttpOnly` (7 días) con rotación *single-flight* |
| **Validación & Config** | Zod `4.3` · `yaml` `2.9` | Validación tipada de variables de entorno al arranque (`src/shared/config/env.ts`), DTOs HTTP y manifiestos de taxonomía/léxico |
| **Testing** | Vitest `4.0` · `@testcontainers/postgresql` | `440` pruebas unitarias aisladas en `61` suites con cobertura V8 y suite de integración contra contenedores PostgreSQL reales |

---

## Arquitectura (Clean Architecture)

Las dependencias fluyen exclusivamente hacia adentro (`presentation` / `api` → `application` → `domain` ← `infrastructure`):

```text
apps/backend-service/
├── prisma/
│   ├── schema.prisma           # Esquema relacional PostgreSQL 18
│   ├── migrations/             # Historial inmutable de migraciones (0001..0015)
│   └── seed.ts                 # Semilla idempotente de roles, permisos, super_admin opcional y PUBLIC_ONLY_RATIFIED
├── scripts/
│   ├── taxonomy-import.ts      # Importador declarativo de taxonomía v1 (65 nodos + 7 HomeSlots)
│   ├── lexicon-extract.ts      # Extractor determinista del corpus fuente
│   ├── lexicon-import.ts       # Ingesta idempotente de sentidos (1.351) y formas Namtrik (1.451)
│   └── equivalencias-sync.ts   # Sincronizador determinista de matriz bilingüe (1.633 equivalencias) y abreviaturas (41)
└── src/
    ├── domain/                 # Entidades de negocio e interfaces de puerto (I*Repository, I*Service)
    ├── application/            # Casos de uso puros y DTOs/esquemas Zod de aplicación
    ├── infrastructure/         # Adaptadores Prisma, Argon2id/JWT, almacenamiento local de medios y MagicByteValidator
    ├── presentation/           # Controladores base, middlewares de autenticación/RBAC y rutas /auth y /api/media
    ├── api/                    # Grupos de rutas modulares (/api/dictionary y /api/admin/*)
    ├── shared/                 # Configuración env (Zod), errores operacionales (AppError), RBAC, auditoría
    ├── generated/prisma/       # Cliente Prisma generado (excluido de Git y Biome)
    ├── app.ts                  # Factoría Fastify (plugins, CSP, rate-limit, hooks Cache-Control, error handler)
    └── server.ts               # Arranque HTTP, bootstrap root opcional y apagado graceful
```

---

## Modelo de Datos

### Entidades Canónicas Activas

- **Identidad, Sesiones y Gobernanza**: `User` (con bloqueo temporal tras intentos fallidos y cambio obligatorio de clave temporal), `Role`, `Permission`, `UserRole`, `RolePermission`, `Session` (refresh tokens rotativos con revocación en cascada), `AuditLog` (bitácora inmutable de acciones editoriales y administrativas), `SystemSetting` (ej. `PUBLIC_ONLY_RATIFIED`).
- **Taxonomía Semántica (`v1`)**: `CampoSemantico` (4 campos raíz: *Ya*, *Ya tul*, *Tra tul*, *Kau ushamera*), `SubcampoSemantico` (18 subcampos), `Microcampo` (43 microcampos con jerarquía recursiva `padreId` y `profundidad`), `HomeSlot` (7 slots de portada: 4 vinculados a `C1..C4` y 3 proyectados).
- **Léxico Canónico (`Sentido + Formas` + Equivalencias + Abreviaturas)**: `SentidoLexico` (acepción semántica con glosa castellana, categoría gramatical, `nombreCientifico`, diálogo/ejemplo contextual, vector `embedding`, estado editorial `borrador` | `ratificado` y borrado lógico `deletedAt`), `FormaNamtrik` (variantes ortográficas/fonéticas asociadas al sentido con `orden`), `SentidoUbicacion` (asignación multinivel a campo, subcampo o microcampo), `EquivalenciaBilingue` (`1.633` relaciones léxicas indexadas en migración `0014`) y `AbreviaturaGramatical` (`41` abreviaturas lingüísticas oficiales en migración `0015`).
- **Medios Culturales**: `MedioCultural` (audios de pronunciación de lema/ejemplo/diálogo e ilustraciones etnográficas almacenados en subdirectorios locales opacos UUIDv4 bajo `uploads/media/`, validados por firma binaria real y servidos con soporte `HTTP 206 Partial Content`).

> **Nota sobre tablas heredadas (Estrategia Opción B — ADR-0007):** El archivo `prisma/schema.prisma` conserva temporalmente las definiciones inactivas `PalabraModelo1`, `PalabraModelo2`, `PalabraM1Microcampo`, `PalabraM2Microcampo` y `PasswordReset` (`0` filas activas) para preservar la reproducibilidad íntegra de las migraciones históricas `0001`–`0015` antes del retiro físico programado mediante migración dedicada. Toda operación de lectura/escritura nueva debe operar sobre `SentidoLexico` + `FormaNamtrik`.

---

## Autenticación y Autorización (RBAC)

- **Tokens**: `POST /auth/login` emite un `accessToken` JWT de corta duración (`15m`, mantenido únicamente en memoria en el cliente) y establece una cookie `HttpOnly`, `SameSite=Lax` (`Secure` en producción) con el `refreshToken` opaco (`7d`).
- **Protección de Fuerza Bruta**: Límite estricto por clave compuesta `IP + identificador` en `/auth/login` (`5` intentos / `15m` en producción) más bloqueo automático de cuenta (`lockedUntil`).
- **Cabeceras de Seguridad**: Todas las respuestas bajo `/auth/*` y `/api/admin/*` fuerzan `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.
- **6 Roles del Sistema** (`src/shared/auth/permissions.ts`):
  - `super_admin`: Control total de la plataforma, configuración técnica, gestión de `super_admin` y purga definitiva de papelera.
  - `admin`: Creación de cuentas, asignación de roles no-root, revisión de auditoría y gestión editorial (`dictionary:read/write/delete`, `users:manage`, `audit:read`, `settings:manage`, `media:read`).
  - `cultural_reviewer`: Validación, ratificación y reversión cultural individual o por lote (`taxonomy:ratify`, `taxonomy:revert`, `dictionary:read`, `media:read`).
  - `content_admin`: Registro y edición de sentidos léxicos, formas Namtrik y medios culturales (`dictionary:read/write`, `media:read/write`).
  - `media_admin`: Carga, catalogación, edición de metadatos y borrado de recursos multimedia (`media:read/write/delete`).
  - `analytics_viewer`: Consulta en solo lectura de métricas de progreso, diccionario, medios y bitácora de auditoría (`audit:read`, `dictionary:read`, `media:read`).

---

## Superficie HTTP (Endpoints)

### Sistema y Salud

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/` | Público | Metadatos del servicio, versión (`0.5.0-alpha.0`) e índice de prefijos |
| `GET` | `/health` | Público | Estado de salud, `uptime` y entorno activo |

### Autenticación (`/auth`)

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Público (rate-limited) | Autenticación por `username` o `email`, emisión de access token y cookie refresh |
| `POST` | `/auth/refresh` | Cookie `HttpOnly` | Renovación y rotación atómica de sesión |
| `POST` | `/auth/logout` | Cookie / Sesión | Revocación inmediata de sesión y limpieza de cookie |
| `GET` | `/auth/me` | Autenticado | Perfil del usuario actual con roles y permisos efectivos |
| `POST` | `/auth/change-password` | Autenticado | Cambio obligatorio o voluntario de contraseña |

### Diccionario Público (`/api/dictionary`) y Medios (`/api/media`)

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/dictionary/home-slots` | Público | 7 slots semánticos de portada (`4` activos vinculados a `C1..C4` + `3` proyectados) |
| `GET` | `/api/dictionary/semantic-fields` | Público | Árbol completo de campos semánticos, subcampos y microcampos |
| `GET` | `/api/dictionary/semantic-fields/slug/:slug` | Público | Detalle jerárquico y sentidos publicados de un campo por `slug` |
| `GET` | `/api/dictionary/semantic-fields/:id` | Público | Detalle jerárquico de un campo semántico por `id` |
| `GET` | `/api/dictionary/words/search` | Público | Buscador híbrido multinivel (`>= 1` car) sobre taxonomía (`nivel 1..4`) y léxico (`nivel 5`) con RRF |
| `GET` | `/api/dictionary/abbreviations` | Público | Catálogo dinámico de abreviaturas gramaticales activas |
| `GET` | `/api/dictionary/words/modelo1/:id` | Público (legado Opción B) | Lectura residual de compatibilidad previa a `Spec 012` |
| `GET` | `/api/dictionary/words/modelo2/:id` | Público (legado Opción B) | Lectura residual de compatibilidad previa a `Spec 012` |
| `GET` | `/api/media/:uuid/meta` | Público | Metadatos públicos de un recurso multimedia validado |
| `GET` | `/api/media/:uuid/stream` | Público | Streaming binario eficiente con soporte de rangos (`HTTP 206 Partial Content`) |

### Administración y Gobierno Editorial (`/api/admin/*`)

| Prefijo | Operaciones principales | Permiso / Guard requerido |
| --- | --- | --- |
| `/api/admin/dictionary/sentidos` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (papelera), `POST /:id/ratificar`, `POST /:id/revertir` | `dictionary:read`, `dictionary:write`, `taxonomy:ratify` |
| `/api/admin/abbreviations` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` (bloqueo `409` si está en uso en sentidos activos) | `dictionary:read`, `dictionary:write` |
| `/api/admin/taxonomy` | CRUD de campos, subcampos, microcampos y subniveles con bloqueo `409 Conflict` ante dependencias activas | `dictionary:read`, `dictionary:write`, `dictionary:delete` |
| `/api/admin/governance` | `GET /progreso`, `POST /nodos/:nivel/:id/ratificar`, `POST /nodos/:nivel/:id/ratificar-lote`, `POST /ratificar-lote/:nivel/:id` | `dictionary:read`, `taxonomy:ratify` |
| `/api/admin/papelera` | `GET /`, `POST /:id/restaurar`, `POST /:nivel/:id/restaurar`, `DELETE /:nivel/:id` (purga definitiva con código) | `dictionary:write` (`super_admin` requerido en `DELETE /:nivel/:id`) |
| `/api/admin/medios` | `POST /upload` (multipart + validación magic bytes), `GET /`, `GET /:id`, `PATCH /:id/metadatos`, `POST /:id/ratificar`, `DELETE /:id` | `media:read`, `media:write`, `media:delete`, `taxonomy:ratify` |
| `/api/admin/users` | `GET /`, `GET /suggest-username`, `POST /`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `POST /:id/reset-password`, `POST /:id/unlock`, `POST/PATCH/DELETE /:id/roles` | `users:manage` (`super_admin` para asignar/revocar `super_admin`) |
| `/api/admin/audit` | `GET /` (filtros por entidad, acción, actor y paginación por cursor) | `audit:read` |
| `/api/admin/settings` | `GET /public-only-ratified`, `PUT/PATCH /public-only-ratified` | `super_admin` (`requireSuperAdmin`) |

---

## Configuración y Desarrollo Local

### 1. Variables de Entorno

Copia la plantilla oficial y ajusta las credenciales según tu entorno local (puerto `5432` nativo o `5434` con el contenedor PostgreSQL de `docker/compose.yml`):

```bash
cp apps/backend-service/.env.example apps/backend-service/.env
```

Variables principales validadas en `src/shared/config/env.ts`:

- `NODE_ENV` (`development` | `production` | `test`), `PORT` (`3000`), `HOST` (`0.0.0.0`)
- `DATABASE_URL` (cadena de conexión PostgreSQL 18)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (mínimo 32 caracteres), `JWT_EXPIRES_IN` (`15m`), `JWT_REFRESH_EXPIRES_IN` (`7d`)
- `ARGON2_MEMORY_KIB` (`65536`), `ARGON2_TIME_COST` (`3`), `ARGON2_PARALLELISM` (`4`)
- `CORS_ORIGIN`, `RATE_LIMIT_MAX`, `RATE_LIMIT_TIMEWINDOW`, `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW`
- `ROOT_BOOTSTRAP_EMAIL`, `ROOT_BOOTSTRAP_PASSWORD` (opcionales; crean el `super_admin` inicial al arranque si la tabla `users` está vacía)
- `SEED_ADMIN_PASSWORD` (opcional para `prisma/seed.ts`, mínimo `15` caracteres)

### 2. Comandos Principales

Ejecutar desde la raíz del monorepo o filtrando el paquete `@misak/backend-service`:

```bash
# Generar cliente Prisma en src/generated/prisma
pnpm --filter @misak/backend-service prisma:generate

# Aplicar migraciones y semilla base (roles, permisos, ajustes)
pnpm --filter @misak/backend-service prisma:migrate
pnpm --filter @misak/backend-service db:seed

# Pipelines idempotentes de corpus oficial (data/taxonomy/v1 y data/lexicon/v1)
pnpm --filter @misak/backend-service taxonomy:import
pnpm --filter @misak/backend-service lexicon:extract
pnpm --filter @misak/backend-service lexicon:import

# Servidor de desarrollo con recarga en caliente (tsx watch)
pnpm dev:backend

# Compilación de producción (dist/)
pnpm build:backend
```

---

## Testing y Calidad

```bash
# Suite unitaria completa (Vitest 4)
pnpm --filter @misak/backend-service test -- --run

# Cobertura V8 (umbral >= 80%)
pnpm --filter @misak/backend-service test:coverage

# Suite de integración real con PostgreSQL vía Testcontainers (requiere Docker activo)
pnpm --filter @misak/backend-service test:integration

# Verificación estática (Biome + TypeScript)
pnpm ci
pnpm --filter @misak/backend-service exec tsc --noEmit
```

---

## Ejecución en Docker

El servicio cuenta con un `Dockerfile` multi-stage (`base` → `deps` → `dev` | `build` → `deploy-deps` → `migrate` | `runner`) sobre `node:24.15.0-slim`, ejecutándose como usuario sin privilegios (`nodejs:1001`) y montando el volumen persistente `media_data` para los recursos culturales.

Consulta la sección **Infraestructura Docker y Despliegue** en el [README principal del monorepo](../../README.md) para los comandos completos de desarrollo y producción.
