---
id: 005-sentido-formas-lexico-tasks
version: 1.0.0
status: archived
---

# 005 — Tareas: Modelo léxico «Sentido + Formas», ingesta gobernada (`.xlsm`) y presentación multinivel

| ID    | Tarea                                                                                                                                   | Requisito           | Estado |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | :----- |
| T-001 | Crear migración `0008_sentido_formas_lexico` (`sentidos_lexicos`, `formas_namtrik`, `sentidos_ubicaciones` con `CHECK` e índices)       | R-001..R-004, R-009 | done   |
| T-002 | Actualizar `prisma/schema.prisma` con `SentidoLexico`, `FormaNamtrik` y `SentidoUbicacion`, aplicar migración y regenerar Prisma Client | R-001..R-004, R-009 | done   |
| T-003 | Implementar `lexiconSchema.ts` (Zod) y `lexiconParser.ts` (desglose de formas, variantes, `neol.`, contexto namtrik, científico, saludos) | R-001..R-006        | done   |
| T-004 | Crear tests unitarios `lexiconParser.test.ts` verificando todos los escenarios Gherkin de extracción y deduplicación                     | R-001..R-006        | done   |
| T-005 | Implementar CLI `scripts/lexicon-extract.ts` y generar `data/lexicon/v1/lexico.yaml` desde `diccionario-campo-namtrik-castellano.xlsm`  | R-005, R-006        | done   |
| T-006 | Implementar `lexiconPlan.ts` y tests `lexiconPlan.test.ts` para cálculo determinista e idempotente del plan de importación              | R-007, R-008        | done   |
| T-007 | Implementar `LexiconRepository.ts`, `lexiconImport.ts` y CLI `scripts/lexicon-import.ts` (`--dry-run` y `--apply --approved-by`)         | R-005, R-007..R-009 | done   |
| T-008 | Ejecutar importación gobernada (`dry-run` + `apply`) contra PostgreSQL local (`:5434`) y verificar conteos e idempotencia               | R-005, R-007, R-008 | done   |
| T-009 | Actualizar `CampoSemanticoRepository.ts`, `PalabraRepository.ts` y `DictionaryController.ts` para servir sentidos y formas multinivel   | R-010               | done   |
| T-010 | Actualizar tests de backend (`CampoSemanticoRepository.test.ts`, `PalabraRepository.test.ts`, `DictionaryController.test.ts`)           | R-010               | done   |
| T-011 | Actualizar `types/semanticField.ts`, `dictionaryApi.ts`, `FieldHero.tsx`, `SubfieldCard.tsx`, `CampoPage.tsx` y `SubfieldPage.tsx`      | R-011               | done   |
| T-012 | Actualizar `TermRow.tsx` y sus tests (`TermRow.test.tsx`, `CampoPage.test.tsx`, `SubfieldPage.test.tsx`) para múltiples formas y saludos | R-011               | done   |
| T-013 | Verificación integral E2E: Biome CI con 0 errores, 100 % tests en `backend-service` y `web-client`, y actualización de trazabilidad     | R-001..R-011        | done   |
