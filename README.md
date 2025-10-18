# Model Dictionary v1 - Diccionario Cultural Misak 🌄

[![Tests](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/test.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/test.yml)
[![Code Quality](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/lint.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/lint.yml)
[![Build](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/build.yml/badge.svg)](https://github.com/Tumi-dev/misak-dictionary/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/Tumi-dev/misak-dictionary/branch/main/graph/badge.svg)](https://codecov.io/gh/Tumi-dev/misak-dictionary)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.2-yellow.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Plataforma Enterprise de Preservación Cultural Digital**

Sistema pionero de diccionario cultural para la comunidad indígena Misak de Colombia, integrando arquitectura enterprise con storytelling inmersivo.

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js**: `>= 22.19.0` ([Instalar Node.js](https://nodejs.org/))
- **pnpm**: `>= 10.18.2` ⚠️ **REQUERIDO** (ver instalación abajo)

> ⚠️ **IMPORTANTE**: Este proyecto **SOLO** funciona con `pnpm`. Usar `npm` o `yarn` causará conflictos graves que pueden congelar tu sistema.

### 📦 Instalación de pnpm

Si no tienes pnpm instalado:

```bash
# Opción 1: Via npm (una sola vez)
npm install -g pnpm@10.18.2

# Opción 2: Via script de instalación
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verificar instalación
pnpm --version  # Debe mostrar 10.18.2 o superior
```

### ⚡ Instalación del Proyecto

```bash
# Clonar el repositorio
git clone <repository-url>
cd model-dictionary-v1

# Instalar dependencias (SOLO con pnpm)
pnpm install

# Verificar que todo funciona
pnpm dev:web
```

### 🔄 Sincronización de Versión pnpm

Si actualizas pnpm globalmente, sincroniza el proyecto:

```bash
# Actualizar pnpm globalmente
npm install -g pnpm@latest

# Sincronizar versión en el proyecto
pnpm sync-pnpm

# Reinstalar dependencias
pnpm install
```

---

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
# Iniciar frontend en modo desarrollo
pnpm dev:web

# Previsualizar build de producción
pnpm preview:web
```

### Testing

```bash
# Ejecutar todas las pruebas (recomendado)
pnpm test

# Modo watch (desarrollo) - ejecuta tests al guardar
pnpm --filter web-client vitest

# UI Mode (interfaz gráfica en navegador)
pnpm test:ui

# Coverage (cobertura de código)
pnpm test:coverage
```

### Calidad de Código

```bash
# Verificar código con ESLint
pnpm lint
pnpm lint:web

# Autofix de problemas
pnpm lint:fix

# Formatear código con Prettier
pnpm format

# Verificar formato
pnpm format:check
```

### Build

```bash
# Build de producción
pnpm build:web
```

### Utilidades

```bash
# Sincronizar versión de pnpm del proyecto con versión global
pnpm sync-pnpm
```

---

## 📁 Estructura del Proyecto

```
model-dictionary-v1/
├── apps/
│   ├── web-client/              # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/      # Componentes React
│   │   │   │   ├── ui/          # Componentes UI (Button, LazyImage, etc.)
│   │   │   │   ├── layouts/     # Layouts (MainLayout)
│   │   │   │   ├── sections/    # Secciones (Hero, Video, Gallery, etc.)
│   │   │   │   └── features/    # Features (SocialLinks, ScrollIndicator)
│   │   │   ├── pages/           # Páginas/rutas (Home, NotFound)
│   │   │   ├── hooks/           # Custom hooks (useLazyImage)
│   │   │   ├── utils/           # Utilidades (cn)
│   │   │   ├── constants/       # Constantes (assets)
│   │   │   └── test/            # Configuración de tests
│   │   ├── public/              # Assets públicos + PWA
│   │   ├── vite.config.ts       # Config de Vite + PWA
│   │   ├── vitest.config.ts     # Config de Vitest
│   │   └── package.json
│   └── admin-panel/            # Panel admin (futuro)
│
├── services/                    # Backend microservices (en desarrollo)
│   ├── api-gateway/            # Gateway unificado
│   ├── dictionary-service/     # Core diccionario + CRUD
│   ├── search-service/         # Motor búsqueda semántica
│   ├── auth-service/           # Autenticación + autorización
│   └── content-service/        # Gestión multimedia
│
├── packages/                    # Paquetes compartidos
│   ├── shared-types/           # Types TypeScript compartidos
│   ├── ui-components/          # Design system completo
│   ├── utils/                  # Utilidades compartidas (futuro)
│   └── database/               # Schemas Prisma + migrations (futuro)
│
├── tools/                       # Herramientas desarrollo
│   ├── build-tools/            # Configuraciones build (futuro)
│   ├── testing-tools/          # Utilidades testing (futuro)
│   └── generators/             # Code generators (futuro)
│
├── infrastructure/              # DevOps y deployment
│   ├── docker/                 # Configuraciones Docker (futuro)
│   ├── kubernetes/             # K8s manifests (futuro)
│   └── terraform/              # Infrastructure as Code (futuro)
│
├── scripts/                     # Scripts de automatización
│   ├── check-package-manager.cjs  # Validación de pnpm
│   └── sync-pnpm-version.js       # Sincronización de versión
│
├── docs/                        # Documentación
│   ├── project.md               # Documentación master del proyecto
│   ├── CURRENT-STATE.md         # Estado actual del proyecto
│   ├── development/             # Planes y guías
│   ├── reports/                 # Reportes históricos
│   └── testing/                 # Guías de testing
│
├── .github/                     # GitHub Actions workflows
│   └── workflows/               # CI/CD pipelines
│
├── .npmrc                       # Configuración de pnpm
├── pnpm-workspace.yaml          # Configuración monorepo
├── package.json                 # Root package
├── tsconfig.json                # TypeScript config base
├── CHANGELOG.md                 # Registro de cambios
└── README.md                    # Este archivo
```

---

## 🎯 Stack Tecnológico

### Frontend

- **Framework**: React 19.1+
- **Build Tool**: Vite 7+
- **TypeScript**: 5.9+
- **Routing**: React Router v7
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion 12+
- **Forms**: React Hook Form 7+ + Zod 4+
- **State Management**: Zustand 5+ + TanStack Query 5+
- **PWA**: vite-plugin-pwa 0.21+ + Workbox 7+

### Backend (En desarrollo)

- **Runtime**: Node.js 22+ LTS
- **Framework**: Fastify 5+
- **ORM**: Prisma 6+
- **Database**: PostgreSQL 17+
- **Search Engine**: ElasticSearch 8.19+
- **Cache**: Redis 8+
- **CDN**: Cloudinary (multimedia)
- **Architecture**: Clean Architecture + Domain-Driven Design
- **Patterns**: CQRS + Event Sourcing

### Testing

- **Framework**: Vitest 3.2+
- **Testing Library**: React Testing Library 16+
- **Coverage**: V8
- **Environment**: jsdom 27+
- **E2E**: Playwright (planificado)
- **Coverage Target**: > 80%

### Infrastructure & DevOps

- **Containerization**: Docker + Docker Compose v2.39+
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (planificado)
- **Logging**: ELK Stack v8+ (planificado)
- **Error Tracking**: Sentry (planificado)
- **CDN/Security**: Cloudflare
- **Package Manager**: pnpm 10.18+

### Dev Tools

- **Linter**: ESLint 9+
- **Formatter**: Prettier 3+
- **Git Hooks**: Husky 9+ + lint-staged
- **Bundle Analyzer**: rollup-plugin-visualizer 5+
- **Type Checking**: TypeScript Strict Mode

### Arquitectura del Proyecto

- **Patrón**: Monorepo (pnpm workspaces)
- **Apps**: web-client (frontend principal), admin-panel (futuro)
- **Services**: dictionary-service, search-service, auth-service (en desarrollo)
- **Packages**: shared-types (TypeScript compartido), ui-components (Design System)
- **Infrastructure**: Docker configurations, Terraform IaC (planificado)

---

## 🏛️ Arquitectura y Patrones de Diseño

### Arquitectura Monorepo

El proyecto utiliza un **monorepo** gestionado con **pnpm workspaces** que permite:

- **Code sharing eficiente**: Types, componentes y utilidades compartidas entre apps y services
- **Versionado unificado**: Toda la aplicación tiene la misma versión
- **Testing integrado**: Tests coordinados entre frontend y backend
- **Deploy sincronizado**: Builds y deployments coordinados

### Clean Architecture + Domain-Driven Design

Los servicios backend siguen **Clean Architecture** y **DDD**:

```
services/dictionary-service/
├── domain/              # Lógica de negocio pura
│   ├── entities/       # Entidades de dominio
│   ├── repositories/   # Interfaces de repositorios
│   └── services/       # Servicios de dominio
├── application/         # Casos de uso
│   ├── commands/       # Comandos (write)
│   ├── queries/        # Consultas (read)
│   └── handlers/       # Manejadores
├── infrastructure/      # Implementaciones
│   ├── database/       # Prisma ORM
│   ├── search/         # ElasticSearch
│   └── cache/          # Redis
└── presentation/        # API HTTP
    ├── controllers/    # Controladores
    └── middleware/     # Middleware
```

### Patrones Implementados

- **CQRS** (Command Query Responsibility Segregation): Separación de operaciones de lectura y escritura
- **Event Sourcing**: Auditoría completa de cambios (crítico para preservación cultural)
- **Repository Pattern**: Abstracción de acceso a datos
- **Dependency Injection**: Desacoplamiento de dependencias
- **Factory Pattern**: Creación de objetos complejos

### Type Safety End-to-End

```typescript
// Types compartidos entre frontend y backend
import { WordEntity, SearchFilters } from '@packages/shared-types';

// Frontend
const results: WordEntity[] = await searchWords(filters);

// Backend
export const searchWords = async (filters: SearchFilters): Promise<WordEntity[]> => {
  // Implementación
};
```

### Seguridad y Autenticación

- **Acceso Público**: Diccionario completamente público sin autenticación
- **Panel Admin**: JWT + Refresh Tokens con RS256 (solo para administradores)
- **RBAC**: Role-Based Access Control con permisos granulares
- **Rate Limiting**: Protección contra abuso de APIs
- **Input Validation**: Todas las entradas validadas con Zod schemas
- **HTTPS Only**: Comunicaciones encriptadas con TLS 1.3

### Performance y Escalabilidad

- **Code Splitting**: Lazy loading de páginas y componentes
- **PWA**: Offline-first con Service Workers
- **Caching Layers**: L1 (memoria), L2 (Redis), L3 (CDN)
- **ElasticSearch**: Búsqueda rápida y semántica
- **CDN**: Assets estáticos servidos desde Cloudflare
- **Database Optimization**: Índices optimizados y query caching

---

## 🐛 Solución de Problemas

### ❌ Error: "please-use-pnpm"

**Causa**: Intentaste usar `npm` o `yarn` en lugar de `pnpm`.

**Solución**:

```bash
# Instalar pnpm
npm install -g pnpm@10.18.2

# Usar pnpm
pnpm install
pnpm dev:web
```

### ❌ Tests congelan el sistema

**Causa**: Ejecutar tests con `npm` causa conflictos.

**Solución**:

```bash
# Eliminar node_modules
rm -rf node_modules apps/*/node_modules

# Reinstalar con pnpm
pnpm install

# Ejecutar tests
pnpm test
```

---

## 🌟 Proyecto Pionero de Preservación Cultural

### Sobre el Pueblo Misak

El **Pueblo Misak** (también conocido como Guambianos) es una comunidad indígena de Colombia ubicada principalmente en el departamento del Cauca. Su lengua ancestral, el **Namtrik** (o namuiwam), es un elemento fundamental de su identidad cultural.

### Objetivo del Proyecto

Este proyecto representa un **primer diccionario cultural con arquitectura enterprise** para la preservación digital de lenguas indígenas, integrando:

- 📚 **Diccionario Bilingüe**: Namtrik - Español
- 🌎 **Contexto Territorial**: El territorio como metáfora lingüística navegable
- 📸 **Multimedia Cultural**: Audio, imágenes y video del contexto cultural
- 🎭 **Storytelling Inmersivo**: Narrativa cultural interactiva
- 🔍 **Búsqueda Semántica**: Campos semánticos culturales con IA

### Validación Cultural

Todo el contenido cultural está validado y autorizado por:

**Autoridad Cultural**: Cabildo Indígena del Resguardo de Guambia  
**Contacto Institucional**: cabildoguambia@yahoo.es, lingumisak@gmail.com

### Impacto Esperado

- ✅ **Preservación Cultural**: Estándar para diccionarios indígenas digitales
- ✅ **Acceso Universal**: Plataforma abierta sin barreras de entrada
- ✅ **Innovación Tecnológica**: Arquitectura replicable para otras culturas
- ✅ **Academia**: Base para investigación lingüística y antropológica
- ✅ **Comunidad**: Empoderamiento digital del pueblo Misak

---

## 🛣️ Roadmap y Próximos Pasos

### ✅ Week 1-2: Fundación Técnica (Completado)

- [x] Setup monorepo con pnpm workspaces
- [x] Frontend React + TypeScript + Vite
- [x] Testing robusto (177 tests, 98.78% coverage)
- [x] CI/CD con GitHub Actions
- [x] PWA con Service Workers
- [x] Performance optimizada (66KB gzipped)
- [x] Documentación completa

### 🔄 Week 3-4: Backend Core (En Desarrollo)

- [ ] Setup servicios backend con Fastify
- [ ] Database schema con Prisma + PostgreSQL
- [ ] API Gateway básico
- [ ] Autenticación JWT para administradores
- [ ] CRUD básico de palabras

### 🕒 Fase 2: Funcionalidades Core (Q1 2025)

- [ ] Motor de búsqueda con ElasticSearch
- [ ] Panel de administración avanzado
- [ ] Gestión de campos semánticos
- [ ] Sistema de multimedia con Cloudinary
- [ ] API pública documentada (OpenAPI)

### 🚀 Fase 3: Innovación Cultural (Q2 2025)

- [ ] Storytelling inmersivo avanzado
- [ ] Mapas territoriales interactivos
- [ ] IA para relaciones semánticas
- [ ] Sistema de contribuciones comunitarias
- [ ] Múltiples idiomas y contextos culturales

### 🌐 Fase 4: Escalabilidad Global (Q3-Q4 2025)

- [ ] Arquitectura multi-tenant
- [ ] Mobile app (React Native)
- [ ] Analytics y métricas culturales
- [ ] API marketplace para investigadores
- [ ] Soporte para múltiples comunidades indígenas

---

## 📝 Documentación Adicional

Para información más detallada, consulta:

- **[docs/project.md](docs/project.md)**: Documentación master del proyecto (2300+ líneas)
- **[docs/CURRENT-STATE.md](docs/CURRENT-STATE.md)**: Estado actual y progreso detallado
- **[CHANGELOG.md](CHANGELOG.md)**: Registro completo de cambios
- **[docs/testing/TESTING-GUIDE.md](docs/testing/TESTING-GUIDE.md)**: Guía completa de testing
- **[docs/reports/](docs/reports/)**: Reportes exhaustivos por sprint

---

**Última actualización**: 2025-10-18  
**Versión Actual**: v0.2.0-alpha  
**Package Manager**: pnpm@10.18.2  
**Repositorio**: https://github.com/Tumi-dev/misak-dictionary.git
