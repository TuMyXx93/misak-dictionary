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
│   └── web-client/          # Frontend React + Vite
│       ├── src/
│       │   ├── components/  # Componentes React
│       │   ├── pages/       # Páginas/rutas
│       │   ├── hooks/       # Custom hooks
│       │   ├── utils/       # Utilidades
│       │   └── test/        # Configuración de tests
│       ├── vitest.config.ts # Config de Vitest
│       └── package.json
├── packages/                # Paquetes compartidos (futuro)
├── services/                # Backend services (futuro)
├── scripts/                 # Scripts de automatización
│   ├── check-package-manager.js  # Validación de pnpm
│   └── sync-pnpm-version.js      # Sincronización de versión
├── docs/                    # Documentación
├── .npmrc                   # Configuración de pnpm
├── pnpm-workspace.yaml      # Configuración monorepo
└── package.json             # Root package
```

---

## 🎯 Stack Tecnológico

### Frontend

- **Framework**: React 19.1+
- **Build Tool**: Vite 7+
- **TypeScript**: 5.9+
- **Routing**: React Router v7
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **State**: Zustand + TanStack Query

### Testing

- **Framework**: Vitest 3.2+
- **Testing Library**: React Testing Library 16+
- **Coverage**: V8
- **Environment**: jsdom 27+

### Dev Tools

- **Package Manager**: pnpm 10.18+
- **Linter**: ESLint 9+
- **Formatter**: Prettier 3+
- **Git Hooks**: Husky + lint-staged

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

## 🌟 Proyecto Pionero

Primer diccionario cultural con arquitectura enterprise para preservación digital de lenguas indígenas.

**Comunidad**: Pueblo Misak (Guambianos) - Cauca, Colombia  
**Lengua**: Namtrik (Wam)

---

**Última actualización**: 2025-10-10  
**Versión**: 1.0.0  
**Package Manager**: pnpm@10.18.2
