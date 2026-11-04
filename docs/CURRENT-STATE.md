# Estado Actual del Proyecto — Diccionario Misak

**Última Actualización**: 2026-10-31  
**Versión**: `v0.5.0-alpha.0`  
**Rama Base de Integración**: `dev`  
**Estado Operativo**: Plataforma funcional de extremo a extremo (Exploración Pública + Buscador Vectorizado + Panel Editorial RBAC + Medios Escalonados + Infraestructura Docker Endurecida)

---

## Resumen Ejecutivo

**Wamtɵrmarɵpik — Diccionario Misak** es la plataforma digital bilingüe (`Namtrik – Castellano`) del pueblo Misak. El sistema integra una aplicación web progresiva (**PWA**) de alto rendimiento visual y cultural con un servicio **API Clean Architecture** sobre **Fastify 5**, **Prisma 7** y **PostgreSQL 18**.

### Hitos Consolidados (`Spec 001` – `Spec 011`)

1. **Gobernanza SDD y Ecosistema Multi-Agente (`Spec 001`, `ADR-0001`, `ADR-0002`)**: Constitución del proyecto, contratos EARS + Gherkin, sincronización determinista `.opencode/` → `.agents/` y gates de calidad (`/version-gate`, `/docs-gate`, `/merge-gate`).
2. **Seguridad, Autenticación y RBAC (`Spec 002`, `Spec 008`, `ADR-0004`)**: Hashing primario **Argon2id** (`@node-rs/argon2`) con migración transparente de hashes heredados, `accessToken` JWT en memoria (`15m`), `refreshToken` opaco en cookie `HttpOnly` (`7d`) con rotación *single-flight*, bloqueo ante intentos fallidos, flujo forzoso de cambio de clave temporal y 6 roles con permisos granulares.
3. **Taxonomía Semántica Recursiva v1 (`Spec 003`, `Spec 004`)**: Árbol declarativo e idempotente de `65` nodos (`4` campos semánticos ratificados: *Ya*, *Ya tul*, *Tra tul* y *Kau ushamera*; `18` subcampos y `43` microcampos con soporte recursivo) más `7` Home Slots de portada (`4` activos vinculados a `C1..C4` y `3` proyectados).
4. **Modelo Léxico Canónico `Sentido + Formas` (`Spec 005`, `ADR-0003`)**: Persistencia e ingesta gobernada de `1.351` sentidos léxicos activos y `1.451` formas en lengua Namtrik con ubicación taxonómica multinivel.
5. **Panel Administrativo y Gobierno Editorial (`Spec 006`, `ADR-0004`)**: Gestión CRUD de sentidos y formas, ratificación y reversión cultural individual o en lote, papelera con restauración y purga protegida por código, expediente de usuarios, bitácora de auditoría inmutable, modo Claro/Oscuro WCAG 2.2 AA y aislamiento total en el chunk diferido `admin`.
6. **Medios Culturales Escalonados (`Spec 007`, `ADR-0005`)**: Validación de firmas binarias (`MagicByteValidator`), almacenamiento local en subdirectorios opacos UUIDv4, streaming parcial `HTTP 206`, reproductor de pronunciación accesible de instancia única (`AudioPlayerContext`), *lightbox* cultural WAI-ARIA y caché offline Workbox.
7. **Experiencia Pública, Búsqueda Vectorizada y Tipografía Namtrik (`Spec 009`, `Spec 010`, `ADR-0006`)**: Portada *scrollytelling* con `HeroSection` de 3 zonas y constelación 2D sin colisiones, header condicional, buscador bilingüe con ranking cultural y `@font-face` compuesto (`Spline Sans` + `Noto Sans`) para renderizado uniforme del grafema `ɵ` (`U+0275`).
8. **Saneamiento Integral de Deuda Técnica y Alineación Documental (`Spec 011`, `ADR-0007`)**: Eliminación de código legado (`PalabraModelo1` admin, componentes huérfanos, prototipos HTML estáticos heredados y esqueletos vacíos), alineación de Docker/Nginx para producción en mismo origen, regeneración binaria de iconos PWA con la paleta oficial Misak y actualización integral de la documentación canónica.

---

## Métricas Técnicas Verificadas

### Suite de Pruebas Automatizadas (Vitest 4)

| Paquete | Suites | Tests | Estado |
| --- | --- | --- | --- |
| `apps/web-client` | `68` archivos | `477` tests | `100% PASS` |
| `apps/backend-service` (unitarios) | `57` archivos | `411` tests | `100% PASS` |
| **Total Unitario Monorepo** | **`125` archivos** | **`888` tests** | **`100% PASS`** |
| `apps/backend-service` (integración) | Suite `integration` | PostgreSQL 18 real vía `@testcontainers/postgresql` | Disponible vía `pnpm --filter @misak/backend-service test:integration` |

### Corpus y Base de Datos

| Indicador | Valor |
| --- | --- |
| Motor de Base de Datos | PostgreSQL `18.1` (`pgvector/pgvector:pg18`) + Prisma `7.4.2` (`@prisma/adapter-pg`) |
| Extensiones Activas | `citext`, `pg_trgm`, `unaccent`, `btree_gin`, `btree_gist`, `uuid-ossp`, `vector`, `pg_stat_statements` |
| Taxonomía Persistida (`v1`) | `4` campos · `18` subcampos · `43` microcampos (`65` nodos) · `7` Home Slots (`4` activos) |
| Léxico Persistido (`v1`) | `1.351` sentidos léxicos activos · `1.451` formas Namtrik |
| Tablas Legadas Inactivas (Opción B) | `5` modelos sin filas activas conservados en `schema.prisma` para integridad de migraciones `0001`–`0013` hasta `Spec 012` |

### Calidad Estática, Build y PWA

- **Runtime**: Node.js `24.15.0` LTS · pnpm `10.20.0` · TypeScript `5.9.3` (`0` errores en `web-client` y `backend-service`).
- **Linting & Formato**: Biome `2.4.6` (`pnpm ci` en verde sin advertencias ni errores).
- **CSS & Bundles**: TailwindCSS `4.2.1` + `Lightning CSS` sobre `BROWSER_BASELINE`; chunk `admin` separado del bundle público y excluido del precache de Service Worker.
- **Infraestructura Contenedorizada**: `docker/compose.yml` (desarrollo) y `docker/compose.prod.yml` (producción endurecida con `read_only: true`, `cap_drop: ALL`, `media_data` persistente y proxy reverso Nginx) validados con `docker compose config`.

---

## Próximos Pasos Previos al Lanzamiento

1. **`Spec 012` — Retiro Físico Controlado de Esquema Heredado**: Crear migración Prisma dedicada (`DROP TABLE` de `palabrasm1_microcampos`, `palabrasm2_microcampos`, `palabras_modelo_1`, `palabras_modelo_2` y `password_resets`), retirar sus adaptadores residuales de lectura y actualizar el esquema Prisma tras respaldo verificado.
2. **Curaduría Multimedia y Ratificación Editorial**: Carga progresiva de grabaciones fonéticas de hablantes nativos e ilustraciones etnográficas desde `/admin/medios` y ratificación cultural por campos semánticos en `/admin/revision`.
3. **Preparación de Release de Producción**: Pruebas integrales E2E sobre el stack `compose.prod.yml`, verificación de presupuestos Core Web Vitals (LCP/INP/CLS) y corte de versión mediante `/docs-gate`, `/version-bump` y `/merge-gate`.
