# Plan Técnico — 009-rediseno-ux-home-navegacion-busqueda

> **Spec de referencia:** `specs/archive/009-rediseno-ux-home-navegacion-busqueda/spec.md` (`v0.3.0` — `approved`)
> **Estado:** `approved` (Constitución C4.1)

---

## 1. Diseño Arquitectónico por Pilar

### 1.1 Pilar 1: Modelo Unificado de Botones de la Home (`SemanticFieldButton`) e Iconografía Vectorial Misak

#### Diagnóstico de las Evidencias Visuales (`data/`)
- **`155236.png` (`800×360` Mobile Landscape)**: `useMediaQuery('(min-width: 768px)')` activa el posicionamiento absoluto porcentual cuando la altura disponible es apenas `360px`. Como resultado, los nodos en `y: 22%..25%` se superponen al título `<h1>` y los de `y: 80%` colisionan con el CTA inferior.
- **`155408.png` (`768×1024` iPad Mini Portrait) y `154958.png` (Ventana estrecha)**: En dispositivos táctiles (`pointer: coarse`), las píldoras permanecen expandidas (`~220px` de ancho). El nodo `Srɵ Wammera` en `x: 82%` con `translate(-50%, -50%)` proyecta su mitad derecha (`~110px`) más allá del borde derecho (`82%` de `768px` = `630px`; `630 + 110 = 740px` + padding/borde → corte lateral).
- **`153440.png` y `165051.png` (Inconsistencia de Iconos)**: En `apps/web-client/src/constants/semanticFields.ts`, el mapa `SLUG_TO_CONFIG_ID` tenía invertidos los IDs de `tra-tul` (`'kaumpu-ushamera'` → `wildlife`) y `kau-ushamera` (`'tusrmera'` → `flora`).

#### Arquitectura del Componente Único Polimórfico (`SemanticFieldButton`)
Se unifican los **8 botones de la Home** bajo `SemanticFieldButton` mediante discriminación explícita de variante:

```ts
export type SemanticFieldButtonVariant = 'field-node' | 'global-catalog';

export interface SemanticFieldButtonProps {
  /** Variante arquitectónica: nodo de campo semántico (1..7) o catálogo global (8.º botón) */
  variant?: SemanticFieldButtonVariant;
  /** Configuración del campo (requerida para 'field-node', opcional/sintética para 'global-catalog') */
  field: SemanticFieldConfig;
  /** Modo de disposición determinado por el contenedor responsivo */
  layoutMode?: 'spatial' | 'grid-compact' | 'grid-tablet';
  /** Callback de navegación para 'field-node' */
  onNavigate?: (field: SemanticFieldConfig) => void;
  /** Ruta destino directa (por defecto '/campos' en 'global-catalog') */
  to?: string;
}
```

#### Matriz Responsiva Bidimensional (Viewport Width × Height + Safe-Area Clamping)

| Modo de Layout | Condición Media Query | Disposición de los 7 Nodos (`field-node`) | Disposición del 8.º Botón (`global-catalog`) |
| :--- | :--- | :--- | :--- |
| **`spatial`** (Desktop / Tablet Landscape amplia) | `(min-width: 1024px) and (min-height: 640px)` | Lienzo absoluto con **Safe-Area Clamping**: `left: clamp(14%, var(--x), 86%)`, `top: clamp(14%, var(--y), 84%)`. Expansión fluida en hover/focus/tap sin desborde lateral. | Centrado en el zócalo inferior del Hero con margen seguro. |
| **`grid-tablet`** (Tablet Portrait / Ventana mediana) | `(min-width: 640px) and (max-width: 1023px)` y `(min-height: 540px)` | Grid simétrico de 2 columnas (`grid-cols-2 gap-3.5 max-w-2xl mx-auto`), píldoras con icono, título Namtrik y subtítulo en español visibles sin truncamiento agresivo. | Integrado bajo el grid con el mismo modelo geométrico de píldora. |
| **`grid-landscape-compact`** (Mobile Landscape `800×360`) | `(max-height: 539px)` | Grid horizontal compacto de 3 a 4 columnas (`grid-cols-3 sm:grid-cols-4 gap-2 max-w-3xl`), padding vertical del Hero reducido (`py-3`) para cero colisiones. | Compactado en la barra inferior junto al indicador de scroll discreto. |
| **`grid-mobile`** (Mobile Portrait `< 640px`) | `(max-width: 639px) and (min-height: 540px)` | Flex/Grid envolvente centrado (`grid-cols-2 xs:grid-cols-2 gap-2.5 max-w-md`) con tap target garantizado `>= 48px`. | Centrado bajo los 7 nodos con ancho adaptativo. |

#### Especificación Visual del 8.º Botón (`variant="global-catalog"`, texto `"Campos Semánticos"`)
- **Etiqueta**: `"Campos Semánticos"` (elimina `"Explorar"`).
- **Icono**: Nuevo SVG vectorial `iconKey: 'cosmos-grid'` ubicado en la caja de icono izquierda (homóloga a los otros 7 botones), representando la matriz/espiral territorial Misak que articula los 7 campos semánticos.
- **Limpieza de artefactos previos**: Se eliminan el punto magenta (`w-2 h-2 rounded-full bg-[#E52D6D]`) y la flecha textual (`→`).
- **Paleta cromática Misak distintiva**:
  - Superficie: Gradiente institucional profundo `linear-gradient(135deg, #0055AA 0%, #071F40 52%, #2B0918 100%)` con borde luminoso `border-white/40 hover:border-white/85` y filete inferior cuatricolor (`MisakBandStripe`).
  - Caja del icono: `bg-white/15 border border-white/35 text-white group-hover:bg-[#E52D6D] group-hover:border-white/60 transition-colors`.
  - Contraste tipográfico: Blanco puro `#FFFFFF` (`> 11:1` WCAG AAA).

#### Rediseño Quirúrgico de los 4 Iconos Integrados (`SemanticFieldIcon.tsx`)
Todos los iconos operan sobre `viewBox="0 0 24 24"`, trazo vectorial escalable (`vectorEffect="non-scaling-stroke"` opcional), jerarquía de grosor (`strokeWidth="1.75"` primario y `"1.35"` para detalles simbólicos):

1. **`Ya` (`iconKey: 'house'`, *"La casa tradicional"*)**:
   - Techo tradicional a dos aguas con cumbrera cruzada ceremonial, muros firmes y en el centro el **Nakchak** (las tres tulpas/piedras del fogón en triángulo con la llama/espiral de la palabra en el centro).
2. **`Ya tul` (`iconKey: 'garden'`, *"La huerta tradicional cercana"*)**:
   - Surco en espiral/semicírculo de tierra labrada junto al hogar, del cual emerge un tallo central vigoroso con dos hojas simétricas y brotes superiores (símbolo de plantas medicinales y sustento familiar).
3. **`Tra tul` (`iconKey: 'mountain-farm'`, *"La huerta lejana"*)**:
   - Dos cumbres andinas escalonadas (territorio alto del Nupirau) con líneas curvas de surcos/terrazas de cultivo en la ladera inferior y disco solar naciente entre los picos.
4. **`Kau ushamera` (`iconKey: 'wildlife'`, *"Los animales originarios"*)**:
   - Silueta noble de venado/fauna andina de páramo con cornamenta/orejas erguidas y trazos orgánicos de movimiento territorial, reemplazando la hoja vegetal errónea que se mostraba antes.
5. **Catálogo Global (`iconKey: 'cosmos-grid'`, *"Campos Semánticos"*)**:
   - Nodo central luminoso rodeado por un anillo orbital segmentado y 7 vértices/pétalos geométricos que simbolizan la unión de los 7 campos semánticos del diccionario.

---

### 1.2 Pilar 2: Header Condicional y Máquina de Estados de Navegación (`PublicHeader` + `Home`)

#### Máquina de Estados de Visibilidad y Navegación
1. **Visibilidad Condicional en `Home.tsx`**:
   - Se incorpora `<PublicHeader variant="overlay" isVisible={showHeader} activeSection={activeSection} />` en `Home.tsx`.
   - `showHeader` es `false` cuando el usuario está en la primera sección (`HeroSection`, `activeSection === 'inicio'`) y no ha abierto el drawer móvil; pasa automáticamente a `true` (con transición `opacity` + `translate-y` de `250ms`) en cuanto el usuario hace scroll hacia `#recorrido`, `#info`, `#simbolos` o `#creditos`, o cuando navega directamente a un hash (`/#recorrido`, `/#simbolos`, `/#creditos`).
   - En `FieldLayout.tsx` (`/campos/*`), `isVisible` es siempre `true` (`variant="sticky"`).

2. **Sincronización de Hash y Scroll-Spy (`useHomeNavigation`)**:
   - **Scroll al montar o cambiar `location.hash`**:
     - En `Home.tsx`, un `useEffect` observa `location.hash`. Si `location.hash` coincide con `#recorrido`, `#simbolos` o `#creditos`, localiza el `<section id={hash}>` y ejecuta `sectionEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })`.
     - Si el usuario hace clic en `Inicio` (`to="/"` sin hash) estando ya en `/` sobre otra sección, desplaza el contenedor `<main>` de vuelta al tope (`#inicio`).
   - **Detección en vivo con `IntersectionObserver`**:
     - Se añade `id="inicio"` a `HeroSection`.
     - Un `IntersectionObserver` con `root: mainScrollRef.current` y `threshold: 0.5` detecta qué sección ocupa la mayor parte del viewport (`'inicio' | 'recorrido' | 'simbolos' | 'creditos'`) y actualiza `activeSection`.
   - **Cálculo Determinista de `isActive` en `PublicHeader.tsx`**:
     ```ts
     function resolveActiveNavItem(pathname: string, hash: string, activeSection?: string): string {
       if (pathname.startsWith('/campos')) return '/campos';
       if (pathname === '/') {
         const currentSection = activeSection || hash.replace('#', '') || 'inicio';
         if (currentSection === 'recorrido') return '/#recorrido';
         if (currentSection === 'simbolos') return '/#simbolos';
         if (currentSection === 'creditos') return '/#creditos';
         return '/';
       }
       return '';
     }
     ```
   - De este modo, **nunca** habrá dos botones activos simultáneamente ni quedará `"Campos Semánticos"` encendido fuera de `/campos/*`.

---

### 1.3 Pilar 3: Corrección y Vectorización del Buscador Bilingüe (`PalabraRepository` + `SearchBox`)

#### 1. Solución al Bug de Filas en Blanco (`—`)
- En `PalabraRepository.ts`, tanto la consulta SQL como el mapeo de `SentidoLexico` se estandarizan para devolver objetos con propiedades en **`camelCase`** (`namtrikTermino`, `espanolTermino`, `namtrikDescripcion`, `espanolDescripcion`, `categoriaGramatical`, `ubicacion`, `microcampos`), preservando además alias en `snake_case` por retrocompatibilidad si algún test legado los inspecciona.
- En `dictionaryApi.ts`, el adaptador normaliza defensivamente `namtrikTermino: raw.namtrikTermino ?? raw.namtrik_termino ?? ''` y `espanolTermino: raw.espanolTermino ?? raw.espanol_termino ?? ''`.

#### 2. Resolución Completa de Ubicación Multinivel (`ubicacion.ruta`)
- Un `SentidoLexico` puede ubicarse en:
  - **Nivel 1 (Campo)**: `ruta = /campos/${campo.slug}#term-${sentido.id}`
  - **Nivel 2 (Subcampo)**: `ruta = /campos/${campo.slug}/${subcampo.slug}#term-${sentido.id}`
  - **Nivel 3+ (Microcampo o Subnivel)**: Si el microcampo tiene `padreId` (profundidad > 0), se asciende hasta el microcampo raíz del subcampo (o se usa el slug de microcampo navegable en `/campos/:fieldSlug/:subfieldSlug/:microfieldSlug#term-${sentido.id}`), garantizando que el clic en cualquier resultado lleve siempre a una ruta válida de React Router y resalte el término.

#### 3. Motor de Búsqueda Bilingüe Vectorizado en PostgreSQL 18 (`0012_search_vector_sentidos_trgm`)
Se crea una migración SQL ligera e idempotente (`0012_search_vector_sentidos_trgm/migration.sql`) que incorpora:
1. **Función `public.immutable_normalize_namtrik_es(text)` (`IMMUTABLE PARALLEL SAFE STRICT`)**:
   - Aplica `lower(public.immutable_unaccent($1))` y traduce todas las variantes ortográficas/fonéticas de la vocal central namtrik (`ɵ`, `Ɵ`, `ø`, `Ø`, `ə`, `Ə`, `ɔ`, `Ɔ` → `'o'`) y de la vocal alta central (`ɨ`, `Ɨ` → `'i'`).
   - Esto permite que `"møpik"`, `"mopik"` y `"mɵpik"` colapsen al mismo lexema indexado `'mopik'`, logrando equivalencia instantánea tanto en Namtrik como en español.
2. **Índices Vectoriales GIN (`tsvector` + `gin_trgm_ops`)**:
   - `idx_formas_namtrik_lema_trgm`: `USING GIN (public.immutable_normalize_namtrik_es(lema::text) gin_trgm_ops)` sobre `formas_namtrik`.
   - `idx_sentidos_glosa_trgm`: `USING GIN (public.immutable_normalize_namtrik_es(espanol_glosa::text) gin_trgm_ops)` sobre `sentidos_lexicos`.
   - `idx_sentidos_fts_vector`: `USING GIN (to_tsvector('spanish', public.immutable_normalize_namtrik_es(coalesce(espanol_glosa::text, '') || ' ' || coalesce(espanol_explicacion, '') || ' ' || coalesce(namtrik_contexto, ''))))` sobre `sentidos_lexicos`.
3. **Consulta Vectorizada y Ranking Híbrido en `PalabraRepository.searchModelo1`**:
   - Prioriza `sentidos_lexicos` + `formas_namtrik` (el modelo canónico activo donde residen los 4 campos integrados `Ya`, `Ya tul`, `Tra tul`, `Kau ushamera`) y combina con `palabras_modelo_1` si aplica.
   - Calcula un score vectorial híbrido:
     - Exact match normalizado (`1.00`)
     - Prefix match normalizado (`0.85`)
     - Trigram similarity `word_similarity(q_norm, target_norm)` (`0.65`)
     - Full-Text Search `ts_rank_cd` (`0.50`)

#### 4. Rediseño UI/UX de `SearchBox.tsx` (Combobox Accesible Bilingüe)
- Implementa teclado completo (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`), botón para limpiar consulta, chips de inserción rápida de caracteres Namtrik (`ɵ`, `ɨ`) opcionales o ayuda visual de búsqueda bilingüe, resaltado del texto coincidente, badge de categoría gramatical y pill con el camino jerárquico (`Ya › Nakchak`).

---

## 2. Cambios por Archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `apps/web-client/src/types/semanticField.ts` | Añadir `'mountain-farm' \| 'cosmos-grid'` a `SemanticFieldIconKey` y ampliar contrato de búsqueda con `ubicacion` y `categoriaGramatical`. | R-004, R-005, R-009, R-010 |
| `apps/web-client/src/constants/semanticFields.ts` | Corregir `SLUG_TO_CONFIG_ID` (`'tra-tul': 'tra-tul'`, `'kau-ushamera': 'kaumpu-ushamera'`), asignar `mountain-farm` a `Tra tul` y exportar `GLOBAL_CATALOG_BUTTON_CONFIG`. | R-004, R-005 |
| `apps/web-client/src/components/features/semantic-fields/SemanticFieldIcon.tsx` | Rediseñar los iconos vectoriales SVG de `house` (`Ya`), `garden` (`Ya tul`), `mountain-farm` (`Tra tul`), `wildlife` (`Kau ushamera`) y añadir `cosmos-grid` (`Campos Semánticos`). | R-004, R-005 |
| `apps/web-client/src/components/features/semantic-fields/SemanticFieldButton.tsx` | Refactorizar a modelo polimórfico único (`variant: 'field-node' \| 'global-catalog'`, `layoutMode`), con dimensiones `clamp()`, safe-area clamping en modo espacial y paleta distintiva para `global-catalog`. | R-001, R-002, R-003, R-004 |
| `apps/web-client/src/components/features/semantic-fields/SemanticFieldsLayer.tsx` | Sustituir media query simple por evaluación bidimensional (`(min-width: 1024px) and (min-height: 640px)` para `spatial`, `(max-height: 539px)` para landscape compacto, y grid 2 columnas para tablet). | R-001, R-002, R-003 |
| `apps/web-client/src/components/sections/HeroSection.tsx` | Reemplazar el `<Link>` manual de `"Explorar Campos Semánticos"` por `<SemanticFieldButton variant="global-catalog" ... />` y ajustar espaciado vertical adaptativo en landscape móvil. | R-001, R-002, R-004 |
| `apps/web-client/src/hooks/useHomeNavigation.ts` | Nuevo hook que gestiona scroll suave a hashes (`#recorrido`, `#simbolos`, `#creditos`), observación de secciones con `IntersectionObserver` y visibilidad condicional del Header en la Home. | R-006, R-007, R-008 |
| `apps/web-client/src/components/layouts/PublicHeader.tsx` | Soportar prop `activeSection` e `isHidden`, resolver estado activo para los 5 ítems (`Inicio`, `Campos Semánticos`, `Recorrido`, `Símbolos`, `Créditos`) y manejar clic en enlaces con hash cuando ya se está en `/`. | R-006, R-007, R-008 |
| `apps/web-client/src/pages/Home.tsx` | Integrar `PublicHeader` condicional (`variant="overlay"`) y `useHomeNavigation` sobre el contenedor `<main>`. | R-006, R-007, R-008 |
| `apps/backend-service/prisma/migrations/0012_search_vector_sentidos_trgm/migration.sql` | Crear función `immutable_normalize_namtrik_es` e índices GIN (`pg_trgm` + `tsvector`) en `formas_namtrik` y `sentidos_lexicos`. | R-011 |
| `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` | Actualizar `searchModelo1` para búsqueda bilingüe normalizada/vectorizada, devolver propiedades en `camelCase` y resolver `ubicacion` jerárquica multinivel (Campo, Subcampo, Microcampo/Subnivel). | R-009, R-010, R-011 |
| `apps/web-client/src/services/dictionaryApi.ts` | Actualizar `SearchResultWord` con `ubicacion`, `categoriaGramatical` y mapeo defensivo `camelCase`/`snake_case`. | R-009, R-010 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | Implementar Combobox WAI-ARIA accesible, renderizado rico `Namtrik — Español` con categoría y ruta jerárquica, navegación por teclado y limpieza rápida. | R-009, R-010, R-011, R-012 |

---

## 3. Contratos de UI y API

### Contrato de Respuesta `GET /api/dictionary/words/search`

```ts
export interface SearchResultLocation {
  campoSlug: string;
  campoNombre: string;
  subcampoSlug?: string;
  subcampoNombre?: string;
  microcampoSlug?: string;
  microcampoNombre?: string;
  /** Ruta canónica lista para navegar en el cliente */
  ruta: string;
}

export interface SearchResultWord {
  id: string;
  codigo?: string;
  namtrikTermino: string;
  espanolTermino: string;
  categoriaGramatical?: string | null;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  ubicacion?: SearchResultLocation | null;
  microcampos?: Array<{
    microcampoId: string;
    microcampo: {
      id: string;
      slug: string;
      namtrikTermino: string | null;
      espanolTermino?: string;
      subcampoSemantico?: {
        id: string;
        slug: string;
        namtrikTermino: string;
        campoSemantico?: {
          id: string;
          slug: string;
          namtrikTermino: string;
        };
      };
    };
  }>;
}
```

---

## 4. Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Microcampos de profundidad > 0 (subniveles) en resultados de búsqueda cuya ruta de página depende del microcampo raíz del subcampo. | Enlace 404 si se usa el slug de un subnivel no enrutado directamente. | Resolver el ancestro raíz de nivel microcampo (o incluir relación `padre` en `PalabraRepository`) para construir siempre `/campos/:fieldSlug/:subfieldSlug/:rootMicrofieldSlug#term-:id`. |
| Conflicto entre `scroll-snap-type: y mandatory` en `Home.tsx` y `scrollIntoView({ behavior: 'smooth' })` al navegar desde `/campos` a `/#recorrido`. | El scroll puede detenerse en la primera sección si el DOM aún no terminó de pintar. | Ejecutar `scrollIntoView` dentro de un `requestAnimationFrame` doble tras el montaje y usar `scroll-margin-top` adecuado. |
| Consultas cortas (2 caracteres) en Namtrik (ej. `"ya"`, `"pi"`). | `plainto_tsquery('spanish', ...)` ignora stop-words o palabras muy cortas. | La combinación híbrida con `ILIKE 'q%'` normalizado y `word_similarity` (`pg_trgm`) garantiza que términos cortos de 2 letras como `"ya"` se encuentren instantáneamente con score `1.0`. |

---

## Plan de la Enmienda 0.2.0

1. **Migración `0013_search_ranking_misak`** — `CREATE OR REPLACE` de `immutable_normalize_namtrik_es` con `translate(lower(immutable_unaccent(x)), 'ɵƟθΘϴøØ∅əɔ', 'oooooooooo')` (sin `ɨ`); función `misak_glosa_cabeza(text)` (texto previo al primer `(`, `,`, `;`, `:`); función `misak_sort_key(text)` (plpgsql, port del VBA); `REINDEX` de los índices 0012 e índice trigram sobre la cabeza de glosa.
2. **`PalabraRepository.search`** — una sola `$queryRaw` con CTE: candidatos por `normalize(lema) LIKE '%q%' OR normalize(lema) % q OR cabeza LIKE ... OR glosa ~ '\mq' ...`, `MIN(nivel)` por sentido, `COUNT(*) OVER()` para el total, `LIMIT/OFFSET`; después un `findMany` por IDs para la jerarquía y los medios (sin N+1) respetando `onlyRatified`. `palabras_modelo_1` solo como respaldo si no hay sentidos.
3. **`SearchBox`** — `<form role="search">`, lupa `type="submit"`, `type="text"` + `inputMode="search"` + `enterKeyHint="search"`, búsqueda inmediata sin debounce, chip único `ɵ`, insignia de coincidencia exacta, `placeholderData` para evitar parpadeo.
4. **Botón global** — se mueve a `SemanticFieldsLayer` como 8.º elemento; la variante `global-catalog` reutiliza la máquina de estados de expandir/contraer de `field-node`.
5. **Verificación** — Vitest (unitario + integración contra BD con `RUN_INTEGRATION=1`), Biome, `tsc`, builds y cobertura ≥ 70 %.

---

## Plan de la Enmienda `0.3.0` — Tarjetas Interactivas con Volteo 3D y Lectura Progresiva en "Símbolos del pueblo Misak"

### Diseño

1. **Modelo de Datos Cultural en `apps/web-client/src/constants/assets.ts` (`R-019`)**:
   - Extender cada entrada de `TEXTS.GALLERY.IMAGES` con la propiedad opcional `details?: SymbolCardDetails` (`intro: string`, `items: readonly string[]`, `outro: string`).
   - Poblar `TEXTS.GALLERY.IMAGES[0]` (**Bandera del pueblo Misak**) con la introducción, los 5 puntos numerados y el cierre histórico de 1980.
   - Poblar `TEXTS.GALLERY.IMAGES[1]` (**Escudo del pueblo Misak**) con la introducción, los 7 puntos numerados y el cierre filosófico del `Nuisuik` de 1988, normalizando `Kɵtrak`, `Kausrɵ`, `Tsurɵpall` y `pishintɵ waramik` con `ɵ` (`U+0275`).
   - Mantener `TEXTS.GALLERY.IMAGES[2]` (**Logo del equipo lingüístico Misak**) sin `details` para que conserve su comportamiento visual estático.

2. **Hook `useAutoScroll` (`apps/web-client/src/hooks/useAutoScroll.ts`) (`R-021`, `R-023`)**:
   - Gestiona el ciclo de vida del desplazamiento vertical progresivo sobre un `RefObject<HTMLElement | null>` cuando `isActive === true` y `!prefersReducedMotion`.
   - Tras un retardo inicial configurable (`initialDelayMs = 1400`), inicia un bucle `requestAnimationFrame` con acumulador de sub-píxeles en punto flotante (`speedPxPerSec = 26`) para avanzar `scrollTop` suavemente en cualquier tasa de refresco (`60Hz` / `120Hz` / `144Hz`) hasta alcanzar `scrollHeight - clientHeight`.
   - Escucha interacciones manuales del usuario (`wheel`, `touchstart`, `touchmove`, `pointerdown` sobre la barra/contenedor o invocación explícita de `pause()`) para detener inmediatamente el auto-scroll y ceder el control manual (WCAG 2.2 SC 2.2.2).
   - Cuando `isActive` pasa a `false` (la tarjeta regresa al frente), cancela cualquier `setTimeout` y `cancelAnimationFrame` activos y restablece `scrollTop = 0`.
   - Garantiza limpieza total en el `cleanup` de `useEffect` al desmontar el componente (cero fugas de memoria).

3. **Componente `<SymbolFlipCard />` (`apps/web-client/src/components/sections/SymbolFlipCard.tsx`) (`R-020`, `R-022`)**:
   - Si el ítem no posee `details` (caso del Logo), renderiza la tarjeta estática original con `MisakBandStripe`, vitrina cuadrada y pie de título.
   - Si el ítem posee `details` (Bandera y Escudo):
     - **Activación multimodal**:
       - **Puntero fino (`hover`)**: al entrar el cursor (`onPointerEnter` con `pointerType === 'mouse'`) tras un retardo de intención de `120ms`, activa `isFlipped = true`; al salir (`onPointerLeave`), regresa a `isFlipped = false` tras `150ms`.
       - **Teclado y pantallas táctiles**: el contenedor o botón disparador permite alternar el volteo con `Enter`, `Space` o toque táctil, y cerrar con `Escape` o mediante un botón de retorno/pausa con área mínima de `48×48px` (Constitución C3.2).
     - **Arquitectura de Volteo 3D y Rol Cromático Magenta**:
       - Contenedor de perspectiva (`perspective: 1200px`) sobre la vitrina cuadrada (`aspect-square`).
       - Tarjeta interna con `transform-style: preserve-3d` animada con Framer Motion (`rotateY: isFlipped ? 180 : 0`, duración `0.48s`, curva suave) o transición de opacidad sin giro cuando `useReducedMotion()` es `true` (Constitución C3.1).
       - **Cara frontal (`backface-visibility: hidden`)**: exhibe el emblema oficial con `group-hover:scale-105` y un indicador discreto de lectura interactiva.
       - **Cara trasera (`backface-visibility: hidden`, `transform: rotateY(180deg)`)**: superficie oscura profunda (`bg-[#07090d]/95`) enmarcada por el borde activo magenta Misak (`border-[#E52D6D]`) y resplandor sutil, con cabecero compacto, contenedor desplazable conectado a `useAutoScroll`, lista numerada con marcadores en magenta/azul Misak, párrafo de cierre histórico/filosófico y máscaras de desvanecimiento superior/inferior (`pointer-events-none`).
     - **Semántica y Accesibilidad**:
       - La cara oculta recibe `aria-hidden="true"` e `inert` para evitar lectura duplicada o foco fantasma en lectores de pantalla.
       - El pie editorial inferior conserva siempre visible el título de la tarjeta (`Bandera del pueblo Misak`, `Escudo del pueblo Misak`) y controles de acción accesibles (`>= 48×48px`).

4. **Integración en `GallerySection.tsx` (`R-020`, `R-022`)**:
   - Delegar el renderizado de cada elemento de `GALLERY_ITEMS` en `<SymbolFlipCard />`, preservando la grilla responsiva (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`) y la animación de entrada escalonada de la sección.

### Cambios por archivo (`Enmienda 0.3.0`)

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `apps/web-client/src/constants/assets.ts` | Definir `SymbolCardDetails` e incorporar `details` con los textos oficiales en castellano (y términos Namtrik en `U+0275`) para Bandera y Escudo en `TEXTS.GALLERY.IMAGES`. | R-019 |
| `apps/web-client/src/hooks/useAutoScroll.ts` | Nuevo hook para desplazamiento vertical progresivo con `requestAnimationFrame`, pausa por interacción manual del usuario y limpieza determinista de timers/rAF. | R-021, R-023 |
| `apps/web-client/src/hooks/useAutoScroll.test.tsx` | Pruebas unitarias del hook validando retardo inicial, avance progresivo, detención ante eventos `wheel`/`touchmove`/pausa, reinicio al desactivar y ausencia de fugas al desmontar. | R-021, R-023 |
| `apps/web-client/src/components/sections/SymbolFlipCard.tsx` | Nuevo componente de tarjeta de símbolo con soporte de volteo 3D (`rotateY`), realce cromático magenta `#E52D6D`, soporte teclado/táctil, respeto a `prefers-reduced-motion` y modo estático cuando `details` no está definido. | R-020, R-021, R-022 |
| `apps/web-client/src/components/sections/SymbolFlipCard.test.tsx` | Pruebas unitarias de `SymbolFlipCard` cubriendo volteo en hover/teclado/click, retorno con `Escape`/salida de cursor, degradación con `prefers-reduced-motion` y tarjeta sin `details`. | R-020, R-022, R-023 |
| `apps/web-client/src/components/sections/GallerySection.tsx` | Integrar `<SymbolFlipCard />` pasando `details` desde `TEXTS.GALLERY.IMAGES`. | R-019, R-020, R-022 |
| `apps/web-client/src/components/sections/GallerySection.test.tsx` | Ampliar suite de pruebas para verificar la presencia del significado de la Bandera y del Escudo, la normalización `U+0275` y la distinción entre tarjetas interactivas y la tarjeta estática del Logo. | R-019, R-020, R-023 |

### Contratos de UI/API (`Enmienda 0.3.0`)

```ts
export interface SymbolCardDetails {
  readonly intro: string;
  readonly items: readonly string[];
  readonly outro: string;
}

export interface GallerySymbolItem {
  readonly id: number;
  readonly webpUrl?: string;
  readonly url: string;
  readonly alt: string;
  readonly title: string;
  readonly subtitle: string;
  readonly containEmblem: boolean;
  readonly details?: SymbolCardDetails;
}

export interface UseAutoScrollOptions {
  /** Indica si la cara trasera está activa y lista para desplazar */
  isActive: boolean;
  /** Tiempo de espera antes de iniciar el ascenso automático (ms, por defecto 1400) */
  initialDelayMs?: number;
  /** Velocidad de desplazamiento en píxeles por segundo (por defecto 26) */
  speedPxPerSec?: number;
  /** Desactiva el desplazamiento automático cuando prefers-reduced-motion está activo */
  disabled?: boolean;
}

export interface UseAutoScrollReturn<T extends HTMLElement> {
  scrollRef: React.RefObject<T | null>;
  isAutoScrolling: boolean;
  isPausedByUser: boolean;
  pause: () => void;
  resume: () => void;
}

export interface SymbolFlipCardProps {
  item: GallerySymbolItem;
  index: number;
}
```

### Decisiones tomadas (`Enmienda 0.3.0`)

- **Coherencia con `ADR-0006` (Punto 5)**: El uso del color primario magenta Misak (`#E52D6D`) en el borde activo, halo e indicadores del reverso de `SymbolFlipCard` cumple estrictamente su rol semántico como señalizador de estado interactivo activo/hover/foco, mientras los títulos estructurales permanecen en blanco puro (`#FFFFFF`).
- **Desplazamiento real sobre contenedor DOM (`scrollTop`) en lugar de `transform: translateY` ciego**: Permite que el usuario tome el control en cualquier instante con la rueda del ratón, gesto táctil o teclado sin perder la posición actual de lectura (cumpliendo WCAG 2.2 SC 2.2.2).
- **Normalización preventiva `U+0275` en `assets.ts`**: Garantiza que `Kɵtrak`, `Kausrɵ`, `Tsurɵpall` y `pishintɵ waramik` utilicen la regla `@font-face` compuesta de `Spec 010` y superen el guardián de regresión ortográfica.

### Riesgos y mitigación (`Enmienda 0.3.0`)

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Redondeo a enteros de `element.scrollTop` en algunos navegadores al incrementar deltas pequeños por frame (`~0.4px` a `60fps`), impidiendo que el scroll avance. | Alto | Mantener un acumulador flotante en un `useRef<number>` dentro de `useAutoScroll` y aplicar a `scrollTop` únicamente la parte entera acumulada (`>= 1px`), sincronizando el acumulador cuando se inicia o reanuda. |
| Espejado o sangrado visual de la cara frontal durante la rotación 3D en motores WebKit/Blink. | Medio | Aplicar `backfaceVisibility: 'hidden'` y `WebkitBackfaceVisibility: 'hidden'` en ambas caras, además de `pointer-events-none` e `inert` en la cara oculta. |
| Fugas de memoria (`memory leaks`) por lazos `requestAnimationFrame` o `setTimeout` activos si el usuario navega fuera de la Home mientras una tarjeta está volteada. | Medio | Encapsular todos los identificadores de `setTimeout` y `requestAnimationFrame` en `useRef` dentro de `useAutoScroll` y `SymbolFlipCard`, cancelándolos infaliblemente en el retorno de `useEffect` y verificando con tests de desmontaje. |
