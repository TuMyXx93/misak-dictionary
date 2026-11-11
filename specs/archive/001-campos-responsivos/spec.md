---
id: 001-campos-responsivos
version: 1.0.0
status: archived
cultural-gate: false
created: 2026-10-14
retroactive: true
---

# 001 — Campos semánticos y landing responsive mobile-first

## Contexto

El landing y las páginas de campos semánticos se diseñaron inicialmente solo para
desktop: secciones con `h-screen` (roto en móviles con barras dinámicas), botones
de campo posicionados absolutamente con animación de deriva continua, y una paleta
verde de borrador. El trabajo pendiente en el working tree (rama `dev`, WIP del
2026-10-13) implementa el overhaul mobile-first: viewport dinámico, layout dedicado
para móvil, tipografía fluida, container queries y paleta definitiva de la bandera.

Esta spec **documenta retroactivamente** ese WIP para validar el formato SDD sin
trabajo de descubrimiento adicional y fijar los requisitos como regresión perpetua.

## Requisitos (EARS)

- **R-001** — CUANDO el viewport mide menos de 768px de ancho, EL SISTEMA DEBERÁ
  renderizar los botones de campo semántico como chips relativos dispuestos en
  flujo (`flex-wrap`), en lugar de botones absolutos flotantes sobre la imagen.
- **R-002** — MIENTRAS el layout sea móvil, EL SISTEMA NO DEBERÁ aplicar deriva
  continua (`drift`), escalado por hover ni retraso de auto-colapso a los botones
  de campo; las etiquetas DEBERÁN mostrarse expandidas desde el inicio.
- **R-003** — Las secciones de altura completa (`MainLayout`, `HeroSection`,
  `GallerySection`) DEBERÁN usar `min-h-dvh` (altura de viewport dinámica) en lugar
  de `h-screen`.
- **R-004** — CUANDO `LazyImage` reciba una URL de `googleusercontent.com` sin
  `srcSet` explícito, EL SISTEMA DEBERÁ generar automáticamente un `srcSet`
  responsivo con anchos 320, 640, 1024 y 1920.
- **R-005** — El título del hero DEBERÁ rotar entre los textos
  «Bienvenidos a», «Wamtɵrmarɵpik», «Diccionario Misak», «Namtrik – Castellano»
  cada 4000ms con transición de opacidad de 400ms.
- **R-006** — Toda animación nueva DEBERÁ degradar a estado estático cuando el
  usuario tenga `prefers-reduced-motion` activo.
- **R-007** — El breadcrumb de las páginas de campo DEBERÁ usar marcado semántico
  (`<ol>`/`<li>`) con `aria-current="page"` en el último elemento y truncado
  controlado en móvil.
- **R-008** — Los controles interactivos de campo DEBERÁN mantener tap target
  ≥ 48×48px en el breakpoint más pequeño.
- **R-009** — Las tarjetas auto-contenidas (`SubfieldCard`, `MicrofieldCard`)
  DEBERÁN usar container queries (`@container` + `@md`) para su layout interno,
  independientemente del viewport.
- **R-010** — La paleta visual DEBERÁ definirse como tokens `@theme` en
  `index.css` con los colores de la bandera (primary rosa, secondary azul,
  fondos negros) más una escala de tipografía fluida (`text-fluid-hero/h1/h2`).

## Criterios de aceptación (Gherkin)

### R-003

```gherkin
Escenario: Secciones usan altura de viewport dinámica
  Dado que el usuario abre el landing en cualquier dispositivo
  Cuando se renderizan HeroSection, GallerySection y MainLayout
  Entonces cada sección declara la clase min-h-dvh
  Y la clase h-screen ya no se usa en esas secciones
```

### R-004

```gherkin
Escenario: Imagen remota recibe srcSet autogenerado
  Dado un LazyImage con src "https://...googleusercontent.com/...=s800"
  Y sin prop srcSet
  Cuando se renderiza la etiqueta img
  Entonces el srcSet contiene descriptores =w320, =w640, =w1024 y =w1920
```

### R-005

```gherkin
Escenario: Título del hero rota
  Dado el hook useRotatingText con 4 textos e intervalMs 4000
  Cuando transcurren 4000ms
  Entonces displayText cambia al texto siguiente
  Y con prefers-reduced-motion, displayText permanece en el primer texto
```

### R-001 / R-002

```gherkin
Escenario: Layout móvil de botones de campo
  Dado un viewport de 375px de ancho
  Cuando se renderiza SemanticFieldsLayer
  Entonces los SemanticFieldButton usan posicionamiento relativo en flujo wrap
  Y las etiquetas de nombre aparecen expandidas
  Y no se aplica animación de deriva
```

## Fuera de alcance

- Router/navegación nueva (ya existente; solo se ajusta layout).
- Backend, persistencia y datos de términos (incluidos como constantes estáticas).
- Animación cinemática territorio→fogón (plateada para fase futura).

## Trazabilidad

| Requisito    | Archivos                                                                                                                           | Tests                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| R-001, R-002 | `src/components/features/semantic-fields/SemanticFieldsLayer.tsx`, `SemanticFieldButton.tsx`, `src/hooks/useMediaQuery.ts` (nuevo) | Suite verde 218/218                                                     |
| R-003        | `src/components/layouts/MainLayout.tsx`, `sections/HeroSection.tsx`, `sections/GallerySection.tsx`                                 | `MainLayout.test.tsx`, `GallerySection.test.tsx`, `pages/Home.test.tsx` |
| R-004        | `src/components/ui/LazyImage.tsx`                                                                                                  | Cubierto por tests de secciones                                         |
| R-005        | `src/hooks/useRotatingText.ts` (nuevo), `sections/HeroSection.tsx`                                                                 | Mock en `src/test/setup.ts`; `HeroSection.test.tsx`                     |
| R-007        | `features/semantic-fields/FieldBreadcrumb.tsx`                                                                                     | Suite verde                                                             |
| R-008        | `features/semantic-fields/SemanticFieldButton.tsx`                                                                                 | Suite verde                                                             |
| R-009        | `features/semantic-fields/SubfieldCard.tsx`, `MicrofieldCard.tsx`                                                                  | Suite verde                                                             |
| R-010        | `src/index.css`, `sections/HeroSection.tsx`                                                                                        | `HeroSection.test.tsx` (`text-fluid-hero`)                              |

**Estado de implementación:** implementada y mergeada en dev (2026-10-15, PR #14). 218/218 tests verdes; formato aplicado (T-011).
Biome reporta solo diferencias de formato autocorregibles (ver `tasks.md`).
