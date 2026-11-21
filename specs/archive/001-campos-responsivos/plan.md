---
id: 001-campos-responsivos-plan
version: 1.0.0
status: archived
---

# 001 — Plan técnico: responsive mobile-first

## Diseño

**Estrategia de breakpoints con doble fuente controlada.** CSS define los tokens
responsivos; un único hook `useMediaQuery('(min-width: 768px)')` decide la
_distribución_ de los botones de campo (absoluta+deriva en desktop vs flujo wrap
en móvil). El breakpoint 768px coincide con `md` de Tailwind para evitar deriva
entre JS y CSS.

**Nuevos hooks:**

- `useMediaQuery(query)` — `matchMedia` con estado inicial sincrónico y listener
  `change`; SSR-safe (`typeof window`).
- `useRotatingText({ texts, intervalMs, fadeDurationMs })` — rotación de textos con
  fade; con `prefers-reduced-motion` muestra solo el primer texto.

**Layout móvil de campos (`SemanticFieldsLayer` + `SemanticFieldButton`):**

- Desktop: contenedor `absolute inset-0 pointer-events-none`; botones absolutos
  circulares icon-only que expanden en hover/focus; deriva continua tipo semilla.
- Móvil: contenedor `relative w-full max-w-lg mx-auto flex-wrap`; botones chips
  `relative rounded-xl` con etiqueta siempre visible; sin deriva ni hover; el tap
  navega directamente.

**Viewport dinámico:** `h-screen` → `min-h-dvh` en secciones full-height más
`scroll-smooth` e `[-webkit-overflow-scrolling:touch]` en el `MainLayout`.

**Tipografía fluida:** tokens `--font-size-fluid-*` con `clamp()` y utilidades
`.text-fluid-*`; el hero usa `text-fluid-hero`.

**Imágenes:** `LazyImage` deriva `srcSet` automático para URLs de
`googleusercontent.com` (convención `=wNNN` del CDN); `sizes` explícito donde el
layout lo requiere (galería).

**Cards con container queries:** `SubfieldCard`/`MicrofieldCard` pasan a
`@container` con `@md:flex-row` y descripción alineada a la derecha en pantallas
de tarjeta anchas.

**Breadcrumb semántico:** `<ol>`/`<li>`, `aria-current="page"`, truncado
`max-w-[120px] sm:max-w-none`.

**Paleta (tokens `@theme`):**

| Token                         | Valor                 | Antes     |
| ----------------------------- | --------------------- | --------- |
| `--color-primary`             | `#e91e63`             | `#38e07b` |
| `--color-primary-light/-dark` | `#ff69b4` / `#c2185b` | verdes    |
| `--color-secondary`           | `#2196f3`             | `#264532` |
| `--color-background`          | `#000000`             | `#122118` |
| `--breakpoint-xs`             | `475px`               | —         |

**Recalibración de posiciones:** las 7 entradas de `SEMANTIC_FIELDS` reasignan
`position` y `drift` para evitar solapamientos al expandir (solo geometría; los
nombres Misak no cambian — sin gate cultural requerido).

## Cambios por archivo

| Archivo                                                           | Cambio                                              | Requisito    |
| ----------------------------------------------------------------- | --------------------------------------------------- | ------------ |
| `hooks/useMediaQuery.ts` (nuevo)                                  | Hook de breakpoint                                  | R-001        |
| `hooks/useRotatingText.ts` (nuevo)                                | Rotación de título                                  | R-005        |
| `features/semantic-fields/SemanticFieldsLayer.tsx`                | Rama desktop/móvil                                  | R-001, R-002 |
| `features/semantic-fields/SemanticFieldButton.tsx`                | Prop `isMobile`, AnimatePresence, drift condicional | R-002, R-008 |
| `features/semantic-fields/FieldBreadcrumb.tsx`                    | `<ol>` semántica, aria-current, truncado            | R-007        |
| `features/semantic-fields/FieldHero.tsx`                          | Flex responsivo, tamaños por breakpoint             | R-003        |
| `features/semantic-fields/SubfieldCard.tsx`, `MicrofieldCard.tsx` | `@container` / `@md:flex-row`                       | R-009        |
| `features/semantic-fields/TermRow.tsx`                            | Apilado móvil, `break-words`                        | R-003        |
| `layouts/MainLayout.tsx`                                          | `h-dvh`, smooth scroll                              | R-003        |
| `sections/HeroSection.tsx`                                        | Título rotativo, layout reestructurado              | R-003, R-005 |
| `sections/GallerySection.tsx`                                     | `min-h-dvh`, grid 1/2/3, `sizes`                    | R-003        |
| `sections/InfoSection.tsx`                                        | Padding responsivo                                  | R-003        |
| `components/ui/LazyImage.tsx`                                     | Auto `srcSet` googleusercontent                     | R-004        |
| `constants/semanticFields.ts`                                     | Recalibración posiciones/drift                      | R-001        |
| `index.css`                                                       | Paleta bandera, `xs`, tipografía fluida             | R-010        |
| `test/setup.ts`                                                   | Mock `useRotatingText`                              | R-005        |

## Contratos de UI

- `useMediaQuery(query: string): boolean` — `true` si coincide; SSR-safe.
- `useRotatingText({ texts: string[]; intervalMs?: number; fadeDurationMs?: number })`
  → `{ displayText: string; isVisible: boolean }`.
- `SemanticFieldButton` acepta `isMobile?: boolean` (default `false`), sin cambios
  de API existentes.

## Decisiones tomadas

- Layout móvil dedicado (no solo ajuste de estilos): derivado del plan histórico
  "responsive mobile/tablet-first 2026"; evita controles absolutos inoperables
  con gestos táctiles.
- Tipografía fluida vía `clamp()` + tokens, no utilidades breakpoint por breakpoint.
- Mock global de `useRotatingText` en `setup.ts`: garantiza título determinista en
  tests sin tocar cada archivo de test.

## Riesgos y mitigación

| Riesgo                                  | Mitigación                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Doble fuente de verdad 768px (JS + CSS) | Único hook; valor alineado con `md` de Tailwind                                             |
| Snap scroll + `min-h-dvh` en iOS        | `scroll-smooth` + `-webkit-overflow-scrolling: touch`                                       |
| Container queries requieren Tailwind ≥4 | Ya en 4.2.1; verificado                                                                     |
| Cambio de paleta afecta contraste       | Tokens `--color-text` blanco sobre fondos negros; WCAG AA verificado visualmente en revisión |

## Referencias

- ADR-0001 (adopción SDD). Esta spec valida el formato con trabajo real.
- Suite: 218/218 tests verdes (2026-10-13).
