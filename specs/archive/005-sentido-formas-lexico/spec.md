---
id: 005-sentido-formas-lexico
version: 1.0.0
status: approved
created: 2026-10-16
approved: 2026-10-16
cultural-gate: true
---

# 005 — Modelo léxico «Sentido + Formas», ingesta gobernada (`.xlsm`) y presentación multinivel

## Contexto

Con la taxonomía v1 (`C1..C4`, 65 nodos y 7 `home_slots`) activa y conectada de punta a punta tras la Spec 004, el siguiente paso crítico es incorporar el corpus léxico real elaborado por el equipo lingüístico en `diccionario-campo-namtrik-castellano.xlsm` (`1.369` filas de entradas y descripciones distribuidas en 5 hojas: `1 NAKCHAK`, `SALUDOS`, `2 YATUL `, `3 TRATUL` y `4 USHAMERA`).

La inspección empírica del archivo `.xlsm` y las capturas de referencia demostró cinco realidades del dominio que el esquema inicial (`palabras_modelo_1` con `@unique` plano 1:1 y asociación exclusiva a `microcampo_id`) no puede representar sin pérdida ni distorsión cultural:

1. **Un sentido agrupa $1..N$ formas namtrik**: una misma entrada conceptual (p. ej., *Cansado*, *Flatulencia*, *Cantar*) se expresa mediante una o varias formas en namtrik (`Murarap (adj., V.1) · Kirap (adj., V.2)`), cada una con su propia categoría gramatical, número de variante (`V.1..V.n`), marca de neologismo (`neol.`), rasgos morfosintácticos (`sing.`, `pl.`, `f.`, `m.`, `plac.`, `Zool.`) o número de homónimo (`Sruutra 1`, `Sruutra 2`).
2. **Explicación contextual bilingüe y nombre científico**: el 76 % de las entradas (`1.041` filas) incluyen en la Columna B (`NAMTRIKMAI MANCHIPIK KUIKWAN MƟRA PƟRIK`) una explicación contextual en lengua namtrik, mientras que secciones como `C1.S1.M19` dejan la Columna B vacía. En la Columna C (`PULƟ TRIKMAI MANCHIPIK KUIKWAN MƟRA PƟRIK`) coexisten la glosa principal en castellano, la explicación enciclopédica o cultural extensa (incluyendo acepciones numeradas `1. … 2. …`) y, en flora y fauna, el nombre científico en cursiva (p. ej., *Chaetocercus mulsant*, *Tyto alba*).
3. **Estructura dialógica en Saludos (`C1.S1.M21`)**: la hoja `SALUDOS` modela pares conversacionales de 6 columnas (Pregunta de saludo + Contexto namtrik + Traducción ↔ Respuesta al saludo + Contexto namtrik + Traducción).
4. **Entradas léxicas asociadas a cualquier nivel del árbol taxonómico**: en el corpus real, los términos no cuelgan únicamente de microcampos; existen entradas directamente bajo un **Campo** (`C3 Tra tul` tiene 30 términos agrícolas antes de `C3.S1`), directamente bajo un **Subcampo** sin microcampos (`C1.S5`, `C1.S6`, `C2.S1..S4`, `C3.S1`, `C4.S3`, `C4.S4`, `C4.S6`) o en el bloque principal de un **Subcampo** antes de sus microcampos (los nombres de animales domésticos en `C2.S5`, las aves en `C4.S1`, los mamíferos en `C4.S2` y los insectos en `C4.S5`), además de los **Microcampos** y **Subniveles** (`C1.S1.M19.1..9`).
5. **Descripciones bilingües de los propios nodos taxonómicos**: el `.xlsm` contiene los textos descriptivos en namtrik y en castellano de los Campos (`C1..C4`), Subcampos y notas lingüísticas introductorias de Microcampos y Subniveles (`C1.S1.M15`, `C1.S1.M18`, `C1.S1.M19.6`, `C1.S1.M19.9`, `C1.S1.M21`).

## Modelo de dominio

```
Campo semántico (C1..C7)
  ├── Descripciones bilingües (namtrik_descripcion, espanol_descripcion)
  ├── Ubicación directa de Sentidos (0..N)  [p. ej. C3 Tra tul]
  └── Subcampos semánticos (0..N)
        ├── Descripciones bilingües (namtrik_descripcion, espanol_descripcion)
        ├── Ubicación directa de Sentidos (0..N)  [p. ej. C1.S5, C2.S1..S5, C4.S1..S6]
        └── Microcampos / Subniveles recursivos (0..N)
              ├── Descripciones / Notas lingüísticas (namtrik_descripcion, espanol_descripcion)
              └── Ubicación de Sentidos (0..N)  [p. ej. C1.S1.M1..M21, C1.S1.M19.1..9]

Sentido Léxico (codigo estable, tipo: 'estandar' | 'dialogico')
  ├── Formas Namtrik (1..N, ordenadas)
  │     └── lema (con ɵ), acepcion_homonima, categoria_gramatical, variante (V.1..V.n),
  │         es_neologismo, rasgos_gramaticales[], etiqueta_original
  ├── Contenido Bilingüe
  │     ├── namtrik_contexto (nullable — Columna B)
  │     ├── espanol_glosa (glosa principal — Columna C)
  │     ├── espanol_explicacion (definición/nota cultural extensa — Columna C, nullable)
  │     └── nombre_cientifico (taxonomía biológica en cursiva, nullable)
  ├── Par Dialógico (solo cuando tipo = 'dialogico', hoja SALUDOS)
  │     ├── respuesta_namtrik
  │     ├── respuesta_namtrik_contexto (nullable)
  │     ├── respuesta_espanol_glosa
  │     └── respuesta_espanol_explicacion (nullable)
  └── Curaduría y Gobernanza
        ├── observacion_editorial (marcas de revisión: resaltado amarillo, comentarios Excel)
        └── estado ('borrador' | 'ratificado'), version, deleted_at
```

## Requisitos (EARS)

- **R-001 (Esquema Sentido + Formas)** — EL SISTEMA DEBERÁ persistir cada entrada léxica como un `SentidoLexico` identificado por un `codigo` estable (p. ej., `C1.S1.M19.1.E001`, `C3.E001`, `C2.S1.E001`) con relación `1:N` hacia `FormaNamtrik`, permitiendo registrar para cada forma: `orden`, `lema` (normalizado con `ɵ`), `acepcion_homonima` opcional, `categoria_gramatical`, `variante` (`V.1..V.n`), booleano `es_neologismo`, `rasgos_gramaticales` y `etiqueta_original`.
- **R-002 (Contenido bilingüe y científico del sentido)** — EL SISTEMA DEBERÁ almacenar en `SentidoLexico` la `espanol_glosa` obligatoria, la `espanol_explicacion` opcional (nota cultural o definición extensa, incluyendo múltiples acepciones numeradas), el `namtrik_contexto` opcional (Columna B del `.xlsm`, nullable cuando la sección no lo incluye) y el `nombre_cientifico` opcional para especies de flora y fauna.
- **R-003 (Soporte de entradas dialógicas — Saludos)** — CUANDO una entrada pertenezca al formato conversacional pregunta-respuesta (`tipo = 'dialogico'`, como en `C1.S1.M21 Saludos`), EL SISTEMA DEBERÁ almacenar en el sentido tanto la expresión de saludo (en sus formas y contexto namtrik/español) como la réplica asociada (`respuesta_namtrik`, `respuesta_namtrik_contexto`, `respuesta_espanol_glosa` y `respuesta_espanol_explicacion`).
- **R-004 (Asociación multinivel en el árbol taxonómico)** — EL SISTEMA DEBERÁ permitir asociar un `SentidoLexico` (mediante `SentidoUbicacion` con `posicion` de ordenamiento) a un `CampoSemantico`, a un `SubcampoSemantico` o a un `Microcampo` (incluidos sus subniveles), garantizando mediante restricción de integridad (`CHECK`) que cada registro de ubicación apunte exactamente a uno de los tres niveles contenedores.
- **R-005 (Enriquecimiento de descripciones bilingües de nodos taxonómicos)** — CUANDO se extraiga e importe el corpus desde el `.xlsm`, EL SISTEMA DEBERÁ actualizar `namtrik_descripcion` y `espanol_descripcion` en los `CampoSemantico`, `SubcampoSemantico` y `Microcampo` que posean textos introductorios o notas lingüísticas en el archivo fuente, preservando la ortografía normalizada con `ɵ`.
- **R-006 (Extracción determinista y curaduría desde `.xlsm`)** — CUANDO se ejecute el extractor sobre `diccionario-campo-namtrik-castellano.xlsm` (y futuras hojas de los campos `C5..C7`), EL SISTEMA DEBERÁ generar un archivo canónico versionado (`data/lexicon/v1/lexico.yaml`) aplicando normalización `ɵ` (solo sobre texto namtrik), desglosando las múltiples formas y etiquetas entre paréntesis de la Columna A, colapsando filas consecutivas 100 % idénticas (p. ej., `Srutrap tsatsɵ` repetida 5 veces en `4 USHAMERA`) y conservando en `observacion_editorial` las alertas de curaduría (celdas resaltadas en amarillo en `3 TRATUL` y comentarios encadenados como `A174`).
- **R-007 (Validación Zod y modo dry-run en `lexicon:import`)** — CUANDO se ejecute el comando `lexicon:import`, EL SISTEMA DEBERÁ validar el archivo `lexico.yaml` con un esquema Zod antes de tocar la base de datos y, MIENTRAS no reciba el flag `--apply`, NO DEBERÁ escribir en la base de datos, mostrando únicamente el informe detallado del plan (sentidos y formas a crear/actualizar, descripciones de nodos a enriquecer, duplicados colapsados y observaciones editoriales).
- **R-008 (Aprobación explícita, atomicidad, idempotencia y auditoría)** — CUANDO `lexicon:import` se ejecute con `--apply`, EL SISTEMA DEBERÁ exigir `--approved-by "<autoridad>"` (abortando si falta), aplicar todos los cambios dentro de una única transacción PostgreSQL, comportarse de forma idempotente ante re-ejecuciones de la misma versión (0 cambios en segunda corrida), retirar mediante borrado lógico (`deleted_at`) las palabras de demostración legadas que quedaran activas, y registrar en `audit_log` el lote con el aprobador, la huella SHA-256 del archivo y el conteo de entidades procesadas.
- **R-009 (Unicidad parcial y papelera de sentidos)** — MIENTRAS un `SentidoLexico` esté activo (`deleted_at IS NULL`), EL SISTEMA NO DEBERÁ permitir otro sentido activo con el mismo `codigo`, y DEBERÁ permitir que las filas borradas lógicamente sean consultables y restaurables desde la papelera administrativa.
- **R-010 (API de diccionario y búsqueda sobre Sentido + Formas)** — CUANDO el cliente consulte `GET /api/dictionary/semantic-fields/slug/:slug` o `GET /api/dictionary/words`, EL SISTEMA DEBERÁ devolver los términos asociados a cada nivel (`Campo`, `Subcampo`, `Microcampo` y `Subnivel`) con su arreglo completo de `formas` namtrik, contexto en namtrik, glosa y explicación en español, nombre científico y bloque dialógico de respuesta (si aplica), permitiendo buscar tanto por cualquiera de los lemas namtrik (con normalización `ɵ`) como por la glosa o explicación en español.
- **R-011 (Visualización multinivel y riqueza léxica en Frontend)** — CUANDO la persona usuaria navegue por `/campos/:fieldSlug`, `/campos/:fieldSlug/:subfieldSlug` o `/campos/:fieldSlug/:subfieldSlug/:microfieldSlug`, EL SISTEMA DEBERÁ:
  1. Mostrar las descripciones culturales bilingües (namtrik y español) del nodo actual cuando existan.
  2. Renderizar la lista de términos directos del Campo (p. ej., en `Tra tul`) o del Subcampo (p. ej., en `Ya chitɵtɵkaik kuik`, `Pek pek Misak`, `Ya tul`, `Tusryu kuantrɵmera`, `Kau ushamera`), además de las tarjetas de sus hijos jerárquicos si los tuviera.
  3. Mostrar en `SubfieldCard` el conteo real de microcampos y/o términos directos para que ningún subcampo con contenido léxico directo aparente estar vacío (`"0 microcampos"`).
  4. Presentar en cada tarjeta/fila de término (`TermRow`) todas sus formas namtrik en posición primaria (Constitución C1.3) con sus etiquetas de categoría gramatical, variante (`V.1`, `V.2`) y distintivo de neologismo (`neol.`), seguidas de su explicación contextual en namtrik, su glosa y explicación en español, su nombre científico en cursiva y, para `Saludos`, el par conversacional pregunta ↔ respuesta.

## Criterios de aceptación (Gherkin)

### R-001 / R-002 / R-006 — Desglose de Sentido + Formas, contexto bilingüe y deduplicación

```gherkin
Escenario: Desglose de sentido con múltiples formas, variantes y neologismo
  Dado la fila del archivo .xlsm con Columna A "Miirap (v., neol., V.1) Kasrak kɵtrɵisrik (v., neol., V.2)" y Columna C "Cantar: neologismo incorporado a la lengua namtrik durante la década de 1980..."
  Cuando se ejecuta el extractor léxico
  Entonces se genera un único SentidoLexico con espanol_glosa "Cantar" y espanol_explicacion con la nota histórica
  Y el sentido contiene 2 FormasNamtrik ordenadas:
    | orden | lema              | categoria_gramatical | variante | es_neologismo |
    | 1     | Miirap            | v.                   | V.1      | true          |
    | 2     | Kasrak kɵtrɵisrik | v.                   | V.2      | true          |

Escenario: Entrada con explicación contextual en namtrik y nombre científico
  Dado la fila de "4 USHAMERA" con Columna A "Mawai tsatsɵ (sn.)", Columna B "Mawei tsatsɵ chippe..." y Columna C "Zumbador ventriblanco (Chaetocercus mulsant)."
  Cuando se ejecuta el extractor léxico
  Entonces el sentido conserva el texto namtrik en namtrik_contexto
  Y separa espanol_glosa "Zumbador ventriblanco" y nombre_cientifico "Chaetocercus mulsant"

Escenario: Colapso de filas consecutivas idénticas y preservación de alertas editoriales
  Dado las 5 filas consecutivas idénticas de "Srutrap tsatsɵ (sn.)" en la hoja "4 USHAMERA" y las 3 filas resaltadas en amarillo en "3 TRATUL"
  Cuando se ejecuta el extractor léxico
  Entonces "Srutrap tsatsɵ" se emite una sola vez en lexico.yaml y el informe reporta 4 duplicados exactos colapsados
  Y las 3 entradas de "3 TRATUL" incluyen la marca "resaltado_amarillo" en observacion_editorial
```

### R-003 — Entradas dialógicas de Saludos (`C1.S1.M21`)

```gherkin
Escenario: Extracción e importación de par pregunta-respuesta en Saludos
  Dado la fila de la hoja "SALUDOS" con pregunta "Munásrɵ? (interj.)" y respuesta "Yúsrɵ"
  Cuando se importa el léxico v1
  Entonces el sentido se registra bajo el microcampo "C1.S1.M21" con tipo "dialogico"
  Y almacena la forma de pregunta "Munásrɵ?" con su contexto namtrik y explicación en español
  Y almacena la réplica "Yúsrɵ" con su contexto "Lɵtik wam." y su explicación "Llegué, aquí estoy..."
```

### R-004 / R-005 — Asociación multinivel y descripciones de nodos

```gherkin
Escenario: Términos asociados directamente a Campo, Subcampo, Microcampo y Subnivel
  Dado el archivo lexico.yaml generado desde las 5 hojas del .xlsm
  Cuando se importa en la base de datos
  Entonces los 30 términos agrícolas iniciales de "3 TRATUL" quedan asociados directamente al Campo "C3"
  Y los términos de "C1.S5", "C1.S6", "C2.S1..S5", "C3.S1" y "C4.S1..S6" quedan asociados a sus respectivos Subcampos
  Y los términos de "C1.S1.M1..M21", "C1.S1.M19.1..9", "C2.S5.M1..M2", "C4.S1.M1", "C4.S2.M1" y "C4.S5.M1" quedan asociados a sus respectivos Microcampos o Subniveles

Escenario: Restricción de integridad en ubicación de sentido
  Cuando se intenta insertar una fila en sentidos_ubicaciones con campo_semantico_id y microcampo_id no nulos simultáneamente (o los tres niveles en NULL)
  Entonces PostgreSQL rechaza la operación por violación de restricción CHECK
```

### R-007 / R-008 / R-009 — Gobernanza, idempotencia y auditoría de `lexicon:import`

```gherkin
Escenario: Dry-run por defecto no modifica la base de datos
  Dado el archivo data/lexicon/v1/lexico.yaml válido
  Cuando se ejecuta "pnpm lexicon:import" sin "--apply"
  Entonces se imprime el resumen de sentidos, formas y descripciones a procesar
  Y la base de datos permanece con 0 escrituras

Escenario: Rechazo de --apply sin --approved-by
  Cuando se ejecuta "pnpm lexicon:import --apply" sin "--approved-by"
  Entonces el proceso termina con código de error distinto de 0 y no escribe nada en la base de datos

Escenario: Importación transaccional e idempotente con registro en audit_log
  Dado una base con la taxonomía v1 activa
  Cuando se ejecuta "pnpm lexicon:import --apply --approved-by 'Equipo Lingüístico Misak'"
  Entonces todos los sentidos, formas, ubicaciones y descripciones se persisten en una sola transacción
  Y se registra en audit_log la acción "LEXICON_IMPORT" con la huella SHA-256 de lexico.yaml
  Y al ejecutar el mismo comando por segunda vez, el plan reporta 0 creaciones y 0 actualizaciones
```

### R-010 / R-011 — API y presentación multinivel en el Frontend

```gherkin
Escenario: Visualización de campo con términos directos y subcampos (C3 Tra tul)
  Dado que el campo "tra-tul" ("C3") tiene 30 términos directos y 1 subcampo ("Tusryu kuantrɵmera")
  Cuando la persona usuaria visita "/campos/tra-tul"
  Entonces ve la descripción bilingüe (namtrik y español) de "Tra tul"
  Y ve tanto la tarjeta del subcampo "Tusryu kuantrɵmera" como el listado de los 30 términos directos del campo

Escenario: Visualización de subcampo con términos directos y microcampos (C4.S1 Illimera)
  Dado que el subcampo "illimera" ("C4.S1") tiene especies de aves asociadas directamente y 1 microcampo ("Illimeran mántɵ ashipelɵ kuikwan")
  Cuando la persona usuaria visita "/campos/kau-ushamera/illimera"
  Entonces ve la descripción bilingüe de "Illimera"
  Y ve la tarjeta del microcampo junto con el catálogo de aves del subcampo mostrando su lema namtrik, explicación en namtrik, glosa en español y nombre científico en cursiva

Escenario: Visualización de sentido con múltiples formas y par dialógico en TermRow
  Cuando se renderiza un sentido con múltiples formas ("Murarap (adj., V.1)" y "Kirap (adj., V.2)") o un saludo dialógico ("Munásrɵ?" ↔ "Yúsrɵ")
  Entonces las formas namtrik se muestran siempre en posición primaria con sus etiquetas de categoría, variante y marca de neologismo
  Y en las entradas de Saludos se muestra claramente el bloque de pregunta y el bloque de respuesta con sus respectivos contextos en namtrik y traducciones en español
```

## Fuera de alcance

- Almacenamiento y carga de archivos binarios de audio e ilustración por término o nivel (definido como R-014 en Spec 004; se abordará en la Spec de Medios Escalonados una vez estén disponibles los activos de audio/imagen).
- Creación de la taxonomía de los campos semánticos 5, 6 y 7 (`Namui Nu Pirɵ`, `Namui Nu Isuik`, `Srɵ Wammera`), cuyos documentos fuente aún no han sido entregados por el equipo lingüístico; no obstante, el esquema de base de datos, el extractor, el importador y la UI quedan 100 % preparados para ingerirlos y mostrarlos sin cambios estructurales cuando lleguen.
- Interfaz gráfica de edición/creación manual de sentidos en el panel administrativo frontend (corresponde a la Fase 4 — Panel Admin UI).

## Trazabilidad

| Requisito | Archivos | Tests |
| --------- | -------- | ----- |
| R-001 | `prisma/migrations/0008_sentido_formas_lexico/migration.sql`, `prisma/schema.prisma` | `lexiconParser.test.ts`, `LexiconRepository.ts` |
| R-002 | `prisma/schema.prisma`, `lexiconSchema.ts`, `lexiconParser.ts` | `lexiconParser.test.ts`, `TermRow.test.tsx` |
| R-003 | `lexiconParser.ts`, `TermRow.tsx` | `lexiconParser.test.ts`, `TermRow.test.tsx` |
| R-004 | `lexiconParser.ts`, `TermRow.tsx`, `CampoPage.tsx`, `SubfieldPage.tsx` | `lexiconParser.test.ts`, `TermRow.test.tsx`, `SubfieldPage.test.tsx` |
| R-005 | `scripts/lexicon-extract.ts`, `data/lexicon/v1/lexico.yaml` | `lexiconParser.test.ts` |
| R-006 | `lexiconParser.ts`, `lexiconPlan.ts` | `lexiconParser.test.ts`, `lexiconPlan.test.ts` |
| R-007 | `lexiconPlan.ts`, `lexiconImport.ts`, `LexiconRepository.ts` | `lexiconPlan.test.ts` |
| R-008 | `scripts/lexicon-import.ts`, `LexiconRepository.ts` | `lexicon-import.ts --dry-run / --apply` |
| R-009 | `prisma/migrations/0008_sentido_formas_lexico/migration.sql`, `LexiconRepository.ts` | `PapeleraUseCase.test.ts` |
| R-010 | `CampoSemanticoRepository.ts`, `PalabraRepository.ts`, `DictionaryController.ts` | `CampoSemanticoRepository.test.ts`, `PalabraRepository.test.ts`, `DictionaryController.test.ts` |
| R-011 | `types/semanticField.ts`, `dictionaryApi.ts`, `FieldHero.tsx`, `SubfieldCard.tsx`, `CampoPage.tsx`, `SubfieldPage.tsx`, `TermRow.tsx` | `TermRow.test.tsx`, `CampoPage.test.tsx`, `SubfieldPage.test.tsx` |

---

> **Gate Cultural (`cultural-gate: true`)**: Esta especificación incorpora el corpus léxico oficial en lengua Namtrik y castellano del equipo lingüístico (`diccionario-campo-namtrik-castellano.xlsm`). Requiere validación humana y `/gate-cultural` antes de pasar su estado a `approved` (Constitución C1.1–C1.3 y C4.1).
