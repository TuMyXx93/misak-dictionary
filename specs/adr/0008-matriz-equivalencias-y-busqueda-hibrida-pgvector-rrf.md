# ADR-0008: Matriz de Equivalencias Bilingüe, Búsqueda Híbrida (Léxica + Trigramas + pgvector RRF) y Soberanía de Datos Indígenas

- **Estado:** Aceptada (`Spec 012 v0.1.0`)
- **Fecha:** 2026-11-04
- **Autores:** sesión arquitectónica (agente architect + dirección de proyecto)
- **Referencias:** `Spec 005` (`ADR-0003`), `Spec 009` (`Enmiendas 0.2.0` y `0.4.0`), `Spec 011` (`ADR-0007`), Principios CARE de Soberanía de Datos Indígenas

---

## Contexto

Tras las correcciones introducidas en la `Spec 009` (`Enmienda 0.4.0`) —que resolvieron la búsqueda de monografemas en Namtrik (`"ú"` / `"u"` → `Ú — Flor`), el bug de escape en expresiones regulares POSIX ERE (`\m...\M`) dentro de `$queryRaw` y la diferenciación visual de coincidencias en descripción (`campoCoincidencia: 'explicacion'` + extracto contextual)—, el diagnóstico integral del motor de búsqueda bilingüe identificó dos necesidades arquitectónicas estructurales que excedían el alcance de una enmienda correctiva:

1. **Asimetría de Asociación Semántica entre Términos (`H5b` — Patrón de Matriz Bilingüe)**:
   - En consultas como `"pura"` (`Maíz`), el buscador exhibe una matriz coherente de resultados (`Pura`, `Puratɵ`, `Pura pishintɵ`, `Purakɵtɵ`, etc.) porque tanto el lema Namtrik como la glosa castellana comparten explícitamente la raíz léxica `"pura"` o el sustantivo `"maíz"`.
   - En cambio, cuando una persona usuaria consulta conceptos en castellano cuyas glosas en `sentidos_lexicos` están redactadas como locuciones descriptivas (`"Representación de la estrella"` para `Kɵnchapik`, `"Nuestro mundo"` para `Kɵrɵishik`, `"¿A dónde?"` para `Munásrɵ?`) o cuando busca por sinónimos, hiperónimos y dominios cosmológicos Misak (`"mundo"`, `"cosmos"`, `"territorio"`, `"estrella"`, `"flor"`), una comparación puramente literal sobre `espanol_glosa` resulta insuficiente o mezcla coincidencias incidentales en explicaciones largas con traducciones conceptuales directas.
2. **Infrautilización de `pgvector` y Gobernanza Cultural sobre Modelos Semánticos (`H6`)**:
   - El contenedor oficial de base de datos del proyecto (`pgvector/pgvector:pg18`) ya dispone de la extensión `vector` (`pgvector`) activa junto con `pg_trgm` y `unaccent`, pero `sentidos_lexicos` carece de estructura para búsqueda híbrida y fusión de rankings.
   - A su vez, entrenar o generar *embeddings* sobre lengua Namtrik mediante APIs externas comerciales implicaría transmitir patrimonio lingüístico del pueblo Misak a servidores de terceros, vulnerando la **Constitución C1** y los **Principios CARE de Soberanía de Datos Indígenas** (*Collective Benefit, Authority to Control, Responsibility, Ethics*).

---

## Decisión

Adoptamos una **Arquitectura de Búsqueda Bilingüe Híbrida de Tres Capas con Fusión RRF (*Reciprocal Rank Fusion*) en PostgreSQL 18**, gobernada bajo soberanía de datos local:

### 1. Matriz Relacional de Equivalencias Bilingües (`equivalencias_bilingues`)

Se incorpora en `prisma/schema.prisma` la entidad `EquivalenciaBilingue` (`@@map("equivalencias_bilingues")`), vinculada `N:1` a `SentidoLexico` (`sentido_id` con `ON DELETE CASCADE`):

- `id`: `BigInt` autoincremental.
- `sentidoId` (`sentido_id`): `BigInt` (FK a `sentidos_lexicos.id`).
- `terminoEs` (`termino_es`): `String` — término clave, sinónimo, sub-acepción o concepto equivalente en castellano (p. ej. `"maíz"`, `"estrella"`, `"mundo"`, `"flor"`).
- `terminoNamtrik` (`termino_namtrik`): `String?` — raíz o lema Namtrik asociado (p. ej. `"Pura"`, `"Kɵnchapik"`, `"Kɵrɵishik"`, `"Ú"`).
- `tipoRelacion` (`tipo_relacion`): `String` (`'glosa_directa' | 'sub_acepcion' | 'raiz_morfologica' | 'sinonimo_es' | 'hiperonimo' | 'afinidad_cultural'`).
- `peso`: `Float` (`default 1.0` — `1.0` para glosa directa/sub-acepción, `0.90` para sinónimo/raíz morfológica, `0.75` para hiperónimo/afinidad cultural).
- `origen`: `String` (`'corpus_v1' | 'derivacion_morfologica' | 'curaduria_linguistica'`).
- `ratificado`: `Boolean` (`default false`; `true` para extracciones directas de glosas del corpus v1 y entradas ratificadas por curaduría).
- Índices funcionales en PostgreSQL sobre `public.immutable_normalize_namtrik_es(termino_es)` y `public.immutable_normalize_namtrik_es(coalesce(termino_namtrik, ''))` (`BTREE` + `GIN gin_trgm_ops`).

La matriz se puebla mediante un pipeline determinista e idempotente (`scripts/equivalencias-sync.ts`) que combina:
1. **Descomposición atómica de `espanol_glosa`** de los `1.351` sentidos (separando sub-acepciones por `,`, `;`, `/` y extrayendo el núcleo nominal de locuciones como `"Representación de la estrella"` → `"estrella"`).
2. **Agrupación de familias morfológicas Namtrik** (como la matriz `pura*` ↔ `"maíz"`, `tsurɵ*`, `kɵrɵ*`, `wam*`).
3. **Manifiesto declarativo curado (`data/lexicon/v1/equivalencias-bilingues.yaml`)** auditable en Git bajo `cultural-gate: true`.

### 2. Columna Vectorial `pgvector` (`vector(384)`) y Puerto `ISemanticEmbeddingProvider`

1. Se añade a `sentidos_lexicos` la columna opcional `embedding vector(384)` acompañada de un índice `HNSW (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)` en la migración SQL `0014`.
2. Se elige la dimensionalidad **`384`** por ser el estándar compacto de modelos multilingües ligeros ejecutables en CPU local mediante ONNX (`paraphrase-multilingual-MiniLM-L12-v2` / `multilingual-e5-small`), evitando dependencias de GPU o APIs remotas.
3. En la capa de dominio (`src/domain/ports/ISemanticEmbeddingProvider.ts`) se define el puerto `ISemanticEmbeddingProvider` con el adaptador por defecto `NullEmbeddingProvider` (que retorna `null` en `< 0.01 ms` sin instalar pesos pesados ni realizar llamadas de red). Si en el futuro el Cabildo habilita un modelo ONNX local en contenedor interno, basta con inyectar el adaptador local sin modificar el repositorio ni el esquema SQL.

### 3. Algoritmo de Ranking Híbrido con *Reciprocal Rank Fusion* (`RRF`, $k = 60$)

Para consultas de `>= 2` caracteres, `PalabraRepository` combina las señales léxica, matricial, difusa y vectorial (cuando esté activa) calculando un puntaje unificado determinista:

$$\text{score}_{\text{RRF}}(s) = \frac{w_{\text{lex}}}{60 + \text{rank}_{\text{lex}}(s)} + \frac{w_{\text{mat}} \cdot \text{peso}(s)}{60 + \text{rank}_{\text{mat}}(s)} + \frac{w_{\text{fts}}}{60 + \text{rank}_{\text{fts}}(s)} + \frac{w_{\text{vec}}}{60 + \text{rank}_{\text{vec}}(s)}$$

conservando la jerarquía de niveles (`1..7`) como criterio primario para garantizar que las coincidencias exactas de lema (`nivel 1`) y glosa (`nivel 2`) jamás sean desplazadas por coincidencias difusas o de descripción, e incorporando el nivel `2b` / `4b` respaldado por `equivalencias_bilingues`.

### 4. Cortocircuito de `palabras_modelo_1` en el Hot-Path de Búsqueda

En cumplimiento de la hoja de ruta de `ADR-0007`, `PalabraRepository.searchModelo1` evita ejecutar las dos consultas `$queryRaw` sobre la tabla legada vacía `palabras_modelo_1` en producción una vez verificado en caché de instancia que `palabras_modelo_1` tiene `0` registros (manteniendo compatibilidad con los tests unitarios que mockean `$queryRaw` para `palabras_modelo_1`).

---

## Consecuencias

### Positivas
- **Coherencia bilingüe simétrica (Patrón `"pura"` generalizado)**: Consultas en castellano o Namtrik (`"estrella"`, `"mundo"`, `"maíz"`, `"pura"`, `"flor"`, `"ú"`) encuentran de forma consistente todos los sentidos asociados por glosa directa, sub-acepción, familia morfológica o afinidad cultural curada.
- **Transparencia para la persona usuaria**: El frontend distingue claramente entre coincidencia **Exacta**, **Prefijo**, **Equivalencia** (matriz bilingüe) y **En descripción** (con extracto contextual).
- **Soberanía lingüística garantizada (Principios CARE)**: Cero tráfico hacia APIs externas de IA; infraestructura `pgvector` HNSW lista y tipada en PostgreSQL 18 para inferencia 100% local.
- **Menor latencia en cada búsqueda**: El cortocircuito de la tabla vacía `palabras_modelo_1` ahorra 2 *round-trips* SQL por petición.

### Negativas / Mitigaciones
- **Mantenimiento del manifiesto de equivalencias**: Requiere revisión humana (`cultural-gate`) cuando se añadan relaciones de `afinidad_cultural` o `hiperonimo`. Se mitiga separando claramente `origen = 'corpus_v1'` (automático desde glosas ratificadas) de `origen = 'curaduria_linguistica'` (declarado en YAML versionado).
