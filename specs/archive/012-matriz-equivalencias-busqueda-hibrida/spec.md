---
id: 012-matriz-equivalencias-busqueda-hibrida
version: 0.3.0
status: approved
cultural-gate: true
---

# 012 — Búsqueda Híbrida Multinivel Semaforizada, Buscador Global Minimalista y Gobierno Integral del Panel Administrativo (Léxico, Taxonomía, Abreviaturas y Medios)

## Contexto

Con el commit base `750435b` (`Spec 012 v0.1.0`) se implementó la **Matriz Relacional de Equivalencias Bilingües (`equivalencias_bilingues`)** con `1.633` relaciones, el puerto `ISemanticEmbeddingProvider` bajo los Principios CARE y el motor de **Búsqueda Híbrida con Reciprocal Rank Fusion (`RRF`, $k = 60$)** para términos léxicos.

Durante la validación integral de punta a punta sobre el entorno vivo y con base en las 14 evidencias visuales y el documento lingüístico oficial `Abreviaturas.pdf` alojados en `/data`, se identificaron cuatro brechas estructurales que deben resolverse dentro de la **Enmienda `v0.2.0` de la `Spec 012`** para garantizar una experiencia pública y administrativa coherente, veloz y libre de pérdida de datos:

1. **Ausencia de nodos taxonómicos en el buscador global y falta de semaforización por nivel**:
   - Actualmente el motor solo indexa entradas de `sentidos_lexicos` + `formas_namtrik`. Al buscar `"Nakkuk"`, el usuario recibe resultados únicamente porque existe el término homónimo `C1.S1.M4.E014 Nakkuk — Fogón`; en cambio, al buscar `"Wammera"` (que existe como microcampo `C1.S1.M1 Wammera — Lengua y memoria ancestral` con 7 términos, pero no como palabra individual), el buscador no retorna el microcampo.
   - El buscador debe indexar y devolver tanto **Campos Semánticos (Nivel 1)**, **Subcampos (Nivel 2)**, **Microcampos (Nivel 3)** y **Subniveles recursivos (Nivel 4)** como **Términos Léxicos (Nivel 5)** desde `>= 1` carácter, presentando **indicadores semaforizados (color + icono + etiqueta de nivel)** que orienten de inmediato al usuario y lo lleven a la vista o lista de términos correspondiente.
2. **Necesidad de un buscador global público minimalista, moderno y no intrusivo**:
   - En la vista raíz `/campos` ya existe el buscador hero dedicado, por lo que allí no debe duplicarse ningún activador adicional.
   - En el resto de páginas públicas (`/` Home, `/campos/:fieldSlug`, `/campos/:fieldSlug/:subfieldSlug`, `/campos/:fieldSlug/:subfieldSlug/:microfieldSlug`), el usuario necesita un acceso inmediato al buscador global que **no obstruya** los botones redondos de la constelación del Home ni las imágenes, videos o audios: un botón minimalista de lupa en el `PublicHeader` (con atajo `Ctrl+K` / `⌘K` en escritorio) acompañado en móvil/táctil (y cuando el header esté oculto en el Hero) por un **botón flotante compacto arrastrable (`DraggableSearchTrigger`)** que el usuario pueda mover y ubicar donde prefiera.
3. **Desconexión de los buscadores del panel administrativo y del Editor de Sentidos Léxicos (`SentidoEditorPage.tsx`)**:
   - Los buscadores administrativos usan `ILIKE` crudo sin `public.immutable_normalize_namtrik_es`, fallando al buscar `"corazon"` (sin tilde) para `Isramsruk — Corazón` o `"malo"` (con `o` en vez de `ɵ`) para `Malɵ — Cara`, y ordenan por `id DESC` en vez de relevancia (dejando `Malɵ` al final al buscar `"cara"`).
   - El formulario `SentidoEditorPage.tsx` no carga ni guarda `namtrikContexto` (oración de ejemplo), `espanolExplicacion`, **`nombreCientifico`** (`150` registros botánicos/zoológicos), campos dialógicos (`40` registros en Saludos), múltiples formas (`90` sentidos) ni variantes (`182` formas con `V. 1`/`V. 2`/`V. 3`), y sus desplegables de «Categoría Gramatical» y «Tipo de Entrada» contienen valores inventados que al guardar sobrescriben las abreviaturas lingüísticas reales de la BD (`s.`, `sn.`, `sv.`, `loc. nom.`, etc., documentadas en `Abreviaturas.pdf`).
4. **Falta del módulo administrativo de Taxonomía (`Campos, Subcampos, Microcampos y Subniveles`) con protección jerárquica y medios culturales reales**:
   - Los administradores requieren una sección dedicada en el panel (`/admin/taxonomia`) para crear, editar y organizar Campos, Subcampos, Microcampos y Subniveles con validación estricta de integridad referencial (**nunca permitir eliminar un campo si contiene subcampos o términos activos, ni un subcampo si contiene microcampos o términos activos, ni un microcampo/subnivel si contiene subniveles o términos activos**) y con carga/asociación real de imágenes, audios y videos validada entre frontend y backend.

---

## Requisitos (EARS)

### Parte I — Base Consolidada de Equivalencias y Búsqueda Híbrida (`R-001` a `R-007`, implementados en `v0.1.0`)

- **R-001 (Esquema Relacional `equivalencias_bilingues` e Índice `pgvector` HNSW)** — CUANDO se aplique la migración `0014_matriz_equivalencias_y_busqueda_hibrida`, EL SISTEMA DEBERÁ crear la tabla `equivalencias_bilingues` vinculada a `sentidos_lexicos(id)` (`ON DELETE CASCADE`) con índices funcionales `BTREE` y `GIN (gin_trgm_ops)` sobre `public.immutable_normalize_namtrik_es`, y añadir en `sentidos_lexicos` la columna `embedding vector(384)` con índice `HNSW (embedding vector_cosine_ops)`.

- **R-002 (Poblado Determinista e Idempotente de la Matriz Bilingüe)** — CUANDO se ejecute `equivalencias:sync` o `syncEquivalenciasBilingues`, EL SISTEMA DEBERÁ poblar de manera idempotente `equivalencias_bilingues` extrayendo sub-acepciones, núcleos nominales (`"estrella"` en `Kɵnchapik`, `"mundo"` en `Kɵrɵishik`), familias morfológicas (`pura*` ↔ `"maíz"`) y el manifiesto `data/lexicon/v1/equivalencias-bilingues.yaml`.

- **R-003 (Ranking Híbrido con Reciprocal Rank Fusion `RRF` en `PalabraRepository`)** — CUANDO una persona usuaria realice una búsqueda en `GET /api/dictionary/words/search?q=<termino>`, EL SISTEMA DEBERÁ combinar las señales léxica, matricial (`equivalencias_bilingues`), difusa (`pg_trgm`), documental (`FTS`) y vectorial (`pgvector`) mediante **RRF ($k = 60$)** y orden alfabético cultural `public.misak_sort_key`.

- **R-004 (Soberanía de Datos Lingüísticos y Puerto `ISemanticEmbeddingProvider`)** — MIENTRAS el sistema procese consultas o indexe términos del diccionario, EL SISTEMA NO DEBERÁ enviar textos a APIs externas de IA, utilizando por defecto `NullEmbeddingProvider`.

- **R-005 (Transparencia de Coincidencia por Equivalencia en API y `SearchBox`)** — CUANDO un sentido léxico sea recuperado vía `equivalencias_bilingues`, EL SISTEMA DEBERÁ proyectar `campoCoincidencia: 'equivalencia'` y `terminoEquivalente`, renderizando la insignia accesible **«Equivalencia: {término}»**.

- **R-006 (Cortocircuito de Tabla Heredada `palabras_modelo_1` en Hot-Path)** — CUANDO `PalabraRepository.searchModelo1` verifique que `palabras_modelo_1` está vacía, EL SISTEMA DEBERÁ memorizar dicho estado y omitir consultas redundantes en búsquedas subsecuentes.

- **R-007 (Coherencia Semántica Bidireccional en Casos Críticos del Léxico)** — CUANDO se consulten `"pura"` ↔ `"maíz"`, `"estrella"` (`Kɵnchapik`), `"mundo"` (`Kɵrɵishik`) y `"flor"` ↔ `"ú"` / `"u"` (`Ú`), EL SISTEMA DEBERÁ preservar la simetría y jerarquía cultural verificada.

---

### Parte II — Búsqueda Global Multinivel Semaforizada y Experiencia Pública Minimalista (`R-008` a `R-010`)

- **R-008 (Indexación Multinivel de Nodos Taxonómicos y Términos desde `>= 1` Carácter)** — CUANDO se consulte `GET /api/dictionary/words/search?q=<termino>` con **`>= 1` carácter** (ajustando el contrato DTO `SearchQuerySchema` a `min(1)` y el umbral de `SearchBox.tsx` a `>= 1`), EL SISTEMA DEBERÁ buscar en paralelo sobre los nodos taxonómicos activos (`campos_semanticos`, `subcampos_semanticos`, `microcampos` de `profundidad = 0` y subniveles recursivos con `profundidad >= 1`) y sobre los sentidos léxicos (`formas_namtrik`, `espanol_glosa`, `equivalencias_bilingues`, `nombre_cientifico`, `espanol_explicacion`, `namtrik_contexto`), utilizando `public.immutable_normalize_namtrik_es` y retornando en cada elemento:
  - `tipoResultado`: `'campo' | 'subcampo' | 'microcampo' | 'subnivel' | 'termino'`
  - `nivelJerarquico`: `1 | 2 | 3 | 4 | 5`
  - `codigo`: código canónico (`C1`, `C1.S1`, `C1.S1.M1`, `C1.S1.M19.1`, `C1.S1.M4.E014`)
  - `totalTerminos`: conteo de términos o subniveles asociados (para nodos taxonómicos)
  - `nombreCientifico`: nombre científico asociado (cuando aplique en términos).
  Para consultas de 1 solo carácter (ej. `"ú"`, `"u"`, `"a"`), el motor deberá retornar únicamente coincidencias exactas o de prefijo directo de lema/glosa/nodo para evitar ruido difuso.

- **R-009 (Semaforización Visual y Accesible por Nivel Jerárquico en `SearchBox`)** — CUANDO `SearchBox.tsx` muestre resultados en el desplegable o modal de búsqueda global, EL SISTEMA DEBERÁ presentar para cada ítem una **insignia semaforizada accesible** (color + icono + etiqueta explícita conforme a WCAG 2.2 AA `1.4.1`) que indique su nivel en la arquitectura del diccionario y su comportamiento de navegación al hacer clic o presionar Enter/lupa:
  - **Nivel 1 — `CAMPO`** (Semaforización Magenta `#E52D6D` + icono de territorio): redirige a `/campos/:campoSlug`.
  - **Nivel 2 — `SUBCAMPO`** (Semaforización Azul `#0055AA` + icono de subcampo): redirige a `/campos/:campoSlug/:subcampoSlug`.
  - **Nivel 3 — `MICROCAMPO`** (Semaforización Esmeralda `#10B981` + icono de microcampo + contador de términos): redirige a `/campos/:campoSlug/:subcampoSlug/:microcampoSlug` (resolviendo el caso `"Wammera"` → `/campos/ya/nakchak/wammera` y mostrando en `"Nakkuk"` tanto el microcampo como el término léxico).
  - **Nivel 4 — `SUBNIVEL`** (Semaforización Ámbar `#F59E0B` + icono de subnivel): redirige a `/campos/:campoSlug/:subcampoSlug/:microcampoSlug#subnivel-:slug`.
  - **Nivel 5 — `TÉRMINO`** (Semaforización Cian `#0EA5E9` + insignia de precisión `EXACTA`, `EQUIVALENCIA: {término}`, `CIENTÍFICO` o `EN DESCRIPCIÓN`): redirige a `/campos/:campoSlug/:subcampoSlug/:microcampoSlug#term-:id`.

- **R-010 (Buscador Global Público Minimalista Unificado con Botón Flotante Arrastrable No Intrusivo)** — MIENTRAS la persona usuaria navegue por cualquier ruta pública distinta de `/campos` (`location.pathname !== '/campos'`), EL SISTEMA DEBERÁ proveer acceso al buscador global sin duplicar iconos en `PublicHeader.tsx` ni obstruir los botones redondos del Home, las imágenes, los videos o los controles de audio mediante dos mecanismos coordinados:
  1. **Botón flotante arrastrable unificado (`DraggableSearchTrigger.tsx`)**: botón circular minimalista (`52x52px`, estética *glassmorphism* con borde `#0055AA/80` y hover `#E52D6D`) disponible en todas las rutas públicas excepto `/campos`, que el usuario puede **mover y reubicar libremente por arrastre táctil, puntero o teclas de flecha (`±15px`)** hacia cualquier punto de la pantalla (persistiendo su ancla canónica `FabAnchor` `{ x, y, xRatio, yRatio, viewportWidth, viewportHeight }` en `localStorage` bajo `misak_search_fab_pos`, proyectando proporcionalmente ante rotación/redimensionamiento y restituyendo el píxel exacto al volver al tamaño original, diferenciando gesto `drag` > `6px` en puntero y > `12px` en táctil de `tap`), y que **se oculta automáticamente en `/campos` o mientras el modal está abierto**.
  2. **Modal de Búsqueda Global y Atajo de Teclado (`GlobalSearchModal.tsx` + `GlobalSearchContext.tsx`)**: diálogo ligero con gestión de foco, activación por clic en la lupa flotante o mediante el atajo global `Ctrl+K` / `⌘K` (que en `/campos` enfoca directamente `#dictionary-search-input`), cierre por `Escape` / clic fuera y renderizado del `SearchBox` semaforizado.

---

### Parte III — Buscadores Administrativos Normalizados, Catálogo Oficial `Abreviaturas.pdf` e Integridad del Editor Léxico (`R-011` a `R-013`)

- **R-011 (Normalización `ɵ`/Sin Tildes y Ranking por Relevancia en Todos los Buscadores del Panel Admin)** — CUANDO un administrador filtre o busque en **Léxico y Sentidos** (`GET /api/admin/dictionary/sentidos`), **Taxonomía** (`GET /api/admin/taxonomy/nodos`), **Medios Culturales** (`GET /api/admin/medios`), **Cola de Revisión** (`/admin/revision`) o **Papelera** (`/admin/papelera`), EL SISTEMA DEBERÁ aplicar `public.immutable_normalize_namtrik_es` sobre la consulta y sobre las columnas evaluadas (lema, glosa, explicación, contexto Namtrik, nombre científico, código, términos de nodos y metadatos de medios), ordenando los resultados de búsqueda por **prioridad de relevancia** (`1`: coincidencia exacta de lema/glosa/código, `2`: palabra exacta en glosa, `3`: prefijo de lema/glosa, `4`: subcadena en glosa/nombre científico/contexto) antes del desempate por `codigo ASC`.

- **R-012 (Catálogo Dinámico de Abreviaturas Lingüísticas en BD, CRUD Seguro y Semilla `Abreviaturas.pdf`)** — EL SISTEMA DEBERÁ persistir en base de datos el modelo `AbreviaturaGramatical` (`abreviaturas_gramaticales`, con `codigo`, `etiqueta_completa`, `descripcion`, `dimension`, `orden`, `activo`), hidratado idempotentemente desde `data/lexicon/v1/abreviaturas.yaml` con las **41 abreviaturas oficiales** de `Abreviaturas.pdf` (`codigo` y `etiquetaCompleta`), y exponer tanto el catálogo público (`GET /api/dictionary/abreviaturas`) como el CRUD administrativo (`GET/POST/PATCH/DELETE /api/admin/dictionary/abreviaturas`, protegido por `dictionary:write` y `dictionary:delete`), garantizando que:
  1. Un administrador o editor pueda **agregar nuevas abreviaturas, editar su código/significado/descripción o eliminarlas** de forma segura (tanto desde la sección de gestión de abreviaturas como al vuelo mediante el botón rápido **«+ Nueva abreviatura»** dentro del editor de sentidos), quedando disponibles al instante en todo el diccionario.
  2. Al editar el `codigo` de una abreviatura existente, se actualicen transaccionalmente las referencias en `formas_namtrik`; y al intentar **eliminar** una abreviatura que esté siendo utilizada por `>= 1` forma léxica activa, el sistema **bloquee el borrado con `HTTP 409 Conflict`** indicando cuántos términos dependen de ella.
  3. Se unifiquen las variantes tipográficas de `formas_namtrik.categoria_gramatical` (`sn` / `SN.` → `sn.`, `v` → `v.`, `adj` / `Adj.` → `adj.`, `v.posic.` / `v.pos.` → `v. pos.`, `loc.interj.` / `loc.Interj.` → `loc. interj.`, `O.S.Adv. Tiem` → `O.S.Adv. Tiem.`) preservando intacta `etiqueta_original` y restaurando `C2.S5.E002` (`Waara` → `s., mamíf.`) y `C4.S6.E021` (`Milu kalik` → `sn.`).

- **R-017 (Tooltip y Popover Interactivo, Responsivo y Accesible de Abreviaturas en UI Pública y Admin — `AbbreviationBadge`)** — CUANDO cualquier vista del diccionario (`SearchBox.tsx`, `GlobalSearchModal.tsx`, `TermRow.tsx`, `SentidosPage.tsx` o `SentidoEditorPage.tsx`) muestre una abreviatura gramatical, de variante, rasgo, préstamo o dominio (simple como `sv.` o compuesta como `loc. nom., adj.` / `s., simb.`), EL SISTEMA DEBERÁ renderizarla mediante el componente accesible y responsivo `AbbreviationBadge` (montado vía `createPortal(..., document.body)` con posicionamiento `position: fixed` calculado mediante `getBoundingClientRect()`):
  1. **En Escritorio (`hover` con mouse y `focus-visible` con teclado, WCAG 1.4.13)**: al pasar el cursor por encima o enfocar la abreviatura, desplegará suavemente un tooltip moderno con el significado completo oficial (ej. `sv.` → **«Sintagma verbal»**, `O. S. E. A. P. I.` → **«Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva»**), su dimensión lingüística y descripción contextual, aplicando *horizontal clamping* (`[12px, viewportWidth - tooltipWidth - 12px]`), flecha dinámica alineada al centro del badge y *vertical flip* automático (`top` ↔ `bottom`) para no recortarse jamás en ningún tamaño de pantalla ni contenedor con `overflow`.
  2. **En Móvil y Pantallas Táctiles (`tap` responsivo desde `320px`/`360px`)**: al tocar la abreviatura (con `stopPropagation` para no disparar la navegación de la tarjeta contenedora), abrirá el micro-popover adaptativo dentro de los márgenes seguros de la pantalla con cierre por toque externo o tecla `Escape`.

- **R-013 (Integridad Total del Editor de Sentidos Léxicos, Nombres Científicos y Formas Múltiples en `SentidoEditorPage.tsx` y Visualización Pública en `TermRow.tsx` / `SearchBox.tsx`)** — CUANDO un usuario con permiso `dictionary:write` edite o cree un sentido en `/admin/sentidos/nuevo` o `/admin/sentidos/:id/editar`, EL SISTEMA DEBERÁ cargar desde la base de datos y persistir sin pérdida de información todos los campos del modelo canónico:
  1. **Gestión completa de `formas: FormaNamtrik[]`**: edición de las `N` formas asociadas al sentido (permitiendo añadir nuevas formas/variantes, editar `lema`, `categoriaGramatical` desde el catálogo oficial de `Abreviaturas.pdf`, `variante` (`V. 1`, `V. 2`, `V. 3`), `esNeologismo`, `rasgosGramaticales[]` y `etiquetaOriginal`, o eliminar una forma secundaria si hay `> 1`), eliminando el adaptador destructivo de `useAdmin.ts` que sobrescribía `formas` con un único elemento.
  2. **Tipo de entrada real (`estandar` | `dialogico`)**: selector alineado con la BD (`Estándar` / `Dialógico`), desplegando para entradas dialógicas los campos `respuestaNamtrik`, `respuestaNamtrikContexto`, `respuestaEspanolGlosa` y `respuestaEspanolExplicacion`.
  3. **Sección dedicada y visualización canónica de Término / Nombre Científico (`nombreCientifico`)**: campo editable con formato taxonómico en cursiva para registrar o actualizar nombres científicos (`Gastropoda`, `Helicoverpa zea`, `Spodoptera frugiperda`, `Smallanthus sonchifolius`, etc.), más filtro rápido «Con nombre científico» e insignia visible en la tabla de `SentidosPage.tsx`; y en el diccionario público (`TermRow.tsx` y `SearchBox.tsx`), renderizado **en la columna/sección en español junto a la glosa en castellano**, encerrado entre **paréntesis de color blanco** (`text-white/95`) con el **término científico en color verde y cursiva** (`text-emerald-300 font-serif italic`) y deduplicación automática cuando la glosa ya incluya el paréntesis.
  4. **Contexto de uso, explicaciones y ubicación real**: carga y guardado efectivo de `namtrikContexto` (Oración de ejemplo en Namtrik), `espanolExplicacion` (Explicación o traducción contextual en Castellano), `observacionEditorial` y selector jerárquico de ubicación (`Campo` → `Subcampo` → `Microcampo` → `Subnivel`) con soporte para reubicación controlada.

---

### Parte IV — Gestión Administrativa de Taxonomía (`Campos, Subcampos, Microcampos y Subniveles`), Protección Jerárquica y Medios Culturales (`R-014` a `R-016`)

- **R-014 (Módulo Administrativo de Taxonomía `/admin/taxonomia` y API CRUD de Nodos)** — EL SISTEMA DEBERÁ proveer los casos de uso y endpoints administrativos en `/api/admin/taxonomy/nodos` (`GET`, `POST`, `PATCH /:nivel/:id`, `DELETE /:nivel/:id`) y la página `/admin/taxonomia` (`TaxonomiaAdminPage.tsx`, incorporada en el menú lateral de `AdminLayout.tsx` bajo el permiso `dictionary:read`) para explorar en árbol y tabla, buscar y gestionar **Campos Semánticos (Nivel 1)**, **Subcampos (Nivel 2)**, **Microcampos (Nivel 3)** y **Subniveles recursivos (Nivel 4+)**, permitiendo crear, editar (`namtrikTermino`, `espanolTermino`, `namtrikDescripcion`, `espanolDescripcion`, `posicion`), ratificar o mover a papelera según los permisos RBAC (`dictionary:write`, `dictionary:delete`, `taxonomy:ratify`).

- **R-015 (Protección Estricta contra Eliminación de Nodos con Descendientes Activos)** — CUANDO un usuario con permiso `dictionary:delete` solicite eliminar (mover a papelera en `DELETE /api/admin/taxonomy/nodos/:nivel/:id` o purgar en `PapeleraUseCase`) un Campo Semántico, Subcampo, Microcampo o Subnivel, EL SISTEMA DEBERÁ verificar en transacción que el nodo no posea ningún nodo hijo activo (`deletedAt: null`) ni ningún sentido léxico activo (`sentidos_ubicaciones` con `sentido.deletedAt: null`), **bloqueando la eliminación con `HTTP 409 Conflict`** y devolviendo el desglose exacto de dependencias (`subcamposActivos`, `microcamposActivos`, `subnivelesActivos`, `sentidosActivos`) mientras existan elementos dependientes.

- **R-016 (Carga, Asociación y Presentación Real de Medios Culturales en Todos los Niveles)** — CUANDO un administrador con permiso `media:write` edite un **Campo Semántico**, **Subcampo**, **Microcampo**, **Subnivel** o **Sentido/Forma léxica**, EL SISTEMA DEBERÁ permitir subir nuevos archivos multimedia (imagen, audio Namtrik, audio Castellano, video) o vincular medios existentes asociando su FK correspondiente (`campoSemanticoId`, `subcampoSemanticoId`, `microcampoId`, `sentidoId`, `formaId`) y actualizando las referencias de presentación del nodo (`imagen`, `namtrikAudio`, `espanolAudio`), de modo que tanto el panel administrativo como las páginas públicas (`CampoPage`, `SubfieldPage`, `MicrofieldPage`, `TermRow`) carguen, reproduzcan y muestren los medios reales validados desde la base de datos.

---

### Parte V — Deep Linking Multimodal Anti-CLS, Auto-Foco Inmediato, Auto-Scroll de Teclado en `listbox`, Modo Command-Palette y Fluidez Móvil/Tablet (`R-018` a `R-021`, Enmienda `v0.3.0`)

- **R-018 (Deep Linking Determinista `#term-{id}` / `#subnivel-{slug}`, Estabilización Multimodal Anti-CLS y Resaltado Accesible)** — CUANDO la persona usuaria seleccione un resultado de búsqueda de tipo **Subnivel (Nivel 4)** o **Término Léxico (Nivel 5)** (incluso cuando pertenezca a un subnivel recursivo anidado), EL SISTEMA DEBERÁ navegar hacia la página contenedora con el fragmento exacto (`#subnivel-{slug}` sobre el microcampo raíz para subniveles y `#term-{id}` para términos, resolviendo también hacia el microcampo raíz cuando el sentido resida en un subnivel), posicionar el _viewport_ sobre el elemento exacto con margen superior seguro (`scroll-mt-28`), mantener el anclaje estable mediante `ResizeObserver` ante la hidratación asíncrona de imágenes/audios/videos, evitar que `useRouteFocus` devuelva el scroll al `<h1>` cuando exista un hash activo, y aplicar un resaltado visual temporal accesible (`data-deep-linked="true"`, respetando `prefers-reduced-motion`).

- **R-019 (Auto-Foco Inmediato en Una Sola Acción, Aislamiento de `/admin/*` y Preservación Íntegra de Metadatos en `dictionaryApi.fetchSearch`)** — CUANDO la persona usuaria active el buscador mediante `Ctrl+K` / `⌘+K`, el atajo rápido `/` (fuera de controles editables) o clic en el activador flotante, EL SISTEMA DEBERÁ situar automáticamente el cursor en el campo de entrada permitiendo escribir de inmediato en una única acción (sincronizando el ID del buscador principal en `/campos`), ignorar los atajos globales públicos mientras se encuentre en `/admin/*`, y preservar sin recorte `tipoResultado`, `nivelJerarquico`, `totalTerminos` y `nombreCientifico` en `dictionaryApi.fetchSearch`.

- **R-020 (Auto-Scroll Determinista en `listbox`, Modo Command-Palette "Keyboard Geek", Seguridad IME y HTML5 Válido)** — MIENTRAS la persona usuaria navegue resultados en `SearchBox.tsx` mediante teclado, EL SISTEMA DEBERÁ:
  1. Sincronizar geométricamente `container.scrollTop` dentro del `listboxRef` (`SCROLL_PADDING = 6` px, _snap_ `0` y `scrollHeight` en los extremos, _fallback_ `scrollIntoView({ block: 'nearest' })` en entornos sin layout) sin desplazar contenedores ancestros ni degradarse ante autorrepetición de teclas (`e.repeat`).
  2. Corregir el _wrap-around_ de `ArrowUp` desde `selectedIndex === -1` para seleccionar el último ítem (`results.length - 1`) y bloquear el _"ghost hover"_ de cursores estacionarios mediante control explícito de modalidad `keyboard` vs `pointer`.
  3. Soportar comandos avanzados para usuarios de teclado: `Ctrl+N` / `Ctrl+P` (siguiente/anterior en _home row_), `PageDown` / `PageUp` (salto `±5`), `Ctrl+Home` / `Ctrl+End` (inicio/fin de resultados sin alterar `Home`/`End` de edición), `Ctrl+Enter` / `⌘+Enter` (abrir en nueva pestaña con `noopener,noreferrer`), `Alt+O` (insertar `ɵ` exactamente en `selectionStart`..`selectionEnd`), `Ctrl+U` (limpiar consulta) y `Escape` progresivo en modo inline.
  4. Proteger `Enter` durante composición IME o teclas muertas (`isComposing`, `keyCode === 229` o `< 50ms` desde `compositionend`), renderizar `<AbbreviationBadge disabled />` como `<abbr>` estático dentro de `<Link role="option" tabIndex={-1}>` (HTML5 válido sin trampa de `Tab`), cerrar el menú inline al hacer clic o tabular fuera y anunciar conteos de resultados con `aria-live="polite"` _debounced_.

- **R-021 (Modal `<dialog>` Adaptativo a `window.visualViewport`, Persistencia Canónica `FabAnchor` y Activación Táctil/Teclado en `DraggableSearchTrigger`)** — CUANDO `GlobalSearchModal.tsx` se abra en escritorio, tablet o móvil, EL SISTEMA DEBERÁ utilizar un elemento `<dialog>` nativo abierto mediante `showModal()` (`closedby="any"`, con transición inicial `closedby="closerequest"` ante aperturas táctiles para neutralizar _ghost clicks_ residuales) y sincronización `flushSync` para garantizar `autofocus` inmediato al 100% en el `<input>` sobre iOS/Android, renderizando `SearchBox` en `variant="modal"` (columna flexible `flex-col` sincronizada con `window.visualViewport` para que el teclado virtual nunca oculte los resultados inferiores), prevenir _scroll chaining_ mediante `overscroll-behavior: contain` en `dialog:modal` y `overflow: hidden; overscroll-behavior: contain` en `dialog::backdrop`, y garantizar que `DraggableSearchTrigger.tsx` abra el modal con un solo `tap` en cualquier coordenada (`touchend` `{ passive: false }`), responda a `onClick` / flechas de teclado (`±15px`) y conserve intacta su ancla canónica (`FabAnchor`) ante ciclos de apertura/cierre del modal, retracción del teclado virtual móvil (`POST_MODAL_KEYBOARD_GUARD_MS = 450`), rotación/redimensionamiento de pantalla y navegación entre secciones o rutas.

---

## Criterios de Aceptación (Gherkin)

### Escenario 1: Búsqueda pública de microcampo «Wammera» y distinción semaforizada en «Nakkuk» (`R-008`, `R-009`)
```gherkin
Dado que en la base de datos existen el microcampo "C1.S1.M1" "Wammera" ("Lengua y memoria ancestral") con 7 términos y el microcampo "C1.S1.M4" "Nakkuk" ("Fogón") con 24 términos además del término léxico "C1.S1.M4.E014" "Nakkuk" ("Fogón")
Cuando la persona usuaria ingresa "Wammera" en el buscador global o presiona el botón de la lupa
Entonces el primer resultado muestra el nodo "Wammera — Lengua y memoria ancestral" con la insignia semaforizada "MICROCAMPO" (Nivel 3) y el contador "7 términos"
Y al hacer clic sobre ese resultado el sistema navega a "/campos/ya/nakchak/wammera"
Y cuando la persona usuaria ingresa "nakkuk"
Entonces los resultados muestran tanto el nodo con insignia "MICROCAMPO" ("Nakkuk — Fogón", 24 términos) como la entrada con insignia "TÉRMINO" + "EXACTA" ("Nakkuk (s.) — Fogón").
```

### Escenario 2: Buscador global público minimalista unificado con botón flotante arrastrable (`R-010`)
```gherkin
Dado que la persona usuaria navega en la portada "/" o dentro de un campo "/campos/ya"
Cuando visualiza la interfaz en escritorio o dispositivo móvil
Entonces dispone del botón flotante reposicionable de lupa ("DraggableSearchTrigger") y del atajo de teclado "Ctrl+K" / "⌘K" sin duplicar otro icono de lupa en el Header ni obstruir los botones redondos de la constelación o los recursos multimedia
Y cuando arrastra el botón flotante hacia otra posición de la pantalla y lo suelta
Entonces el botón conserva su nueva ubicación sin disparar la apertura accidental del modal
Y cuando navega a la ruta exacta "/campos"
Entonces el activador flotante se oculta automáticamente porque allí ya está presente el buscador principal de la sección.
```

### Escenario 3: Búsqueda administrativa insensible a tildes y con equivalencia `ɵ` ↔ `o` y orden por relevancia (`R-011`)
```gherkin
Dado que en "sentidos_lexicos" existen "C1.S1.M18.E018" ("Isramsruk" — "Corazón") y "C1.S1.M18.E001" ("Malɵ" — "Cara")
Cuando un administrador escribe "corazon" (sin tilde) en el buscador de "/admin/sentidos"
Entonces la lista muestra "Isramsruk — Corazón"
Y cuando escribe "malo" (con vocal "o") o "malɵ" (con vocal "ɵ")
Entonces la lista muestra "Malɵ — Cara", "Malɵ kuallip — Lavarse la cara" y "Malɵ pikɵrap — Ruborizarse"
Y cuando escribe "cara"
Entonces "Malɵ — Cara" y "Malɵ kuallip — Lavarse la cara" aparecen en las primeras posiciones por encima de "Caracol (Gastropoda)" y "Carangano".
```

### Escenario 4: Edición íntegra de sentido léxico con catálogo `Abreviaturas.pdf`, formas múltiples y nombre científico (`R-012`, `R-013`)
```gherkin
Dado que el sentido "C4.S6.E021" ("Milu kalik" — "Caracol (Gastropoda)") tiene categoría "sn.", oración de ejemplo "Milu kalik nui ya mara, truyu nurap, nika unik." y nombre científico "Gastropoda"
Cuando un administrador con permiso "dictionary:write" abre "/admin/sentidos/:id/editar"
Entonces el formulario carga la categoría oficial "sn. — Sintagma Nominal", la oración de ejemplo real desde BD y el campo "Nombre científico" con "Gastropoda"
Y cuando modifica el nombre científico o añade una segunda forma con variante "V. 2" y guarda los cambios
Entonces la base de datos persiste todas las formas, sus categorías oficiales, el contexto Namtrik, la explicación en castellano y el nombre científico sin pérdida de datos.
```

### Escenario 5: Protección jerárquica contra eliminación de campos, subcampos y microcampos con hijos activos (`R-014`, `R-015`)
```gherkin
Dado que el campo semántico "C1" ("Ya") tiene subcampos activos y el microcampo "C1.S1.M1" ("Wammera") tiene 7 sentidos léxicos activos
Cuando un usuario con permiso "dictionary:delete" intenta eliminar el campo "C1" o el microcampo "C1.S1.M1" desde "/admin/taxonomia"
Entonces el backend rechaza la operación con estado HTTP 409 Conflict indicando cuántos subcampos, microcampos, subniveles o términos activos impiden su eliminación
Y el botón de eliminar en la interfaz informa claramente la restricción jerárquica hasta que el nodo no tenga elementos hijos activos.
```

### Escenario 6: Carga y asociación real de medios culturales en nodos taxonómicos y términos (`R-016`)
```gherkin
Dado que un administrador con permisos "dictionary:write" y "media:write" edita un campo, subcampo, microcampo o sentido léxico
Cuando sube o asocia una imagen ilustrativa, un audio de pronunciación o un video cultural
Entonces el archivo es validado por firma binaria, almacenado y vinculado al nodo o sentido en "medios_culturales"
Y la vista pública correspondiente renderiza y reproduce el recurso multimedia real desde la base de datos.
```

### Escenario 7: Gestión dinámica CRUD de las 41 abreviaturas en BD y tooltip/popover responsivo en público y admin (`R-012`, `R-017`)
```gherkin
Dado que el catálogo de abreviaturas está persistido en "abreviaturas_gramaticales" con las 41 entradas exactas de "Abreviaturas.pdf" (únicamente "codigo" y "etiquetaCompleta", sin "adj. cal." ni "mamíf.")
Cuando un usuario del diccionario público o un administrador pasa el cursor sobre la abreviatura "sv." (en escritorio) o la toca (en pantalla móvil)
Entonces el componente "AbbreviationBadge" despliega de forma responsiva el tooltip/popover indicando únicamente "sv." y "Sintagma verbal" con paleta cromática sincronizada entre el panel administrativo (modo claro y modo oscuro) y el diccionario público
Y cuando un editor en el panel administrativo abre el gestor "AdminAbreviaturasModal" desde "SentidosPage" o desde "+ Nueva / Gestionar abreviaturas" en "SentidoEditorPage"
Entonces puede crear nuevas abreviaturas, editar abreviaturas existentes (con cascada en "formas_namtrik") y eliminar abreviaturas que no estén en uso
Y cuando intenta eliminar una abreviatura que está siendo usada por al menos un sentido activo
Entonces el sistema rechaza el borrado con HTTP 409 Conflict informando cuántos términos la utilizan.
```

### Escenario 8: Deep Linking exacto hacia términos y subniveles con resaltado post-scroll y estabilidad multimedia (`R-018`)
```gherkin
Dado que la persona usuaria busca un término específico dentro de un microcampo o subnivel con múltiples entradas y recursos de audio/imagen
Cuando selecciona el resultado desde el buscador mediante clic o tecla "Enter"
Entonces el navegador abre la página correspondiente con el fragmento "#term-{id}" (o "#subnivel-{slug}" para subniveles), desplaza automáticamente el viewport hasta centrar/mostrar el elemento exacto sin que "useRouteFocus" ni la carga diferida de multimedia desvíen la posición
Y aplica un resaltado visual temporal sobre la tarjeta de destino.
```

### Escenario 9: Auto-foco inmediato y auto-scroll de teclado con comandos avanzados en el menú desplegable (`R-019`, `R-020`)
```gherkin
Dado que la persona usuaria presiona "Ctrl+K" / "⌘+K" o "/" en cualquier ruta pública (incluyendo "/campos")
Cuando el buscador se activa
Entonces el foco y el cursor quedan situados inmediatamente dentro del campo de texto permitiendo escribir sin ningún clic ni "Tab" adicional
Y cuando la consulta devuelve una lista de resultados que excede la altura visible del contenedor y la persona usuaria navega con "ArrowDown", "ArrowUp", "Ctrl+N", "Ctrl+P", "PageDown", "PageUp" o "Ctrl+End"
Entonces el contenedor "listbox" ajusta automáticamente su "scrollTop" manteniendo siempre visible la opción activa sin desplazar la página de fondo ni saltar el último elemento al presionar "ArrowUp" desde el estado inicial.
```

### Escenario 10: Modal `<dialog>` adaptativo al teclado virtual móvil y activación universal del FAB (`R-021`)
```gherkin
Dado que la persona usuaria accede desde un teléfono móvil, tablet o lector de pantalla (VoiceOver / TalkBack)
Cuando activa "DraggableSearchTrigger" mediante toque táctil, doble toque asistivo o teclado ("Enter" / "Space")
Entonces "GlobalSearchModal" se abre como "<dialog>" modal con "SearchBox" en flujo flexible ajustado a "window.visualViewport", manteniendo visibles los resultados por encima del teclado virtual y permitiendo cerrarlo con el gesto "Atrás" del sistema o "Escape".
```

---

## Tabla de Reconciliación del Catálogo Oficial (`Abreviaturas.pdf` — 41 Entradas ↔ Base de Datos)

| Abreviatura Canónica (`codigo`) | Significado Oficial (`etiquetaCompleta`) | Variantes en BD que se unifican a esta forma |
| :--- | :--- | :--- |
| `adj.` | Adjetivo | `adj.`, `adj`, `Adj.` |
| `adv.` | Adverbio | `adv.` |
| `adv. c.` | Adverbio de cantidad | `adv.c.` |
| `adv. d.` | Adverbio demostrativo | `adv. d.` |
| `adv. f.` | Adverbio de frecuencia | `adv. f.` |
| `adv. l.` | Adverbio de lugar | `adv. l.` |
| `adv. lugar` | Adverbio de lugar | `adv. lugar` |
| `adv. m.` | Adverbio de modo | `adv. m.` |
| `adv. t.` | Adverbio de tiempo | `adv. t.` |
| `amb.` | Ambiguo | `amb.` |
| `bot.` | Botánica | `bot.` |
| `cal.` | Calificativo | `cal.`, `adj. cal.`, `adj.cal.` |
| `cuant. nom.` | Cuantificador nominal | `cuant. nom.` |
| `educ.` | Educación | `educ.`, `edu.` |
| `f.` | Femenino | `f.` |
| `gast.` | Gastronomía | `gast.`, `gast` |
| `interj.` | Interjección | `interj.` |
| `loc.` | Locución | `loc.` |
| `loc. adv. l.` | Locución adverbial de lugar | `loc. adv. l.`, `loc. adv.` |
| `loc. conjunt. temp.` | Locución conjuntiva temporal | `loc. conjunt. temp.` |
| `loc. interj.` | Locución interjectiva | `loc.interj.`, `loc.Interj.` |
| `loc. nom.` | Locución nominal | `loc. nom.`, `loc.nom.` |
| `loc. verb.` | Locución verbal | `loc. verb.` |
| `m.` | Masculino | `m.` |
| `neol.` | Neologismo | `neol.` |
| `O.E.A.` | Oración enunciativa afirmativa | `O.E.A.` |
| `O.S.Adv. Tiem.` | Oración subordinada adverbial de tiempo | `O.S.Adv. Tiem.`, `O.S.Adv. Tiem` |
| `O. S. E. A. P. I.` | Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva | `O. S. E. A. P. I.` |
| `orac. condic.` | Oración condicional | `orac. condic.` |
| `pl.` | Plural | `pl.` |
| `plac.` | Préstamo de la lengua castellana | `plac.`, `plac` |
| `plan.` | Préstamo de la lengua náhuatl | `plan.` |
| `plaq.` | Préstamo de la lengua quechua | `plaq.` |
| `plaqui.` | Préstamo de la lengua quichua | `plaqui.` |
| `ren.` | Riñón humano | `ren.`, `ren` |
| `s.` | Sustantivo | `s.` |
| `símb.` | Símbolo | `símb.`, `simb.` |
| `sing.` | Singular | `sing.` |
| `sn.` | Sintagma Nominal | `sn.`, `sn`, `SN.` |
| `sv.` | Sintagma verbal | `sv.` |
| `v.` | Verbo | `v.`, `v` |
| `V. 1`, `V. 2`, `V. 3` | Variante 1, Variante 2, Variante 3 | `V.1`, `V.2`, `V.2.`, `V. 1`, `V. 2`, `V. 3` |
| `VB.` | Vesícula Biliar | `VB.` |
| `v. pos.` | Verbo posicional | `v. pos.`, `v.pos.`, `v.posic.` |
| `zool.` | Zoología | `zool.`, `Zool.` |

---

## Impacto en Soberanía de Datos y Gobernanza Cultural (`cultural-gate: true`)

1. **Principios CARE**: La búsqueda multinivel, el ranking RRF y el catálogo de abreviaturas operan 100 % en PostgreSQL 18 y Node.js local sin llamadas externas.
2. **Fidelidad Lingüística (`Abreviaturas.pdf`)**: Se respeta la clasificación gramatical propia del Namtrik entregada por el equipo lingüístico, conservando siempre `etiqueta_original` para trazabilidad filológica.
3. **Protección del Árbol Taxonómico**: Ningún nodo con descendientes o términos activos puede ser eliminado accidentalmente, preservando los 4 campos ancestrales (*Ya*, *Ya tul*, *Tra tul*, *Kau ushamera*) y sus ramificaciones.

---

## Referencias

- Evidencias diagnósticas: `/data/Captura de pantalla 2026-11-05 *.png` y `/data/Abreviaturas.pdf`
- Fuente léxica maestra: `/data/diccionario-campo-namtrik-castellano.xlsm`
- Informe de diagnóstico: `informe_buscador_global_y_editor_admin.md`
- ADR: `specs/adr/0008-matriz-equivalencias-y-busqueda-hibrida-pgvector-rrf.md`
