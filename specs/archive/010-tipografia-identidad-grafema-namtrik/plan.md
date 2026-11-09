# Plan Técnico — 010-tipografia-identidad-grafema-namtrik

> **Spec:** `specs/archive/010-tipografia-identidad-grafema-namtrik/spec.md` (`v0.2.0` — `approved`)
> **ADR:** `specs/adr/0006-tipografia-compuesta-armonizacion-grafema-namtrik.md`

---

## Diseño

El objetivo técnico de esta especificación es eliminar las inconsistencias visuales del grafema central Misak `ɵ` (`U+0275`) / `Ɵ` (`U+019F`) y de la marca institucional `Wamtɵrmarɵpik` en todas las pantallas (Home, Header, Login, Buscador y Panel Admin), garantizando armonía métrica sin fallback al sistema operativo.

### 1. Pila Tipográfica Compuesta y Tokens en `apps/web-client/src/index.css`
- **Regla `@font-face` con `unicode-range`**:
  Declarar `@font-face` vinculada a `font-family: 'Spline Sans'` con:
  - `font-weight: 400`, `500`, `600`, `700`
  - `font-style: normal`
  - `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` (vocal central Misak mayúscula y minúscula, schwa, i tachada y u cerrada)
  - `src: local('Noto Sans'), local('NotoSans'), url(...)`
  - `size-adjust: 96%` (calibrando la altura-x de Noto Sans al 51.5% de Spline Sans)
  - `ascent-override: 95%`
  - `descent-override: 22%`
- **Tokens `@theme` en Tailwind CSS v4**:
  - `--font-display: 'Spline Sans', 'Noto Sans', sans-serif;`
  - `--font-body: 'Noto Sans', sans-serif;`
  - `--font-sans: 'Noto Sans', sans-serif;`
- **Reglas globales de síntesis**:
  - `font-synthesis: none;` en `:root`, encabezados y selectores `.font-display` para impedir `faux-bold` en navegadores Chromium/WebKit.

### 2. Componente Canónico `<MisakWordmark />`
- Ubicación: `apps/web-client/src/components/ui/MisakWordmark.tsx`
- Propósito: Encapsular el lema oficial `Wamtɵrmarɵpik` con punto de código estricto `U+0275`, peso `font-bold` (700), `font-display`, `font-kerning: normal` y variantes de escala preconfiguradas:
  - `hero`: `text-fluid-hero font-bold tracking-tight text-white` (con shadow opcional)
  - `login`: `text-2xl sm:text-3xl font-bold tracking-tight text-white` (reemplaza `font-extrabold`)
  - `header`: `text-sm sm:text-base font-bold tracking-wide text-white`
  - `drawer`: `text-base font-bold text-white`
  - `compact`: `text-sm font-bold text-white`

### 3. Normalizador Ortográfico Canónico (`namtrikText.ts`) y Chips de Inserción
- Ubicación: `apps/web-client/src/utils/namtrikText.ts`
- Funciones:
  - `normalizeNamtrikGraphemes(text: string): string`: Mapea variantes alógrafas (`ø`, `Ø`, `∅`, `θ`, `Θ`, `ϴ`, `ə`, `Ə`, `ө`, `Ө`) a sus formas canónicas Misak `ɵ` (`U+0275`) y `Ɵ` (`U+019F`).
  - Constante exportada: `MISAK_BRAND_NAME = 'Wamtɵrmarɵpik'`.
- Actualización de chips:
  - En `SearchBox.tsx`: cambiar `className="... font-mono font-bold ..."` por `className="... font-display font-bold ..."` en el botón de inserción rápida.

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `apps/web-client/src/index.css` | Reglas `@font-face` con `unicode-range`, `size-adjust`, tokens `--font-sans`, `--font-display`, `--font-body` y `font-synthesis: none`. | R-001, R-002, R-003 |
| `apps/web-client/index.html` | Precarga y declaración limpia de Google Fonts (`Spline Sans` y `Noto Sans`). | R-001, R-002 |
| `apps/web-client/src/utils/namtrikText.ts` | Utilidad `normalizeNamtrikGraphemes` y constante canónica `MISAK_BRAND_NAME`. | R-006 |
| `apps/web-client/src/components/ui/MisakWordmark.tsx` | Componente canónico de marca para renderizado consistente de `Wamtɵrmarɵpik`. | R-004 |
| `apps/web-client/src/components/sections/HeroSection.tsx` | Integrar `<MisakWordmark variant="hero" />`. | R-004 |
| `apps/web-client/src/components/layouts/PublicHeader.tsx` | Integrar `<MisakWordmark variant="header" />` en navbar y drawer móvil. | R-004 |
| `apps/web-client/src/pages/admin/LoginPage.tsx` | Sustituir `font-extrabold` por `<MisakWordmark variant="login" />`. | R-003, R-004 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | Cambiar `font-mono` por `font-display font-bold` en el chip de inserción `ɵ`. | R-005 |
| `apps/web-client/src/components/admin/CampoNamtrik.tsx` | Asegurar que los botones de inserción `ɵ` y `Ɵ` usen `font-display font-bold`. | R-005 |
| `apps/web-client/src/utils/namtrikText.test.ts` | Tests unitarios de normalización fonética y validación estática de literales Unicode. | R-006, R-007 |
| `apps/web-client/src/components/ui/MisakWordmark.test.tsx` | Tests unitarios de renderizado, codepoints y variantes de `MisakWordmark`. | R-004, R-007 |

---

## Contratos de UI/API

### Componente `<MisakWordmark />`
```tsx
export type MisakWordmarkVariant = 'hero' | 'login' | 'header' | 'drawer' | 'compact';

export interface MisakWordmarkProps {
  variant?: MisakWordmarkVariant;
  className?: string;
  as?: 'h1' | 'h2' | 'span' | 'p' | 'div';
  id?: string;
  shadow?: boolean;
}
```

### Utilidad `normalizeNamtrikGraphemes`
```tsx
export const MISAK_BRAND_NAME = 'Wamtɵrmarɵpik';

export function normalizeNamtrikGraphemes(input: string): string;
```

---

## Decisiones tomadas

- **ADR-0006**: Pila tipográfica compuesta con `@font-face` y `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` acoplada a Noto Sans con `size-adjust: 96%`.
- **Prohibición de `font-extrabold` en títulos de display**: dado que `Spline Sans` solo está licenciado/descargado en pesos `400..700`, el peso visual máximo en encabezados de marca es `font-bold` (700) con `tracking-tight`.

---

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Dispositivos offline o sin conexión a Google Fonts | Medio | La regla `@font-face` incluye `local('Noto Sans')`, `local('NotoSans')` y `--font-sans` como fallback seguro. |
| Incompatibilidad de `size-adjust` en navegadores muy antiguos | Bajo | `size-adjust` cuenta con soporte universal en todos los navegadores modernos (>95% global, Chrome 92+, Safari 15+, Firefox 92+); si no se soporta, el fallback sigue siendo funcionalmente legible. |
| Falsos positivos por variantes en inputs de usuario | Bajo | `normalizeNamtrikGraphemes` se aplica antes de persistir o procesar búsquedas en frontend. |

---

## Plan de la Enmienda `0.2.0` — Jerarquía Tipográfica y Rol Cromático de Títulos de Sección (Opción A′)

### Diseño de la enmienda

1. **Escala tipográfica fluida completa (`hero → h1 → h2 → h3`)**:
   - Completar en `@theme` (`apps/web-client/src/index.css`) el token `--font-size-fluid-h3` (`clamp(1.125rem, 1.4vw + 0.7rem, 1.5rem)`) y la utilidad `.text-fluid-h3` (`line-height: 1.3`), consolidando simultáneamente la eliminación de la regla obsoleta `.misak-selvedge-divider`.
   - Registrar `'text-fluid-h3'` en el grupo `'font-size'` de `extendTailwindMerge` (`apps/web-client/src/utils/cn.ts`) junto a `'text-fluid-hero'`, `'text-fluid-h1'` y `'text-fluid-h2'`, garantizando que `cn('text-fluid-h3', 'text-white')` conserve ambas clases.
2. **Componente canónico `<SectionHeading />` (`apps/web-client/src/components/ui/SectionHeading.tsx`)**:
   - Encapsula la renderización uniforme de los títulos estructurales de sección (`h1`, `h2`, `h3`) en el ámbito público.
   - Aplica por contrato `font-display`, `font-bold` (`700`), `text-white` (`#FFFFFF`, contraste `21:1` AAA), `tracking-tight`, `text-balance`, `fontSynthesis: 'none'` y `fontKerning: 'normal'`.
   - Adopta por defecto `accent="none"` (**Opción A′: sin cinta decorativa bajo el título**), alineándose con el retiro integral de `MisakSelvedgeDivider` en las secciones y manteniendo la cinta cuatricolor únicamente en componentes estructurales (`PublicHeader`, tarjetas y modales). Conserva soporte declarativo opcional `accent="band"` solo bajo decisión explícita.
   - Re-exportado como named export en `apps/web-client/src/components/ui/index.ts`.
3. **Homologación de secciones de la Home, cabeceras de catálogo y regiones accesibles**:
   - `VideoSection`, `InfoSection`, `GallerySection` y `CreditsSection`: sustituir encabezados `h2` dispares por `<SectionHeading id="..." as="h2">` en `text-white`, eliminar wrappers residuales `div.space-y-2` de un único hijo y asociar cada `<section>` con `aria-labelledby` apuntando al `id` de su título.
   - `CreditsSection`: sustituir el subtítulo *Contacto* por `<SectionHeading as="h3">` (`text-fluid-h3`) y cambiar el divisor `border-primary` a `border-white/15` para eliminar la duplicidad cromática.
   - `CamposIndex` y `FieldHero`: homologar el encabezado principal `h1` de `text-3xl sm:text-4xl lg:text-5xl` hacia `text-fluid-h1` en `text-white`, preservando animaciones de entrada y atributos de foco (`tabIndex={-1}` en `FieldHero`).
   - Consolidar en el mismo conjunto limpio el retiro de `MisakSelvedgeDivider` (`MisakBandStripe.tsx`, secciones, `CamposIndex`, `FieldHero`, `LoginPage`, `CambiarPasswordPage`) y el ajuste terminológico del buscador (`SearchBox.tsx` y `SearchBox.test.tsx`).
4. **Guardarraíles de gobernanza y regresión**:
   - Añadir en `specs/steering/conventions.md` la regla explícita de rol cromático tipográfico (*uso obligatorio de `SectionHeading` para títulos de sección y prohibición de `text-primary` en `h1–h3` estáticos del ámbito público*).
   - Crear `SectionHeading.test.tsx` y actualizar `InfoSection.test.tsx`, `CreditsSection.test.tsx`, `VideoSection.test.tsx`, `GallerySection.test.tsx`, `CamposIndex.test.tsx` y `namtrikText.test.ts`.

### Cambios por archivo (`Enmienda 0.2.0`)

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `apps/web-client/src/index.css` | Añadir `--font-size-fluid-h3` en `@theme`, utilidad `.text-fluid-h3` en `@layer utilities` y consolidar retiro de `.misak-selvedge-divider`. | R-008, R-011 |
| `apps/web-client/src/utils/cn.ts` | Registrar `'text-fluid-h3'` en `classGroups['font-size']` de `extendTailwindMerge`. | R-008 |
| `apps/web-client/src/components/ui/SectionHeading.tsx` | Nuevo componente canónico polimórfico (`h1` \| `h2` \| `h3`) con escala fluida, `text-white`, métricas Namtrik protegidas y `accent="none"` por defecto (Opción A′). | R-009, R-010 |
| `apps/web-client/src/components/ui/SectionHeading.test.tsx` | Suite unitaria cubriendo niveles `h1–h3`, escalas fluidas, resolución con `cn()`, métricas inline, `accent="none"` por defecto y `accent="band"` explícito. | R-008, R-009, R-012 |
| `apps/web-client/src/components/ui/index.ts` | Re-exportar `SectionHeading` y `SectionHeadingProps`. | R-009 |
| `apps/web-client/src/components/ui/MisakBandStripe.tsx` | Consolidar retiro de `MisakSelvedgeDivider` y `MisakSelvedgeDividerProps`. | R-011 |
| `apps/web-client/src/components/sections/VideoSection.tsx` | Adoptar `<SectionHeading id="recorrido-heading">`, vincular `<section aria-labelledby="recorrido-heading">`, quitar wrapper residual y consolidar retiro de `MisakSelvedgeDivider`. | R-010, R-011 |
| `apps/web-client/src/components/sections/InfoSection.tsx` | Migrar `h2` de `text-primary` por breakpoints a `<SectionHeading id="info-heading">` (`text-white` + `text-fluid-h2`), vincular `<section aria-labelledby="info-heading">` y consolidar retiro de `MisakSelvedgeDivider`. | R-010, R-011 |
| `apps/web-client/src/components/sections/GallerySection.tsx` | Adoptar `<SectionHeading id="simbolos-heading">`, vincular `<section aria-labelledby="simbolos-heading">` y quitar wrapper residual `space-y-2`. | R-010, R-011 |
| `apps/web-client/src/components/sections/CreditsSection.tsx` | Migrar `h2` a `<SectionHeading id="creditos-heading">` (`text-white`), `h3` *Contacto* a `<SectionHeading as="h3">` (`text-fluid-h3`), cambiar divisor `border-primary` por `border-white/15`, añadir `aria-labelledby="creditos-heading"` y consolidar retiro de `MisakSelvedgeDivider`. | R-010, R-011 |
| `apps/web-client/src/pages/CamposIndex.tsx` | Homologar `motion.h1` de breakpoints manuales a `text-fluid-h1` en `text-white` y consolidar retiro de `MisakSelvedgeDivider`. | R-010, R-011 |
| `apps/web-client/src/components/features/semantic-fields/FieldHero.tsx` | Homologar `h1` a `text-fluid-h1` preservando `tabIndex={-1}` y consolidar retiro de `MisakSelvedgeDivider`. | R-010, R-011 |
| `apps/web-client/src/pages/admin/LoginPage.tsx` | Consolidar retiro limpio de `MisakSelvedgeDivider` en el pie administrativo. | R-011 |
| `apps/web-client/src/pages/admin/CambiarPasswordPage.tsx` | Consolidar retiro limpio de `MisakSelvedgeDivider` en el pie administrativo. | R-011 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | Consolidar ajuste de etiqueta bilingüe (`Namtrik · Castellano`) y placeholder (`Digita un término`). | R-005, R-011 |
| `apps/web-client/src/components/sections/InfoSection.test.tsx` | Actualizar aserciones del `h2` hacia `text-fluid-h2`, `text-white`, ausencia de `text-primary` y presencia de `aria-labelledby`. | R-010, R-011, R-012 |
| `apps/web-client/src/components/sections/CreditsSection.test.tsx` | Actualizar aserciones del `h2` (`text-fluid-h2`, `text-white`, sin `text-primary`), `h3` (`text-fluid-h3`), divisor neutro `border-white/15` y `aria-labelledby`. | R-010, R-011, R-012 |
| `apps/web-client/src/components/sections/VideoSection.test.tsx` | Verificar encabezado `h2` con `text-fluid-h2`, `text-white`, sin `text-primary` y región `aria-labelledby`. | R-010, R-011, R-012 |
| `apps/web-client/src/components/sections/GallerySection.test.tsx` | Verificar encabezado `h2` con `text-fluid-h2`, `text-white`, sin `text-primary` y región `aria-labelledby`. | R-010, R-011, R-012 |
| `apps/web-client/src/pages/CamposIndex.test.tsx` | Verificar que el `h1` principal aplique `text-fluid-h1` y `text-white` sin `text-primary`. | R-010, R-011, R-012 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.test.tsx` | Consolidar pruebas de etiqueta y placeholder actualizados del buscador. | R-005 |
| `apps/web-client/src/utils/namtrikText.test.ts` | Ampliar verificación estática sobre `src/index.css` para asegurar presencia de `--font-size-fluid-h3` y ausencia de `.misak-selvedge-divider`. | R-008, R-012 |
| `specs/steering/conventions.md` | Documentar regla de rol cromático tipográfico y uso de `SectionHeading` en encabezados públicos. | R-012 |

### Contratos de UI (`Enmienda 0.2.0`)

```ts
export type SectionHeadingLevel = 'h1' | 'h2' | 'h3';
export type SectionHeadingAlign = 'center' | 'start';
export type SectionHeadingAccent = 'none' | 'band';

export interface SectionHeadingProps extends ComponentPropsWithoutRef<'h2'> {
  as?: SectionHeadingLevel;
  scale?: SectionHeadingLevel;
  align?: SectionHeadingAlign;
  accent?: SectionHeadingAccent;
}
```

### Decisiones tomadas (`Enmienda 0.2.0`)

- **ADR-0006 (Punto 5)**: Separación estricta entre jerarquía estructural (`#FFFFFF`, `21:1` AAA) y señalización interactiva (`#E52D6D`), canalizada mediante `<SectionHeading />` y la escala fluida `hero → h1 → h2 → h3`.
- **Adopción de Opción A′ (`accent="none"` por defecto)**: No se añaden cintas decorativas bajo los títulos de sección para respetar la sobriedad visual tras el retiro de `MisakSelvedgeDivider`, manteniendo los 4 colores oficiales Misak en el header, tarjetas y emblemas.

### Riesgos y mitigación (`Enmienda 0.2.0`)

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Colisión en `tailwind-merge` entre `text-fluid-h3` y `text-white` (ambas comparten prefijo `text-*`) | Alto | Registrar `'text-fluid-h3'` explícitamente en `classGroups['font-size']` dentro de `src/utils/cn.ts` y cubrirlo con test unitario en `SectionHeading.test.tsx`. |
| Ruptura de tests existentes en `InfoSection.test.tsx` y `CreditsSection.test.tsx` que esperaban `text-primary` y `.border-primary` | Medio | Actualizar las aserciones de ambos archivos de test en la misma tarea atómica para validar el nuevo contrato (`text-white`, `text-fluid-h2`, `border-white/15` y ausencia de `text-primary`). |
| Pérdida de animación de entrada en `CamposIndex` donde el `h1` es un `motion.h1` | Bajo | Mantener `motion.h1` en `CamposIndex` aplicando `text-fluid-h1` o envolviendo la entrada animada sin alterar la coreografía de `useReducedMotion`. |
