---
name: sdd-tasks
description: >-
  Descompone el plan en tareas atómicas trazables (tasks.md). Invocar con /sdd-tasks (equivalente a /tasks en OpenCode).
---

# Skill: /sdd-tasks

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/sdd-tasks`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `architect`. Aplica las convenciones del agente especialista `architect` (o delégalo con `invoke_subagent` si forma parte de un flujo paralelo).

Descompone en tareas atómicas (`tasks.md`) la feature **$1** (formato `NNN-slug`) del proyecto Misak Dictionary.

Sigue el ciclo Spec-Driven Development: `/sdd-tasks` (`/tasks` en OpenCode) → `tasks.md` atómicas (T-001…), a partir de `spec.md` y `plan.md`.

## Instrucciones

1. Lee `specs/features/$1/spec.md` y `specs/features/$1/plan.md`. Si falta alguno,
   avisa y detente: `/sdd-specify` (`/specify` en OpenCode) y `/sdd-plan` (`/plan` en OpenCode) van antes en el ciclo.
2. Genera o actualiza `specs/features/$1/tasks.md` con front-matter (`id`, `version`,
   `status`) y una tabla con estas columnas:

   | ID    | Tarea                         | Requisito | Estado         |
   | ----- | ----------------------------- | --------- | -------------- |
   | T-001 | <una sola acción verificable> | R-001     | pending → done |
   - `ID`: correlativo `T-001`, `T-002`, …
   - `Tarea`: una sola acción verificable, sin ambigüedad, acorde a la convención
     del proyecto (Clean Architecture, patrones React, Vitest).
   - `Requisito`: el `R-NNN` de la spec que cubre (trazabilidad, Constitución C4.2).
   - `Estado`: `pending` al generar; `done` solo cuando la tarea está completa.

3. **Recordatorio de granularidad**: una tarea = una invocación de agente con
   contexto mínimo (la task + el requisito, no el repo entero). Si una tarea
   necesita más de un agente o mezcla dominios, divídela.
4. Ordena las tareas por dependencia (dominio → aplicación → infraestructura →
   presentación en backend; primitivas → composición en frontend; tests junto a su
   requisito, C2.3 TDD desde Gherkin).
5. Reporta la ruta escrita y el número total de tareas generadas.

$ARGUMENTS
