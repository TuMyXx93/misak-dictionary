# Historial de Cambios (Changelog)

Todos los cambios notables del proyecto estan documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y el proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0-alpha.0](https://github.com/Tumi-dev/misak-dictionary/compare/v0.4.0-alpha.0...v0.5.0-alpha.0) (2026-10-17)


### Funcionalidades

* **agents:** add /specify /plan /tasks SDD workflow commands ([aa03b13](https://github.com/Tumi-dev/misak-dictionary/commit/aa03b138c17e43cba1d404e2bd67db438be41428))
* **backend:** auth cookie mode, GET /auth/me, and change-password flow ([d581b86](https://github.com/Tumi-dev/misak-dictionary/commit/d581b86af2c231af81a9500a0c743c9b44beba18))
* **backend:** implement admin governance routes for node, batch ratification and progress (T-025) ([67f5a08](https://github.com/Tumi-dev/misak-dictionary/commit/67f5a08daee5bfcae8931c72829319d557444cc1))
* **backend:** implement admin sentido CRUD and review routes (T-024) ([a6d3f27](https://github.com/Tumi-dev/misak-dictionary/commit/a6d3f2716c16597bd227a7d6afc463ab7ca56441))
* **backend:** implement editorial governance use cases (A3) ([82d3e65](https://github.com/Tumi-dev/misak-dictionary/commit/82d3e6545e0e4968800d63f4df85e023920c1b94))
* **backend:** implement routes for purge, users, audit and settings (T-026) ([0a6358f](https://github.com/Tumi-dev/misak-dictionary/commit/0a6358ffb7e9d870926447b30b2c23aee99e7c34))
* **backend:** implement spec 002 auth RBAC (argon2id, rotation, audit) ([3fa0f87](https://github.com/Tumi-dev/misak-dictionary/commit/3fa0f87ae72bf8e36c3e8f2c0e707bca2555c7f5))
* **backend:** implement spec 004 taxonomy v1 governance and tree schema ([0022488](https://github.com/Tumi-dev/misak-dictionary/commit/0022488de5023540a565575cc15879a071d25c72))
* **backend:** permissions, requireAnyPermission middleware, and transactional audit ([c42119f](https://github.com/Tumi-dev/misak-dictionary/commit/c42119fd2b3a16a0c5004dac552f96931ac737d3))
* **backend:** register @fastify/cookie and configure X-Client header in app ([6175bc6](https://github.com/Tumi-dev/misak-dictionary/commit/6175bc658fa015ab8c021e8bc47ee6a53d4269fe))
* **backend:** register new admin plugins and no-store Cache-Control header (T-027) ([e6e63c8](https://github.com/Tumi-dev/misak-dictionary/commit/e6e63c88e90bacbc6c99d6f05ad08c700f7c7d3d))
* **backend:** schema and migration 0009 for editorial governance ([6e322b1](https://github.com/Tumi-dev/misak-dictionary/commit/6e322b1c31d94953988fa97b18b588cb1accbbf5))
* **lexicon:** expose sense review status and dual mode filtering (R-026) ([9f1a510](https://github.com/Tumi-dev/misak-dictionary/commit/9f1a510c70100f2d6d9e6c361f45ccb0ad5b177a))
* **lexicon:** implement sentido and formas model with xlsm ingestion and multilevel ui ([67b281f](https://github.com/Tumi-dev/misak-dictionary/commit/67b281f4a2130623734ac42372c1cd9a4fff93e0))
* **web-client:** add floating semantic field buttons on hero ([ae2e343](https://github.com/Tumi-dev/misak-dictionary/commit/ae2e3439891215b2665f57999b81ee59e790d583))
* **web-client:** add router, data layer and 4 new pages for Phase 2 ([eb35105](https://github.com/Tumi-dev/misak-dictionary/commit/eb35105e9f8755f6e95c3700072d815d4a90df86))
* **web-client:** connect home slots to API and align taxonomy v1 navigation ([ae9738d](https://github.com/Tumi-dev/misak-dictionary/commit/ae9738d290497213c5f1591db5fa15a9615c164f))
* **web-client:** extract FieldHero and FieldLayout components for semantic fields pages ([26a87ef](https://github.com/Tumi-dev/misak-dictionary/commit/26a87ef84e42ae1d92f6f63e34a0afc2294fff6f))
* **web-client:** extract semantic field card and list components ([871ebe7](https://github.com/Tumi-dev/misak-dictionary/commit/871ebe73eb688b9ef139486af11c93458efb4ded))
* **web-client:** implementar panel administrativo y gobierno editorial ([7edb998](https://github.com/Tumi-dev/misak-dictionary/commit/7edb99826102cb57aef896045b16ecf3c2963c33))
* **web-client:** polish SubfieldPage and MicrofieldPage ([a1526d6](https://github.com/Tumi-dev/misak-dictionary/commit/a1526d61bfa288e9a660ffabea0aa8e179b52e26))
* **web-client:** ratify 7 Misak semantic fields with icon-only hover-expand reveal ([5d2eaee](https://github.com/Tumi-dev/misak-dictionary/commit/5d2eaee0515a038b611f7d237e664ca2e5e87611))
* **web-client:** recursive microfield subniveles and deep slug navigation ([5f82597](https://github.com/Tumi-dev/misak-dictionary/commit/5f82597abaa656ef63e1cfdf7082abe0980f7af2))
* **web-client:** responsive mobile-first overhaul of landing and semantic fields ([fe622f4](https://github.com/Tumi-dev/misak-dictionary/commit/fe622f461662b254564548613d3916ba4726c28c))
* **web-client:** spec 003 vertical integration - pages on live API, seed and search ([b9bdccc](https://github.com/Tumi-dev/misak-dictionary/commit/b9bdccce8e29c56a425d62c2405e08702e869947))


### Correcciones

* **types:** align optional query properties with exactOptionalPropertyTypes ([04b0284](https://github.com/Tumi-dev/misak-dictionary/commit/04b0284b0005102153ea67288c0b75940b86bec3))
* **web-client:** align iconKey with shortDescription coherence ([31ef967](https://github.com/Tumi-dev/misak-dictionary/commit/31ef967b7762732df4265dffbc69f38b3a1ef0e9))
* **web-client:** campos index variants as const for animation generator type ([3f686f0](https://github.com/Tumi-dev/misak-dictionary/commit/3f686f0f8439ac366f38be2f11a60673cbc0be34))
* **web-client:** correct ApiMicrofield subniveles property in SubfieldPage test ([2f7fce9](https://github.com/Tumi-dev/misak-dictionary/commit/2f7fce96238dc785f91846e185db7e9c6d5e383f))
* **web-client:** correct Framer Motion animate/transition prop handling in SemanticFieldButton ([e6d6842](https://github.com/Tumi-dev/misak-dictionary/commit/e6d68429ade9196edb015963672207f94bc3b90a))
* **web-client:** update SemanticFieldsLayer tests for name change Ya ([104b556](https://github.com/Tumi-dev/misak-dictionary/commit/104b556ff971cffdb4855c2cdf436c82778dd38b))


### Refactorizaciones

* **agents:** slim router context and align reviewer/devops policies ([d52470e](https://github.com/Tumi-dev/misak-dictionary/commit/d52470e853d0bb93516ad1276305693bb9cf891f))


### Documentacion

* **adr:** add ADR-0004 admin session token security and editorial governance ([b5775d9](https://github.com/Tumi-dev/misak-dictionary/commit/b5775d9854c26e2d765352e0222fbd5df5c1f9c9))
* **agents:** add spec 002 auth-rbac (EARS + Gherkin) ([a83be6e](https://github.com/Tumi-dev/misak-dictionary/commit/a83be6ee7687db0f629eea0e0ef598462af813d1))
* **agents:** add specs 003 (vertical integration) and 004 (content schema design) ([2c3839c](https://github.com/Tumi-dev/misak-dictionary/commit/2c3839ce6365924548d98c942a6ba701ff65f607))
* **agents:** approve spec 004 content schema design with plan and tasks ([a256ac5](https://github.com/Tumi-dev/misak-dictionary/commit/a256ac5861290705e663a8941e160343e7853304))
* **agents:** archive feature 001 (campos responsivos) ([c68fcc4](https://github.com/Tumi-dev/misak-dictionary/commit/c68fcc43eb6f946e85bfb82c22caa28b2a681a7c)), closes [#14](https://github.com/TuMyXx93/misak-dictionary/issues/14)
* **agents:** bootstrap SDD foundation (constitution, steering, feature 001) ([dea0672](https://github.com/Tumi-dev/misak-dictionary/commit/dea06726fe8cb18667e04ee0ef50b206c4e69ee5))
* **agents:** optimize AGENTS.md per enterprise best practices ([c9b1452](https://github.com/Tumi-dev/misak-dictionary/commit/c9b1452d32cff507fc9b0ea449b32bc86ac51d93))
* **agents:** spec 002 auth-rbac plan, tasks and approval ([23f33c6](https://github.com/Tumi-dev/misak-dictionary/commit/23f33c6b23771f7e2ec8931d2739e45bc7fbb5c6))
* **metrics:** sincronizar metricas y estado para release v0.5.0-alpha.0 ([b04908a](https://github.com/Tumi-dev/misak-dictionary/commit/b04908a337035ae79843cc52cf9e1286d5c89fad))
* **ops:** add super_admin runbook and security secrets scanner test (T-029) ([8cc81a8](https://github.com/Tumi-dev/misak-dictionary/commit/8cc81a889083f2ff20b5b849a591f0d1313d81a1))
* **release:** add docs-gate, merge-gate and sync canonical docs for v0.4.0-alpha.0 ([5e72f7b](https://github.com/Tumi-dev/misak-dictionary/commit/5e72f7b543720e0af4e269e9ffe40a4d1957ede9))
* **spec-006:** archivar Spec 006 tras integracion completa de PR [#26](https://github.com/TuMyXx93/misak-dictionary/issues/26) ([6b2fb10](https://github.com/Tumi-dev/misak-dictionary/commit/6b2fb10a8f3702ceef2bb66be8db02ec145c5ddb))
* **spec-006:** update tasks.md progress for A0, A1, and A2 ([ff770ce](https://github.com/Tumi-dev/misak-dictionary/commit/ff770cee0ef579f2fda5e19b2ab52b339e061143))
* **specs:** add atomic tasks and finalize technical plan for spec 006 ([6d0ea3e](https://github.com/Tumi-dev/misak-dictionary/commit/6d0ea3e96dbf831d83a490a6a819c750212c3a4b))
* **specs:** add draft spec 006 panel admin y gobierno editorial ([11d5d39](https://github.com/Tumi-dev/misak-dictionary/commit/11d5d39c4be85c3cf82301a06aebbc29a1022409))
* **specs:** add technical plan for spec 006 and fix R-015 ([c8f0d82](https://github.com/Tumi-dev/misak-dictionary/commit/c8f0d828e9fa62253043b96c5e2b104b19019e51))
* **specs:** approve spec 006 with team decisions D-1..D-8 ([93c884e](https://github.com/Tumi-dev/misak-dictionary/commit/93c884e6c0e883dc43ab2620db0de03e4dd1dc59))
* **tasks:** mark PR A complete with T-030 verification ([7414535](https://github.com/Tumi-dev/misak-dictionary/commit/74145358a7e8a9ee8cd53c08963086648074d636))
* **tasks:** mark PR B complete with T-034 verification ([a4b7451](https://github.com/Tumi-dev/misak-dictionary/commit/a4b7451746dfe02f633efba7f64630744882f0aa))
* **tasks:** mark T-024 through T-029 as done ([3ac7f9b](https://github.com/Tumi-dev/misak-dictionary/commit/3ac7f9b4a3b5c9722cfc716492e6e6b7bc9247a6))


### Testing

* **backend:** add PostgreSQL integration suite for editorial governance (T-028) ([0c44d51](https://github.com/Tumi-dev/misak-dictionary/commit/0c44d51369e9558a12e3de6295396722d2de9cd6))
* **web-client:** add coverage tests for CampoPage, SubfieldPage, MicrofieldPage, router ([57fb021](https://github.com/Tumi-dev/misak-dictionary/commit/57fb02180ac2b8bcdfa91dce86e4b8b0c09b770f))
* **web-client:** add tests for CamposIndex semantic fields index page ([17eea89](https://github.com/Tumi-dev/misak-dictionary/commit/17eea89577b740a6864f63cdd27d0ecf0c9891a3))
* **web-client:** add tests for semantic field card components ([85d8b52](https://github.com/Tumi-dev/misak-dictionary/commit/85d8b523993191b03437157ae0247f952bd931a5))
* **web-client:** align tests with fluid typography and dvh layout ([54e3d53](https://github.com/Tumi-dev/misak-dictionary/commit/54e3d53cec68c0c9cdf6b381878daec21f7ffe48))
* **web-client:** aumentar cobertura de useAdmin y adminHttp para umbrales de CI ([98fe6ec](https://github.com/Tumi-dev/misak-dictionary/commit/98fe6ec72cf7d7e780e091f5f8810c045dede596))

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
