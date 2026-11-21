---
id: 004-esquema-contenido-plan
version: 1.0.0
status: archived
---

# 004 — Plan técnico: Taxonomía v1 y Gobernanza de la Carga

## Diseño

**Estrategia**: Sustituir los datos de demostración ad hoc por una taxonomía versionada y revisada contra el documento `docs/estructura-diccionario-campos-1-2-3-4.pdf`, introduciendo gobernanza estricta en la carga, borrado lógico recuperable (papelera), verificación de permisos en base de datos y un árbol de microcampos de profundidad arbitraria.

### 1. Modelo de Datos y Migraciones PostgreSQL (Prisma 7)
- **Columnas de gobernanza**: `CampoSemantico`, `SubcampoSemantico` y `Microcampo` incorporan `codigo`, `slug`, `posicion` y `version`. `CampoSemantico` incluye campos de ratificación comunitaria (`estado`, `ratificado_por`, `ratificado_at`).
- **Unicidad parcial activa (R-008)**: En la migración `0006_taxonomy_governance`, los índices únicos globales se sustituyen por índices parciales con cláusula `WHERE deleted_at IS NULL`. Esto permite que registros borrados conserven su historial sin bloquear la reutilización de códigos o slugs.
- **Árbol recursivo de microcampos (R-001/008)**: En la migración `0007_microcampos_arbol`, `Microcampo` añade `padre_id` y `profundidad`. Una foreign key compuesta `(padre_id, subcampo_semantico_id)` garantiza a nivel de base de datos que todo subnivel pertenezca al mismo subcampo que su padre. Un trigger PL/pgSQL `microcampos_validar_profundidad()` fuerza `profundidad = padre.profundidad + 1` y bloquea ciclos. La unicidad de nombres se aplica entre nodos hermanos (`COALESCE(padre_id, 0)`).
- **Home slots persistidos (R-013)**: Nueva tabla `home_slots` con 7 posiciones para vincular los botones principales de la landing con campos semánticos por clave estable.

### 2. Fuente Canónica y Pipeline Gobernado de Importación
- **Fuente YAML (R-001/012)**: `data/taxonomy/v1/taxonomia.yaml` (65 nodos: 4 campos, 18 subcampos, 34 microcampos, 9 subniveles bajo C1.S1.M19) y `home-slots.yaml`. Ortografía namtrik normalizada con la vocal `ɵ` (reemplazando `o`, `ə`, `ɔ` sin alterar el español).
- **CLI y Caso de Uso (R-001 a R-007, R-009)**: `TaxonomyImportUseCase` y `scripts/taxonomy-import.ts`.
  - Validación de esquema con Zod (`taxonomiaSchema`, `botonesHomeSchema`).
  - `dry-run` por defecto sin escrituras.
  - `--apply` exige obligatoriamente `--approved-by <nombre>` y calcula hash SHA-256 de las fuentes.
  - Comprobación previa de conflictos: si un código o slug colisiona bajo el mismo padre, aborta el lote completo sin tocar la BD.
  - Ejecución atómica en una única transacción: retiro lógico de filas legadas `LEG-*` y sus palabras exclusivas, inserción/actualización en orden padre→hijo, sincronización de `home_slots` y registro en `audit_log`.

### 3. Autorización en Servidor y Papelera Administrativa
- **RBAC en BD (R-011)**: `requirePermission('dictionary:write')` consulta la tabla `permissions` y `role_permissions` en cada petición vía `PermissionRepository`. No confía en los roles presentes en el token JWT.
- **Papelera (R-010)**: `PapeleraUseCase` y rutas en `/api/admin/dictionary/papelera`. Permite listar elementos eliminados lógicamente y restaurarlos individualmente, capturando `P2002` de Prisma para responder `409` si el código o slug activo ya fue ocupado. Registra auditoría de restauración.

### 4. API Pública y Frontend Recursivo
- **Ensamblaje del árbol en memoria**: `CampoSemanticoRepository` y `arbolMicrocampos.ts` cargan los microcampos en una sola consulta plana por subcampo y estructuran el árbol `subniveles` en memoria.
- **Frontend accesible**: `MicrofieldPage` y `MicrofieldSubnivel` renderizan recursivamente los subniveles calculando encabezados semánticos (`h3` hasta `h6`) y soportando navegación directa por slug único (`buscarMicrocampo`).

---

## Cambios por archivo

| Archivo | Cambio | Requisito |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | Modelos `CampoSemantico`, `SubcampoSemantico`, `Microcampo`, `HomeSlot`, `User` | R-008, R-013 |
| `prisma/migrations/0006_taxonomy_governance/migration.sql` | Índices parciales activos, backfill `LEG-*`, tabla `home_slots` | R-008, R-013 |
| `prisma/migrations/0007_microcampos_arbol/migration.sql` | `padre_id`, `profundidad`, FK compuesta, trigger anti-ciclos | R-008 |
| `data/taxonomy/v1/taxonomia.yaml` | 65 nodos de taxonomía v1 normalizados con `ɵ` | R-001, R-012 |
| `data/taxonomy/v1/home-slots.yaml` | Mapeo de 7 botones del home | R-013 |
| `src/shared/utils/namtrik.ts` | Normalización `o/ə/ɔ → ɵ` | R-012 |
| `src/shared/utils/slug.ts` | Slugs ASCII preservando equivalencias namtrik | R-008 |
| `src/shared/utils/arbolMicrocampos.ts` | Conversión pura plano → árbol | R-001 |
| `src/application/taxonomy/taxonomySchema.ts` | Esquemas Zod de taxonomía y botones | R-001 |
| `src/application/taxonomy/taxonomyPlan.ts` | Construcción de plan, detección de conflictos y normalización | R-002, R-004, R-006 |
| `src/application/taxonomy/taxonomyImport.ts` | Caso de uso gobernado con dry-run y apply | R-002, R-003, R-007 |
| `src/infrastructure/repositories/TaxonomyRepository.ts` | Aplicación transaccional padre→hijo, retiro `LEG-*`, auditoría | R-005, R-007, R-009 |
| `scripts/taxonomy-import.ts` | CLI ejecutable con flags `--apply`, `--approved-by`, `--dir` | R-002, R-003 |
| `src/shared/auth/permissions.ts` | Catálogo unificado de permisos y roles | R-011 |
| `src/infrastructure/repositories/PermissionRepository.ts` | Verificación de permisos en BD por usuario | R-011 |
| `src/presentation/middleware/authorizationMiddleware.ts` | Guard `requirePermission` | R-011 |
| `src/application/use-cases/admin/PapeleraUseCase.ts` | Listado y restauración con control de colisiones 409 | R-010 |
| `src/api/admin/routes/adminDictionaryRoutes.ts` | Rutas de papelera protegidas por `dictionary:write` | R-010, R-011 |
| `src/infrastructure/repositories/CampoSemanticoRepository.ts` | Inclusión de árbol de microcampos y búsqueda por slug | R-001, R-013 |
| `apps/web-client/src/services/dictionaryApi.ts` | Tipos y adaptadores recursivos para `subniveles` | R-001 |
| `apps/web-client/src/hooks/useDictionary.ts` | Búsqueda profunda en árbol por slug | R-001 |
| `apps/web-client/src/pages/MicrofieldPage.tsx` | Renderizado de microcampo y subniveles recursivos | R-001 |
| `apps/web-client/src/components/features/semantic-fields/MicrofieldSubnivel.tsx` | Componente recursivo accesible (`h3..h6`) | R-001 |

---

## Decisiones tomadas

1. **Subniveles como Microcampos con `padre_id` (vs entidad separada)**: Permite recursividad de profundidad arbitraria para futuros microcampos sin alterar el modelo de relación con términos (un término se asocia a un `microcampo_id`, independientemente de su profundidad).
2. **Índices parciales activos (`deleted_at IS NULL`)**: Soluciona la colisión histórica de slugs y nombres al hacer soft-delete, manteniendo la integridad referencial para auditoría y restauración.
3. **Verificación de permisos en servidor (BD) en cada llamada**: Garantiza revocación inmediata de acceso sin esperar la expiración del token JWT.
4. **Retiro lógico de filas `LEG-*` en la primera importación v1**: No se destruyen datos físicamente; las filas de demostración y sus palabras asociadas pasan a `deleted_at = now()`, quedando auditadas y recuperables.
