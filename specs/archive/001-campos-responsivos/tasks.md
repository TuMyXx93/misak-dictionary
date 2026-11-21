---
id: 001-campos-responsivos-tasks
version: 1.0.0
status: archived
---

# 001 — Tareas

> Documentación retroactiva del WIP. Todos los estados cerrados el
> 2026-10-14: verificación 218/218 tests + formato aplicado (T-011) + merge en dev.

| ID    | Tarea                                                                          | Requisito    | Estado |
| ----- | ------------------------------------------------------------------------------ | ------------ | ------ |
| T-001 | Crear hook `useMediaQuery` con listener `change`                               | R-001        | done   |
| T-002 | Crear hook `useRotatingText` con fade y reduced-motion                         | R-005        | done   |
| T-003 | Rama móvil en `SemanticFieldsLayer` (wrap relativo)                            | R-001, R-002 | done   |
| T-004 | Prop `isMobile` + `AnimatePresence` en `SemanticFieldButton`                   | R-002, R-008 | done   |
| T-005 | Breadcrumb semántico con `aria-current` y truncado                             | R-007        | done   |
| T-006 | `h-screen` → `min-h-dvh` en secciones full-height                              | R-003        | done   |
| T-007 | Auto `srcSet` en `LazyImage` para `googleusercontent.com`                      | R-004        | done   |
| T-008 | Paleta bandera + tipografía fluida en `index.css`                              | R-010        | done   |
| T-009 | Recalibrar posiciones/drift de `SEMANTIC_FIELDS`                               | R-001        | done   |
| T-010 | Alinear tests (`text-fluid-hero`, `min-h-dvh`, grid, mock hook)                | R-003, R-005 | done   |
| T-011 | Ejecutar `biome check --write` sobre archivos del WIP (9 hallazgos de formato) | —            | done   |

## Notas de cierre

- T-011 resuelta el 2026-10-14: los 9 hallazgos de formato se corrigieron con `biome check --write` antes del commit del WIP.
- Los requisitos R-001..R-010 quedan como regresión perpetua: cualquier cambio
  futuro en estos archivos debe respetarlos o modificar la spec en el mismo commit.
