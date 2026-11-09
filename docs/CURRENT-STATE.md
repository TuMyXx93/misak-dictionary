# Estado Actual del Proyecto — Diccionario Misak

**Última Actualización**: 2026-11-08  
**Versión**: `v0.5.0-alpha.0`  
**Rama Base de Integración**: `feat/012-matriz-equivalencias-busqueda-hibrida` (lista para merge a `dev`)  
**Estado Operativo**: Plataforma funcional de extremo a extremo (Exploración Pública + Buscador Global Híbrido Multinivel con Deep Linking Anti-CLS + Catálogo Dinámico de Abreviaturas + Panel Editorial RBAC con Editor Multiforma y Módulo de Taxonomía con Bloqueo 409)

---

## Resumen Ejecutivo

**Wamtɵrmarɵpik — Diccionario Misak** es la plataforma digital bilingüe (`Namtrik – Castellano`) del pueblo Misak. El sistema integra una aplicación web progresiva (**PWA**) de alto rendimiento visual y cultural con un servicio **API Clean Architecture** sobre **Fastify 5**, **Prisma 7** y **PostgreSQL 18**.

### Hitos Consolidados (`Spec 001` – `Spec 012 v0.3.0`)

1. **Gobernanza SDD y Ecosistema Multi-Agente (`Spec 001`, `ADR-0001`, `ADR-0002`)**: Constitución del proyecto, contratos EARS + Gherkin, sincronización determinista `.opencode/` → `.agents/` y gates de calidad (`/version-gate`, `/docs-gate`, `/merge-gate`).
2. **Seguridad, Autenticación y RBAC (`Spec 002`, `Spec 008`, `ADR-0004`)**: Hashing primario **Argon2id** (`@node-rs/argon2`) con migración transparente de hashes heredados, `accessToken` JWT en memoria (`15m`), `refreshToken` opaco en cookie `HttpOnly` (`7d`) con rotación *single-flight*, bloqueo ante intentos fallidos, flujo forzoso de cambio de clave temporal y 6 roles con permisos granulares.
3. **Taxonomía Semántica Recursiva v1 (`Spec 003`, `Spec 004`)**: Árbol declarativo e idempotente de `65` nodos (`4` campos semánticos ratificados: *Ya*, *Ya tul*, *Tra tul* y *Kau ushamera*; `18` subcampos y `43` microcampos con soporte recursivo) más `7` Home Slots de portada (`4` activos vinculados a `C1..C4` y `3` proyectados).
4. **Modelo Léxico Canónico `Sentido + Formas` (`Spec 005`, `ADR-0003`)**: Persistencia e ingesta gobernada de `1.351` sentidos léxicos activos y `1.451` formas en lengua Namtrik con ubicación taxonómica multinivel.
5. **Panel Administrativo y Gobierno Editorial (`Spec 006`, `ADR-0004`)**: Gestión CRUD de sentidos y formas, ratificación y reversión cultural individual o en lote, papelera con restauración y purga protegida por código, expediente de usuarios, bitácora de auditoría inmutable, modo Claro/Oscuro WCAG 2.2 AA y aislamiento total en el chunk diferido `admin`.
6. **Medios Culturales Escalonados (`Spec 007`, `ADR-0005`)**: Validación de firmas binarias (`MagicByteValidator`), almacenamiento local en subdirectorios opacos UUIDv4, streaming parcial `HTTP 206`, reproductor de pronunciación accesible de instancia única (`AudioPlayerContext`), *lightbox* cultural WAI-ARIA y caché offline Workbox.
7. **Experiencia Pública, Búsqueda Vectorizada y Tipografía Namtrik (`Spec 009`, `Spec 010`, `ADR-0006`)**: Portada *scrollytelling* con `HeroSection` de 3 zonas y constelación 2D sin colisiones, header condicional inteligente con navegación unificada a `/campos`, tarjetas interactivas de símbolos Misak con giro 3D y lectura progresiva accesible, buscador bilingüe vectorizado multi-nivel con ranking cultural Misak (soporte de monografemas `ú`/`u`, parametrización regex POSIX ERE y transparencia semántica con extractos contextuales), y tipografía compuesta con `@font-face` (`Spline Sans` + `Noto Sans`) para renderizado armónico del grafema `ɵ` (`U+0275`).
8. **Saneamiento Integral de Deuda Técnica y Alineación Documental (`Spec 011`, `ADR-0007`)**: Eliminación de código legado (`PalabraModelo1` admin, componentes huérfanos, prototipos HTML estáticos heredados y esqueletos vacíos), alineación de Docker/Nginx para producción en mismo origen, regeneración binaria de iconos PWA con la paleta oficial Misak y actualización integral de la documentación canónica.
9. **Matriz de Equivalencias Bilingüe, Búsqueda Híbrida Multinivel, Deep Linking y Gobierno Integral (`Spec 012 v0.3.0`, `ADR-0008`)**:
   - **Búsqueda Multinivel Semaforizada (`>= 1` car) y Deep Linking Anti-CLS**: Indexa y jerarquiza simultáneamente tanto nodos del árbol taxonómico (`Campo`, `Subcampo`, `Microcampo`, `Subnivel` recursivo) como términos léxicos y nombres científicos taxonómicos (`Gastropoda` ↔ *Milu kalik*). Navegación con anclaje profundo determinista (`#term-{id}` y `#subnivel-{slug}`) estabilizado con `MutationObserver` + `ResizeObserver` (`useDeepLinkAnchor`) y resaltado accesible post-scroll.
   - **Buscador Global Público `<dialog>` y Suite "Keyboard Geek"**: Acceso rápido en una sola acción (`⌘K` / `Ctrl+K` / `/`), modal nativo `<dialog>` (`showModal()`, `closedby="any"`) con auto-enfoque síncrono (`flushSync`) en móvil y adaptable en tiempo real a `window.visualViewport`, auto-scroll determinista acotado al `listbox` (`container.scrollTop`), comandos avanzados (`Ctrl+N/P`, `PageUp/Down`, `Ctrl+Home/End`, `Ctrl+Enter`, `Alt+O`, `Ctrl+U`), guardia IME y gatillo arrastrable flotante (`DraggableSearchTrigger`) con persistencia canónica de coordenadas (`FabAnchor` + proyección proporcional en `resize`/`orientationchange` y guardia `POST_MODAL_KEYBOARD_GUARD_MS`).
   - **Catálogo Dinámico de Abreviaturas Gramaticales**: Tabla `abreviaturas_gramaticales` (migración `0015`), 41 abreviaturas normalizadas del documento lingüístico oficial (`Abreviaturas.pdf`), API CRUD con protección 409 Conflict ante uso activo, componente `AbbreviationBadge` responsivo (portal `position: fixed` en modo interactivo y `<abbr>` estático HTML5 válido dentro de `<Link role="option">`) y modal in-situ en el panel editorial.
   - **Normalización Fonética Armónica y Filtros Admin**: Búsqueda en panel administrativo insensible a tildes y diacríticos (`corazon` ↔ `corazón`, `malo` ↔ `malɵ`), filtros de categoría gramatical y presencia de nombre científico.
   - **Reconstrucción de SentidoEditorPage**: Soporte integral de múltiples formas (`formas[]`), variantes (`V. 1..3`), sección especializada de Taxonomía Biológica (`nombreCientifico`), contexto cultural y estructuras dialógicas.
   - **Módulo de Gestión Taxonómica (`/admin/taxonomia`)**: Árbol jerárquico interactivo con bloqueo estricto de borrado (`HTTP 409 Conflict`) si existen nodos dependientes o términos asociados, garantizando la preservación patrimonial.

---

## Métricas Técnicas Verificadas

### Suite de Pruebas Automatizadas (Vitest 4)

| Paquete | Suites | Tests | Estado |
| --- | --- | --- | --- |
| `apps/web-client` | `77` archivos | `554` tests | `100% PASS` |
| `apps/backend-service` (unitarios) | `61` archivos | `440` tests | `100% PASS` |
| **Total Unitario Monorepo** | **`138` archivos** | **`994` tests** | **`100% PASS`** |
| `apps/backend-service` (integración) | Suite `integration` | PostgreSQL 18 real (`searchRankingMisak`: `13` tests PASS contra DB viva en puerto 5434) | `100% PASS` |

### Corpus y Base de Datos

| Indicador | Valor |
| --- | --- |
| Motor de Base de Datos | PostgreSQL `18.6` (`pgvector/pgvector:pg18`) + Prisma `7.4.2` (`@prisma/adapter-pg`) |
| Extensiones Activas | `citext`, `pg_trgm`, `unaccent`, `btree_gin`, `btree_gist`, `uuid-ossp`, `vector`, `pg_stat_statements` |
| Taxonomía Persistida (`v1`) | `4` campos · `18` subcampos · `43` microcampos (`65` nodos) · `7` Home Slots (`4` activos) |
| Léxico Persistido (`v1`) | `1.351` sentidos léxicos activos · `1.451` formas Namtrik |
| Matriz de Equivalencias (`v1`) | `1.633` equivalencias bilingües indexadas (`glosa_directa`, `sub_acepcion`, `nucleo_nominal`, `raiz_morfologica`) |
| Catálogo de Abreviaturas | `41` abreviaturas gramaticales ratificadas (`data/lexicon/v1/abreviaturas.yaml`, migración `0015`) |

### Calidad Estática, Build y PWA

- **Runtime**: Node.js `24.15.0` LTS · pnpm `10.20.0` · TypeScript `5.9.3` (`0` errores en `web-client` y `backend-service`).
- **Linting & Formato**: Biome `2.4.6` (`pnpm ci` en verde sin advertencias ni errores).
- **CSS & Bundles**: TailwindCSS `4.2.1` + `Lightning CSS` sobre `BROWSER_BASELINE`; chunk `admin` separado del bundle público y excluido del precache de Service Worker.
- **Infraestructura Contenedorizada**: `docker/compose.yml` (desarrollo) y `docker/compose.prod.yml` (producción endurecida con `read_only: true`, `cap_drop: ALL`, `media_data` persistente y proxy reverso Nginx) validados con `docker compose config`.

---

## Próximos Pasos Previos al Lanzamiento

1. **Retiro Físico Controlado de Esquema Heredado**: Crear migración Prisma dedicada (`DROP TABLE` de `palabrasm1_microcampos`, `palabrasm2_microcampos`, `palabras_modelo_1`, `palabras_modelo_2` y `password_resets`), retirar sus adaptadores residuales de lectura y actualizar el esquema Prisma tras respaldo verificado.
2. **Curaduría Multimedia y Ratificación Editorial**: Carga progresiva de grabaciones fonéticas de hablantes nativos e ilustraciones etnográficas desde `/admin/medios` y ratificación cultural por campos semánticos en `/admin/revision`.
3. **Preparación de Release de Producción**: Pruebas integrales E2E sobre el stack `compose.prod.yml`, verificación de presupuestos Core Web Vitals (LCP/INP/CLS) y corte de versión mediante `/docs-gate`, `/version-bump` y `/merge-gate`.
