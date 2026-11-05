---
id: 012-matriz-equivalencias-busqueda-hibrida
version: 0.1.0
status: done
---

# Tareas de Implementación — 012-matriz-equivalencias-busqueda-hibrida

> **Spec:** `specs/features/012-matriz-equivalencias-busqueda-hibrida/spec.md` (`v0.1.0` — `done`, `cultural-gate: true`)
> **Plan:** `specs/features/012-matriz-equivalencias-busqueda-hibrida/plan.md`
> **ADR:** `specs/adr/0008-matriz-equivalencias-y-busqueda-hibrida-pgvector-rrf.md`

| ID | Tarea | Requisito | Estado |
| :--- | :--- | :--- | :--- |
| **T-001** | **Esquema Prisma, Migración `0014_matriz_equivalencias_y_busqueda_hibrida` y Regeneración de Cliente**: Añadir el modelo `EquivalenciaBilingue` (`equivalencias_bilingues`) y la columna `embedding vector(384)` en `apps/backend-service/prisma/schema.prisma`; crear y aplicar la migración SQL `0014` con índices funcionales `BTREE`/`GIN`, índice `HNSW` sobre `sentidos_lexicos.embedding` y poblado inicial idempotente de equivalencias en PostgreSQL 18; regenerar el cliente Prisma. | R-001, R-002 | done |
| **T-002** | **Extractor Determinista, Manifiesto Curado `equivalencias-bilingues.yaml` y Sincronizador CLI (`equivalencias:sync`)**: Crear `data/lexicon/v1/equivalencias-bilingues.yaml`, implementar `apps/backend-service/src/application/lexicon/equivalenciasBilingues.ts` (extracción de sub-acepciones, núcleos nominales como `"estrella"` en `Kɵnchapik` y `"mundo"` en `Kɵrɵishik`, familias morfológicas como `pura*` ↔ `"maíz"` y sincronización idempotente), crear `apps/backend-service/scripts/equivalencias-sync.ts`, registrar el script en `package.json` y añadir las pruebas unitarias en `equivalenciasBilingues.test.ts`. | R-002, R-007 | done |
| **T-003** | **Puerto de Dominio `ISemanticEmbeddingProvider` y `NullEmbeddingProvider`**: Crear `apps/backend-service/src/domain/ports/ISemanticEmbeddingProvider.ts` con la interfaz `ISemanticEmbeddingProvider` (`dimensions: 384`, `isEnabled()`, `embedQuery()`) y el adaptador por defecto `NullEmbeddingProvider` bajo cumplimiento estricto de los Principios CARE (cero llamadas externas). | R-004 | done |
| **T-004** | **Motor de Búsqueda Híbrida con Fusión `RRF` ($k = 60$), Matriz de Equivalencias y Cortocircuito en `PalabraRepository.ts`**: Actualizar `apps/backend-service/src/infrastructure/repositories/PalabraRepository.ts` para integrar `equivalencias_bilingues` en la consulta ranqueada, calcular `rrf_score` ($k = 60$), soportar vectores opcionales de `ISemanticEmbeddingProvider`, proyectar `campoCoincidencia: 'equivalencia'` + `terminoEquivalente` y activar el cortocircuito en memoria cuando `palabras_modelo_1` está vacío. | R-003, R-004, R-005, R-006 | done |
| **T-005** | **Pruebas Unitarias y de Integración del Motor Híbrido (`PalabraRepository.test.ts` + `searchRankingMisak.integration.test.ts`)**: Ampliar `PalabraRepository.test.ts` (validando `campoCoincidencia: 'equivalencia'`, `terminoEquivalente`, `ISemanticEmbeddingProvider` y el cortocircuito de `palabras_modelo_1`) y `searchRankingMisak.integration.test.ts` contra PostgreSQL 18 real (validando coherencia bidireccional `"pura"` ↔ `"maíz"`, `"estrella"` → `Kɵnchapik`, `"mundo"` → `Kɵrɵishik` y `"flor"` ↔ `"ú"` → `Ú`). | R-001, R-003, R-004, R-006, R-007 | done |
| **T-006** | **Insignia `"Equivalencia"` y Mapeo de `terminoEquivalente` en Frontend (`dictionaryApi.ts` + `SearchBox.tsx` + Tests)**: Actualizar `apps/web-client/src/services/dictionaryApi.ts` y `SearchBox.tsx` para mapear y renderizar la insignia accesible `"Equivalencia"` (y el término equivalente asociado) cuando `campoCoincidencia === 'equivalencia'`, y añadir las pruebas correspondientes en `dictionaryApi.test.ts` y `SearchBox.test.tsx`. | R-005, R-007 | done |
| **T-007** | **Verificación Integral de Calidad y Cierre de `Spec 012`**: Ejecutar `biome check`, `tsc` (frontend y backend), suites unitarias (`web-client` y `backend-service`), suite de integración con PostgreSQL real (`RUN_INTEGRATION=1`), builds de producción y actualizar `spec.md`, `plan.md` y `tasks.md` a `done`. | R-001..R-007 | done |
