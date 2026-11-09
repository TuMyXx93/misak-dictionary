---
description: Genera el plan técnico (plan.md) a partir de una spec aprobada
agent: architect
---

Genera el plan técnico (`plan.md`) de la feature **$1** (formato `NNN-slug`) para el proyecto Misak Dictionary.

Sigue el ciclo Spec-Driven Development: `/plan` → `plan.md` + ADRs, después de que la spec esté `approved`.

## Instrucciones

1. Lee `specs/features/$1/spec.md`.
2. **Verifica el estado**: si `status` no es `approved`, avisa y DETENTE — no se
   planifica sobre una spec no aprobada (Constitución C4.1). Si el estado es
   `approved`, continúa.
3. Lee el steering pertinente en `specs/steering/` y las convenciones de `AGENTS.md`
   (Clean Architecture en backend, convenciones React en frontend, named exports,
   testing con Vitest).
4. Genera o actualiza `specs/features/$1/plan.md` con estas secciones:

   - `## Diseño` — componentes/módulos afectados, contratos y datos.
   - `## Cambios por archivo` — tabla `| Archivo | Cambio | Requisito |`: cada fila
     referencia un `R-NNN` de la spec (trazabilidad, Constitución C4.2).
   - `## Contratos de UI/API` — props de componentes, esquemas Zod, shapes de
     respuesta.
   - `## Decisiones tomadas` — referencia ADRs existentes en `specs/adr/`
     (numeración `NNNN-slug`) o indica crear uno nuevo con la siguiente numeración
     disponible (formato Nygard: contexto, decisión, consecuencias).
   - `## Riesgos y mitigación` — qué puede salir mal y cómo se mitiga.

5. El plan NO contiene código de implementación, solo diseño y contratos.
6. Reporta la ruta escrita y las decisiones referenciadas. El plan queda listo para
   `/tasks` y para revisión del `reviewer`.

$ARGUMENTS
