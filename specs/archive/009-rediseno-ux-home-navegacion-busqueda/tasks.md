---
id: 009-rediseno-ux-home-navegacion-busqueda
version: 0.4.0
status: archived
---

# Tareas de Implementación — 009-rediseno-ux-home-navegacion-busqueda

> **Spec:** `specs/archive/009-rediseno-ux-home-navegacion-busqueda/spec.md` (`v0.4.0`)
> **Plan:** `specs/archive/009-rediseno-ux-home-navegacion-busqueda/plan.md`

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-001** | **Iconografía SVG y Mapeo Canónico de Campos Semánticos**: Corregir `SLUG_TO_CONFIG_ID` en `apps/web-client/src/constants/semanticFields.ts` (`tra-tul` y `kau-ushamera`), añadir claves `'mountain-farm'` y `'cosmos-grid'` en `apps/web-client/src/types/semanticField.ts`, y rediseñar en `apps/web-client/src/components/features/semantic-fields/SemanticFieldIcon.tsx` los 4 iconos integrados (`house`, `garden`, `mountain-farm`, `wildlife`) más el icono global `cosmos-grid`. | R-004, R-005 | done |
| **T-002** | **Modelo Unificado Polimórfico de Botones (`SemanticFieldButton`)**: Refactorizar `apps/web-client/src/components/features/semantic-fields/SemanticFieldButton.tsx` para soportar `variant="field-node" \| "global-catalog"` y `layoutMode`, aplicando escalado fluido `clamp()`, safe-area clamping en modo espacial y el nuevo diseño sin punto magenta ni flecha para el botón global `"Campos Semánticos"`. | R-001, R-003, R-004 | done |
| **T-003** | **Layout Responsivo Bidimensional en `SemanticFieldsLayer` y `HeroSection`**: Actualizar `apps/web-client/src/components/features/semantic-fields/SemanticFieldsLayer.tsx` y `apps/web-client/src/components/sections/HeroSection.tsx` con media queries compuestas (`(min-width: 1024px) and (min-height: 640px)` para espacial, grid de 2 columnas en tablet portrait `768×1024`, y grid horizontal compacto en móvil landscape `800×360`) e integrar el 8.º botón mediante `SemanticFieldButton`. | R-001, R-002, R-003, R-004 | done |
| **T-004** | **Header Condicional y Navegación Coherente (`useHomeNavigation` + `PublicHeader` + `Home`)**: Crear `apps/web-client/src/hooks/useHomeNavigation.ts` (scroll programático a `#recorrido`, `#simbolos`, `#creditos` + `IntersectionObserver`), actualizar `apps/web-client/src/components/layouts/PublicHeader.tsx` para resaltar dinámicamente el ítem activo real y montar el Header condicional en `apps/web-client/src/pages/Home.tsx`. | R-006, R-007, R-008 | done |
| **T-005** | **Migración SQL de Índices Vectoriales y Normalización Fonética Bilingüe**: Crear `apps/backend-service/prisma/migrations/0012_search_vector_sentidos_trgm/migration.sql` con la función `public.immutable_normalize_namtrik_es(text)` (normalizando `ɵ`/`ø`/`o`/`ə`/`ɔ` e `ɨ`/`i` + `immutable_unaccent`) y los índices GIN (`gin_trgm_ops` y `to_tsvector`) sobre `formas_namtrik` y `sentidos_lexicos`. | R-011 | done |
| **T-006** | **Búsqueda Bilingüe Vectorizada y Contrato `camelCase` en `PalabraRepository`**: Actualizar `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` para normalizar consultas en Namtrik y castellano, calcular ranking híbrido, retornar propiedades en `camelCase` (`namtrikTermino`, `espanolTermino`, `categoriaGramatical`) y resolver `ubicacion` jerárquica multinivel (Campo, Subcampo, Microcampo/Subnivel). | R-009, R-010, R-011 | done |
| **T-007** | **Rediseño del Buscador `SearchBox.tsx` (WAI-ARIA Combobox) y Cliente API**: Actualizar `apps/web-client/src/services/dictionaryApi.ts` y `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` para renderizar lema Namtrik, categoría gramatical, glosa en castellano y ruta taxonómica, con soporte de teclado (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) y limpieza rápida. | R-009, R-010, R-011, R-012 | done |
| **T-008** | **Suite de Tests Unitarios y de Integración (Gherkin → Vitest)**: Añadir y actualizar pruebas en `HeroSection.test.tsx`, `CamposIndex.test.tsx`, `PublicHeader.test.tsx`, `Home.test.tsx`, `SearchBox.test.tsx` y `PalabraRepository.test.ts` cubriendo todos los escenarios Gherkin de R-001 a R-012. | R-001..R-012 | done |
| **T-009** | **Verificación Integral de Calidad (`pnpm ci`, `pnpm test:coverage`, `pnpm build:web`, `pnpm build:backend`)**: Validar cero errores de lint/tipos, 100% de tests en verde y umbrales de cobertura cumplidos. | R-001..R-012 | done |

## Enmienda 0.2.0

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-010** | Botón global colapsable dentro de `SemanticFieldsLayer` con `layoutMode` compartido. | R-013 | done |
| **T-011** | Migración `0013_search_ranking_misak` (normalización v2, `misak_glosa_cabeza`, `misak_sort_key`, REINDEX). | R-014, R-017 | done |
| **T-012** | Ranking por niveles en una sola consulta en `PalabraRepository` + campo `coincidencia`. | R-015 | done |
| **T-013** | `SearchBox`: lupa submit, una sola X, solo chip `ɵ`, búsqueda inmediata, insignia de coincidencia. | R-016 | done |
| **T-014** | Tests unitarios (frontend/backend) de R-013..R-016. | R-013..R-016 | done |
| **T-015** | Tests de integración contra BD real (casos `waara`, `vaca`, `kɵsak/køsak/k∅sak/kosak`). | R-018 | done |
| **T-016** | Verificación integral (Biome, tsc, builds, cobertura ≥ 70 %, `docs-gate`). | R-013..R-018 | done |

## Enmienda `0.3.0` — Tarjetas Interactivas con Volteo 3D y Lectura Progresiva en "Símbolos del pueblo Misak"

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-017** | **Contrato Cultural en `assets.ts` y Validación `U+0275`**: Definir la interfaz `SymbolCardDetails` en `apps/web-client/src/constants/assets.ts` e incorporar el contenido oficial en castellano (`intro`, `items`, `outro`) para la Bandera y el Escudo del pueblo Misak en `TEXTS.GALLERY.IMAGES`, normalizando los términos Namtrik embebidos (`Kɵtrak`, `Kausrɵ`, `Tsurɵpall`, `pishintɵ waramik`) al grafema canónico `ɵ` (`U+0275`). | R-019 | done |
| **T-018** | **Hook `useAutoScroll` y Suite Unitaria Sin Fugas de Memoria**: Crear `apps/web-client/src/hooks/useAutoScroll.ts` con acumulador flotante sobre `requestAnimationFrame` (`~26px/s`), retardo inicial (`~1.4s`), detención inmediata por interacción manual (`wheel`, `touchmove`, `pointerdown` o pausa), reinicio a `scrollTop = 0` al cerrarse y limpieza determinista en `useEffect`; añadir `useAutoScroll.test.tsx`. | R-021, R-023 | done |
| **T-019** | **Componente `<SymbolFlipCard />` y Tests TDD**: Implementar `apps/web-client/src/components/sections/SymbolFlipCard.tsx` con volteo 3D (`rotateY(180deg)`, `perspective: 1200px`, `backface-visibility: hidden`), realce cromático magenta `#E52D6D`, soporte multimodal (hover, teclado `Enter`/`Space`/`Escape` y toque táctil con controles `>= 48px`), degradación para `prefers-reduced-motion` y modo estático cuando `details` está ausente; crear `SymbolFlipCard.test.tsx`. | R-020, R-021, R-022, R-023 | done |
| **T-020** | **Integración en `GallerySection.tsx` y Ampliación de `GallerySection.test.tsx`**: Conectar `<SymbolFlipCard />` en `apps/web-client/src/components/sections/GallerySection.tsx` y ampliar `GallerySection.test.tsx` verificando el significado completo de Bandera y Escudo, la normalización `U+0275`, el volteo interactivo y la tarjeta estática del Logo. | R-019, R-020, R-022, R-023 | done |
| **T-021** | **Verificación Integral de Calidad y Cierre de Enmienda `0.3.0`**: Ejecutar `biome ci .`, `tsc`, suite completa de Vitest, `pnpm build:web` y actualizar `tasks.md` a `done`. | R-019..R-023 | done |

## Enmienda `0.4.0` — Navegación Unificada del Header, Monografemas Namtrik, Parametrización Regex y Transparencia Semántica

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-022** | **Navegación Unificada hacia `/campos` en `PublicHeader.tsx` y Tests de Regresión**: Restringir la intercepción de scroll en `handleLinkClick` exclusivamente a enlaces de ancla del Home (`'/'` y `'/#*'`), permitiendo la navegación SPA hacia `'/campos'` desde desktop y drawer móvil; unificar metadatos (`PRIMARY_CAMPOS_NAV`), `aria-label` y `aria-current="page"` con el botón móvil `"Campos"`, y añadir pruebas de transición real en `PublicHeader.test.tsx`. | R-024, R-028 | done |
| **T-023** | **Parametrización Regex (`escapePostgresRegex`), Modo Léxico 1 Carácter y Metadatos Semánticos en `PalabraRepository.ts`**: Exportar `escapePostgresRegex` y `buildSearchExcerpt`, inyectar `\m<q>` y `\m<q>\M` como parámetros enlazados en `$queryRaw`, restringir consultas de 1 carácter a los niveles `1..4`, evaluar `namtrik_contexto` con diccionario `'simple'` y retornar `campoCoincidencia` + `extractoCoincidencia`. | R-025, R-026, R-027 | done |
| **T-024** | **Pruebas Unitarias y de Integración del Motor de Búsqueda (`PalabraRepository.test.ts` + `searchRankingMisak.integration.test.ts`)**: Validar `escapePostgresRegex`, `buildSearchExcerpt`, búsqueda de 1 carácter (`"ú"` / `"u"` → `Ú — Flor`), recuperación de nivel `5` vía Prisma (`"estrella"` → `Kɵnchapik`, `"mundo"` → `Kɵrɵishik` y `Munásrɵ?`), coincidencias en descripción con extracto (`"mundo"` → `Tsurik` en nivel `7`) y resiliencia ante metacaracteres (`"pura("`). | R-025, R-026, R-027, R-028 | done |
| **T-025** | **Habilitación de Consultas de 1 Carácter y Transparencia Semántica en `SearchBox.tsx`, `useDictionary.ts` y `dictionaryApi.ts`**: Habilitar consultas con `length >= 1` en `useSearchWords` y `SearchBox`, mapear `campoCoincidencia` y `extractoCoincidencia` en `dictionaryApi.ts`, mostrar insignia `"En descripción"` + extracto contextual en `SearchBox.tsx` y ampliar `SearchBox.test.tsx`. | R-025, R-027, R-028 | done |
| **T-026** | **Verificación Integral de Calidad y Cierre de Enmienda `0.4.0`**: Ejecutar `biome check`, `tsc` (frontend y backend), suites unitarias y de integración (`RUN_INTEGRATION=1`), `pnpm build:web`, `pnpm build:backend` y actualizar `tasks.md` a `done`. | R-024..R-028 | done |
