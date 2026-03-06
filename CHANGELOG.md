# Historial de Cambios (Changelog)

Todos los cambios notables del proyecto estan documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y el proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0-alpha.0](https://github.com/Tumi-dev/misak-dictionary/compare/v0.3.0-alpha...v0.4.0-alpha.0) (2026-03-06)


### ⚠ BREAKING CHANGES

* ESLint and Prettier are no longer used. Use biome commands instead.

### Funcionalidades

* migrate from ESLint 9 + Prettier 3 to Biome v2 ([fdc5452](https://github.com/Tumi-dev/misak-dictionary/commit/fdc5452fbf9f67b7efe810f9ccb60b2aa7680501))


### Correcciones

* **backend:** add missing properties to mock objects in LoginUseCase tests ([4bcd6dc](https://github.com/Tumi-dev/misak-dictionary/commit/4bcd6dc252ac44ca648bc971ff90785748ebaf16))
* **backend:** revert dot notation for index signatures and fix parseFloat type errors ([b277364](https://github.com/Tumi-dev/misak-dictionary/commit/b277364338a81935f98a82e2342e5b9799d2096f))


### Documentacion

* update AGENTS.md for Biome v2 migration ([4ca1191](https://github.com/Tumi-dev/misak-dictionary/commit/4ca11913ed46cbb68323dd5e09891779d947ca4d))


### Testing

* **backend:** add comprehensive test suite achieving 80% coverage threshold ([9d8aaa9](https://github.com/Tumi-dev/misak-dictionary/commit/9d8aaa9f59d587edf50855dfb62f1448a4dc8329))

## [0.3.0-alpha] - 2025-10-20

### 🚀 Week 3-4: Backend Core Complete

Completación exitosa de los 4 sprints del backend, implementando el sistema completo de autenticación, API pública del diccionario y API administrativa.

#### Sprint 1: Backend Foundation (✅ 100%)

- **Fastify Server** - Framework de alto rendimiento configurado
- **Prisma ORM** - Schema completo (admin + diccionario) con PostgreSQL
- **Clean Architecture** - Estructura domain/application/infrastructure/presentation
- **Configuración de Seguridad** - Helmet, CORS, Rate Limiting
- **Variables de Entorno** - Validación con Zod
- **Health Check** - Endpoints de monitoreo

#### Sprint 2: Auth System (✅ 100%)

- **JWT Authentication** - Access tokens (15min) + Refresh tokens (7 días)
- **Auth Endpoints** - `/auth/login`, `/auth/refresh`, `/auth/logout`
- **Password Hashing** - Bcrypt con 10 rounds
- **RBAC** - 5 roles (super_admin, content_admin, media_admin, cultural_reviewer, analytics_viewer)
- **Session Management** - Gestión de sesiones en base de datos
- **Middleware** - Autenticación y autorización por roles
- **Database Seed** - Usuario admin inicial (admin@misak-dictionary.com / Admin123!)
- **56 Tests Implementados** - Coverage completo de Services, Use Cases y Controllers

#### Sprint 3: Dictionary API Público (✅ 100%)

- **12 Endpoints Públicos** - Sin autenticación requerida
- **Búsqueda Full-text** - Por término en Namtrik o Español
- **Filtros por Idioma** - namtrik/espanol
- **Jerarquía Semántica** - Campo Semántico → Subcampo → Microcampo
- **Paginación** - skip/take para listas grandes
- **Sorting** - Ordenamiento por diferentes campos

#### Sprint 4: Admin API Protegido (✅ 100%)

- **12 Endpoints CRUD** - Protegidos con JWT + Role authorization
- **CRUD Palabras** - Create, Update, Delete para Modelo 1 y Modelo 2
- **CRUD Estructura Semántica** - Campos, Subcampos y Microcampos
- **Soft Delete** - Campo deletedAt para eliminación lógica
- **Validación Duplicados** - Prevenir términos repetidos
- **DTOs con Zod** - Validación de entrada en todos los endpoints

### ✨ Testing & Quality

#### Tests Implementados (56 total)

- **PasswordService** - 7 tests (hash, compare)
- **TokenService** - 15 tests (JWT generation, verification)
- **LoginUseCase** - 7 tests (login flows, validations)
- **RefreshTokenUseCase** - 8 tests (token refresh scenarios)
- **LogoutUseCase** - 5 tests (logout and session cleanup)
- **AuthController** - 14 tests (HTTP endpoint integration)

#### Refactorizaciones

- **Dependency Injection** - AuthController refactorizado para testabilidad
- **Error Handling** - Manejo de ZodError para respuestas 400
- **Vitest Configuration** - Setup completo con coverage thresholds

### 🔌 API Endpoints

#### Autenticación (3 endpoints)

```
POST   /auth/login     - Login con username/password
POST   /auth/refresh   - Renovar access token
POST   /auth/logout    - Cerrar sesión
```

#### Dictionary API - Público (12 endpoints)

```
GET    /api/dictionary/words                             - Listar palabras
GET    /api/dictionary/words/:id                         - Obtener palabra
GET    /api/dictionary/words/search                      - Búsqueda
GET    /api/dictionary/semantic-fields                   - Listar campos
GET    /api/dictionary/semantic-fields/:id               - Campo + subcampos
GET    /api/dictionary/semantic-fields/:id/subcampos     - Subcampos
GET    /api/dictionary/subcampos/:id                     - Subcampo + microcampos
GET    /api/dictionary/subcampos/:id/microcampos         - Microcampos
GET    /api/dictionary/microcampos/:id                   - Microcampo + palabras
GET    /api/dictionary/microcampos/:id/words             - Palabras de microcampo
```

#### Admin API - Protegido (12 endpoints)

```
POST   /api/admin/dictionary/words/modelo1               - Crear palabra
PUT    /api/admin/dictionary/words/modelo1/:id           - Actualizar palabra
DELETE /api/admin/dictionary/words/modelo1/:id           - Eliminar palabra
POST   /api/admin/dictionary/semantic-fields             - Crear campo
PUT    /api/admin/dictionary/semantic-fields/:id         - Actualizar campo
DELETE /api/admin/dictionary/semantic-fields/:id         - Eliminar campo
POST   /api/admin/dictionary/semantic-fields/:id/subcampos  - Crear subcampo
PUT    /api/admin/dictionary/subcampos/:id               - Actualizar subcampo
DELETE /api/admin/dictionary/subcampos/:id               - Eliminar subcampo
POST   /api/admin/dictionary/subcampos/:id/microcampos   - Crear microcampo
PUT    /api/admin/dictionary/microcampos/:id             - Actualizar microcampo
DELETE /api/admin/dictionary/microcampos/:id             - Eliminar microcampo
```

### 📊 Estadísticas Week 3-4

- **4 Sprints completados** (Backend Foundation, Auth, Dictionary API, Admin API)
- **27 endpoints implementados** (3 auth + 12 públicos + 12 admin)
- **56 tests pasando** (100% success rate)
- **Clean Architecture** - Completamente implementada
- **0 deuda técnica** - Tests integrados desde el inicio

### 🔒 Seguridad

- JWT con secrets separados (access + refresh)
- Bcrypt para hashing de passwords (10 rounds)
- Rate limiting configurado (100 req/15min)
- Input validation con Zod en todos los endpoints
- RBAC con 5 roles y middleware de autorización
- Session management con expiración automática
- CORS configurado para orígenes permitidos

### 📦 Dependencias Añadidas

- `fastify@^5.1.0` - HTTP framework
- `@prisma/client@^6.6.0` - ORM
- `@fastify/jwt@^9.0.1` - JWT authentication
- `@fastify/helmet@^12.0.1` - Security headers
- `@fastify/cors@^10.0.1` - CORS support
- `@fastify/rate-limit@^10.1.1` - Rate limiting
- `bcryptjs@^2.4.3` - Password hashing
- `zod@^3.24.1` - Schema validation
- `vitest@^3.2.4` - Testing framework

### 📝 Documentación Actualizada

- `apps/backend-service/README.md` - Documentación completa del backend
- `README.md` (raíz) - Roadmap Week 3-4 marcado como completado
- `CHANGELOG.md` - Este archivo

### 🎯 Próximos Pasos (Week 5+)

- ElasticSearch para búsqueda semántica avanzada
- Upload de multimedia (Cloudinary/S3)
- Bulk import de palabras
- WebSockets para notificaciones en tiempo real
- Logging avanzado (Winston/Pino)
- Metrics y monitoring (Prometheus)

---

## [0.2.0-alpha] - 2025-10-11

### 🚀 Funcionalidades Principales Añadidas

#### CI/CD & Automation (Sprint 1)

- **GitHub Actions Workflows** - Testing, linting y validación de build automatizados
- **Codecov Integration** - Reportes de coverage automatizados con quality gates
- **Pre-commit Hooks** - Automatización de ESLint y Prettier con Husky + lint-staged
- **Quality Gates** - Validaciones automáticas aseguran calidad de código en cada commit

#### Optimizaciones de Performance (Sprint 2)

- **Code Splitting** - React.lazy y Suspense para división de código por ruta
- **Lazy Loading** - Imágenes y componentes cargan bajo demanda
- **PWA Support** - Progressive Web App completa con service worker y funcionalidad offline
- **Bundle Analyzer** - Visualización de composición del bundle con rollup-plugin-visualizer
- **Responsive Images** - Soporte WebP con fallback y optimización srcset

#### Mejoras UX (Sprint 3)

- **Error Boundaries** - Manejo robusto de errores con fallback UI amigable
- **Skeleton Loaders** - Estados de carga profesionales con 3 variantes y animaciones
- **Página 404** - Página Not Found personalizada con navegación y animaciones
- **Auditoría de Accesibilidad** - Conformidad WCAG 2.1 AA alcanzada (98.78% coverage)

#### Quality & Testing (Sprint 4)

- **Test Coverage** - Incrementado de 70% a 98.78% (+53 tests, 177 total)
- **Lighthouse Ready** - Optimizado para scores >95 en todas las categorías
- **Fundamentos SEO** - Meta tags, HTML semántico y crawlability listos
- **Documentación** - Reportes exhaustivos y guías para todas las funcionalidades

### ✨ Componentes Nuevos

#### Componentes UI

- `LoadingScreen` - Pantalla de carga profesional con animaciones
- `Skeleton` - Skeleton loader reutilizable (variantes rectangular, circular, text)
- `ErrorBoundary` - React error boundary con fallback UI
- `ErrorFallback` - Componente de visualización de errores amigable para el usuario

#### Páginas

- `NotFound` - Página 404 personalizada con animaciones Framer Motion

### 🔧 Mejoras

#### Build & Performance

- Tamaño de bundle optimizado: 66.37 KB gzipped (reducido desde ~350 KB)
- Tiempo de build: ~5s para builds de producción
- Service worker precachea 22 assets (775.96 KiB)
- Code splitting reduce carga inicial en ~80%

#### Testing

- **177 tests** distribuidos en 16 archivos (incremento desde 112)
- **98.78% coverage** (statements, lines)
- **95.08% branch coverage**
- **91.66% function coverage**
- Todos los tests pasan en ~13 segundos

#### Accesibilidad (Accessibility)

- Conformidad WCAG 2.1 AA completa
- Ratios de contraste de color exceden estándares AAA (8.2:1+)
- Soporte completo para navegación por teclado
- ARIA labels en todos los elementos interactivos
- Compatible con screen readers

#### Developer Experience

- ESLint: 0 errores, 0 warnings
- TypeScript: 0 errores
- Prettier: 100% formateado
- Pre-commit hooks previenen commits defectuosos
- Documentación exhaustiva

### 📦 Dependencias

#### Añadidas

- `vite-plugin-pwa@^0.21.1` - Soporte PWA
- `workbox-window@^7.3.0` - Gestión de service worker
- `rollup-plugin-visualizer@^5.12.0` - Análisis de bundle

#### Actualizadas

- Todas las dependencias actualizadas con parches de seguridad

### 📝 Documentación

#### Nueva Documentación

- `CURRENT-STATE.md` - Fuente única de verdad para el estado del proyecto
- `ACCESSIBILITY-AUDIT-SPRINT3.md` - Reporte completo de auditoría de accesibilidad
- `COVERAGE-REPORT-SPRINT4.md` - Análisis de test coverage
- `LIGHTHOUSE-SEO-READINESS-SPRINT4.md` - Readiness de performance y SEO
- `WEEK2-SPRINT2-SUMMARY.md` - Resumen de completado Sprint 2
- `WEEK2-SPRINT3-SUMMARY.md` - Resumen de completado Sprint 3
- `CHANGELOG.md` - Este archivo

#### Documentación Actualizada

- `README.md` - Actualizado con nuevos comandos y funcionalidades
- `project.md` - Documentación del proyecto actualizada
- Todos los reportes archivados y organizados

### 🐛 Correcciones de Bugs

- Corregido test de funcionalidad de reset de ErrorBoundary
- Corregido comportamiento de lazy loading de imágenes
- Mejorado timing de registro de service worker
- Corregida compatibilidad de TypeScript del bundle analyzer con Vite 7

### 🔒 Seguridad

- Sin dependencias vulnerables
- Listo para HTTPS en producción
- CSP (Content Security Policy) preparado
- Best practices de seguridad de service worker implementadas

### ⚡ Métricas de Performance

#### Core Web Vitals (Estimadas)

- First Contentful Paint: ~0.8s (target <1.8s) ✅
- Largest Contentful Paint: ~1.2s (target <2.5s) ✅
- Cumulative Layout Shift: ~0.01 (target <0.1) ✅
- Time to Interactive: ~2.0s (target <3.8s) ✅
- Total Blocking Time: ~100ms (target <200ms) ✅

#### Lighthouse Scores (Estimados)

- Performance: 95-98/100
- Accessibility: 98-100/100
- Best Practices: 95-98/100
- SEO: 95-98/100
- PWA: 90-95/100

### 📊 Estadísticas

#### Logros Week 2

- **4 Sprints completados** (CI/CD, Performance, UX, Quality)
- **15 tareas completadas** en todos los sprints
- **+65 tests añadidos** (112 → 177)
- **+28.78% incremento en coverage** (70% → 98.78%)
- **~36 horas de desarrollo enfocado**
- **50+ commits** con documentación exhaustiva

#### Comparativa Week 1 vs Week 2

| Métrica       | Week 1 | Week 2 | Cambio     |
| ------------- | ------ | ------ | ---------- |
| Tests         | 112    | 177    | +65 (+58%) |
| Coverage      | 70%    | 98.78% | +28.78%    |
| Test Files    | 11     | 16     | +5         |
| Componentes   | 13     | 17     | +4         |
| Páginas       | 1      | 2      | +1         |
| Build Time    | 3.84s  | 5.04s  | +1.2s      |
| Bundle (gzip) | ~334KB | 66KB   | -80%       |

### 🎯 Roadmap para v0.3.0

#### Funcionalidades Planificadas

- Backend API con integración Supabase
- Datos reales del diccionario y funcionalidad de búsqueda
- Autenticación de usuarios
- Favoritos y marcadores
- Pronunciaciones de audio
- Más pares de idiomas

#### Deuda Técnica

- Testing E2E con Playwright (opcional)
- Auditoría Lighthouse real en versión desplegada
- Iconos PWA de producción (PNG optimizados)
- Configuración CDN para assets
- Integración de analytics

### 💡 Cambios que Rompen Compatibilidad (Breaking Changes)

Ninguno - Esta es una versión alpha sin cambios que rompan compatibilidad con v0.1.0.

### 📦 Guía de Migración

No se requiere migración - Esta es la primera versión alpha con estas funcionalidades.

---

## [0.1.0] - 2025-10-01

### Lanzamiento Inicial (Initial Release)

#### Funcionalidades

- React 19.1.1 + TypeScript 5.9.2 + Vite 7.1.7
- Estilos con TailwindCSS 4.1.13
- Animaciones con Framer Motion 12.23.19
- 5 secciones principales: Hero, Video, Info, Gallery, Credits
- 13 componentes reutilizables
- Diseño responsivo
- Configuración básica de testing (112 tests)
- Configuración ESLint + Prettier

---

## Formato de Versiones

- **Major** (X.0.0): Cambios que rompen compatibilidad, rediseños mayores
- **Minor** (0.X.0): Nuevas funcionalidades, cambios sin romper compatibilidad
- **Patch** (0.0.X): Correcciones de bugs, mejoras menores
- **Alpha/Beta/RC**: Versiones pre-lanzamiento para testing

---

**Nota**: Este changelog sigue semantic versioning y documenta todos los cambios significativos. Para historial detallado de commits, consulta el Git log.

**Repositorio**: https://github.com/Tumi-dev/misak-dictionary.git  
**Licencia**: MIT  
**Mantenedor**: Tumi-dev
