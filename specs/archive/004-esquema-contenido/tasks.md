---
id: 004-esquema-contenido-tasks
version: 1.0.0
status: done
---

# 004 — Tareas: Taxonomía v1 y Gobernanza de la Carga

| ID    | Tarea                                                                                                        | Requisito     | Estado |
| :---  | :----------------------------------------------------------------------------------------------------------- | :------------ | :----- |
| T-001 | Migración 0006: índices parciales activos (`deleted_at IS NULL`), backfill `LEG-*`, tabla `home_slots`       | R-008, R-013  | done   |
| T-002 | Migración 0007: árbol microcampos (`padre_id`, `profundidad`, trigger anti-ciclos, unicidad hermanos)        | R-008         | done   |
| T-003 | Schema Prisma: actualización de modelos y modelo `HomeSlot`; regenerar cliente                              | R-008, R-013  | done   |
| T-004 | Normalización ortográfica namtrik (`namtrik.ts`, `slug.ts`) a vocal `ɵ`                                      | R-012         | done   |
| T-005 | Fuentes de datos canónicas: `data/taxonomy/v1/taxonomia.yaml` (65 nodos) y `home-slots.yaml`                 | R-001, R-013  | done   |
| T-006 | Validación Zod y cálculo del plan (`taxonomySchema.ts`, `taxonomyPlan.ts`, `taxonomyPlan.test.ts`)           | R-001, R-004  | done   |
| T-007 | Aplicación transaccional padre→hijo, retiro `LEG-*` y auditoría (`TaxonomyRepository.ts`, `taxonomyImport.ts`) | R-003..R-007, R-009 | done |
| T-008 | CLI ejecutable `scripts/taxonomy-import.ts` con modos dry-run y apply gobernado                              | R-002, R-003  | done   |
| T-009 | Test de integración transaccional atómico contra PostgreSQL (`TaxonomyRepository.integration.test.ts`)        | R-005         | done   |
| T-010 | RBAC en servidor: catálogo `permissions.ts`, `PermissionRepository.ts` y middleware `requirePermission`    | R-011         | done   |
| T-011 | Papelera administrativa: `PapeleraUseCase.ts` y rutas `/papelera` con colisiones 409 y auditoría             | R-010         | done   |
| T-012 | Jerarquía pública en backend: `arbolMicrocampos.ts` y `CampoSemanticoRepository.ts`                          | R-001         | done   |
| T-013 | Frontend recursivo: `dictionaryApi.ts`, `useDictionary.ts`, `MicrofieldPage.tsx` y `MicrofieldSubnivel.tsx`  | R-001         | done   |
| T-014 | Verificación E2E: dry-run y apply en DB local (:5434), Biome CI en verde, tests frontend y backend           | —             | done   |
