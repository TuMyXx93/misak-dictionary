# ADR-0001: Adoptar Spec-Driven Development (SDD) como flujo de trabajo

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Autores:** sesión arquitectónica (agente architect + revisión humana)

## Contexto

El proyecto contaba con gobernanza de proceso sólida (Conventional Commits, Husky,
gates `version-gate`/`docs-gate`/`merge-gate`, ecosistema OpenCode de 6 agentes,
8 skills y 10 commands, memoria Engram), pero **sin capa de especificación dentro del
repositorio**: el único spec completo existente (plan de 884 líneas con fases
congeladas) vivía fuera del repo (`.kilo/plans/`) y fue eliminado, perdiendo la
trazabilidad intención → implementación.

Consecuencias observadas:

1. Cada sesión LLM reconstruía contexto desde cero (~15k tokens por feature).
2. Decisiones (paleta invertida, `min-h-dvh`, container queries) quedaban implícitas
   en diffs, sin registro auditable.
3. Requisitos (p. ej. tap targets ≥48px, drift amplitudes) vivían solo en planes
   conversacionales y se perdían.

## Decisión

Adoptar **SDD con jerarquía de autoridad**: Constitution (L0) > Steering (L0) >
Specs activas (L2) > código. Artefactos en `specs/`, versionados con el repo:

- `constitution.md` — invariantes no negociables (incluye gate cultural para nombres Misak).
- `steering/` — stack, convenciones y glosario verificados contra el repo.
- `features/NNN-slug/` — `spec.md` (requisitos EARS + aceptación Gherkin),
  `plan.md` (diseño), `tasks.md` (trazabilidad).
- `adr/` — decisiones arquitectónicas (formato Nygard).
- `archive/` — specs cerradas como regresión perpetua.

Integración con el flujo existente: los agentes OpenCode se mapean a fases SDD
(`architect` redacta specs/plan/tasks; `frontend`/`backend` implementan; `tester`
genera tests desde criterios Gherkin; `reviewer` audita; `devops` cierra gates);
los commits `feat`/`fix` referencian spec vía `Refs:`; Engram persiste el resumen
de sesión.

## Consecuencias

**Positivas:**

- Trazabilidad requisito → tarea → código → test.
- Reconstrucción de contexto por sesión pasa de ~15k tokens al slice de la spec.
- Gate cultural formalizado para decisiones sensibles al dominio.
- Onboarding: un recién llegado lee `specs/README.md` y entiende el proyecto.

**Negativas (aceptadas):**

- Overhead de mantener specs vivas (mitigado: la spec se actualiza en el mismo
  commit que el código; `docs-gate` lo verifica).
- Numeración de features y estados que mantener.

**Riesgos y mitigaciones:**

- Spec desactualizada → actualización obligatoria en el mismo commit.
- LLM inventa requisitos → `/gate-cultural` y revisión humana en fase `review`.
- Crecimiento burocrático → templates ligeros; la feature 001 valida el coste real.

## Alternativas consideradas

1. **Solo Conventional Commits + ADRs** (rechazada): cubre decisiones, no requisitos
   ni criterios de aceptación verificables.
2. **Specs externas estilo Kilo/Tessl** (rechazada): el artefacto se pierde al salir
   del repo (ya ocurrió una vez); la versión dentro del repo viaja con el código.
3. **Issues de GitHub como specs** (rechazada): no es versionable con el código ni
   parseable por los agentes locales con contexto mínimo.

## Cumplimiento

- Esta Fase 0 no introduce cambios de código ni de proceso breaking: solo crea
  `specs/`. Los commands `/specify`, `/plan`, `/tasks` y la extensión de commitlint
  (`Refs:`) llegan en Fase 1 de manera independiente.
- Métrica de éxito: commits `feat`/`fix` con `Refs:` ≥ 90% tras 1 sprint.
