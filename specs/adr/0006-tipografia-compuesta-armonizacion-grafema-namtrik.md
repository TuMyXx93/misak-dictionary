# ADR-0006: Pila Tipográfica Compuesta y Armonización Métrica de Grafemas Namtrik

- **Estado:** Aceptada
- **Fecha:** 2026-10-27
- **Autores:** sesión arquitectónica (agente architect + revisión humana)

## Contexto

El Diccionario Cultural Misak utiliza la familia tipográfica display `Spline Sans` para títulos y marca institucional (`Wamtɵrmarɵpik`), combinada con `Noto Sans` para el cuerpo de texto. Sin embargo:
1. `Spline Sans` carece en su conjunto de glifos de los caracteres centrales del alfabeto Namtrik: la vocal central minúscula `ɵ` (`U+0275`, bloque IPA Extensions) y su mayúscula `Ɵ` (`U+019F`, bloque Latin Extended-B).
2. Al declararse `--font-display: 'Spline Sans', sans-serif`, el navegador aplica *per-character fallback* hacia la fuente genérica del sistema operativo (`Segoe UI`, `Arial`, `DejaVu Sans`), produciendo el efecto "ransom note": las vocales `ɵ` sobresalían en altura-x, tenían óvalos condensados y grosores de trazo incompatibles con el diseño geométrico de `Spline Sans`.
3. En `LoginPage.tsx` se usaba `font-extrabold` (`800`) cuando `index.html` solo descarga `Spline Sans` hasta `700`, forzando *faux-bold* o selección de caras pesadas de sistema que deformaban la contraforma del grafema.
4. `SearchBox.tsx` usaba `font-mono` (fuente monoespaciada de código) en el chip de inserción rápida.
5. En `src/index.css`, `@theme` omitía definir `--font-sans`, dejando elementos base expuestos al fallback del sistema.
6. En las secciones públicas de la Home (`/`), coexistían dos sistemas paralelos de encabezados `h2`: blanco con escala fluida (`VideoSection`, `GallerySection`) frente a magenta `#E52D6D` con saltos por breakpoints (`InfoSection`, `CreditsSection`), colisionando con el rol de interacción del color primario y dejando incompleta la escala fluida en `h3`.

## Decisión

1. **Definir una pila tipográfica compuesta con `@font-face` y `unicode-range`**:
   Configurar en `src/index.css` reglas `@font-face` asignadas a la familia `'Spline Sans'` con `unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A` que resuelvan desde `'Noto Sans'` con `size-adjust: 96%` y `font-synthesis: none`. Esto asegura que el glifo de `Noto Sans` (que sí contiene `ɵ` y `Ɵ` nativos y de alta calidad) se escale métricamente a la altura-x y grosor exacto de `Spline Sans` sin depender de las fuentes instaladas en el dispositivo del usuario.
2. **Homologar tokens `@theme` en Tailwind CSS v4**:
   Declarar explícitamente `--font-display: 'Spline Sans', 'Noto Sans', sans-serif;`, `--font-body: 'Noto Sans', sans-serif;` y `--font-sans: 'Noto Sans', sans-serif;`, junto con la escala tipográfica fluida completa (`--font-size-fluid-hero`, `--font-size-fluid-h1`, `--font-size-fluid-h2` y `--font-size-fluid-h3`) registrada en `extendTailwindMerge`.
3. **Crear el componente canónico de marca `<MisakWordmark />`**:
   Encapsular el string oficial `Wamtɵrmarɵpik` (`U+0275`) con variantes de escala responsivas (`hero`, `login`, `header`, `drawer`), peso uniforme `font-bold` (`700`) y `font-kerning: normal`, erradicando discrepancias de tracking y peso en toda la aplicación.
4. **Normalización ortográfica canónica (`normalizeNamtrikGraphemes`)**:
   Unificar en el frontend la conversión de cualquier variante de teclado (`ø`, `Ø`, `∅`, `θ`, `ə`, `ө`) hacia `ɵ` (`U+0275`) y `Ɵ` (`U+019F`), y actualizar los chips de inserción rápida a `font-display font-bold`.
5. **Separación de rol cromático y componente canónico `<SectionHeading />` (Enmienda `0.2.0` — Opción A′)**:
   Establecer como regla arquitectónica que en el ámbito público el blanco (`#FFFFFF`, contraste `21:1` WCAG 2.2 AAA) jerarquiza todos los encabezados estructurales estáticos (`h1`, `h2`, `h3`), el magenta Misak (`#E52D6D`) señaliza exclusivamente controles interactivos y estados activos/hover/foco, y la cinta cuatricolor se concentra en los componentes estructurales (`PublicHeader`, tarjetas y modales) sin añadir cintas decorativas bajo los títulos (`accent="none"` por defecto en `<SectionHeading />`).

## Consecuencias

**Positivas:**
- Renderizado idéntico y profesional de `Wamtɵrmarɵpik` y de la vocal `ɵ` en cualquier navegador, sistema operativo o pantalla.
- Eliminación total del salto visual a fuentes de sistema operativo.
- Reutilización y gobierno centralizado de la marca institucional mediante `<MisakWordmark />` y de los títulos de sección mediante `<SectionHeading />`.
- Coherencia semántica cromática (WCAG 2.2 SC 3.2.4), contraste máximo AAA (`21:1`) en encabezados y regiones `<section>` nombradas vía `aria-labelledby`.
- Prevención de regresiones mediante tests automatizados en Vitest y reglas explícitas en `specs/steering/conventions.md`.

**Negativas / Mitigaciones:**
- Requiere asegurar que `Noto Sans` esté cargado con soporte para el subset de extensiones fonéticas/latinas (ya disponible en Google Fonts y compatible con PWA offline).
