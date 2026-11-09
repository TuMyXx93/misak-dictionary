# Plan Técnico — 012-matriz-equivalencias-busqueda-hibrida (`v0.3.0`)

> **Spec de referencia:** `specs/features/012-matriz-equivalencias-busqueda-hibrida/spec.md` (`v0.3.0` — `approved`, `cultural-gate: true`)
> **ADR de referencia:** `specs/adr/0008-matriz-equivalencias-y-busqueda-hibrida-pgvector-rrf.md`
> **Estado:** `approved` (Constitución C4.1)

---

## Diseño

### 1. Parte I — Base Ya Consolidada (`T-001` a `T-007` en commit `750435b`, `R-001..R-007`)

- Tabla `equivalencias_bilingues` (`1.633` filas activas) e índice `HNSW` en `sentidos_lexicos.embedding vector(384)`.
- Extractor determinista `equivalenciasBilingues.ts` y manifiesto `data/lexicon/v1/equivalencias-bilingues.yaml`.
- Puerto `ISemanticEmbeddingProvider` + `NullEmbeddingProvider`.
- Motor híbrido RRF ($k = 60$) para sentidos léxicos y cortocircuito de `palabras_modelo_1`.

---

### 2. Parte II — Búsqueda Multinivel de Nodos Taxonómicos + Términos y Semaforización (`R-008`, `R-009`, `R-010`)

1. **Ampliación del Contrato de Búsqueda (`DictionaryDto.ts`, `PalabraRepository.ts`, `SearchWordsUseCase.ts`)**:
   - En `apps/backend-service/src/api/dictionary/dtos/DictionaryDto.ts`:
     - Cambiar `SearchQuerySchema` de `min(2)` a `min(1, 'El término de búsqueda debe tener al menos 1 carácter')`.
   - En `PalabraRepository.ts`:
     - Ampliar el resultado de búsqueda con:
       - `tipoResultado: 'campo' | 'subcampo' | 'microcampo' | 'subnivel' | 'termino'` (default `'termino'`)
       - `nivelJerarquico: 1 | 2 | 3 | 4 | 5`
       - `totalTerminos?: number | null`
       - `nombreCientifico?: string | null`
     - Añadir en `searchWithSynonyms` una CTE `taxonomy_matches` que consulte en paralelo los nodos activos (`deleted_at IS NULL`):
       - **Campos semánticos (`campos_semanticos`, nivel 1)**: evalúa `public.immutable_normalize_namtrik_es(namtrik_termino)` y `public.immutable_normalize_namtrik_es(espanol_termino)`, calcula ruta `/campos/{slug}` y cuenta subcampos/sentidos activos.
       - **Subcampos semánticos (`subcampos_semanticos`, nivel 2)**: evalúa `namtrik_termino` y `espanol_termino`, construye ruta `/campos/{campo.slug}/{subcampo.slug}` y cuenta microcampos/sentidos activos.
       - **Microcampos (`microcampos` con `profundidad = 0`, nivel 3)**: evalúa `coalesce(namtrik_termino, '')` y `espanol_termino` (resolviendo `"Wammera"` → `C1.S1.M1 Wammera — Lengua y memoria ancestral` y `"Nakkuk"` → `C1.S1.M4 Nakkuk — Fogón`), construye ruta `/campos/{campo.slug}/{subcampo.slug}/{microcampo.slug}` y cuenta sentidos activos (`7` en `Wammera`, `24` en `Nakkuk`).
       - **Subniveles recursivos (`microcampos` con `profundidad >= 1`, nivel 4)**: evalúa `coalesce(namtrik_termino, '')` y `espanol_termino`, resuelve su microcampo raíz y construye ruta `/campos/{campo.slug}/{subcampo.slug}/{microRaiz.slug}#subnivel-{slug}`.
     - En la consulta de sentidos léxicos (`sentidos_lexicos`, nivel 5), incluir también la evaluación de `public.immutable_normalize_namtrik_es(coalesce(s.nombre_cientifico, ''))` proyectando `campoCoincidencia: 'cientifico'` cuando coincida por nombre científico, además de proyectar `s.nombre_cientifico AS nombre_cientifico`.
     - **Prioridad multinivel en `UNION ALL`**:
       - Coincidencias exactas de nodo taxonómico o lema/glosa (`match_level` 1–2) aparecen en la cima (si coinciden exactamente tanto un nodo como un término, como en `"Nakkuk"`, se presenta primero el nodo `MICROCAMPO` seguido inmediatamente del `TÉRMINO` exacto).
       - Para consultas de 1 solo carácter (`cleanQuery.length === 1`), se restringe el matching a coincidencia exacta (`=`) o prefijo directo (`LIKE q || '%'`) de lema/glosa/nodo sin trigramas ni FTS difuso.

2. **Semaforización Visual y Accesible en `SearchBox.tsx` y `dictionaryApi.ts` (`R-009`)**:
   - Actualizar `SearchResultWord` en `apps/web-client/src/services/dictionaryApi.ts` con `tipoResultado`, `nivelJerarquico`, `totalTerminos` y `nombreCientifico`.
   - En `SearchBox.tsx`:
     - Reducir el umbral de disparo de búsqueda a `>= 1` carácter (`trimmedQuery.length >= 1`), mostrando indicador de estado claro mientras carga o filtra.
     - Incorporar el sistema de **insignias semaforizadas por nivel** (WCAG 2.2 AA: color + icono SVG + texto explícito):
       - `tipoResultado === 'campo'` → Insignia **`CAMPO · NIVEL 1`** (`bg-[#E52D6D]/20 text-[#FF85AD] border-[#E52D6D]/60`) + contador de subcampos.
       - `tipoResultado === 'subcampo'` → Insignia **`SUBCAMPO · NIVEL 2`** (`bg-[#0055AA]/25 text-[#7CC4FA] border-[#0055AA]/70`) + contador de microcampos.
       - `tipoResultado === 'microcampo'` → Insignia **`MICROCAMPO · NIVEL 3`** (`bg-emerald-500/20 text-emerald-300 border-emerald-500/60`) + contador `"{N} términos"`.
       - `tipoResultado === 'subnivel'` → Insignia **`SUBNIVEL · NIVEL 4`** (`bg-amber-500/20 text-amber-300 border-amber-500/60`) + contador `"{N} términos"`.
       - `tipoResultado === 'termino'` → Insignia **`TÉRMINO`** (`bg-sky-500/15 text-sky-300 border-sky-500/45`) acompañada de la insignia de precisión (`EXACTA`, `EQUIVALENCIA: {término}`, `CIENTÍFICO` o `EN DESCRIPCIÓN`) y el `nombreCientifico` en cursiva cuando exista.
     - Al hacer clic sobre cualquier resultado o al presionar el botón de lupa / tecla `Enter` (que si no hay ítem seleccionado con flechas navega automáticamente al primer resultado relevante), redirigir a `ubicacion.ruta`.

3. **Buscador Global Público Minimalista Unificado con Botón Flotante Arrastrable (`R-010`)**:
   - Crear `apps/web-client/src/components/features/semantic-fields/GlobalSearchModal.tsx` y `apps/web-client/src/contexts/GlobalSearchContext.tsx`:
     - Modal ligero y accesible (`role="dialog"`, `aria-modal="true"`, cierre con `Escape` y clic en backdrop) que aloja el `SearchBox` con auto-foco y navega cerrando el modal al elegir un resultado.
     - Escucha el atajo global `Ctrl+K` / `Cmd+K` en todas las rutas públicas excepto `/campos` (donde enfoca directamente el `#dictionary-search-input` existente).
   - Crear `apps/web-client/src/components/features/semantic-fields/DraggableSearchTrigger.tsx`:
     - Botón circular compacto (`52x52px`, `rounded-full`, *glassmorphism* oscuro con borde `#0055AA/80` y hover `#E52D6D`) como único activador visual flotante en las rutas públicas fuera de `/campos`.
     - Implementa arrastre libre mediante Pointer/Touch Events y teclado (`Arrow*` `±15px`) con umbrales diferenciados (`6px` puntero / `12px` táctil) para distinguir entre **arrastrar/reubicar** y **tocar para abrir el buscador**, guardando el ancla canónica `FabAnchor` (`{ x, y, xRatio, yRatio, viewportWidth, viewportHeight }`) en `localStorage` (`misak_search_fab_pos`) y proyectando proporcionalmente o restituyendo la coordenada exacta ante rotación/redimensionamiento sin sobrescribir la preferencia del usuario.
     - Se oculta automáticamente cuando `location.pathname === '/campos'` o cuando el modal ya está abierto (`isOpen === true`).
   - Mantener `apps/web-client/src/components/layouts/PublicHeader.tsx` limpio sin duplicar un segundo botón de búsqueda en la barra superior (evitando redundancia visual en `/campos` y liberando espacio horizontal para el título `Wamtɵrmarɵpik` en pantallas móviles de `360px`).

---

### 3. Parte III — Buscadores Admin Normalizados, Catálogo Dinámico `Abreviaturas.pdf`, Tooltip Responsivo (`AbbreviationBadge`) e Integridad del Editor Léxico (`R-011`, `R-012`, `R-013`, `R-017`)

1. **Modelo Prisma `AbreviaturaGramatical`, Semilla `Abreviaturas.pdf`, Migración `0015` y API CRUD (`R-012`)**:
   - Añadir en `apps/backend-service/prisma/schema.prisma` el modelo `AbreviaturaGramatical` (`@@map("abreviaturas_gramaticales")`):
     - `id: BigInt @id @default(autoincrement())`
     - `codigo: String @unique @db.Citext` (ej. `'s.'`, `'sn.'`, `'sv.'`, `'loc. nom.'`, `'V. 1'`, `'bot.'`)
     - `etiquetaCompleta: String @map("etiqueta_completa")` (ej. `'Sustantivo'`, `'Sintagma Nominal'`, `'Sintagma verbal'`, `'Locución nominal'`)
     - `descripcion: String?` (Explicación pedagógica de la categoría/abreviatura en Namtrik para el público y editores)
     - `dimension: String @default("categoria")` (`'categoria' | 'variante' | 'rasgo' | 'origen' | 'dominio'`)
     - `orden: Int @default(0)`
     - `activo: Boolean @default(true)`
     - `createdAt`, `updatedAt`
   - Crear `data/lexicon/v1/abreviaturas.yaml` y `apps/web-client/src/constants/abreviaturas.ts` con las 41 abreviaturas oficiales del PDF (`codigo` y `etiquetaCompleta`).
   - Crear migración SQL `0015_normalizar_abreviaturas_y_restaurar_etiquetas/migration.sql` que:
     - Cree la tabla `abreviaturas_gramaticales` e hidrate de manera idempotente las 41 entradas oficiales de `Abreviaturas.pdf` (`codigo` y `etiquetaCompleta`).
     - Restaure `etiqueta_original` en `C2.S5.E002` (`Waara` → `'s., mamíf.'`) y `C4.S6.E021` (`Milu kalik` → `'sn.'`) y asegure `nombre_cientifico = 'Gastropoda'` en `Milu kalik`.
     - Normalice en `formas_namtrik` las categorías con variaciones de puntuación/mayúsculas (`sn` / `SN.` → `sn.`, `v` → `v.`, `adj` / `Adj.` → `adj.`, `v.posic.` / `v.pos.` → `v. pos.`, `loc.interj.` / `loc.Interj.` → `loc. interj.`, `O.S.Adv. Tiem` → `O.S.Adv. Tiem.`, `adj. cal.` → `cal.`) y preserve en `rasgos_gramaticales` los marcadores de dominio/rasgo/préstamo (`bot.`, `gast.`, `educ.`, `símb.`, `ren.`, `VB.`, `sing.`, `pl.`, `f.`, `m.`, `amb.`, `plac.`, `plaq.`).
   - Crear `ManageAbreviaturasUseCase.ts` y las rutas:
     - **Pública**: `GET /api/dictionary/abreviaturas` (devuelve el catálogo activo ordenado por `orden` y `codigo` para alimentar `AbbreviationBadge` en toda la web pública).
     - **Administrativa**: `GET / POST / PATCH /:id / DELETE /:id` en `/api/admin/dictionary/abreviaturas` (con conteo de uso en `formas_namtrik`: al editar `codigo` actualiza las formas que lo usaban en transacción; al eliminar verifica que `usosCount === 0` o bloquea con `HTTP 409 Conflict`).

2. **Componente Responsivo y Accesible de Tooltip/Popover para Abreviaturas (`AbbreviationBadge.tsx`, `R-017`)**:
   - Crear `apps/web-client/src/components/ui/AbbreviationBadge.tsx`:
     - Recibe `code: string` (simple como `"sv."` o compuesto como `"loc. nom., adj."` / `"s., simb."`) y resuelve cada segmento mediante `AbbreviationPill` contra el catálogo dinámico de abreviaturas (`useAbreviaturasCatalog` con fallback inmediato al catálogo base para 0ms de espera).
     - Renderiza el tooltip/popover mediante `createPortal(..., document.body)` con `position: fixed` y cálculo de coordenadas en `useLayoutEffect` vía `getBoundingClientRect()`, garantizando *horizontal clamping* dentro de `[12px, viewportWidth - tooltipWidth - 12px]`, cálculo independiente de `arrowLeft` apuntando al centro del badge y *vertical flip* automático (`top` ↔ `bottom`) cuando `badgeRect.top < tooltipHeight + 20`.
     - **Escritorio (`hover` y `focus-visible`, WCAG 1.4.13)**: al pasar el mouse o enfocar con teclado, muestra el tooltip flotante y permite mover el puntero sobre el recuadro sin que desaparezca.
     - **Móvil y Pantallas Táctiles (`tap` responsivo en `320px`/`360px`+)**: al tocar la abreviatura (`onClick` con `e.stopPropagation()` y `e.preventDefault()` para no disparar la navegación de la fila o tarjeta contenedora), abre el popover adaptativo y se cierra al tocar fuera, hacer scroll o presionar `Escape`.
     - Integrar `AbbreviationBadge` en `SearchBox.tsx`, `GlobalSearchModal.tsx`, `TermRow.tsx`, `SentidosPage.tsx` y `SentidoEditorPage.tsx`.

3. **Normalización y Relevancia en Buscadores Administrativos (`R-011`)**:
   - Actualizar `ListSentidosAdminUseCase.ts` y `AdminSentidoDto.ts`:
     - Soportar filtros adicionales en `GET /api/admin/dictionary/sentidos`: `categoriaGramatical`, `conNombreCientifico` (`true`/`false`), `nivel` (`campo`|`subcampo`|`microcampo`).
     - Cuando se envía `q`, resolver los IDs y el puntaje de relevancia usando SQL parametrizado con `public.immutable_normalize_namtrik_es` sobre `f.lema`, `s.espanol_glosa`, `s.nombre_cientifico`, `s.namtrik_contexto`, `s.espanol_explicacion` y `s.codigo`:
       - Nivel 1: lema exacto, glosa exacta o código exacto (`Malɵ` para `"malo"`/`"malɵ"`/`"cara"`, `Isramsruk` para `"corazon"`/`"corazón"`).
       - Nivel 2: palabra completa en glosa (`Malɵ kuallip — Lavarse la cara` para `"cara"`).
       - Nivel 3: prefijo de lema o glosa (`Caracol`, `Carangano` para `"cara"`).
       - Nivel 4: subcadena normalizada en lema, glosa, nombre científico o contexto.
     - Ordenar los resultados por `(match_priority ASC, public.misak_sort_key(lema_principal) ASC, s.id DESC)`.
   - Actualizar `MedioCulturalRepository.ts` (`findAll`) y `PapeleraUseCase.ts` / `ProgresoRatificacionUseCase.ts` para usar normalización insensible a tildes y `ɵ ↔ o`.

4. **Reconstrucción Integral de `SentidoEditorPage.tsx`, `SentidosPage.tsx`, Gestor de Abreviaturas y `useAdmin.ts` (`R-012`, `R-013`)**:
   - En `apps/web-client/src/hooks/useAdmin.ts`:
     - Eliminar el mapeo destructivo que forzaba `categoriaGramatical ?? 'sustantivo'` y colapsaba `formas` en un solo elemento.
     - Exponer y enviar el payload canónico completo de `CreateSentidoDTO` / `UpdateSentidoDTO` más los hooks `useAdminAbreviaturas`, `useCreateAbreviatura`, `useUpdateAbreviatura`, `useDeleteAbreviatura`.
   - En `apps/web-client/src/pages/admin/SentidoEditorPage.tsx`:
     - **Sección 1 — Ubicación Taxonómica y Código**: selector jerárquico real de nodo (`Campo` / `Subcampo` / `Microcampo` / `Subnivel`) alimentado por `/api/admin/taxonomy/nodos` y tipo de entrada real (`estandar` — *Término o expresión estándar* | `dialogico` — *Expresión dialógica / saludo*).
     - **Sección 2 — Formas Léxicas en Namtrik (`formas[]`)**: lista editable de formas (mínimo 1, botón «+ Añadir forma / variante») donde cada forma permite editar:
       - `lema` (con botones de inserción de `ɵ` / `Ɵ`)
       - `categoriaGramatical` (selector alimentado desde el catálogo dinámico de BD con todas las abreviaturas oficiales + **botón rápido «+ Nueva abreviatura» / «Gestionar abreviaturas»** para crear, editar o eliminar abreviaturas al instante y que queden seleccionadas y listas)
       - `variante` (`Ninguna`, `V. 1`, `V. 2`, `V. 3` o variantes agregadas al catálogo)
       - `rasgosGramaticales` (chips seleccionables alimentados por las dimensiones `rasgo`, `origen` y `dominio` del catálogo con preview mediante `AbbreviationBadge`) y checkbox `esNeologismo` (`neol.`).
     - **Sección 3 — Glosa, Explicación y Término Científico**:
       - `espanolGlosa` (Glosa principal en castellano)
       - `espanolExplicacion` (Explicación / descripción cultural detallada en castellano — cargada desde `sentido.espanolExplicacion`)
       - **`nombreCientifico` (Nombre / Término Científico — Botánica, Zoología, Taxonomía biológica)**: input específico con previsualización en cursiva y ayuda contextual para los 150+ términos de flora y fauna.
     - **Sección 4 — Contexto de Uso y Diálogo**:
       - `namtrikContexto` (Oración de ejemplo / uso tradicional en Namtrik — cargada realmente desde `sentido.namtrikContexto`)
       - Si `tipo === 'dialogico'`: bloque adicional con `respuestaNamtrik`, `respuestaNamtrikContexto`, `respuestaEspanolGlosa` y `respuestaEspanolExplicacion`.
       - `observacionEditorial` (Notas editoriales internas).
     - **Pestaña Medios Culturales**: subida y vinculación real con `sentidoId` y `formaId`.
   - En `apps/web-client/src/pages/admin/SentidosPage.tsx`:
     - Añadir botón «Catálogo de Abreviaturas» (que abre el modal/panel CRUD completo para agregar, editar o eliminar abreviaturas con conteo de uso y protección `409`), filtro por Categoría Gramatical, filtro «Solo con nombre científico» y mostrar en cada fila la categoría gramatical con `AbbreviationBadge`, el `nombreCientifico` en cursiva cuando exista y la miga del nodo taxonómico.

---

### 4. Parte IV — Módulo Administrativo de Taxonomía (`/admin/taxonomia`), Protección Jerárquica y Medios (`R-014`, `R-015`, `R-016`)

1. **Casos de Uso y Rutas Backend de Taxonomía Admin (`/api/admin/taxonomy`)**:
   - Crear `apps/backend-service/src/application/dtos/AdminTaxonomiaDto.ts` y `apps/backend-service/src/application/use-cases/admin/ManageTaxonomiaUseCase.ts`:
     - `listarNodos(query)`: devuelve la jerarquía completa o filtrada (con normalización `immutable_normalize_namtrik_es` sobre `q` y filtro opcional por `nivel`: `'campo' | 'subcampo' | 'microcampo' | 'subnivel'` y `estado`), incluyendo conteos exactos de hijos activos (`subcamposCount`, `microcamposCount`, `subnivelesCount`, `sentidosCount`, `mediosCount`) y bandera booleana `canDelete: boolean` (`true` únicamente si todos los conteos de hijos y sentidos activos son `0`).
     - `crearNodo(dto, actor)`: crea un `CampoSemantico`, `SubcampoSemantico`, `Microcampo` (`profundidad = 0`) o `Subnivel` (`Microcampo` con `padreId` y `profundidad = padre.profundidad + 1`), generando código secuencial atómico (`C5`, `C1.S5`, `C1.S1.M22`, `C1.S1.M19.10`) y `slug` único, normalizando `ɵ` y auditando la creación.
     - `actualizarNodo(nivel, id, dto, actor)`: actualiza `namtrikTermino`, `espanolTermino`, `namtrikDescripcion`, `espanolDescripcion`, `posicion`, `imagen`, `namtrikAudio`, `espanolAudio` con control de concurrencia optimista (`version`), reiniciando `estado` a `'borrador'` si estaba `'ratificado'` y hubo cambio cultural.
     - `eliminarNodo(nivel, id, actor)`: **verifica estrictamente que no tenga ningún hijo activo (`subcampos`, `microcampos`, `subniveles`) ni ningún sentido léxico activo (`sentidos_ubicaciones`)**. Si tiene `>= 1` dependencia activa, lanza `AppError` con código `409` y el detalle exacto (`No se puede eliminar el {nivel}: contiene {N} subcampos/microcampos/subniveles o términos activos`). Si está libre de dependencias, aplica `deletedAt = new Date()` y registra en `AuditService`.
   - Registrar las rutas en `apps/backend-service/src/api/admin/routes/adminTaxonomyRoutes.ts` bajo `/api/admin/taxonomy` y montarlas en `app.ts`.

2. **Página Frontend `/admin/taxonomia` (`TaxonomiaAdminPage.tsx`) y Menú Lateral (`AdminLayout.tsx`)**:
   - Añadir el ítem **«Taxonomía y Campos»** (`/admin/taxonomia`, permiso `dictionary:read`) en `AdminLayout.tsx` y registrarlo en `router/index.tsx`.
   - Implementar `apps/web-client/src/pages/admin/TaxonomiaAdminPage.tsx`:
     - Buscador normalizado (`ɵ`/sin tildes) + filtro por nivel semaforizado (`Todos`, `Campos (Nivel 1)`, `Subcampos (Nivel 2)`, `Microcampos (Nivel 3)`, `Subniveles (Nivel 4)`).
     - Vista jerárquica con insignias semaforizadas de nivel, conteo de subniveles/términos/medios, estado editorial (`Borrador` / `Ratificado`), botones de **«+ Nuevo Campo / Subcampo / Microcampo / Subnivel»**, **«Editar»**, **«Medios»** (abre el gestor/cargador de imágenes, audios y videos vinculado a `campoSemanticoId` / `subcampoSemanticoId` / `microcampoId`) y **«Eliminar»** (deshabilitado con explicación clara cuando `canDelete === false` por tener hijos o términos activos, y protegido por confirmación cuando está vacío).

---

### 5. Parte V — Deep Linking Multimodal Anti-CLS, Auto-Foco, Auto-Scroll de `listbox`, Modo Command-Palette y Fluidez Móvil (`R-018..R-021`, Enmienda `v0.3.0`)

1. **Rutas de Anclaje Profundo en Backend y Cliente API (`PalabraRepository.ts`, `dictionaryApi.ts`)**:
   - En `PalabraRepository.ts`: resolver recursivamente el microcampo raíz (`profundidad = 0`) en la CTE de taxonomía y en la hidratación de `sentidos_ubicaciones`, generando `/campos/{campo}/{subcampo}/{microRaiz}#subnivel-{slug}` para subniveles (Nivel 4) y `/campos/{campo}/{subcampo}/{microRaiz}#term-{id}` para términos ubicados dentro de microcampos o subniveles (Nivel 5), manteniendo rutas limpias sin hash para niveles 1–3.
   - En `dictionaryApi.fetchSearch`: preservar `tipoResultado`, `nivelJerarquico`, `totalTerminos` y `nombreCientifico` en el mapeo defensivo.

2. **Anclajes DOM, Estabilización Anti-CLS Multimodal y Coordinación con `useRouteFocus` (`TermRow.tsx`, `MicrofieldSubnivel.tsx`, `useDeepLinkAnchor.ts`, `useRouteFocus.ts`, `FieldLayout.tsx`)**:
   - Asignar `id="term-{term.id}"` y `scroll-mt-28` en ambos modos de `TermRow.tsx` (estándar y dialógico) y `id="subnivel-{microfield.id}"` + `scroll-mt-28` en `MicrofieldSubnivel.tsx`.
   - Crear `useDeepLinkAnchor.ts` montado en `FieldLayout.tsx`: observa `location.hash` (`#term-*` / `#subnivel-*`), espera el renderizado asíncrono (`MutationObserver` + `requestAnimationFrame`), re-estabiliza la posición con `ResizeObserver` durante una ventana acotada (`1200ms`, cancelada al primer input manual `wheel`/`touchmove`/`keydown`) ante carga diferida de imágenes/videos/audios, y activa `data-deep-linked="true"` para el pulso visual Misak (`#E52D6D` / `#0055AA`).
   - En `useRouteFocus.ts`: usar `h1.focus({ preventScroll: true })` y omitir el reenfoque al `h1` cuando `location.hash` apunte a un ancla profunda activa.

3. **Auto-Scroll Determinista, Suite "Keyboard Geek", Seguridad IME y HTML5 Válido (`SearchBox.tsx`, `GlobalSearchContext.tsx`, `AbbreviationBadge.tsx`)**:
   - En `AbbreviationBadge.tsx`: renderizar `<abbr>` estático cuando `disabled={true}` para que `<Link role="option" tabIndex={-1}>` cumpla HTML5 estricto sin `<button>` anidados ni paradas extras de `Tab`.
   - En `GlobalSearchContext.tsx`: soportar `Ctrl+K` / `⌘+K` y `/` (fuera de inputs/editables), aislar `/admin/*`, sincronizar aperturas táctiles con `flushSync` para `autofocus` inmediato al 100% en iOS/Android, y enfocar + seleccionar `#dictionary-search` directamente en `/campos`.
   - En `SearchBox.tsx`: implementar `useLayoutEffect` con cálculo geométrico `scrollTop` sobre `listboxRef`, corregir `ArrowUp` desde `-1` → `results.length - 1`, añadir candado `navMode` (`keyboard` vs `pointer`), atajos `Ctrl+N`/`Ctrl+P`, `PageUp`/`PageDown` (`±5`), `Ctrl+Home`/`Ctrl+End`, `Ctrl+Enter`/`⌘+Enter` (nueva pestaña), `Alt+O` (inserción `ɵ` en `selectionStart`..`selectionEnd`), `Ctrl+U`, `Escape` progresivo, guardia IME (`isComposing` / `keyCode === 229` / `50ms` `compositionend`), cierre por clic/blur externo y anuncio `aria-live="polite"`.

4. **Modal `<dialog>` Adaptativo a `visualViewport`, Persistencia `FabAnchor` y Activación Táctil/Teclado (`GlobalSearchModal.tsx`, `DraggableSearchTrigger.tsx`, `index.css`)**:
   - Migrar `GlobalSearchModal.tsx` a `<dialog>` nativo abierto con `showModal()` (`closedby="any"` / `closedby="closerequest"` en apertura táctil inicial para neutralizar _ghost clicks_), sincronizado con `window.visualViewport` (`--vvh`, `--vv-top`) y renderizando `SearchBox` con `variant="modal"` en columna `flex-col` sin `position: absolute`.
   - Declarar en `index.css` las reglas de `dialog.misak-search-dialog` y `::backdrop` (`overflow: hidden; overscroll-behavior: contain`) más el resaltado `[data-deep-linked='true']`.
   - Añadir en `DraggableSearchTrigger.tsx` apertura síncrona por `touchend` (`{ passive: false }`), modelo de persistencia canónica `FabAnchor` (con proyección proporcional en `resize`/`orientationchange`, restitución exacta al tamaño original y guardia `POST_MODAL_KEYBOARD_GUARD_MS = 450` frente al teclado virtual móvil), persistencia en `onLostPointerCapture` y reubicación accesible con teclas de flecha (`±15px`).

---

## Matriz de Trazabilidad (`R-008..R-021` → Tareas `T-008..T-023`)

| Requisito | Componente Principal | Tarea(s) |
| :--- | :--- | :--- |
| `R-008` | `DictionaryDto.ts`, `PalabraRepository.ts` (CTE `taxonomy_matches` + `nombre_cientifico` + `min(1)`) | `T-008` |
| `R-009` | `dictionaryApi.ts`, `SearchBox.tsx` (insignias semaforizadas Nivel 1..5 y navegación directa) | `T-009` |
| `R-010` | `PublicHeader.tsx`, `DraggableSearchTrigger.tsx`, `GlobalSearchModal.tsx`, `FieldLayout.tsx`, `Home.tsx` | `T-010` |
| `R-011` | `ListSentidosAdminUseCase.ts`, `MedioCulturalRepository.ts`, `RevisionPage.tsx`, `PapeleraPage.tsx` | `T-012` |
| `R-012` | `schema.prisma` (`AbreviaturaGramatical`), `data/lexicon/v1/abreviaturas.yaml`, migración `0015`, `ManageAbreviaturasUseCase.ts`, `/api/admin/dictionary/abreviaturas`, `/api/dictionary/abreviaturas` | `T-011` |
| `R-017` | `AbbreviationBadge.tsx` (tooltip escritorio + popover móvil/táctil) integrado en `SearchBox.tsx`, `TermRow.tsx`, `SentidosPage.tsx`, `SentidoEditorPage.tsx` | `T-011`, `T-013`, `T-020` |
| `R-013` | `useAdmin.ts`, `SentidoEditorPage.tsx` (con botón rápido «+ Nueva abreviatura»), `SentidosPage.tsx` (formas múltiples, `nombreCientifico`, contexto, dialógico) | `T-013` |
| `R-014`, `R-015`, `R-016` | `ManageTaxonomiaUseCase.ts`, `adminTaxonomyRoutes.ts`, `TaxonomiaAdminPage.tsx`, `AdminLayout.tsx` | `T-014` |
| `R-001..R-017` | Tests unitarios e integración PostgreSQL 18 + builds + cierre documental (`v0.2.0`) | `T-015` |
| `R-018` | `PalabraRepository.ts`, `TermRow.tsx`, `MicrofieldSubnivel.tsx`, `useDeepLinkAnchor.ts`, `FieldLayout.tsx`, `useRouteFocus.ts` | `T-016`, `T-018`, `T-019` |
| `R-019` | `dictionaryApi.ts`, `GlobalSearchContext.tsx`, `SearchBox.tsx` | `T-017`, `T-019`, `T-021` |
| `R-020` | `AbbreviationBadge.tsx`, `SearchBox.tsx` | `T-020`, `T-021` |
| `R-021` | `GlobalSearchModal.tsx`, `DraggableSearchTrigger.tsx`, `index.css` | `T-022` |
| `R-018..R-021` | Suites Vitest (`SearchBox`, `GlobalSearchModal`, `DraggableSearchTrigger`, `TermRow`, `AbbreviationBadge`, `dictionaryApi`, `PalabraRepository`) + builds | `T-023` |
