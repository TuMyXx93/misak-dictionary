# Features — Plantilla y flujo

Cada feature vive en `specs/features/NNN-slug/` con tres artefactos.
Plantilla mínima: copiar las secciones marcadas y sustituir.

## `spec.md` — requisitos y aceptación

````markdown
---
id: NNN-slug
version: 0.1.0
status: draft # draft → review → approved → in-progress → done → archived
cultural-gate: false # true si toca nombres Misak (requiere /gate-cultural)
---

# <Título de la feature>

## Contexto

<Por qué existe este trabajo. 3-5 líneas.>

## Requisitos (EARS)

- **R-001** — CUANDO <evento>, EL SISTEMA DEBERÁ <respuesta medible>.
- **R-002** — MIENTRAS <condición>, EL SISTEMA NO DEBERÁ <comportamiento prohibido>.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: <nombre>
  Dado <contexto>
  Cuando <evento>
  Entonces <resultado verificable>
```
````

## Fuera de alcance

<Lo que explícitamente NO se hará en esta feature.>

## Trazabilidad

| Requisito | Archivos | Tests      |
| --------- | -------- | ---------- |
| R-001     | src/...  | X.test.tsx |

````

## `plan.md` — diseño técnico

```markdown
## Diseño
<Componentes/módulos afectados, contratos, datos.>
## Cambios por archivo
| Archivo | Cambio | Requisito |
## Contratos de UI/API
<Props, esquemas Zod, respuestas.>
## Decisiones tomadas
<Referencias a ADRs nuevas o existentes.>
## Riesgos y mitigación
````

## `tasks.md` — tareas atómicas

```markdown
| ID    | Tarea                         | Requisito | Estado         |
| ----- | ----------------------------- | --------- | -------------- |
| T-001 | <una sola acción verificable> | R-001     | pending → done |
```

## Reglas del ciclo

1. Spec en `draft` → revisión humana → `approved` (aquí entra `/gate-cultural` si aplica).
2. Ninguna línea de código antes de `approved` (Constitución C4.1).
3. `tasks.md` es la unidad de delegación a agentes: una tarea = una invocación con
   contexto mínimo (spec + task, no el repo).
4. Al terminar: todos los requisitos con `Traza` y tests verdes → `done`.
5. Cierre: mover carpeta a `archive/`, commit `docs(spec): archive NNN-slug`,
   `mem_session_summary`.
