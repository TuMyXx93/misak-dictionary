# Web Client — Diccionario Misak

**Última Actualización**: 2026-11-13  
**Versión**: `0.5.0-alpha.0`  
**Paquete**: `web-client`

Aplicación web progresiva (**PWA**) del **Diccionario Misak** (`Wamtɵrmarɵpik`), construida con **React 19**, **Vite 8** (`Rolldown` + `Oxc`), **TailwindCSS 4** (`Lightning CSS`) y **Framer Motion 12**. Combina una experiencia pública inmersiva de exploración territorial y lingüística con un panel administrativo aislado en bundles independientes (`admin`, `admin-editorial` y `admin-media-governance`).

---

## Stack Tecnológico

| Categoría | Tecnología | Detalle |
| --- | --- | --- |
| **UI & Compilación** | React `19.2` · Vite `8.3` (`Rolldown` + `Oxc`) · TypeScript `5.9` | `@vitejs/plugin-react` v6 (Oxc Fast Refresh), code splitting por rutas y `rolldownOptions.output.codeSplitting.groups` (`vendor`, `animations`, `admin`, `admin-editorial`, `admin-media-governance`) |
| **Estilos & CSS Engine** | TailwindCSS `4.2` · `@tailwindcss/vite` · Lightning CSS | Configuración CSS-first en `src/index.css` (`@theme`); compilación y minificación CSS unificadas sobre `BROWSER_BASELINE` (Safari/iOS 16.4, Chrome/Edge 111, Firefox 128) |
| **Animación & Interacción** | Framer Motion `12.35` | Transiciones scrollytelling, constelación semántica 2D interactiva y micro-interacciones accesibles (`prefers-reduced-motion`) |
| **Enrutamiento & Estado** | React Router `7.13` · TanStack Query `5.90` · Zustand `5.0` | `createBrowserRouter` con protección RBAC; caché declarativa de servidor y store de sesión JWT exclusivamente en memoria |
| **Formularios & Esquemas** | React Hook Form `7.71` · `@hookform/resolvers` · Zod `4.3` | Validación tipada en formularios editoriales de sentidos, formas Namtrik, medios y usuarios |
| **PWA & Offline** | `vite-plugin-pwa` `1.2` · Workbox `7.4` | Manifiesto instalable en español, Service Worker con `CacheFirst` para tipografías y streaming multimedia (`/api/media/*/stream`, estado `200`), y exclusión estricta de los chunks `admin*` y `stats.html` |
| **Testing** | Vitest `4.1` · Testing Library · `jsdom` `28.1` | `646` pruebas automatizadas distribuidas en `85` suites (componentes, hooks, stores, rutas y accesibilidad) |

---

## Identidad Visual y Tipográfica

### 1. Sistema Cromático Oficial Misak (`src/index.css`)

La interfaz pública (`.misak-public-scope`) se fundamenta en los cuatro colores sagrados de la bandera y el tejido propio del pueblo Misak (Resguardo de Guambia):

| Token CSS | Hex | Rol Semántico y Simbólico |
| --- | --- | --- |
| `--color-misak-magenta` / `--color-primary` | `#e52d6d` | **Magenta Misak** — Acción primaria, acentos interactivos y energía vital |
| `--color-misak-blue` / `--color-secondary` | `#0055aa` | **Azul Misak** — Foco interactivo, enlaces, agua sagrada y sabiduría |
| `--color-misak-white` / `--color-text` | `#ffffff` | **Blanco Puro** — Tipografía principal de alto contraste sobre lienzo oscuro |
| `--color-misak-black` / `--color-background` | `#000000` | **Negro Puro** — Fondo territorial base, acompañado de superficies elevadas `#141820` y `#07090d` |

Para el **Panel Administrativo** (`.misak-admin-scope`), `AdminThemeContext` habilita los modos **Claro**, **Oscuro** y **Sistema** con tokens dedicados (`--admin-bg`, `--admin-surface`, `--admin-text`, `--admin-border`) calibrados bajo contraste **WCAG 2.2 AA** y resueltos antes del primer pintado en `index.html` para evitar *FOUC*.

### 2. Armonización Tipográfica del Grafema Namtrik `ɵ` (`ADR-0006`)

Los títulos y la marca bilingüe (`Wamtɵrmarɵpik`) emplean **`Spline Sans`**, mientras que la lectura prolongada usa **`Noto Sans`**. Dado que `Spline Sans` carece de glifos AFI extendidos del alfabeto Namtrik, `src/index.css` define una regla `@font-face` compuesta para `'Spline Sans'` restringida a `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` que delega exactamente esos puntos de código a `Noto Sans` con `size-adjust: 96%`, garantizando altura de `x`, grosor de trazo y kerning uniformes en todos los sistemas operativos.

---

## Estructura de Directorios

```text
apps/web-client/
├── public/                     # Activos estáticos, emblemas WebP/PNG, robots.txt e iconos binarios PWA
├── index.html                  # Inicialización anti-FOUC de tema admin y precarga tipográfica
├── nginx.conf                  # Servidor estático SPA + reverse proxy /api/ y /auth/ en producción
├── vite.config.ts              # Configuración Vite 8 (Rolldown/Oxc), TailwindCSS 4, Lightning CSS, PWA y codeSplitting.groups
└── src/
    ├── components/
    │   ├── ui/                 # Átomos reutilizables (MisakWordmark, MisakBandStripe, SearchModal, etc.)
    │   ├── layouts/            # MainLayout, PublicHeader condicional y navegación móvil accesible
    │   ├── sections/           # Secciones scrollytelling de portada (Hero, Video, Info, Gallery, Credits)
    │   ├── features/           # Tarjetas semánticas, GlobalSearchModal, DraggableSearchTrigger, AbbreviationBadge, TermList/TermRow
    │   ├── media/              # AudioPronunciationButton y CulturalImageLightbox (WAI-ARIA)
    │   ├── admin/              # AdminLayout, RequireAuth, RequirePermission, modales de abreviaturas/taxonomía y tablas editoriales
    │   └── errors/             # ErrorBoundary y pantallas de contingencia
    ├── contexts/               # AudioPlayerContext, GlobalSearchContext y AdminThemeContext
    ├── hooks/                  # Hooks de búsqueda, useDeepLinkAnchor, navegación de portada, media queries y debounce
    ├── pages/                  # Vistas públicas (Home, CamposIndex, Campo/Subfield/Microfield) y /admin/*
    ├── router/                 # Enrutador declarativo RR7 con lazy loading por ruta
    ├── services/               # Clientes HTTP tipados con interceptor single-flight de refresh token
    ├── shared/                 # Catálogo espejo de permisos RBAC compartido con la capa de rutas
    ├── stores/                 # authStore (Zustand en memoria, sin persistencia de JWT en localStorage)
    ├── constants/              # Rutas de activos institucionales y constantes de configuración
    ├── types/                  # Contratos TypeScript de dominio léxico, taxonomía, medios y auth
    ├── utils/                  # Utilidades puras (cn, formateadores, resaltado de coincidencias)
    └── test/                   # Configuración global Vitest + Testing Library
```

---

## Arquitectura de Rutas y Aislamiento de Bundle

Definida en `src/router/index.tsx` mediante `createBrowserRouter` y `React.lazy`:

- **Espacio Público**:
  - `/` (`Home`): Portada scrollytelling con `HeroSection` de 3 zonas, constelación semántica 2D libre de colisiones, buscador bilingüe vectorizado (`Namtrik ↔ Castellano`) y `PublicHeader` condicional.
  - `/campos`: Índice general de los 4 campos semánticos activos de la taxonomía v1 (*Ya*, *Ya tul*, *Tra tul* y *Kau ushamera*), conectado desde los 7 slots de la portada (`4` habilitados + `3` en preparación).
  - `/campos/:fieldSlug`, `/campos/:fieldSlug/:subfieldSlug`, `/campos/:fieldSlug/:subfieldSlug/:microfieldSlug`: Exploración multinivel de subcampos, microcampos recursivos, sentidos léxicos, variantes ortográficas, pronunciaciones en audio e ilustraciones culturales.
- **Espacio Administrativo (`/admin/*` — Chunk `admin` aislado)**:
  - `/admin/login` y `/admin/cambiar-password`: Autenticación y cambio forzoso de clave temporal.
  - `/admin/sentidos`, `/admin/sentidos/nuevo`, `/admin/sentidos/:id/editar`: Gestión editorial multiforma de sentidos léxicos, variantes Namtrik (`V. 1..3`), taxonomía biológica (`nombreCientifico`), catálogo dinámico de abreviaturas in-situ, ubicaciones y asociación multimedia.
  - `/admin/taxonomia`: Gestión jerárquica de Campos, Subcampos, Microcampos y Subniveles con protección `HTTP 409 Conflict` ante dependencias activas.
  - `/admin/medios`: Catálogo, carga multipart y curaduría de audios e imágenes culturales.
  - `/admin/revision`, `/admin/dashboard`, `/admin/papelera`, `/admin/usuarios`, `/admin/auditoria`, `/admin/ajustes`: Gobierno cultural, métricas de ratificación, restauración/purga, control de usuarios RBAC y bitácora inmutable.

Todo el código de administración se empaqueta en los chunks independientes `admin`, `admin-editorial` y `admin-media-governance` (`vite.config.ts` → `rolldownOptions.output.codeSplitting.groups`) y se excluye explícitamente del precache del Service Worker (`workbox.globIgnores`), manteniendo liviana la carga inicial para la comunidad usuaria.

---

## Desarrollo, Build y Testing

### Comandos Principales

```bash
# Servidor de desarrollo en http://localhost:5173 (proxy /api y /auth -> localhost:3000)
pnpm dev:web

# Build de producción (tsc -b + vite build + generación de Service Worker)
pnpm build:web

# Previsualización local del build de producción
pnpm preview:web

# Análisis visual de tamaño de chunks (genera dist/stats.html)
pnpm build:analyze

# Suite completa de tests unitarios y de integración UI
pnpm test -- --run

# Reporte de cobertura V8
pnpm test:coverage
```

### Despliegue en Contenedor

En producción (`apps/web-client/Dockerfile` + `apps/web-client/nginx.conf`), los artefactos estáticos se compilan con `VITE_API_URL=""` (mismo origen) y son servidos por `nginx:1.27-alpine`, que enruta de forma transparente `/api/*` y `/auth/*` hacia el servicio `api:3000`, habilitando cargas multimedia de hasta `105 MB` y streaming `HTTP 206` sin *buffering* intermedio en `/api/media/`. Consulta el [README principal](../../README.md) para el detalle de la infraestructura Docker.
