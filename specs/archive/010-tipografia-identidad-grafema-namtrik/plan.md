# Plan Técnico — 010-tipografia-identidad-grafema-namtrik

> **Spec:** `specs/features/010-tipografia-identidad-grafema-namtrik/spec.md` (approved)
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
