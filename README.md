# Wamtɵrmarɵpik — Diccionario Misak

[![Tests](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/test.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/test.yml)
[![Code Quality](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/lint.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/lint.yml)
[![Build](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/build.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/Tumi-dev/misak-dictionary/branch/main/graph/badge.svg)](https://codecov.io/gh/Tumi-dev/misak-dictionary)
[![Node](https://img.shields.io/badge/Node.js-24.15.0_LTS-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10.20.0-F69220.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Plataforma digital bilingüe (**Namtrik – Castellano**) del **Diccionario Misak**, concebida para la preservación lingüística, la navegación semántica territorial y el gobierno editorial del patrimonio léxico y audiovisual del pueblo Misak (Resguardo de Guambia, Cauca, Colombia).

---

## Documentación Canónica

- **[Documento Maestro de Arquitectura y Dominio](docs/project.md)** — Visión integral, modelo lingüístico, decisiones arquitectónicas (`ADR-0001`..`ADR-0008`) y seguridad.
- **[Estado Actual del Proyecto](docs/CURRENT-STATE.md)** — Capacidades consolidadas, métricas verificadas y hoja de ruta vigente.
- **[Web Client (`apps/web-client`)](apps/web-client/README.md)** — PWA en React 19, Vite 8 (`Rolldown` + `Oxc`), TailwindCSS 4 (`Lightning CSS`), sistema cromático oficial Misak y tipografía compuesta.
- **[Backend Service (`apps/backend-service`)](apps/backend-service/README.md)** — API HTTP en Fastify 5, Prisma 7, PostgreSQL 18, Clean Architecture y RBAC de 6 roles.
- **[Constitución SDD](specs/constitution.md)** · **[Registro de ADRs](specs/adr/)** · **[Changelog](CHANGELOG.md)**.

---

## Inicio Rápido (Desarrollo Local)

### Requisitos Previos

- **Node.js**: `>= 24.15.0` LTS (fijado en `.node-version`, recomendado gestionar con `fnm`)
- **pnpm**: `>= 10.20.0` (**obligatorio**; `npm` y `yarn` están bloqueados por `preinstall`)
- **PostgreSQL**: `18.1+` con extensión `pgvector` (disponible al instante mediante `docker/compose.yml`)

```bash
# 1. Clonar el repositorio y activar la versión exacta de Node.js
git clone https://github.com/Tumi-dev/misak-dictionary.git
cd misak-dictionary
fnm use

# 2. Instalar dependencias del monorepo
pnpm install

# 3. Configurar variables de entorno del backend
cp apps/backend-service/.env.example apps/backend-service/.env

# 4. Generar cliente Prisma y levantar los servicios de desarrollo
pnpm prisma:generate
pnpm dev:backend   # http://localhost:3000
pnpm dev:web       # http://localhost:5173
```

---

## Estructura del Monorepo

```text
misak-dictionary/
├── apps/
│   ├── web-client/             # Frontend PWA (React 19 + Vite 8 + TailwindCSS 4 + Framer Motion)
│   └── backend-service/        # Backend API (Fastify 5 + Prisma 7 + PostgreSQL 18, Clean Architecture)
├── data/
│   ├── taxonomy/v1/            # Taxonomía declarativa oficial (4 campos, 18 subcampos, 43 microcampos + 7 Home Slots)
│   └── lexicon/v1/             # Corpus curado (1.351 sentidos, 1.451 formas Namtrik, 1.633 equivalencias y 41 abreviaturas)
├── docker/
│   ├── compose.yml             # Stack Docker base + desarrollo con hot-reload
│   ├── compose.prod.yml        # Override de producción endurecido (hardening + proxy Nginx)
│   └── postgres/               # Script idempotente de extensiones PostgreSQL 18
├── docs/                       # Documentación maestra (project.md, CURRENT-STATE.md)
├── scripts/                    # Guardas de runtime, tamaño de bundle y sincronización de agentes
├── specs/                      # Especificaciones SDD (constitution.md, steering/, adr/, features/, archive/)
├── .opencode/                  # Fuente canónica de agentes, skills y comandos (sincronizada a .agents/)
└── AGENTS.md                   # Enrutador operativo de agentes y protocolo de memoria Engram
```

---

## Resumen de Aplicaciones y Corpus

| Dimensión | Implementación Actual |
| --- | --- |
| **Frontend (`web-client`)** | React 19.2 · Vite 8.3 (`Rolldown` + `Oxc`) · TailwindCSS 4.2 (`@tailwindcss/vite` + `Lightning CSS`) · Framer Motion 12 · React Router 7 · TanStack Query 5 · Zustand 5 · PWA Workbox 7 |
| **Backend (`@misak/backend-service`)** | Fastify 5.8 · Prisma 7.4 (`@prisma/adapter-pg`) · PostgreSQL 18.1 · Argon2id (`@node-rs/argon2`) · JWT + Cookie `HttpOnly` · Zod 4 |
| **Identidad Visual Misak** | Paleta oficial de 4 colores (`#e52d6d` magenta, `#0055aa` azul, `#ffffff` blanco, `#000000` negro) + modo Claro/Oscuro WCAG 2.2 AA en administración y armonización tipográfica del grafema `ɵ` (`U+0275`) |
| **Corpus Persistido (`v1`)** | `65` nodos taxonómicos recursivos (`4` campos, `18` subcampos, `43` microcampos), `7` Home Slots (`4` activos), `1.351` sentidos léxicos activos, `1.451` formas en Namtrik, `1.633` equivalencias bilingües y `41` abreviaturas gramaticales |
| **Calidad Automatizada** | `1.046` pruebas unitarias (`605` frontend en `81` suites + `441` backend en `61` suites) + suite de integración PostgreSQL con Testcontainers y BD real |

---

## Infraestructura Docker y Despliegue

El repositorio provee una arquitectura contenedorizada reproducible bajo el proyecto Compose **`misakdict`**, separando limpiamente la experiencia de desarrollo con *hot-reload* (`docker/compose.yml`) del despliegue endurecido de producción (`docker/compose.prod.yml`).

### 1. Topología de Servicios y Volúmenes

| Servicio | Imagen / Target | Puerto Host (Dev) | Puerto Host (Prod) | Propósito |
| --- | --- | --- | --- | --- |
| `postgres` | `pgvector/pgvector:pg18` | `5434 -> 5432` | *Cerrado (red interna)* | PostgreSQL 18 con `pgvector`, `pg_trgm`, `unaccent`, `citext`, `btree_gin`, `btree_gist`, `uuid-ossp` y `pg_stat_statements` |
| `migrate` | `backend-service` (`target: migrate`) | *One-shot* | *One-shot* | Ejecuta `prisma migrate deploy` tras `service_healthy` de `postgres` y finaliza antes de iniciar `api` |
| `api` | `backend-service` (`dev` / `runner`) | `3001 -> 3000` | *Cerrado (red interna)* | API Fastify sobre `node:24.15.0-slim` (usuario no-root `nodejs:1001` en prod) |
| `web` | `web-client` (`dev` / `runner`) | `8080 -> 5173` | `8080 -> 80` | Vite Dev Server en desarrollo; `nginx:1.27-alpine` sirviendo estáticos SPA + proxy reverso en producción |
| `pgadmin` | `dpage/pgadmin4:9` | `127.0.0.1:5051 -> 80` | *Opcional (`--profile tools`)* | Consola administrativa de base de datos ligada exclusivamente a `localhost` |

**Volúmenes persistentes nombrados:**

- `postgres_data`: Almacena el clúster de datos de PostgreSQL 18 (`/var/lib/postgresql/data`).
- `media_data`: Persiste los audios de pronunciación e ilustraciones culturales validados en subdirectorios UUIDv4 (`/app/uploads/media` en producción), garantizando durabilidad incluso con el sistema de archivos raíz en solo lectura.

### 2. Builds Multi-Stage

- **`apps/backend-service/Dockerfile`**: `base` (`node:24.15.0-slim` + `pnpm@10.20.0`) → `deps` (caché BuildKit de tienda pnpm + `prisma:generate`) → `dev` | `build` (`tsc -p tsconfig.build.json`) → `deploy-deps` (`pnpm deploy --prod`) → `migrate` | `runner` (imagen mínima sin `devDependencies` ni código fuente TypeScript).
- **`apps/web-client/Dockerfile`**: `base` (`node:24.15.0-slim` + `pnpm@10.20.0`) → `deps` → `dev` | `build` (`VITE_API_URL=""` por defecto para mismo origen) → `runner` (`nginx:1.27-alpine` sin privilegios).

### 3. Preparación de Variables de Entorno Docker

```bash
cp .env.docker.example .env.docker
# Edita POSTGRES_PASSWORD, JWT_SECRET y JWT_REFRESH_SECRET (mínimo 32 caracteres) en .env.docker
```

### 4. Ejecución por Entorno

```bash
# Entorno de desarrollo completo (PostgreSQL 18 + migraciones automáticas + API watch + Vite HMR)
docker compose --env-file .env.docker -f docker/compose.yml up -d --build

# Opcional: habilitar pgAdmin en http://127.0.0.1:5051
docker compose --env-file .env.docker -f docker/compose.yml --profile tools up -d

# Entorno de producción endurecido (builds multi-stage runner + Nginx reverse proxy)
docker compose --env-file .env.docker \
  -f docker/compose.yml -f docker/compose.prod.yml up -d --build

# Inspección de estado, logs y parada limpia
docker compose --env-file .env.docker -f docker/compose.yml ps
docker compose --env-file .env.docker -f docker/compose.yml logs -f api web
docker compose --env-file .env.docker -f docker/compose.yml down
```

### 5. Endurecimiento de Producción y Proxy Nginx

Al combinar `docker/compose.prod.yml` y `apps/web-client/nginx.conf`:

- **Superficie de red mínima**: `postgres` y `api` anulan la exposición de puertos al host (`ports: !reset []`); todo el tráfico externo ingresa únicamente por `web` (`Nginx`), que encamina `/api/*` y `/auth/*` hacia `http://api:3000` preservando prefijos y cookies `HttpOnly` de mismo origen.
- **Soporte multimedia de alto rendimiento**: `nginx.conf` establece `client_max_body_size 105m` (alineado al límite de `100 MB` de `@fastify/multipart`) y desactiva `proxy_buffering` en `/api/media/` reenviando cabeceras `Range` / `If-Range` para streaming fluido `HTTP 206 Partial Content`.
- **Inmutabilidad y privilegios mínimos**: `api` y `web` corren con `read_only: true`, volúmenes efímeros `tmpfs` para rutas temporales, `cap_drop: ALL`, `security_opt: no-new-privileges:true`, cuotas explícitas de CPU/memoria y `init: true` en `api` para propagación limpia de `SIGTERM`.

---

## Comandos Globales del Monorepo

| Comando | Propósito |
| --- | --- |
| `pnpm dev:web` / `pnpm dev:backend` | Levanta el cliente web (`5173`) o la API backend (`3000`) en modo desarrollo |
| `pnpm build:web` / `pnpm build:backend` | Ejecuta el build tipado de producción de cada aplicación |
| `pnpm ci` | Validación integral de formato y linting con **Biome 2.4** en modo CI |
| `pnpm check:fix` | Aplica correcciones automáticas de formato y linting en todo el repositorio |
| `pnpm test` / `pnpm test:coverage` | Ejecuta pruebas unitarias y reporte de cobertura de `web-client` |
| `pnpm --filter @misak/backend-service test` | Ejecuta la suite unitaria de `backend-service` |
| `pnpm prisma:generate` / `pnpm prisma:studio` | Genera el cliente Prisma o abre Prisma Studio |
| `pnpm agents:sync` / `pnpm agents:check` | Sincroniza o verifica la paridad entre `.opencode/` y `.agents/` |
| `pnpm release:dry` / `pnpm release:alpha` | Simula o ejecuta versionamiento semántico y actualización de `CHANGELOG.md` |

---

## Flujo de Calidad y Gobernanza

- **Spec-Driven Development (SDD)**: Todo cambio funcional o arquitectónico parte de especificaciones verificables en `specs/features/` (requisitos EARS + escenarios Gherkin) respaldadas por `specs/constitution.md` y registros `specs/adr/`.
- **Git Hooks (Husky)**:
  - `pre-commit`: `lint-staged` ejecuta `biome check --write` sobre archivos modificados y `agents:check` ante cambios en `.opencode/`.
  - `commit-msg`: `commitlint` valida Conventional Commits y trazabilidad `Refs: specs/...` en commits `feat`/`fix`.
  - `pre-push`: verifica `pnpm run ci` y `pnpm build:web` antes de publicar ramas.

---

## Licencia

Distribuido bajo licencia **ISC** (ver `package.json`). El contenido lingüístico, simbólico y audiovisual en lengua **Namtrik** pertenece al patrimonio colectivo del **Pueblo Misak (Cabildo Indígena del Resguardo de Guambia)**.
