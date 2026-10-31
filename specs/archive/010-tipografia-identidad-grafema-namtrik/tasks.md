# Tareas de Implementación — 010-tipografia-identidad-grafema-namtrik

> **Spec:** `specs/features/010-tipografia-identidad-grafema-namtrik/spec.md`
> **Plan:** `specs/features/010-tipografia-identidad-grafema-namtrik/plan.md`

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-001** | **Pila Tipográfica Compuesta y Tokens en `src/index.css`**: Configurar reglas `@font-face` con `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` acopladas a `'Noto Sans'` con `size-adjust: 96%`, definir tokens `--font-display`, `--font-body` y `--font-sans` en `@theme`, y desactivar `font-synthesis: none` en encabezados. | R-001, R-002, R-003 | done |
| **T-002** | **Normalizador Ortográfico Canónico (`namtrikText.ts`)**: Crear `apps/web-client/src/utils/namtrikText.ts` con la función `normalizeNamtrikGraphemes`, la constante `MISAK_BRAND_NAME = 'Wamtɵrmarɵpik'`, y escribir su suite de tests unitarios en `namtrikText.test.ts`. | R-006, R-007 | done |
| **T-003** | **Componente Canónico de Marca (`<MisakWordmark />`)**: Implementar `apps/web-client/src/components/ui/MisakWordmark.tsx` con variantes de escala (`hero`, `login`, `header`, `drawer`, `compact`), `font-bold`, `font-kerning: normal` y pruebas unitarias en `MisakWordmark.test.tsx`. | R-004 | done |
| **T-004** | **Integración de `<MisakWordmark />` en Home, Header y Login**: Actualizar `apps/web-client/src/components/sections/HeroSection.tsx`, `apps/web-client/src/components/layouts/PublicHeader.tsx` y `apps/web-client/src/pages/admin/LoginPage.tsx`, erradicando el uso de `font-extrabold`. | R-003, R-004 | done |
| **T-005** | **Homologación de Chips de Inserción Namtrik**: Actualizar `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` y `apps/web-client/src/components/admin/CampoNamtrik.tsx` para usar `font-display font-bold` eliminando `font-mono` en el grafema `ɵ`. | R-005 | done |
| **T-006** | **Verificación Integral y Suite de Regresión**: Ejecutar `./node_modules/.bin/biome check . --diagnostic-level=error`, compilación TypeScript (`tsc -b`), y suite de tests completa de Vitest para confirmar 100% de tests en verde y cero regresiones. | R-001..R-007 | done |
