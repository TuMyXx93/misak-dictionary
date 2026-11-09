---
id: 010-tipografia-identidad-grafema-namtrik
version: 0.2.0
status: done
---

# Tareas de Implementación — 010-tipografia-identidad-grafema-namtrik

> **Spec:** `specs/archive/010-tipografia-identidad-grafema-namtrik/spec.md` (`v0.2.0`)
> **Plan:** `specs/archive/010-tipografia-identidad-grafema-namtrik/plan.md`
> **ADR:** `specs/adr/0006-tipografia-compuesta-armonizacion-grafema-namtrik.md`

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-001** | **Pila Tipográfica Compuesta y Tokens en `src/index.css`**: Configurar reglas `@font-face` con `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` acopladas a `'Noto Sans'` con `size-adjust: 96%`, definir tokens `--font-display`, `--font-body` y `--font-sans` en `@theme`, y desactivar `font-synthesis: none` en encabezados. | R-001, R-002, R-003 | done |
| **T-002** | **Normalizador Ortográfico Canónico (`namtrikText.ts`)**: Crear `apps/web-client/src/utils/namtrikText.ts` con la función `normalizeNamtrikGraphemes`, la constante `MISAK_BRAND_NAME = 'Wamtɵrmarɵpik'`, y escribir su suite de tests unitarios en `namtrikText.test.ts`. | R-006, R-007 | done |
| **T-003** | **Componente Canónico de Marca (`<MisakWordmark />`)**: Implementar `apps/web-client/src/components/ui/MisakWordmark.tsx` con variantes de escala (`hero`, `login`, `header`, `drawer`, `compact`), `font-bold`, `font-kerning: normal` y pruebas unitarias en `MisakWordmark.test.tsx`. | R-004 | done |
| **T-004** | **Integración de `<MisakWordmark />` en Home, Header y Login**: Actualizar `apps/web-client/src/components/sections/HeroSection.tsx`, `apps/web-client/src/components/layouts/PublicHeader.tsx` y `apps/web-client/src/pages/admin/LoginPage.tsx`, erradicando el uso de `font-extrabold`. | R-003, R-004 | done |
| **T-005** | **Homologación de Chips de Inserción Namtrik**: Actualizar `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` y `apps/web-client/src/components/admin/CampoNamtrik.tsx` para usar `font-display font-bold` eliminando `font-mono` en el grafema `ɵ`. | R-005 | done |
| **T-006** | **Verificación Integral y Suite de Regresión**: Ejecutar `./node_modules/.bin/biome check . --diagnostic-level=error`, compilación TypeScript (`tsc -b`), y suite de tests completa de Vitest para confirmar 100% de tests en verde y cero regresiones. | R-001..R-007 | done |

## Enmienda `0.2.0` — Jerarquía Tipográfica y Rol Cromático de Títulos de Sección (Opción A′)

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-007** | **Escala Fluida `h3` y Resolución `twMerge`**: Añadir `--font-size-fluid-h3` y `.text-fluid-h3` en `apps/web-client/src/index.css` (consolidando el retiro de `.misak-selvedge-divider`), registrar `'text-fluid-h3'` en `extendTailwindMerge` dentro de `apps/web-client/src/utils/cn.ts` y ampliar la validación estática en `apps/web-client/src/utils/namtrikText.test.ts`. | R-008, R-012 | done |
| **T-008** | **Primitiva Canónica `<SectionHeading />` y Tests TDD**: Crear `apps/web-client/src/components/ui/SectionHeading.tsx` (`as: 'h1' \| 'h2' \| 'h3'`, `align`, `accent: 'none' \| 'band'` con `'none'` por defecto bajo Opción A′, `text-white`, `font-display font-bold`, `fontSynthesis: 'none'`), re-exportarlo en `src/components/ui/index.ts` y escribir `SectionHeading.test.tsx`. | R-008, R-009, R-012 | done |
| **T-009** | **Unificación de Títulos y Regiones `aria-labelledby` en la Home**: Integrar `<SectionHeading />` en `VideoSection.tsx`, `InfoSection.tsx`, `GallerySection.tsx` y `CreditsSection.tsx` (incluyendo `as="h3"` en *Contacto* y divisor neutro `border-white/15`), consolidar el retiro de `MisakSelvedgeDivider` (`MisakBandStripe.tsx`, `LoginPage.tsx`, `CambiarPasswordPage.tsx`) y actualizar `VideoSection.test.tsx`, `InfoSection.test.tsx`, `GallerySection.test.tsx` y `CreditsSection.test.tsx`. | R-010, R-011, R-012 | done |
| **T-010** | **Homologación de `h1` Fluido en Catálogo y Jerarquía Taxonómica**: Migrar los encabezados `h1` de `CamposIndex.tsx` y `FieldHero.tsx` a `text-fluid-h1` en `text-white` (consolidando los ajustes de `SearchBox.tsx` y `SearchBox.test.tsx`) y ampliar `CamposIndex.test.tsx` para verificar `text-fluid-h1` y ausencia de `text-primary`. | R-010, R-011, R-012 | done |
| **T-011** | **Regla de Gobernanza en Steering (`conventions.md`)**: Documentar en `specs/steering/conventions.md` el principio de rol cromático tipográfico (`<SectionHeading />` obligatorio para títulos de sección y prohibición de `text-primary` en `h1–h3` estáticos públicos). | R-012 | done |
| **T-012** | **Verificación Integral de Calidad y Cierre de Enmienda**: Ejecutar `biome ci .`, `tsc` (`web-client` y `backend-service`), `pnpm agents:check`, suite completa de Vitest con cobertura y `pnpm build:web`, verificar cero referencias a `MisakSelvedgeDivider` y actualizar `tasks.md` a `done`. | R-008..R-012 | done |
