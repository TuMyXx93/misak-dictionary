---
id: 009-rediseno-ux-home-navegacion-busqueda
version: 0.2.0
status: approved
cultural-gate: false
---

# Rediseño UX/UI de Botones de la Home, Navegación Condicional y Buscador Bilingüe Vectorizado

## Contexto

La auditoría visual y funcional del Diccionario Cultural Misak sobre dispositivos reales (Desktop 1080p, ventanas estrechas, Samsung Galaxy A55 en portrait `360×800` y landscape `800×360`, e iPad Mini en portrait `768×1024` y landscape `1024×768`) evidenció tres brechas críticas de experiencia e ingeniería:

1. **Fragmentación y colisiones en los 8 botones de la Home**: Los 7 botones de campos semánticos y el octavo botón (`"Explorar Campos Semánticos"`) usan implementaciones dispares. En móvil horizontal (`800×360`) se activa prematuramente el posicionamiento absoluto (`min-width: 768px`), provocando colisiones severas contra el título y el CTA inferior; en tablet vertical (`768×1024`) el botón `Srɵ Wammera` se desborda fuera del viewport derecho. Asimismo, el mapa `SLUG_TO_CONFIG_ID` asigna iconos erróneos a `Tra tul` y `Kau ushamera`.
2. **Navegación incoherente en el Header público**: En `PublicHeader`, la condición `isActive` solo contempla `'/'` y `'/campos'`, provocando que `"Campos Semánticos"` permanezca perpetuamente resaltado en las vistas internas y que los enlaces `Recorrido` (`/#recorrido`), `Símbolos` (`/#simbolos`) y `Créditos` (`/#creditos`) nunca reflejen su estado activo ni ejecuten scroll programático al navegar desde `/campos` hacia la Home, donde además el Header desaparece por completo.
3. **Resultados en blanco (`—`) en el Buscador de Campos Semánticos**: El endpoint `GET /api/dictionary/words/search` retorna claves en `snake_case` (`namtrik_termino`, `espanol_termino`) y omite rutas cuando un `SentidoLexico` se ubica a nivel de Campo o Subcampo, mientras que `SearchBox.tsx` lee propiedades en `camelCase` (`namtrikTermino`, `espanolTermino`), renderizando filas vacías con solo un guion (`—`). Adicionalmente, la búsqueda carece de equivalencia ortográfica/fonética para grafías Namtrik (`ɵ`, `ø`, `o`, `ə`, `ɔ`, `ɨ`) e índices de trigramas/FTS sobre las tablas `sentidos_lexicos` y `formas_namtrik`.

## Requisitos (EARS)

### Pilar 1: Rediseño y Estandarización de los 8 Botones de la Home e Iconografía SVG

- **R-001** — EL SISTEMA DEBERÁ implementar un único modelo de componente reutilizable y polimórfico (`SemanticFieldButton`) para renderizar los 8 botones de la Home (7 nodos de campos semánticos con `variant="field-node"` y 1 botón global con `variant="global-catalog"`), garantizando escalado proporcional fluido mediante funciones matemáticas CSS (`clamp()`) y un área interactiva mínima de `48×48px` (Constitución C3.2).
- **R-002** — MIENTRAS el viewport no disponga simultáneamente de al menos `1024px` de ancho y `640px` de alto (`(min-width: 1024px) and (min-height: 640px)`), EL SISTEMA NO DEBERÁ posicionar los botones mediante coordenadas absolutas porcentuales, evitando colisiones en móviles en orientación horizontal (ej. `800×360`) y desbordamientos laterales en tablets verticales (ej. `768×1024`).
- **R-003** — CUANDO el viewport se encuentre en modo espacial (`>= 1024×640px`), EL SISTEMA DEBERÁ acotar las coordenadas `(x, y)` de cada botón con márgenes de seguridad (`clamp()`) para que ningún botón colapsado o expandido rebase los bordes laterales del viewport ni invada el área del título superior o del botón global inferior.
- **R-004** — CUANDO se renderice el octavo botón de acción global hacia `/campos` (`variant="global-catalog"`), EL SISTEMA DEBERÁ mostrar exactamente el texto `"Campos Semánticos"`, sustituir la flecha de dirección (`→`) por un icono vectorial SVG (`iconKey="cosmos-grid"`) que represente la totalidad articulada de los campos semánticos, omitir el indicador de punto magenta y aplicar una paleta institucional distintiva basada en los 4 colores oficiales Misak (`#0055AA`, `#E52D6D`, `#FFFFFF`, `#000000`) diferenciada del esquema de los 7 botones individuales.
- **R-005** — EL SISTEMA DEBERÁ corregir el mapeo `SLUG_TO_CONFIG_ID` y proveer iconos vectoriales SVG rediseñados, semánticamente precisos y culturalmente coherentes para los 4 campos integrados: `Ya` (`house`: casa tradicional con fogón central *Nakchak*), `Ya tul` (`garden`: huerta tradicional cercana con brotes y espiral de cultivo), `Tra tul` (`mountain-farm`: huerta lejana en ladera de montaña andina) y `Kau ushamera` (`wildlife`: fauna originaria del territorio y páramo).

### Pilar 2: Optimización del Header Condicional y Navegación Coherente

- **R-006** — MIENTRAS el usuario se encuentre en el viewport inicial (Hero) de la Home (`/`) sin hash de sección activo, EL SISTEMA NO DEBERÁ mostrar el `PublicHeader` fijo en pantalla; CUANDO el usuario haga scroll hacia las secciones inferiores de la Home (`Recorrido`, `Info`, `Símbolos`, `Créditos`) o navegue a `/campos/*`, EL SISTEMA DEBERÁ mostrar el `PublicHeader` con transición suave y accesibilidad completa.
- **R-007** — CUANDO el usuario seleccione `Recorrido` (`/#recorrido`), `Símbolos` (`/#simbolos`) o `Créditos` (`/#creditos`) desde cualquier ruta (`/campos/*` o `/`), EL SISTEMA DEBERÁ desplazar el contenedor principal hasta la sección correspondiente (respetando `prefers-reduced-motion`, Constitución C3.1) y resaltar exclusivamente el botón de navegación correspondiente con `aria-current`, eliminando el resaltado estático permanente de `"Campos Semánticos"`.
- **R-008** — MIENTRAS el usuario haga scroll por las secciones de la Home (`/`), EL SISTEMA DEBERÁ detectar la sección visible mediante `IntersectionObserver` y actualizar dinámicamente el estado activo del menú en `PublicHeader` (`Inicio`, `Recorrido`, `Símbolos`, `Créditos`).

### Pilar 3: Corrección y Mejora Vectorizada del Buscador de Campos Semánticos

- **R-009** — CUANDO el endpoint `GET /api/dictionary/words/search` retorne resultados de búsqueda, EL SISTEMA DEBERÁ serializar cada ítem con contrato unificado en `camelCase` (`id`, `codigo`, `namtrikTermino`, `espanolTermino`, `categoriaGramatical`, `namtrikDescripcion`, `espanolDescripcion`, `ubicacion`, `microcampos`), mostrando siempre en `SearchBox` el par bilingüe `Namtrik — Español` con el término Namtrik en posición primaria (Constitución C1.3).
- **R-010** — CUANDO un término encontrado en el buscador pertenezca a cualquier nivel taxonómico (Campo, Subcampo, Microcampo o Subnivel de profundidad arbitraria), EL SISTEMA DEBERÁ resolver su ruta jerárquica canónica (`/campos/:fieldSlug`, `/campos/:fieldSlug/:subfieldSlug` o `/campos/:fieldSlug/:subfieldSlug/:microfieldSlug#term-:id`) y navegar a ella al seleccionarlo con clic o teclado.
- **R-011** — CUANDO el usuario ingrese una consulta en Namtrik o en español en el buscador (incluyendo variantes ortográficas o de teclado como `ɵ`, `ø`, `o`, `ə`, `ɔ`, `ɨ` y términos con o sin tildes), EL SISTEMA DEBERÁ ejecutar una búsqueda híbrida vectorizada (Full-Text Search `tsvector` + similitud de trigramas `pg_trgm` + coincidencia de prefijo normalizada) sobre `sentidos_lexicos`, `formas_namtrik` y `palabras_modelo_1`, ordenando los resultados por relevancia combinada.
- **R-012** — EL SISTEMA DEBERÁ implementar el patrón accesible WAI-ARIA Combobox en `SearchBox` (`role="combobox"`, `role="listbox"`, `role="option"`, navegación con teclas `ArrowDown`, `ArrowUp`, `Enter`, `Escape` y botón para limpiar consulta con tap target accesible).

## Criterios de aceptación (Gherkin)

### R-001, R-002, R-003

```gherkin
Escenario: Renderizado responsivo sin colisiones en móvil horizontal (800x360) y tablet vertical (768x1024)
  Dado que el usuario abre la página de inicio "/" en un viewport de 800x360 (móvil landscape) o 768x1024 (tablet portrait)
  Cuando se renderiza la sección Hero con los 7 botones de campos semánticos y el botón global "Campos Semánticos"
  Entonces los 8 botones utilizan el componente unificado SemanticFieldButton con altura mínima de 48px
  Y los botones se organizan en una cuadrícula adaptativa sin usar posicionamiento absoluto fuera de rango
  Y ningún botón colisiona con el título principal ni se desborda horizontalmente fuera del viewport
```

### R-004

```gherkin
Escenario: Estandarización visual y textual del botón global "Campos Semánticos"
  Dado que el usuario visualiza la sección Hero en la página de inicio "/"
  Cuando inspecciona el botón de acción principal hacia el catálogo "/campos"
  Entonces el botón muestra exactamente el texto "Campos Semánticos"
  Y contiene el icono vectorial SVG "cosmos-grid" representativo de la totalidad de los campos
  Y no contiene el punto indicador magenta ni la flecha de dirección "→"
  Y presenta una paleta cromática institucional Misak distintiva respecto a los 7 botones individuales
```

### R-005

```gherkin
Escenario: Correspondencia semántica e iconográfica de los 4 campos integrados
  Dado que se cargan los campos semánticos "ya", "ya-tul", "tra-tul" y "kau-ushamera"
  Cuando el sistema resuelve su configuración visual e iconográfica en la Home y en "/campos"
  Entonces "ya" muestra el icono "house" (casa tradicional con fogón)
  Y "ya-tul" muestra el icono "garden" (huerta tradicional cercana)
  Y "tra-tul" muestra el icono "mountain-farm" (huerta lejana de montaña, y no "wildlife")
  Y "kau-ushamera" muestra el icono "wildlife" (animales originarios, y no "flora")
```

### R-006, R-007, R-008

```gherkin
Escenario: Visibilidad condicional del Header y estado activo coherente al navegar a Recorrido, Símbolos y Créditos
  Dado que el usuario se encuentra en "/campos" donde el ítem "Campos Semánticos" está activo en el PublicHeader
  Cuando el usuario hace clic en el botón "Recorrido" ("/#recorrido") del menú de navegación
  Entonces el sistema navega a "/#recorrido" y desplaza la vista hasta la sección "#recorrido"
  Y el PublicHeader permanece visible sobre la sección
  Y el botón "Recorrido" queda resaltado como activo mientras que "Campos Semánticos" deja de estar resaltado
```

### R-009, R-010, R-011, R-012

```gherkin
Escenario: Búsqueda bilingüe fluida y visualización completa de resultados en Namtrik y Español
  Dado que el usuario se encuentra en "/campos" e interactúa con el buscador de campos semánticos
  Cuando escribe "vaca" (en español) o "møpik" / "mopik" / "mɵpik" (en Namtrik con cualquier variante de la vocal ɵ)
  Entonces la lista desplegable muestra el resultado con el lema Namtrik "mɵpik" visible en texto primario blanco seguido de "—" y la glosa en español "vaca"
  Y muestra la ruta jerárquica del campo semántico correspondiente
  Y al presionar "Enter" o hacer clic sobre el resultado, navega directamente a la ruta del campo/subcampo/microcampo donde se ubica el término
```

## Fuera de alcance

- Alteración de los nombres lingüísticos Misak (`namtrikTermino`) o sus traducciones oficiales (`espanolTermino`) almacenados en la base de datos (protegidos por Constitución C1.1).
- Modificación de las vistas o flujos del Panel Administrativo (`/admin/*`).
- Creación de contenido léxico para los 3 campos semánticos que aún se encuentran en estado `"Próximamente"` (`Kasrɵpɵtɵ`, `Srɵ Wammera`, `Alik`).

## Trazabilidad

| Requisito | Archivos | Tests |
| --------- | -------- | ----- |
| R-001, R-002, R-003 | `apps/web-client/src/components/features/semantic-fields/SemanticFieldButton.tsx`, `apps/web-client/src/components/features/semantic-fields/SemanticFieldsLayer.tsx`, `apps/web-client/src/components/sections/HeroSection.tsx` | `apps/web-client/src/components/sections/HeroSection.test.tsx` |
| R-004 | `apps/web-client/src/components/features/semantic-fields/SemanticFieldButton.tsx`, `apps/web-client/src/components/features/semantic-fields/SemanticFieldIcon.tsx`, `apps/web-client/src/components/sections/HeroSection.tsx` | `apps/web-client/src/components/sections/HeroSection.test.tsx` |
| R-005 | `apps/web-client/src/constants/semanticFields.ts`, `apps/web-client/src/components/features/semantic-fields/SemanticFieldIcon.tsx`, `apps/web-client/src/types/semanticField.ts` | `apps/web-client/src/pages/CamposIndex.test.tsx` |
| R-006, R-007, R-008 | `apps/web-client/src/components/layouts/PublicHeader.tsx`, `apps/web-client/src/pages/Home.tsx`, `apps/web-client/src/hooks/useHomeNavigation.ts` | `apps/web-client/src/components/layouts/PublicHeader.test.tsx`, `apps/web-client/src/pages/Home.test.tsx` |
| R-009, R-010, R-011 | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts`, `apps/backend-service/prisma/migrations/0012_search_vector_sentidos_trgm/migration.sql`, `apps/web-client/src/services/dictionaryApi.ts` | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.test.ts`, `apps/web-client/src/services/dictionaryApi.test.ts` |
| R-012 | `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | `apps/web-client/src/components/features/semantic-fields/SearchBox.test.tsx` |

---

## Enmienda 0.2.0 — Auditoría post-integración (Aprobada por el usuario)

**Hallazgos:** R-004 parcial (el botón global no comparte la lógica de colapso), R-011 no cumplido (orden por `codigo`, `contains` sobre textos largos, índices 0012 no utilizados, `∅` sin normalizar), R-012 parcial (lupa decorativa, doble "X" por `type="search"`). Referencia cultural: macro VBA `OrdenarBloqueMisak` de `diccionario-campo-namtrik-castellano.xlsm`.

### Requisitos (EARS)

- **R-013** — EL SISTEMA DEBERÁ integrar el botón global `"Campos Semánticos"` con la misma lógica interactiva y de colapso de los 7 botones: MIENTRAS el modo sea `spatial`, DEBERÁ iniciar expandido mostrando texto e icono, contraerse automáticamente tras 3.5 segundos a tamaño icon-only (`48×48px`), y reactivar su expansión fluida mediante hover, foco del teclado o primer toque táctil (el segundo toque o Enter navega a `/campos`); MIENTRAS el modo sea de grilla (móvil, tablet o apaisado), DEBERÁ permanecer visible y expandido con layout adaptativo y ritmo visual consistente (R-004).
- **R-014** — EL SISTEMA DEBERÁ normalizar consulta y datos con una única función inmutable que unifique las variantes de la vocal Misak `ɵ Ɵ θ Θ ϴ ø Ø ∅ o O ə ɔ`, elimine tildes y mayúsculas, y NO DEBERÁ tratar el grafema `ɨ` (no usado en Namtrik).
- **R-015** — CUANDO el usuario busque en Namtrik o español, EL SISTEMA DEBERÁ ejecutar una única consulta SQL indexada sobre `formas_namtrik` y `sentidos_lexicos` que ordene por niveles: (1) lema exacto, (2) cabeza de glosa exacta, (3) prefijo de lema o de palabra del lema, (4) prefijo de cabeza de glosa, (5) palabra completa en glosa, (6) similitud de trigramas, (7) explicación/contexto (consulta ≥ 4 caracteres); desempate por similitud desc, longitud del lema asc y clave de orden Misak asc; e informar `coincidencia: 'exacta' | 'prefijo' | 'aproximada'`.
- **R-016** — CUANDO el usuario pulse la lupa o `Enter` sin opción resaltada, EL SISTEMA DEBERÁ ejecutar la búsqueda de inmediato (sin esperar el debounce) y resaltar el primer resultado; CUANDO pulse `Enter` con una opción resaltada, DEBERÁ navegar a ella. EL SISTEMA DEBERÁ mostrar un único control de limpieza y solo el atajo de grafema `ɵ`.
- **R-017** — EL SISTEMA DEBERÁ proveer `public.misak_sort_key(text)` equivalente al VBA: alfabeto `M W TR SR I K P SH TS Ɵ L U CH LL E Y N Ñ A T S`, dígrafos primero, `R` interna tras el alfabeto, letras externas al final, lema previo al primer `(`, sin espacios ni guiones.
- **R-018** — EL SISTEMA DEBERÁ incluir pruebas de regresión del ranking con casos reales: `waara` → `C2.S5.E002` y `C4.S5.E035` en las dos primeras posiciones; `vaca` → `C2.S5.E002` primero; `kɵsak`, `køsak`, `k∅sak` y `kosak` → mismo primer resultado.

### Criterios de aceptación (Gherkin)

```gherkin
Escenario: Botón global inicia expandido y se contrae automáticamente en modo espacial
  Dado un viewport de 1440×900 en la página de inicio "/"
  Cuando se renderiza el botón "Campos Semánticos"
  Entonces se muestra inicialmente expandido con su texto e icono
  Y tras 3.5 segundos se contrae suavemente a un icono de 48×48px
  Y al pasar el cursor o recibir foco vuelve a expandirse mostrando "Campos Semánticos"

Escenario: Botón global en grilla móvil
  Dado un viewport de 390×844
  Entonces el botón "Campos Semánticos" ocupa la fila completa bajo los 7 campos

Escenario: Coincidencia exacta primero
  Cuando busco "Waara"
  Entonces los dos primeros resultados son "Waara — Vaca" y "Waara — Saltamontes"
  Y ambos indican coincidencia "exacta"

Escenario: Grafema de teclado móvil
  Cuando busco "k∅sak" o "køsak"
  Entonces obtengo el mismo primer resultado que con "kɵsak"

Escenario: Lupa funcional y una sola X
  Dado que escribí "vaca"
  Cuando pulso la lupa
  Entonces se muestran resultados con el primero resaltado
  Y existe un único botón "Limpiar búsqueda"
```

### Trazabilidad de la enmienda

| Requisito | Código | Test |
| :--- | :--- | :--- |
| R-013 | `SemanticFieldButton.tsx`, `SemanticFieldsLayer.tsx`, `HeroSection.tsx` | `SemanticFieldButton.test.tsx`, `SemanticFieldsLayer.test.tsx`, `HeroSection.test.tsx` |
| R-014, R-017 | `prisma/migrations/0013_search_ranking_misak/migration.sql` | `PalabraRepository.integration.test.ts` |
| R-015, R-018 | `PalabraRepository.ts`, `dictionaryApi.ts` | `PalabraRepository.test.ts`, `PalabraRepository.integration.test.ts` |
| R-016 | `SearchBox.tsx` | `SearchBox.test.tsx` |
