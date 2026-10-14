---
id: conventions
version: 1.0.0
status: active
description: >
  Convenciones de código, testing y proceso, verificadas contra biome.json,
  hooks de Husky y skills existentes. Complementa, no reemplaza, la configuración.
---

# Steering — Convenciones

## Código (verificado contra `biome.json` y skills)

- **Exports:** named exports por defecto (componentes y hooks); constantes exportadas
  como `const` con nombre en MAYÚSCULAS (`allowConstantExport` activo en Biome).
- **Formato:** 2 espacios, comillas simples en TS, dobles en JSX, `trailingCommas: all`,
  punto y coma siempre, línea máxima 100, finales LF.
- **Identificadores:** inglés (`isExpanded`, `fieldId`); copy y tests en español.
- **Componentes:** PascalCase, un componente principal por archivo, props interface
  `NombreProps` con JSDoc describiendo el módulo.
- **Hooks:** `useX` camelCase; estado inmutable; limpieza de timers/subscripciones
  en `cleanup`.
- **CSS:** Tailwind v4 con tokens `@theme` en `src/index.css`; sin valores hardcoded
  donde exista token; responsive mobile-first (`sm`/`md`/`lg`); container queries
  (`@container`/`@md`) para componentes auto-contenidos.
- **Animación:** solo Framer Motion; `useReducedMotion` obligatorio en loops/drift;
  transiciones ≤ 0.5s salvo secuencias narrativas documentadas.
- **Backend:** Clean Architecture — `domain` sin dependencias externas; casos de uso
  en `application`; Prisma solo en `infrastructure`; controllers Fastify + Zod en
  `presentation`. Errores vía `AppError`.

## Testing (skill `vitest-testing`)

- Tests colocados junto al código: `Componente.test.tsx`.
- Estructura Arrange / Act / Assert; `describe` en español describiendo el sujeto.
- Mocks solo de fronteras externas (red, timers, matchMedia vía helpers).
- Mocks globales compartidos en `src/test/setup.ts` (p. ej. `useRotatingText`).
- Suite verde antes de commit; cobertura se mide con `test:coverage`.

## Proceso

- **Commits:** Conventional Commits (`type(scope): descripción`).
  Tipos: `feat`, `fix`, `test`, `refactor`, `perf`, `docs`, `chore`, `build`, `ci`.
  Referencia a spec obligatoria en features: `Refs: specs/features/NNN-slug`.
- **Ramas:** `<tipo>/<slug-descriptivo>` desde `dev`; PR a `dev`; `main` solo recibe
  merges controlados desde `dev`.
- **Gates:** `version-gate` (pre-tarea) → `docs-gate` → `merge-gate` (pre-integración).
- **Releases:** `commit-and-tag-version`; CHANGELOG generado desde commits.
- **Memoria:** decisión/bug/patrón → `mem_save` inmediato; cierre de sesión →
  `mem_session_summary`.

## Idioma

- UI, tests, docs y commits: español.
- Código, identificadores, comentarios JSDoc: inglés técnico.
