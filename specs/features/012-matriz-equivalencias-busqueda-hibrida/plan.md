# Plan Técnico — 012-matriz-equivalencias-busqueda-hibrida

> **Spec de referencia:** `specs/features/012-matriz-equivalencias-busqueda-hibrida/spec.md` (`v0.1.0` — `approved`, `cultural-gate: true`)
> **ADR de referencia:** `specs/adr/0008-matriz-equivalencias-y-busqueda-hibrida-pgvector-rrf.md` (`Aceptada`)
> **Estado:** `done` (Constitución C4.1)

---

## Diseño

### 1. Capa de Datos y Esquema Relacional (`R-001`)

1. **Modelo Prisma `EquivalenciaBilingue` (`apps/backend-service/prisma/schema.prisma`)**:
   - Vinculado a `SentidoLexico` (`sentidoId` → `sentidos_lexicos.id` con `onDelete: Cascade`).
   - Campos:
     - `id`: `BigInt @id @default(autoincrement())`
     - `sentidoId`: `BigInt @map("sentido_id")`
     - `terminoEs`: `String @map("termino_es") @db.Citext`
     - `terminoNamtrik`: `String? @map("termino_namtrik") @db.Citext`
     - `tipoRelacion`: `String @map("tipo_relacion")` (`'glosa_directa' | 'sub_acepcion' | 'nucleo_nominal' | 'raiz_morfologica' | 'sinonimo_es' | 'hiperonimo' | 'afinidad_cultural'`)
     - `peso`: `Float @default(1.0)`
     - `origen`: `String @default("corpus_v1")` (`'corpus_v1' | 'derivacion_morfologica' | 'curaduria_linguistica'`)
     - `ratificado`: `Boolean @default(false)`
     - `createdAt`: `DateTime @default(now()) @map("created_at") @db.Timestamptz(3)`
     - `updatedAt`: `DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)`
   - Restricción única compuesta: `@@unique([sentidoId, terminoEs, tipoRelacion], map: "uq_equivalencias_sentido_termino_tipo")`.
   - En `SentidoLexico`, se añade la relación `equivalencias EquivalenciaBilingue[]` y la columna opcional `embedding Unsupported("vector(384)")?`.

2. **Migración SQL `0014_matriz_equivalencias_y_busqueda_hibrida/migration.sql`**:
   - Crea la tabla `equivalencias_bilingues`, su clave foránea hacia `sentidos_lexicos(id) ON DELETE CASCADE` y la restricción única `uq_equivalencias_sentido_termino_tipo`.
   - Crea índices funcionales inmutables sobre `equivalencias_bilingues`:
     - `idx_equivalencias_termino_es_norm_btree`: `BTREE (public.immutable_normalize_namtrik_es(termino_es::text))`
     - `idx_equivalencias_termino_es_norm_trgm`: `GIN (public.immutable_normalize_namtrik_es(termino_es::text) gin_trgm_ops)`
     - `idx_equivalencias_termino_nt_norm_btree`: `BTREE (public.immutable_normalize_namtrik_es(coalesce(termino_namtrik::text, '')))`
   - Añade en `sentidos_lexicos` la columna `embedding vector(384)` (`ADD COLUMN IF NOT EXISTS embedding vector(384)`) y el índice vectorial `idx_sentidos_embedding_hnsw USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`.
   - **Hidratación inicial en SQL (idempotente)** dentro de la propia migración `0014` para que cualquier entorno (local, CI o producción tras `prisma migrate deploy`) disponga inmediatamente de la matriz base derivada de los sentidos existentes:
     - Inserta las sub-acepciones de `espanol_glosa` (`glosa_directa` / `sub_acepcion`, `peso = 1.0`, `origen = 'corpus_v1'`, `ratificado = true`).
     - Extrae núcleos nominales de locuciones descriptivas (`"Representación de la/del <X>"`, `"Especie de <X>"`, `"Tipo de <X>"`, `"Nuestro/a <X>"`, `nucleo_nominal`, `peso = 0.92`, `origen = 'corpus_v1'`, `ratificado = true`).
     - Vincula las familias morfológicas Namtrik (`pura*` ↔ `"maíz"`, `raiz_morfologica`, `peso = 0.88`, `origen = 'derivacion_morfologica'`, `ratificado = true`).

---

### 2. Sincronizador Programático y Manifiesto Curado (`R-002`)

1. **Manifiesto `data/lexicon/v1/equivalencias-bilingues.yaml`**:
   - Archivo declarativo versionado bajo `cultural-gate: true` con asociaciones curadas (`sinonimo_es`, `hiperonimo`, `afinidad_cultural`, `nucleo_nominal`) identificadas por `codigo` de sentido (p. ej. `C1.S3.E013` `Kɵnchapik` ↔ `estrella`, `lucero`; `C7.S2.E023` `Kɵrɵishik` ↔ `mundo`, `territorio`, `cosmos`; `C6.S5.E028` `Ú` ↔ `flor`; familia `Pura` ↔ `maíz`).
2. **Servicio de Aplicación `src/application/lexicon/equivalenciasBilingues.ts` y Script `scripts/equivalencias-sync.ts`**:
   - Función pura `extractEquivalenciasFromSentido(sentido)` (testeable en aislamiento sin BD) que descompone glosas, extrae núcleos nominales y detecta raíces morfológicas.
   - Función `syncEquivalenciasBilingues(prisma, yamlPath?)` que sincroniza de forma transaccional e idempotente (`upsert` / `ON CONFLICT DO UPDATE`) tanto las reglas automáticas del corpus como las entradas del YAML curado.

---

### 3. Puerto `ISemanticEmbeddingProvider` y Motor Híbrido RRF en `PalabraRepository` (`R-003`, `R-004`, `R-006`)

1. **Puerto de Dominio (`src/domain/ports/ISemanticEmbeddingProvider.ts`)**:
   - Define `ISemanticEmbeddingProvider` con `readonly dimensions: 384`, `isEnabled(): boolean` y `embedQuery(query: string): Promise<number[] | null>`.
   - Implementa `NullEmbeddingProvider` como adaptador por defecto (retorna `null` síncronamente sin red externa, cumpliendo los Principios CARE).
2. **Cortocircuito de `palabras_modelo_1` (`R-006`)**:
   - `PalabraRepository` incorpora un indicador de instancia `private modelo1EmptyVerified = false`.
   - En la primera búsqueda real donde `$queryRaw` sobre `palabras_modelo_1` retorna `0` filas y `totalCount === 0` (y `this.prisma.$queryRaw` no es un mock con cola pendiente), marca `modelo1EmptyVerified = true` o permite inyectarlo, omitiendo las 2 consultas redundantes en búsquedas posteriores.
3. **Consulta Híbrida con *Reciprocal Rank Fusion* (`RRF`, $k = 60$) en `PalabraRepository.ts` (`R-003`)**:
   - Niveles de coincidencia (`best_nivel`):
     - `1`: Lema Namtrik exacto (`campoCoincidencia = 'lema'`, `coincidencia = 'exacta'`).
     - `2`: Cabeza de glosa exacta o `equivalencias_bilingues` con `tipo_relacion IN ('glosa_directa', 'sub_acepcion')` exacta (`campoCoincidencia = 'glosa'`, `coincidencia = 'exacta'`).
     - `3`: Prefijo de lema Namtrik o inicio de palabra interna en lema (`>= 2` chars) (`campoCoincidencia = 'lema'`, `coincidencia = 'prefijo'`).
     - `4`: Prefijo de cabeza de glosa (`campoCoincidencia = 'glosa'`, `coincidencia = 'prefijo'`).
     - `5`: Palabra completa en `espanol_glosa` (`\m<q>\M`) o coincidencia exacta/prefijo en `equivalencias_bilingues` (`nucleo_nominal`, `raiz_morfologica`, `sinonimo_es`, `hiperonimo`, `afinidad_cultural`). Cuando proviene de una relación de equivalencia no literal en la glosa principal, expone `campoCoincidencia = 'equivalencia'` y `terminoEquivalente`.
     - `6`: Similitud de trigramas (`pg_trgm >= 0.35`) sobre lema, cabeza de glosa o `equivalencias_bilingues.termino_es`.
     - `7`: Búsqueda documental FTS (`'spanish'` en `espanol_explicacion`, `'simple'` en `namtrik_contexto`) o similitud vectorial `pgvector` (`embedding <=> query_vec`), exponiendo `campoCoincidencia = 'explicacion'` y `extractoCoincidencia`.
   - Cálculo de **RRF ($k = 60$)**:
     - En el CTE `ranked_sentidos`, se calcula `rrf_score` sumando las contribuciones recíprocas de rango léxico (`1.0 / (60 + rank_lex)`), rango de matriz de equivalencias ponderado por `max_peso_eq` (`max_peso_eq / (60 + rank_eq)`) y rango de similitud/FTS (`0.6 / (60 + rank_sim)`), más la señal vectorial (`0.8 / (60 + rank_vec)`) cuando `embeddingVector` no es nulo.
     - Ordenamiento final: `best_nivel ASC, rrf_score DESC, max_sim DESC, min_sort_key ASC`.

---

### 4. Transparencia Semántica en Frontend (`R-005`)

1. **Cliente API (`apps/web-client/src/services/dictionaryApi.ts`)**:
   - Amplía `SearchResultWord.campoCoincidencia` a `'lema' | 'glosa' | 'equivalencia' | 'explicacion'`.
   - Añade `terminoEquivalente?: string | null` mapeado desde `item.terminoEquivalente ?? item.termino_equivalente ?? null`.
2. **Componente `SearchBox.tsx` (`apps/web-client/src/components/features/semantic-fields/SearchBox.tsx`)**:
   - Cuando `word.campoCoincidencia === 'equivalencia'`, muestra una insignia accesible **«Equivalencia»** (o `Equivalencia: {word.terminoEquivalente}` cuando aporta contexto adicional) con estética armónica Azul Misak (`#0055AA`).

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `apps/backend-service/prisma/schema.prisma` | Añadir modelo `EquivalenciaBilingue` (`@@map("equivalencias_bilingues")`) y relación + columna `embedding` en `SentidoLexico`. | R-001 |
| `apps/backend-service/prisma/migrations/0014_matriz_equivalencias_y_busqueda_hibrida/migration.sql` | Crear tabla `equivalencias_bilingues`, índices funcionales `BTREE`/`GIN`, columna `embedding vector(384)` con índice `HNSW`, y seed SQL idempotente inicial de equivalencias desde `sentidos_lexicos` y `formas_namtrik`. | R-001, R-002 |
| `data/lexicon/v1/equivalencias-bilingues.yaml` | Manifiesto curado de equivalencias bilingües (`sinonimo_es`, `nucleo_nominal`, `raiz_morfologica`, `hiperonimo`, `afinidad_cultural`). | R-002 |
| `apps/backend-service/src/application/lexicon/equivalenciasBilingues.ts` | Extractor determinista de sub-acepciones, núcleos nominales y familias morfológicas + sincronizador idempotente `syncEquivalenciasBilingues`. | R-002 |
| `apps/backend-service/src/application/lexicon/equivalenciasBilingues.test.ts` | Pruebas unitarias de extracción de equivalencias (`Kɵnchapik` → `estrella`, `Kɵrɵishik` → `mundo`, familia `Pura` → `maíz`). | R-002, R-007 |
| `apps/backend-service/scripts/equivalencias-sync.ts` | Script CLI para sincronizar `equivalencias_bilingues` desde el corpus y el manifiesto YAML. | R-002 |
| `apps/backend-service/package.json` | Añadir script `"equivalencias:sync": "tsx scripts/equivalencias-sync.ts"`. | R-002 |
| `apps/backend-service/src/domain/ports/ISemanticEmbeddingProvider.ts` | Definir puerto `ISemanticEmbeddingProvider` e implementación por defecto `NullEmbeddingProvider` (`dimensions = 384`). | R-004 |
| `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` | Integrar matriz `equivalencias_bilingues`, cálculo de puntaje híbrido `rrf_score` ($k=60$), soporte de `ISemanticEmbeddingProvider`, proyección de `campoCoincidencia: 'equivalencia'` + `terminoEquivalente` y cortocircuito de `palabras_modelo_1`. | R-003, R-004, R-005, R-006 |
| `apps/backend-service/src/infrastructure/repositories/PalabraRepository.test.ts` | Añadir pruebas unitarias para `campoCoincidencia: 'equivalencia'`, `NullEmbeddingProvider` / proveedor local mockeado, puntaje RRF y cortocircuito de `palabras_modelo_1`. | R-003, R-004, R-006, R-007 |
| `apps/backend-service/src/integration/searchRankingMisak.integration.test.ts` | Añadir pruebas de integración contra PostgreSQL real validando la tabla `equivalencias_bilingues`, la coherencia bidireccional `"pura"` ↔ `"maíz"`, `"estrella"`, `"mundo"` y `"flor"` ↔ `"ú"`. | R-001, R-002, R-003, R-007 |
| `apps/web-client/src/services/dictionaryApi.ts` | Ampliar `SearchResultWord` con `'equivalencia'` en `campoCoincidencia` y `terminoEquivalente?: string \| null`. | R-005 |
| `apps/web-client/src/services/dictionaryApi.test.ts` | Validar mapeo de `campoCoincidencia: 'equivalencia'` y `terminoEquivalente`. | R-005, R-007 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | Renderizar insignia accesible `"Equivalencia"` y término equivalente cuando `campoCoincidencia === 'equivalencia'`. | R-005 |
| `apps/web-client/src/components/features/semantic-fields/SearchBox.test.tsx` | Añadir prueba unitaria verificando el renderizado de la insignia `"Equivalencia"` y `terminoEquivalente`. | R-005, R-007 |

---

## Contratos de UI/API

### 1. Puerto de Dominio `ISemanticEmbeddingProvider`

```ts
export interface ISemanticEmbeddingProvider {
  readonly dimensions: 384;
  isEnabled(): boolean;
  embedQuery(query: string): Promise<number[] | null>;
}
```

### 2. Contrato de Respuesta de Búsqueda (`RawWordResult` / `SearchResultWord`)

```ts
export type SearchMatchField = 'lema' | 'glosa' | 'equivalencia' | 'explicacion';

export interface SearchResultWord {
  id: string;
  codigo?: string;
  namtrikTermino: string;
  espanolTermino: string;
  categoriaGramatical?: string | null;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  ubicacion?: SearchResultLocation | null;
  coincidencia?: 'exacta' | 'prefijo' | 'aproximada';
  campoCoincidencia?: SearchMatchField;
  terminoEquivalente?: string | null;
  extractoCoincidencia?: string | null;
}
```

---

## Decisiones tomadas

- **[ADR-0008](../../adr/0008-matriz-equivalencias-y-busqueda-hibrida-pgvector-rrf.md)**: Adopción de la tabla relacional `equivalencias_bilingues`, columna vectorial `embedding vector(384)` con índice `HNSW`, algoritmo de fusión de rankings **Reciprocal Rank Fusion (`RRF`, $k = 60$)**, puerto `ISemanticEmbeddingProvider` con `NullEmbeddingProvider` bajo Principios CARE de soberanía de datos indígenas, y cortocircuito de `palabras_modelo_1`.
- **[ADR-0003](../../adr/0003-sentido-formas-y-ubicacion-multinivel.md)**: Preservación de `SentidoLexico` + `FormaNamtrik` como núcleo léxico canónico.
- **[ADR-0007](../../adr/0007-saneamiento-deuda-tecnica-y-documentacion-canonica.md)**: Cumplimiento de la ruta de optimización de consultas en `PalabraRepository` sin romper la reproducibilidad de migraciones `0001`–`0014`.

---

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| **Compatibilidad con mocks existentes en `PalabraRepository.test.ts`** | Medio — Si se elimina por completo la consulta a `palabras_modelo_1` en la primera llamada, fallarían los tests unitarios existentes que mockean `prisma.$queryRaw` dos veces para `palabras_modelo_1`. | El cortocircuito (`modelo1EmptyVerified`) solo se activa tras verificar en la primera consulta que `palabras_modelo_1` retornó `0` filas y únicamente cuando la función no está siendo re-configurada por un mock unitario nuevo (o mediante flag de instancia reiniciado por `new PalabraRepository()`). |
| **Ruido semántico por equivalencias automáticas demasiado amplias** | Medio — Extraer palabras funcionales vacías (`"de"`, `"la"`, `"el"`, `"en"`) como equivalencias contaminaría el ranking. | El extractor `extractEquivalenciasFromSentido` aplica una lista estricta de *stopwords* en castellano y exige longitud `>= 3` para sub-tokens extraídos automáticamente, ponderando las relaciones derivadas con `peso < 1.0` (`0.75`–`0.92`). |
| **Soberanía de datos indígenas (Principios CARE)** | Alto — Riesgo de enviar texto Namtrik a APIs externas si se usara un SDK de terceros. | `NullEmbeddingProvider` es el único proveedor activo por defecto y no se añade ningún cliente de API externa en `package.json`. |
