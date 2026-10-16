---
id: 005-sentido-formas-lexico-plan
version: 1.0.0
status: approved
---

# 005 — Plan técnico: Modelo léxico «Sentido + Formas», ingesta gobernada (`.xlsm`) y presentación multinivel

## Diseño

**Estrategia**: Evolucionar la capa de persistencia, el pipeline de ingesta gobernada, los endpoints de consulta del diccionario y la interfaz de usuario para soportar el modelo lexicográfico real del equipo lingüístico Misak (`SentidoLexico` + `1..N FormaNamtrik` + `SentidoUbicacion` multinivel + descripciones bilingües de nodos), alimentado desde el archivo `diccionario-campo-namtrik-castellano.xlsm` vía un artefacto canónico versionado (`data/lexicon/v1/lexico.yaml`).

### 1. Modelo de Datos y Migración PostgreSQL `0008_sentido_formas_lexico` (Prisma 7)
- **Tabla `sentidos_lexicos` (`SentidoLexico`) (R-001, R-002, R-003, R-009)**:
  - `id` (`BIGSERIAL PRIMARY KEY`), `codigo` (`TEXT NOT NULL`), `tipo` (`TEXT NOT NULL DEFAULT 'estandar'`, check `'estandar' | 'dialogico'`).
  - Contenido bilingüe: `namtrik_contexto` (`TEXT NULL`), `espanol_glosa` (`CITEXT NOT NULL`), `espanol_explicacion` (`TEXT NULL`), `nombre_cientifico` (`TEXT NULL`).
  - Bloque dialógico (`Saludos`): `respuesta_namtrik` (`CITEXT NULL`), `respuesta_namtrik_contexto` (`TEXT NULL`), `respuesta_espanol_glosa` (`TEXT NULL`), `respuesta_espanol_explicacion` (`TEXT NULL`).
  - Curaduría y ciclo de vida: `observacion_editorial` (`TEXT NULL`), `estado` (`TEXT NOT NULL DEFAULT 'borrador'`), `version` (`INT NOT NULL DEFAULT 1`), `created_at`, `updated_at`, `deleted_at`.
  - Índice único parcial activo: `CREATE UNIQUE INDEX sentidos_lexicos_codigo_active_key ON sentidos_lexicos (codigo) WHERE deleted_at IS NULL`.
  - Índices de búsqueda Trigram/GIN sobre `espanol_glosa` y `nombre_cientifico`.
- **Tabla `formas_namtrik` (`FormaNamtrik`) (R-001)**:
  - `id` (`BIGSERIAL PRIMARY KEY`), `sentido_id` (`BIGINT NOT NULL REFERENCES sentidos_lexicos(id) ON DELETE CASCADE`), `orden` (`INT NOT NULL DEFAULT 1`).
  - `lema` (`CITEXT NOT NULL`), `acepcion_homonima` (`INT NULL`), `categoria_gramatical` (`TEXT NULL`), `variante` (`TEXT NULL`), `es_neologismo` (`BOOLEAN NOT NULL DEFAULT false`), `rasgos_gramaticales` (`TEXT[] NOT NULL DEFAULT '{}'`), `etiqueta_original` (`TEXT NULL`).
  - Índice único `(sentido_id, orden)` e índice de búsqueda sobre `lema`.
- **Tabla `sentidos_ubicaciones` (`SentidoUbicacion`) (R-004)**:
  - `id` (`BIGSERIAL PRIMARY KEY`), `sentido_id` (`BIGINT NOT NULL REFERENCES sentidos_lexicos(id) ON DELETE CASCADE`), `campo_semantico_id` (`BIGINT NULL`), `subcampo_semantico_id` (`BIGINT NULL`), `microcampo_id` (`BIGINT NULL`), `posicion` (`INT NOT NULL DEFAULT 0`).
  - Restricción de integridad: `CHECK (num_nonnulls(campo_semantico_id, subcampo_semantico_id, microcampo_id) = 1)`.
  - Índices únicos parciales para evitar duplicar el mismo sentido dos veces en el mismo nodo contenedor.

### 2. Extractor Determinista (`lexicon:extract`) y Fuente Canónica `data/lexicon/v1/lexico.yaml`
- **Parser de `.xlsm` y desglose morfosintáctico (`lexiconParser.ts`, `scripts/lexicon-extract.ts`) (R-001 a R-006)**:
  - Lee las hojas `1 NAKCHAK`, `SALUDOS`, `2 YATUL `, `3 TRATUL` y `4 USHAMERA` (y soporta hojas futuras `5..7`).
  - Identifica filas de encabezado jerárquico (`Campo`, `Subcampo`, `Microcampo`, `Subnivel 1..9`) y las vincula con su `codigo` de la taxonomía v1 (`C1..C4`, `C1.S1..C4.S6`, `C1.S1.M1..M21`, `C1.S1.M19.1..9`).
  - Extrae las filas descriptivas bilingües de Campos, Subcampos y notas lingüísticas de Microcampos/Subniveles (`descripciones_nodos`).
  - Desglosa la Columna A en `1..N` formas namtrik: separa cada lema y su bloque entre paréntesis `(adj., neol., V.1)`, extrae `variante` (`V.\d+`), `es_neologismo` (`neol.`), `acepcion_homonima` final (`Sruutra 1`), `categoria_gramatical` principal y `rasgos_gramaticales` (`sing.`, `pl.`, `f.`, `m.`, `plac.`, `Zool.`), aplicando normalización `normalizeNamtrik` (`ɵ`) exclusivamente a los textos en namtrik.
  - Desglosa la Columna C en `espanol_glosa`, `espanol_explicacion` y `nombre_cientifico` (cuando aparece un binomio taxonómico entre paréntesis al final de las entradas de flora/fauna).
  - Detecta y colapsa filas consecutivas 100 % idénticas (las 5 repeticiones de `Srutrap tsatsɵ` en `4 USHAMERA` quedan en 1 sentido y se reportan 4 duplicados colapsados) y registra en `observacion_editorial` las celdas resaltadas en amarillo (`3 TRATUL`) y los comentarios encadenados (`A174`).

### 3. Importador Gobernado (`lexicon:import`) y Papelera
- **Validación Zod y Planificación (`lexiconSchema.ts`, `lexiconPlan.ts`, `lexiconImport.ts`, `LexiconRepository.ts`) (R-007, R-008, R-009)**:
  - Valida `data/lexicon/v1/lexico.yaml` con `lexicoSchema`.
  -Verifica que todos los códigos de nodos taxonómicos referenciados (`C1..C4`, subcampos y microcampos) existan activos en la base de datos.
  - En modo por defecto (`dry-run`), calcula y muestra el plan completo (sentidos a crear, actualizar, sin cambios, descripciones de nodos a actualizar, duplicados colapsados y observaciones editoriales) sin escribir en PostgreSQL.
  - Con `--apply`, exige `--approved-by <autoridad>`, ejecuta en una sola transacción la actualización de descripciones de nodos, el upsert de `sentidos_lexicos`, el reemplazo ordenado de `formas_namtrik` y `sentidos_ubicaciones`, el retiro lógico (`deleted_at = now()`) de filas demo activas en `palabras_modelo_1`/`palabras_modelo_2`, y escribe la entrada `LEXICON_IMPORT` en `audit_log` con el hash SHA-256 de `lexico.yaml`.
  - Ampliación de `PapeleraUseCase` para incluir sentidos léxicos borrados lógicamente y su restauración con verificación de colisión `409`.

### 4. API de Diccionario y Presentación Multinivel en Frontend
- **Backend (`CampoSemanticoRepository.ts`, `PalabraRepository.ts`, `DictionaryController.ts`) (R-010)**:
  - Hidratación eficiente de los sentidos asociados a cada `Campo`, `Subcampo`, `Microcampo` y `Subnivel` ordenados por `posicion ASC`.
  - Serialización en el endpoint `GET /api/dictionary/semantic-fields/slug/:slug` incluyendo `namtrikDescripcion`, `espanolDescripcion` y `terms[]` en los tres niveles (`field.terms`, `subfield.terms`, `microfield.terms` y `subnivel.terms`).
  - Actualización de `GET /api/dictionary/words` para buscar sobre `sentidos_lexicos` y `formas_namtrik` (por lema normalizado con `ɵ`, glosa, explicación o nombre científico).
- **Frontend (`apps/web-client`) (R-011)**:
  - Extensión de los tipos `Term`, `SemanticField`, `Subfield` y `Microfield` en `types/semanticField.ts` y del adaptador `adaptSemanticField` en `dictionaryApi.ts`.
  - `FieldHero.tsx`: soporte opcional para mostrar la descripción cultural en namtrik (`descriptionMisak`) encima o junto a la descripción en español.
  - `CampoPage.tsx`: renderiza los términos directos del campo (`field.terms`) además de sus subcampos (caso `C3 Tra tul`).
  - `SubfieldCard.tsx`: muestra el resumen inteligente de contenido (`N microcampos` y/o `M términos`) para que los subcampos con términos directos no muestren `"0 microcampos"`.
  - `SubfieldPage.tsx`: renderiza tanto los microcampos hijos (si existen) como el catálogo de términos directos del subcampo (`subfield.terms`, casos `C1.S5..S6`, `C2.S1..S5`, `C3.S1`, `C4.S1..S6`).
  - `TermRow.tsx`: renderiza todas las formas namtrik del sentido en posición primaria con badges de categoría gramatical, variante (`V.1`, `V.2`) y neologismo (`neol.`), la explicación contextual en namtrik (`namtrikContexto`), la glosa principal en negrita, la explicación en español, el nombre científico en cursiva y la vista conversacional pregunta ↔ respuesta para entradas dialógicas (`Saludos`).

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `specs/adr/0003-sentido-formas-y-ubicacion-multinivel.md` | ADR de modelo Sentido + Formas y ubicación multinivel | R-001, R-004 |
| `apps/backend-service/prisma/schema.prisma` | Modelos `SentidoLexico`, `FormaNamtrik`, `SentidoUbicacion` y relaciones con nodos taxonómicos | R-001..R-004, R-009 |
| `apps/backend-service/prisma/migrations/0008_sentido_formas_lexico/migration.sql` | Tablas `sentidos_lexicos`, `formas_namtrik`, `sentidos_ubicaciones`, `CHECK` multinivel e índices parciales | R-001..R-004, R-009 |
| `apps/backend-service/src/application/lexicon/lexiconSchema.ts` | Esquema Zod `lexicoSchema` para validar `lexico.yaml` | R-001..R-007 |
| `apps/backend-service/src/application/lexicon/lexiconParser.ts` | Parser puro de filas del `.xlsm`: formas, etiquetas, glosa/explicación, nombre científico y saludos | R-001..R-006 |
| `apps/backend-service/src/application/lexicon/lexiconParser.test.ts` | Tests unitarios del parser léxico sobre casos reales (`Murarap/Kirap`, `Miirap`, `Mawai tsatsɵ`, `Saludos`, duplicados) | R-001..R-006 |
| `apps/backend-service/scripts/lexicon-extract.ts` | CLI que lee el `.xlsm` y escribe `data/lexicon/v1/lexico.yaml` deterministamente | R-006 |
| `data/lexicon/v1/lexico.yaml` | Fuente canónica versionada con todos los sentidos, formas, ubicaciones y descripciones de `C1..C4` | R-001..R-006 |
| `apps/backend-service/src/application/lexicon/lexiconPlan.ts` | Cálculo puro del plan de importación léxica e idempotencia por `codigo` | R-007, R-008 |
| `apps/backend-service/src/application/lexicon/lexiconPlan.test.ts` | Tests unitarios de `construirPlanLexico` (crear, actualizar, sin cambios, nodo inexistente) | R-007, R-008 |
| `apps/backend-service/src/application/lexicon/lexiconImport.ts` | Caso de uso `LexiconImportUseCase` (dry-run vs `--apply --approved-by`) | R-007, R-008 |
| `apps/backend-service/src/infrastructure/repositories/LexiconRepository.ts` | Aplicación transaccional en PostgreSQL, retiro de palabras demo y registro en `audit_log` | R-005, R-008, R-009 |
| `apps/backend-service/scripts/lexicon-import.ts` | CLI ejecutable `pnpm lexicon:import` (`--apply`, `--approved-by`, `--file`) | R-007, R-008 |
| `apps/backend-service/src/application/use-cases/admin/PapeleraUseCase.ts` | Soporte de listado y restauración de sentidos léxicos en papelera | R-009 |
| `apps/backend-service/src/infrastructure/repositories/CampoSemanticoRepository.ts` | Inclusión de sentidos y formas en `Campo`, `Subcampo`, `Microcampo` y `Subnivel` | R-010 |
| `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` | Búsqueda y detalle de términos sobre `sentidos_lexicos` y `formas_namtrik` | R-010 |
| `apps/backend-service/src/api/dictionary/controllers/DictionaryController.ts` | Serialización de sentidos con `formas[]`, contexto bilingüe, nombre científico y bloque dialógico | R-010 |
| `apps/web-client/src/types/semanticField.ts` | Tipos `TermForm`, `TermDialogue`, `Term` enriquecido y `terms` en `SemanticField` y `Subfield` | R-011 |
| `apps/web-client/src/services/dictionaryApi.ts` | Adaptación de términos en niveles Campo, Subcampo, Microcampo y Subnivel | R-010, R-011 |
| `apps/web-client/src/components/features/semantic-fields/FieldHero.tsx` | Visualización de descripción bilingüe (namtrik + español) del nodo | R-011 |
| `apps/web-client/src/components/features/semantic-fields/SubfieldCard.tsx` | Contador combinado de microcampos y términos directos del subcampo | R-011 |
| `apps/web-client/src/pages/CampoPage.tsx` | Renderizado de términos directos del campo además de subcampos | R-011 |
| `apps/web-client/src/pages/SubfieldPage.tsx` | Renderizado de términos directos del subcampo además de microcampos | R-011 |
| `apps/web-client/src/components/features/semantic-fields/TermRow.tsx` | Tarjeta léxica completa: múltiples formas namtrik, variantes, `neol.`, contexto namtrik, explicación español, nombre científico y vista dialógica | R-011 |
| `apps/web-client/src/components/features/semantic-fields/TermRow.test.tsx` | Tests de renderizado de `TermRow` para sentidos multiforma, científicos y dialógicos | R-011 |

---

## Contratos de UI/API

### 1. Contrato de Término en la API (`ApiTerm` / `Term`)

```ts
export interface TermForm {
  orden: number;
  lema: string;
  acepcionHomonima?: number | null;
  categoriaGramatical?: string | null;
  variante?: string | null;
  esNeologismo: boolean;
  rasgosGramaticales: string[];
  etiquetaOriginal?: string | null;
}

export interface TermDialogue {
  respuestaNamtrik: string;
  respuestaNamtrikContexto?: string | null;
  respuestaEspanolGlosa: string;
  respuestaEspanolExplicacion?: string | null;
}

export interface Term {
  id: string;
  codigo: string;
  tipo: 'estandar' | 'dialogico';
  /** Lema principal o concatenación legible de formas para compatibilidad rápida */
  misak: string;
  /** Glosa principal en español */
  spanish: string;
  namtrikContexto?: string | null;
  espanolExplicacion?: string | null;
  nombreCientifico?: string | null;
  partOfSpeech?: string;
  exampleMisak?: string;
  formas: TermForm[];
  dialogo?: TermDialogue | null;
}
```

### 2. Contrato de Jerarquía Multinivel (`GET /api/dictionary/semantic-fields/slug/:slug`)
- `CampoSemantico` devuelve `namtrikDescripcion`, `espanolDescripcion`, `palabras: ApiTerm[]` (términos directos del campo) y `subcampos: ApiSubfield[]`.
- `ApiSubfield` devuelve `namtrikDescripcion`, `espanolDescripcion`, `palabras: ApiTerm[]` (términos directos del subcampo) y `microcampos: ApiMicrofield[]`.
- `ApiMicrofield` devuelve `namtrikDescripcion`, `espanolDescripcion`, `palabras: ApiTerm[]` y `subniveles: ApiMicrofield[]`.

---

## Decisiones tomadas

1. **[ADR-0003](file:///home/tumidev/developments/misak-dictionary/specs/adr/0003-sentido-formas-y-ubicacion-multinivel.md)**: Adopción del modelo `SentidoLexico` + `FormaNamtrik` + `SentidoUbicacion` con restricción `CHECK (num_nonnulls(...) = 1)` para soportar términos en Campo, Subcampo, Microcampo y Subnivel sin crear nodos artificiales.
2. **Fuente canónica intermedia en `data/lexicon/v1/lexico.yaml`**: Separar la extracción del `.xlsm` (`lexicon:extract`) de la importación en base de datos (`lexicon:import`) permite auditar en Git cada línea del corpus, calcular su huella SHA-256 y ejecutar pruebas e importaciones en CI/producción sin depender de binarios de Excel en tiempo de ejecución.
3. **Compatibilidad hacia atrás en `Term`**: Mantener las propiedades `misak` y `spanish` en el objeto `Term` junto con el nuevo arreglo `formas[]` y metadatos extendidos evita romper componentes o tests existentes mientras enriquece la visualización en `TermRow`.

---

## Riesgos y mitigación

- **Variabilidad de formato en las etiquetas entre paréntesis del `.xlsm` (`179` variantes de puntuación/espaciado)**:
  - *Mitigación*: El parser `lexiconParser.ts` conserva siempre `etiqueta_original` intacta además de extraer de forma tolerante la categoría gramatical, la variante (`V.1..V.3`), el flag `neol.` y los rasgos adicionales; ninguna entrada se descarta por variaciones de puntuación.
- **Volumen de escritura en una sola transacción (~1.350 sentidos y ~1.500 formas)**:
  - *Mitigación*: Uso de operaciones por lote e indexación por `codigo` en `LexiconRepository.ts` con timeout de transacción interactiva configurado (`30000ms`), completando la carga completa en menos de 3 segundos en PostgreSQL local.
