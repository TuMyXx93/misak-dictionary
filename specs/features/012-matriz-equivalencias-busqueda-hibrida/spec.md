---
id: 012-matriz-equivalencias-busqueda-hibrida
version: 0.1.0
status: done
cultural-gate: true
---

# 012 — Matriz de Equivalencias Bilingüe y Búsqueda Híbrida (`pgvector` + RRF)

## Contexto

Tras resolver en la `Spec 009` (`Enmienda 0.4.0`) la navegación del Header hacia `/campos`, el soporte de monografemas en Namtrik (`"ú"` / `"u"` → `Ú — Flor`), el escape de expresiones regulares POSIX ERE (`\m...\M`) y la visualización de extractos para coincidencias en descripción, queda por abordar la evolución estructural diagnosticada en el informe técnico (`H5b` y `H6`):
1. Generalizar la consistencia de asociación bilingüe observada en términos como `"pura"` (`Maíz`) hacia todo el léxico mediante una **Matriz Relacional de Equivalencias Bilingües (`equivalencias_bilingues`)** que indexe sub-acepciones, núcleos nominales de glosas compuestas, familias morfológicas Namtrik y sinónimos/hiperónimos curados.
2. Habilitar la arquitectura de **Búsqueda Híbrida en PostgreSQL 18 (`ADR-0008`)** combinando coincidencia léxica, matriz de equivalencias, trigramas (`pg_trgm`), FTS y soporte vectorial `pgvector` (`HNSW`) mediante **Reciprocal Rank Fusion (`RRF`, $k = 60$)** bajo estricto cumplimiento de los Principios CARE de soberanía de datos indígenas (cero llamadas a APIs externas).

---

## Requisitos (EARS)

- **R-001 (Esquema Relacional `equivalencias_bilingues` e Índice `pgvector` HNSW)** — CUANDO se aplique la migración `0014_matriz_equivalencias_y_busqueda_hibrida`, EL SISTEMA DEBERÁ crear la tabla `equivalencias_bilingues` vinculada a `sentidos_lexicos(id)` (`ON DELETE CASCADE`) con columnas `id`, `sentido_id`, `termino_es`, `termino_namtrik`, `tipo_relacion`, `peso`, `origen`, `ratificado`, `created_at` y `updated_at`, junto con índices funcionales `BTREE` y `GIN (gin_trgm_ops)` sobre `public.immutable_normalize_namtrik_es(termino_es)` y `public.immutable_normalize_namtrik_es(coalesce(termino_namtrik, ''))`, y añadir en `sentidos_lexicos` la columna opcional `embedding vector(384)` con índice `HNSW (embedding vector_cosine_ops)`.

- **R-002 (Poblado Determinista e Idempotente de la Matriz Bilingüe)** — CUANDO se ejecute el sincronizador de equivalencias (`pnpm --filter @misak/backend-service equivalencias:sync` o función programática `syncEquivalenciasBilingues`), EL SISTEMA DEBERÁ poblar de manera idempotente `equivalencias_bilingues` extrayendo: (a) las sub-acepciones de `espanol_glosa` separadas por `,`, `;` o `/`, (b) el núcleo nominal de glosas descriptivas (p. ej. `"Representación de la estrella"` → `"estrella"` en `C1.S3.E013` `Kɵnchapik`, `"Nuestro mundo"` → `"mundo"` en `C7.S2.E023` `Kɵrɵishik`), (c) los pares de familias morfológicas Namtrik-Castellano (p. ej. familia `pura*` ↔ `"maíz"`), y (d) las entradas declaradas en el manifiesto curado `data/lexicon/v1/equivalencias-bilingues.yaml`.

- **R-003 (Ranking Híbrido con Reciprocal Rank Fusion `RRF` en `PalabraRepository`)** — CUANDO una persona usuaria realice una búsqueda en `GET /api/dictionary/words/search?q=<termino>` con `>= 2` caracteres, EL SISTEMA DEBERÁ evaluar en una única consulta SQL parametrizada las señales léxica (`formas_namtrik` y `espanol_glosa`), matricial (`equivalencias_bilingues` ponderada por `peso`), difusa (`pg_trgm`), documental (`FTS`) y vectorial (`pgvector` cuando exista vector de consulta), combinándolas con prioridad de nivel léxico y desempate por puntaje **RRF ($k = 60$)** + orden alfabético cultural `public.misak_sort_key(f.lema)`.

- **R-004 (Soberanía de Datos Lingüísticos y Puerto `ISemanticEmbeddingProvider`)** — MIENTRAS el sistema procese consultas o indexe términos del diccionario en cualquier entorno, EL SISTEMA NO DEBERÁ enviar textos en Namtrik ni en castellano a APIs externas de inteligencia artificial; el cálculo de vectores semánticos deberá abstraerse detrás del puerto `ISemanticEmbeddingProvider` utilizando por defecto `NullEmbeddingProvider` (inferencia externa deshabilitada, latencia cero) o un proveedor local autoalojado de `384` dimensiones.

- **R-005 (Transparencia de Coincidencia por Equivalencia en API y `SearchBox`)** — CUANDO un sentido léxico sea recuperado a través de una relación de `equivalencias_bilingues` (tales como `raiz_morfologica`, `sinonimo_es`, `hiperonimo` o `afinidad_cultural`) que no sea coincidencia literal de lema o cabeza de glosa, EL SISTEMA DEBERÁ incluir en el resultado `campoCoincidencia: 'equivalencia'` y `terminoEquivalente: string | null`, y `SearchBox.tsx` deberá mostrar una insignia accesible **«Equivalencia»** indicando el término asociado.

- **R-006 (Cortocircuito de Tabla Heredada `palabras_modelo_1` en Hot-Path)** — CUANDO `PalabraRepository.searchModelo1` verifique que la tabla heredada `palabras_modelo_1` no contiene registros en la base de datos activa, EL SISTEMA DEBERÁ memorizar dicho estado y omitir las consultas `$queryRaw` sobre `palabras_modelo_1` en búsquedas subsecuentes, ejecutando directamente la consulta híbrida sobre `sentidos_lexicos` sin romper los tests unitarios que mockean `$queryRaw` para `palabras_modelo_1`.

- **R-007 (Cobertura de Pruebas Unitarias y de Integración sobre Matriz Bilingüe)** — CUANDO se ejecuten las suites de pruebas unitarias y de integración (`RUN_INTEGRATION=1`), EL SISTEMA DEBERÁ verificar con tests automatizados la coherencia bidireccional de las consultas `"pura"` ↔ `"maíz"`, `"estrella"` → `Kɵnchapik`, `"mundo"` → `Kɵrɵishik` (con distinción entre traducciones/equivalencias y apariciones en descripción), `"ú"` / `"u"` ↔ `"flor"` → `Ú`, el cálculo de puntaje RRF y el cortocircuito de `palabras_modelo_1`.

---

## Criterios de aceptación (Gherkin)

### R-001 y R-002 — Esquema y Poblado de `equivalencias_bilingues`

```gherkin
Escenario: Creación e hidratación idempotente de la matriz de equivalencias bilingüe
  Dado que la migración 0014 ha sido aplicada en PostgreSQL 18
  Cuando se ejecuta el sincronizador de equivalencias sobre los 1.351 sentidos léxicos
  Entonces la tabla "equivalencias_bilingues" contiene entradas normalizadas para glosas directas, núcleos nominales y familias morfológicas
  Y el sentido "C1.S3.E013" ("Kɵnchapik" — "Representación de la estrella") queda vinculado al término equivalente "estrella"
  Y los sentidos de la familia "Pura" ("Puratɵ", "Pura pishintɵ", "Purakɵtɵ") quedan vinculados con relación a "maíz" / "pura"
  Y re-ejecutar el sincronizador no duplica filas existentes
```

### R-003 y R-005 — Búsqueda Híbrida RRF y Coherencia Bidireccional (`pura` / `maíz`, `estrella`, `mundo`)

```gherkin
Escenario: Coherencia de matriz bilingüe al buscar "maíz" y "pura"
  Dado que la matriz de equivalencias bilingüe está sincronizada
  Cuando la persona usuaria busca "pura" o "maíz"
  Entonces el sistema retorna en las primeras posiciones la familia léxica del maíz encabezada por "Pura" ("Maíz") y sus variedades asociadas
  Y los resultados asociados por matriz exponen su metadato de coincidencia de forma consistente

Escenario: Búsqueda de "estrella" y "mundo" con diferenciación entre equivalencia directa y descripción
  Dado que el usuario escribe "estrella" en el buscador bilingüe
  Cuando el backend ejecuta la consulta híbrida RRF
  Entonces "Kɵnchapik" ("Representación de la estrella") aparece en la primera posición antes que cualquier coincidencia de nivel 7 ("Tsurɵ pɵrtsi")
  Y cuando el usuario escribe "mundo", los sentidos con glosa o equivalencia directa ("Kɵrɵishik", "Munásrɵ?") preceden a los sentidos donde "mundo" solo aparece en la explicación ("Tsurik"), los cuales muestran la insignia "En descripción" y su extracto
```

### R-004 — Soberanía de Datos y Puerto `ISemanticEmbeddingProvider`

```gherkin
Escenario: Operación sin exfiltración de datos lingüísticos a terceros
  Dado el proveedor por defecto NullEmbeddingProvider inyectado en PalabraRepository
  Cuando se ejecuta cualquier búsqueda bilingüe en Namtrik o castellano
  Entonces no se realiza ninguna petición HTTP saliente hacia servicios externos
  Y si se inyecta un proveedor local de prueba que retorna un vector de 384 dimensiones, la consulta incorpora el ranking vectorial en el puntaje RRF sin errores de tipos ni de SQL
```

### R-006 — Cortocircuito de `palabras_modelo_1`

```gherkin
Escenario: Omisión de consultas redundantes sobre palabras_modelo_1 vacío en producción
  Dado que la tabla legada "palabras_modelo_1" tiene 0 registros en PostgreSQL
  Cuando se realizan múltiples búsquedas consecutivas en PalabraRepository
  Entonces tras la primera verificación el repositorio omite las consultas SQL a "palabras_modelo_1" y consulta directamente "sentidos_lexicos"
```

---

## Fuera de alcance

- Integración con APIs externas propietarias de embeddings o LLMs (OpenAI, Cohere, Vertex AI, etc.), prohibida sin autorización expresa del Cabildo por soberanía de datos lingüísticos (Principios CARE / Constitución C1).
- Descarga obligatoria de pesos binarios pesados (`> 100 MB` de modelos ONNX) dentro del bundle de arranque o en el pipeline de CI estándar.
- Eliminación física (`DROP TABLE`) de las 5 tablas legadas en `prisma/schema.prisma` dentro de esta misma migración, para mantener cada cambio de esquema aislado y reversible.

---

## Trazabilidad

| Requisito | Archivos | Tests |
| :--- | :--- | :--- |
| **R-001** | `apps/backend-service/prisma/schema.prisma`, `apps/backend-service/prisma/migrations/0014_matriz_equivalencias_y_busqueda_hibrida/migration.sql` | `apps/backend-service/src/integration/searchRankingMisak.integration.test.ts` |
| **R-002** | `data/lexicon/v1/equivalencias-bilingues.yaml`, `apps/backend-service/src/application/lexicon/equivalenciasBilingues.ts`, `apps/backend-service/scripts/equivalencias-sync.ts` | `apps/backend-service/src/application/lexicon/equivalenciasBilingues.test.ts` |
| **R-003** | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.test.ts`, `apps/backend-service/src/integration/searchRankingMisak.integration.test.ts` |
| **R-004** | `apps/backend-service/src/domain/ports/ISemanticEmbeddingProvider.ts` | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.test.ts` |
| **R-005** | `apps/web-client/src/services/dictionaryApi.ts`, `apps/web-client/src/components/features/semantic-fields/SearchBox.tsx` | `apps/web-client/src/components/features/semantic-fields/SearchBox.test.tsx` |
| **R-006** | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` | `apps/backend-service/src/infrastructure/repositories/PalabraRepository.test.ts` |
| **R-007** | Suites unitarias y de integración (`web-client` y `backend-service`) | `PalabraRepository.test.ts`, `equivalenciasBilingues.test.ts`, `searchRankingMisak.integration.test.ts`, `SearchBox.test.tsx` |

> **Nota de Gobernanza Cultural (`cultural-gate: true`)**: Dado que esta especificación define la matriz de equivalencias semánticas `Namtrik ↔ Castellano` (`data/lexicon/v1/equivalencias-bilingues.yaml`) y las políticas de soberanía lingüística sobre el corpus Misak (`ADR-0008`), requiere revisión y aprobación humana (`/gate-cultural` / aprobación de la spec) antes de pasar su estado a `approved` y generar `plan.md` y `tasks.md` (Constitución C1.1–C1.3 y C4.1).
