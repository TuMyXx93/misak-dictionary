---
id: 010-tipografia-identidad-grafema-namtrik
version: 0.2.0
status: approved
cultural-gate: false
---

# 010 — Estandarización Tipográfica, Armonización Métrica del Grafema `ɵ` y Marca `Wamtɵrmarɵpik`

## Contexto

La auditoría visual comparativa entre la página de inicio (`HeroSection`), la cabecera pública (`PublicHeader` y `SearchBox`) y el portal de acceso administrativo (`LoginPage`) evidenció que la palabra institucional **`Wamtɵrmarɵpik`** y la vocal central Misak **`ɵ` (`U+0275`) / `Ɵ` (`U+019F`)** se renderizan con proporciones, grosores y morfologías dispares:

1. **Ausencia de los glifos `ɵ` (`U+0275`, bloque *IPA Extensions*) y `Ɵ` (`U+019F`, bloque *Latin Extended-B*) en `Spline Sans` (Efecto *Ransom Note* por fallback de sistema)**: En `src/index.css`, `--font-display: 'Spline Sans', sans-serif` carece del glifo `U+0275` y tampoco incluye a `'Noto Sans'` como respaldo inmediato. El navegador dibuja las letras latinas (`Wamt...rmar...pik`) con `Spline Sans` (altura-x ~51.5%, geometría ancha), pero cae a la fuente `sans-serif` del sistema operativo (`Segoe UI`, `Arial`, `DejaVu Sans`) exclusivamente para la letra `ɵ`, cuya altura-x mayor y óvalo condensado hacen que la vocal sobresalga y desentone con el resto de la palabra.
2. **Síntesis artificial de peso (`font-extrabold` 800) y *hinting* divergente**: `index.html` solo descarga pesos `400..700` de `Spline Sans`. Mientras `HeroSection` y `PublicHeader` usan `font-bold` (`700`), `LoginPage` aplica `font-extrabold` (`800`), forzando al navegador a seleccionar una variante pesada del sistema o aplicar *faux-bold* sobre el glifo `ɵ` de respaldo. Además, en `SearchBox.tsx` el chip de inserción de `ɵ` utiliza `font-mono` (tipografía monoespaciada de código) y en `@theme` falta definir `--font-sans: 'Noto Sans', sans-serif`, dejando elementos base a merced de la fuente del sistema.
3. **Riesgo de variantes Unicode heterogéneas (`ø`, `Ø`, `∅`, `θ`, `ə`, `ө`)**: Cuando se ingresan o renderizan variantes alógrafas procedentes de teclados móviles o fuentes externas sin normalización canónica hacia `ɵ` (`U+0275`) y `Ɵ` (`U+019F`), cada punto de código invoca un bloque Unicode y una fuente distinta.

## Requisitos (EARS)

### Pilar 1: Arquitectura Tipográfica con `@font-face` Compuesto (`unicode-range` + `size-adjust`) y Tokens `@theme`

- **R-001** — EL SISTEMA DEBERÁ declarar en `apps/web-client/src/index.css` reglas `@font-face` de armonización para la familia `'Spline Sans'` (pesos `400`, `500`, `600` y `700`) acotadas mediante `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` que utilicen los glifos web de `'Noto Sans'` con ajuste métrico (`size-adjust` y `ascent-override`), garantizando que `ɵ` (`U+0275`) y `Ɵ` (`U+019F`) tengan la misma altura-x, grosor de trazo y proporción visual que las letras adyacentes de `Spline Sans` sin caer nunca en fuentes del sistema operativo.
- **R-002** — EL SISTEMA DEBERÁ definir explícitamente en el bloque `@theme` de `apps/web-client/src/index.css` las tres pilas tipográficas canónicas (`--font-display: 'Spline Sans', 'Noto Sans', sans-serif`, `--font-body: 'Noto Sans', sans-serif` y `--font-sans: 'Noto Sans', sans-serif`) y aplicar `font-synthesis: none` en los encabezados y elementos `.font-display` para impedir deformaciones por *faux-bold* o *faux-italic*.
- **R-003** — MIENTRAS un texto o título utilice la familia `font-display`, EL SISTEMA NO DEBERÁ aplicar pesos no descargados como `font-extrabold` (`800`) o `font-black` (`900`), ni aplicar `font-mono` a controles o chips que representen grafemas del alfabeto Namtrik (`ɵ`, `Ɵ`).

### Pilar 2: Componente Canónico de Marca (`<MisakWordmark />`) y Consistencia en Controles Namtrik

- **R-004** — EL SISTEMA DEBERÁ proveer un componente canónico reutilizable `<MisakWordmark />` (y la constante `MISAK_BRAND_NAME = 'Wamtɵrmarɵpik'` con `U+0275` verificado) con variantes de escala predefinidas (`hero`, `login`, `header`, `drawer`), asegurando el mismo peso (`font-bold` 700), `font-kerning: normal` y renderizado idéntico del grafema `ɵ` en `HeroSection.tsx`, `PublicHeader.tsx` y `LoginPage.tsx`.
- **R-005** — CUANDO se rendericen botones o chips de inserción rápida de grafemas Namtrik (`ɵ` y `Ɵ` en `SearchBox.tsx` y `CampoNamtrik.tsx`), EL SISTEMA DEBERÁ aplicar `font-display font-bold` con la misma fuente armonizada de los títulos, eliminando el uso de `font-mono`.

### Pilar 3: Normalización Ortográfica Canónica en Cliente y Guardián Automatizado de Regresión

- **R-006** — CUANDO un componente de interfaz reciba, formatee o inserte texto en idioma Namtrik a través de la utilidad `normalizeNamtrikGraphemes` (`apps/web-client/src/utils/namtrikText.ts`), EL SISTEMA DEBERÁ normalizar cualquier variante visual o de teclado (`ø` `U+00F8`, `Ø` `U+00D8`, `∅` `U+2205`, `θ` `U+03B8`, `Θ` `U+0398`, `ϴ` `U+03F4`, `ə` `U+0259`, `Ə` `U+018F`, `ө` `U+04E9`, `Ө` `U+04E8`) hacia los puntos de código canónicos Misak `ɵ` (`U+0275`, minúscula) y `Ɵ` (`U+019F`, mayúscula).
- **R-007** — EL SISTEMA DEBERÁ contar con una suite de tests automatizados de integridad tipográfica y ortográfica que verifique que ningún archivo de interfaz contenga variantes espurias en literales de marca, que `src/index.css` mantenga la configuración `@font-face` con `unicode-range` para `U+0275`/`U+019F` y `--font-sans`, y que `HeroSection`, `PublicHeader`, `LoginPage` y `SearchBox` rendericen el grafema `ɵ` con clases tipográficas homologadas.

## Criterios de aceptación (Gherkin)

### R-001, R-002, R-003

```gherkin
Escenario: Armonización métrica del glifo ɵ (U+0275) y Ɵ (U+019F) sin fallback al sistema operativo
  Dado que la hoja de estilos global "src/index.css" está cargada en el navegador
  Cuando se renderiza cualquier texto con la clase "font-display", "font-body" o "font-sans" que contenga "ɵ" (U+0275) o "Ɵ" (U+019F)
  Entonces la regla @font-face con unicode-range "U+019F, U+0259, U+0268, U+0275, U+028A" resuelve el glifo desde Noto Sans con size-adjust calibrado a la altura-x de Spline Sans
  Y "--font-display", "--font-body" y "--font-sans" incluyen explícitamente a "Noto Sans" antes del fallback genérico "sans-serif"
  Y se desactiva la síntesis artificial de peso ("font-synthesis: none") evitando deformaciones del glifo
```

### R-004, R-005

```gherkin
Escenario: Consistencia visual absoluta de "Wamtɵrmarɵpik" y del chip "ɵ" en Home, Header, Login y Buscador
  Dado que el usuario visualiza la marca "Wamtɵrmarɵpik" en la Home ("/"), en el Header público ("/campos") y en el Login ("/admin/login"), así como el botón de inserción "ɵ" en el buscador
  Cuando se inspeccionan los elementos renderizados en cada vista
  Entonces los tres títulos renderizan el componente canónico MisakWordmark con el mismo punto de código U+0275, familia "font-display" y peso "font-bold" (700) sin usar "font-extrabold"
  Y el botón de inserción rápida del grafema "ɵ" en SearchBox utiliza "font-display font-bold" en lugar de "font-mono"
```

### R-006, R-007

```gherkin
Escenario: Normalización canónica de variantes de teclado hacia ɵ (U+0275) / Ɵ (U+019F) y protección contra regresiones
  Dado que un usuario o flujo de datos introduce variantes de teclado como "Wamtørmarøpik", "Wamt∅rmar∅pik", "Wamtθrmarθpik" o "Ɵsrɵ"
  Cuando se procesa el texto mediante la utilidad "normalizeNamtrikGraphemes"
  Entonces todas las variantes minúsculas ("ø", "∅", "θ", "ə", "ө") se convierten a "ɵ" (U+0275) y las mayúsculas ("Ø", "Θ", "ϴ", "Ə", "Ө") a "Ɵ" (U+019F)
  Y la suite de tests verifica que ningún componente de UI utilice "font-mono" ni "font-extrabold" sobre el grafema Namtrik
```

## Fuera de alcance

- Modificación de los términos léxicos o traducciones ratificadas en el glosario (`specs/steering/glossary.md`) o en la base de datos PostgreSQL (protegidos por Constitución C1.1).
- Alteración de la lógica de negocio o endpoints del backend (`apps/backend-service`), dado que las funciones SQL `immutable_normalize_namtrik_es` y `normalizarNamtrik` ya gestionan la equivalencia en servidor.
- Incorporación de librerías externas de fuentes en runtime fuera del stack actual (Vite + CSS estático).

## Trazabilidad

| Requisito | Archivos | Tests |
| --------- | -------- | ----- |
| R-001, R-002, R-003 | `apps/web-client/src/index.css`, `apps/web-client/index.html` | `apps/web-client/src/utils/namtrikText.test.ts` |
| R-004 | `apps/web-client/src/components/ui/MisakWordmark.tsx`, `apps/web-client/src/components/sections/HeroSection.tsx`, `apps/web-client/src/components/layouts/PublicHeader.tsx`, `apps/web-client/src/pages/admin/LoginPage.tsx` | `apps/web-client/src/components/ui/MisakWordmark.test.tsx`, `apps/web-client/src/pages/admin/LoginPage.test.tsx` |
| R-005 | `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx`, `apps/web-client/src/components/admin/CampoNamtrik.tsx` | `apps/web-client/src/components/features/semantic-fields/SearchBox.test.tsx` |
| R-006, R-007 | `apps/web-client/src/utils/namtrikText.ts` | `apps/web-client/src/utils/namtrikText.test.ts` |

---

## Enmienda 0.2.0 — Jerarquía Tipográfica y Rol Cromático de Títulos de Sección (Opción A′)

### Contexto de la enmienda

La auditoría visual sobre las secciones narrativas e institucionales de la Home (`/`) y las cabeceras del catálogo público evidenció tres desalineaciones tipográficas y cromáticas:

1. **Dos sistemas paralelos de títulos `h2` en la Home:** Mientras `VideoSection` (*Recorrido*) y `GallerySection` (*Símbolos*) aplican `text-fluid-h2 font-display font-bold text-white`, `InfoSection` (*El Territorio como metáfora*) y `CreditsSection` (*Créditos*) aplican `text-3xl md:text-4xl font-bold text-primary` (magenta `#E52D6D` y saltos discretos en `768px`).
2. **Colisión semántica del rol cromático (WCAG 2.2 SC 3.2.4):** En el sistema visual del producto, el magenta Misak (`--color-primary` `#E52D6D` y `--color-primary-light`) señaliza controles interactivos y estados activos/hover/foco. Aplicarlo sobre títulos estáticos sugiere falsa accionabilidad, introduce una jerarquía ilusoria entre secciones hermanas, diluye la fuerza de los CTAs y reduce el contraste a `~4.9:1` (AA) frente a `21:1` (AAA) del blanco `#FFFFFF` sobre el lienzo negro.
3. **Escala fluida incompleta (`h3`), retiro de divisores redundantes y accesibilidad de regiones:** `@theme` carece de `--font-size-fluid-h3` (dejando el `h3` *Contacto* en `text-2xl` fijo); `CamposIndex` y `FieldHero` emplean breakpoints manuales en vez de `text-fluid-h1`; `CreditsSection` duplica el acento con un divisor `border-primary`; y las `<section>` de la Home no declaran `aria-labelledby`. En coherencia con el retiro de `MisakSelvedgeDivider` en las secciones, se adopta la **Opción A′** (*el blanco jerarquiza, el color señala, los componentes estructurales identifican*): títulos limpios en blanco `#FFFFFF` sin cinta decorativa bajo el encabezado por defecto (`accent="none"`), reservando la cinta cuatricolor para el header, tarjetas y modales.

### Requisitos de la enmienda (EARS)

- **R-008** — EL SISTEMA DEBERÁ completar la escala tipográfica fluida en `apps/web-client/src/index.css` declarando `--font-size-fluid-h3: clamp(1.125rem, 1.4vw + 0.7rem, 1.5rem)` en `@theme` y la utilidad `.text-fluid-h3` (`line-height: 1.3`), y DEBERÁ registrar `'text-fluid-h3'` en el grupo `'font-size'` de `extendTailwindMerge` en `apps/web-client/src/utils/cn.ts` para impedir que `twMerge` descarte la escala fluida al combinarse con `text-white`.
- **R-009** — EL SISTEMA DEBERÁ proveer un componente canónico reutilizable `<SectionHeading />` (`apps/web-client/src/components/ui/SectionHeading.tsx`) con soporte polimórfico `as?: 'h1' | 'h2' | 'h3'` (por defecto `'h2'`), alineación `align?: 'center' | 'start'` (por defecto `'center'`) y acento `accent?: 'none' | 'band'` (por defecto `'none'`, **Opción A′: sin cinta decorativa bajo el título**), aplicando por contrato `font-display font-bold text-white tracking-tight text-balance`, `fontSynthesis: 'none'`, `fontKerning: 'normal'` y la clase fluida correspondiente a su nivel (`text-fluid-h1`, `text-fluid-h2` o `text-fluid-h3`).
- **R-010** — MIENTRAS se renderice un encabezado estructural estático (`h1`, `h2`, `h3`) en las secciones públicas de la Home (`VideoSection`, `InfoSection`, `GallerySection`, `CreditsSection`) o en las cabeceras de catálogo (`CamposIndex`, `FieldHero`), EL SISTEMA DEBERÁ utilizar color blanco (`text-white`, contraste `21:1` WCAG 2.2 AAA) y escala fluida, y NO DEBERÁ aplicar `text-primary` ni colores reservados a la interacción.
- **R-011** — EL SISTEMA DEBERÁ integrar `<SectionHeading />` en `VideoSection`, `InfoSection`, `GallerySection` y `CreditsSection` (incluyendo el subtítulo `h3` *Contacto* con `as="h3"`), vincular cada `<section>` con el `id` de su título primario mediante `aria-labelledby`, eliminar contenedores residuales de un solo hijo (`div.space-y-2`), sustituir el divisor `border-primary` de `CreditsSection` por `border-white/15`, consolidar el retiro completo de `MisakSelvedgeDivider`, y homologar el `h1` de `CamposIndex` y `FieldHero` a `text-fluid-h1`.
- **R-012** — EL SISTEMA DEBERÁ documentar la regla de rol cromático y uso de `<SectionHeading />` en `specs/steering/conventions.md` e incorporar pruebas de regresión en Vitest (`SectionHeading.test.tsx` y tests de secciones) que verifiquen el uso de `text-white` y `text-fluid-*`, la asociación `aria-labelledby` en cada `<section>` y la ausencia total de `text-primary` en `h1–h3` públicos.

### Criterios de aceptación de la enmienda (Gherkin)

#### R-008, R-009

```gherkin
Escenario: Escala fluida completa (h1, h2, h3) y contrato visual de SectionHeading en Opción A′
  Dado que el componente "SectionHeading" se renderiza con "as" en "h1", "h2" o "h3" sin especificar "accent"
  Cuando se inspeccionan las clases, estilos y nodos generados en el DOM
  Entonces aplica "text-fluid-h1", "text-fluid-h2" o "text-fluid-h3" junto con "font-display", "font-bold" y "text-white" sin que "cn()" descarte ninguna clase
  Y establece "fontSynthesis: none" y "fontKerning: normal" para preservar la métrica de grafemas Namtrik
  Y por defecto ("accent='none'") no renderiza cintas decorativas bajo el título
```

#### R-010, R-011

```gherkin
Escenario: Unificación cromática, escala fluida y regiones accesibles en las secciones de la Home y catálogo
  Dado que el usuario navega por las secciones "VideoSection", "InfoSection", "GallerySection" y "CreditsSection" en "/", así como por "CamposIndex" y "FieldHero" en "/campos"
  Cuando se evalúan los encabezados h1, h2 y h3 y sus elementos "<section>" contenedores
  Entonces los títulos "El Territorio como metáfora" y "Créditos" se muestran en blanco ("text-white") con escala fluida "text-fluid-h2" igual que "Recorrido del territorio Misak" y "Símbolos del pueblo Misak"
  Y el subtítulo "Contacto" en "CreditsSection" se renderiza como h3 en blanco con "text-fluid-h3", separado por un divisor neutro "border-white/15" en lugar de "border-primary"
  Y cada "<section>" de contenido en la Home referencia el "id" de su título h2 mediante "aria-labelledby"
  Y los títulos h1 de "CamposIndex" y "FieldHero" utilizan la escala fluida "text-fluid-h1"
```

#### R-012

```gherkin
Escenario: Protección documental y automatizada contra el uso de color de interacción en títulos estáticos
  Dado el conjunto de tests de "SectionHeading" y de las secciones públicas en Vitest
  Cuando se ejecuta la suite de pruebas del cliente web
  Entonces ningún encabezado h1, h2 o h3 de las secciones públicas contiene la clase "text-primary"
  Y no existen referencias residuales a "MisakSelvedgeDivider" ni a ".misak-selvedge-divider"
```

### Trazabilidad proyectada de la enmienda

| Requisito | Archivos | Tests |
| :--- | :--- | :--- |
| R-008 | `apps/web-client/src/index.css`, `apps/web-client/src/utils/cn.ts` | `apps/web-client/src/components/ui/SectionHeading.test.tsx`, `apps/web-client/src/utils/namtrikText.test.ts` |
| R-009 | `apps/web-client/src/components/ui/SectionHeading.tsx` | `apps/web-client/src/components/ui/SectionHeading.test.tsx` |
| R-010, R-011 | `apps/web-client/src/components/sections/VideoSection.tsx`, `apps/web-client/src/components/sections/InfoSection.tsx`, `apps/web-client/src/components/sections/GallerySection.tsx`, `apps/web-client/src/components/sections/CreditsSection.tsx`, `apps/web-client/src/pages/CamposIndex.tsx`, `apps/web-client/src/components/features/semantic-fields/FieldHero.tsx`, `apps/web-client/src/components/ui/MisakBandStripe.tsx` | `VideoSection.test.tsx`, `InfoSection.test.tsx`, `GallerySection.test.tsx`, `CreditsSection.test.tsx`, `CamposIndex.test.tsx` |
| R-012 | `specs/steering/conventions.md` | `SectionHeading.test.tsx`, `InfoSection.test.tsx`, `CreditsSection.test.tsx` |
