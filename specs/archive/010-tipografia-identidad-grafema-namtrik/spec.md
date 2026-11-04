---
id: 010-tipografia-identidad-grafema-namtrik
version: 0.1.0
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
