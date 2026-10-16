---
name: sdd-specify
description: >-
  Genera spec.md con requisitos EARS y criterios Gherkin para una feature. Invocar con /sdd-specify (equivalente a /specify en OpenCode).
---

# Skill: /sdd-specify

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/sdd-specify`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `architect`. Aplica las convenciones del agente especialista `architect` (o delégalo con `invoke_subagent` si forma parte de un flujo paralelo).

Genera la especificación (`spec.md`) de la feature **$1** para el proyecto Misak Dictionary.

Sigue el ciclo Spec-Driven Development: `/sdd-specify` (`/specify` en OpenCode) → `spec.md` (EARS + Gherkin). Ninguna línea de código se escribe antes de que la spec esté `approved` (Constitución C4.1).

## Instrucciones

1. Lee `specs/features/` y calcula el siguiente número `NNN` correlativo de 3 dígitos
   (si existe `001-campos-responsivos`, el siguiente es `002`). El slug de la carpeta
   es `NNN-` + kebab-case de **$1** (minúsculas, palabras separadas por guiones,
   sin acentos ni caracteres especiales).
2. Consulta el steering pertinente en `specs/steering/`: `tech-stack.md` (límites por
   app), `conventions.md` (convenciones de código/proceso) y `glossary.md`
   (vocabulario Misak ↔ español). Si la feature toca dominio cultural, usa los
   términos exactos del glosario.
3. Crea `specs/features/NNN-slug/spec.md` con la plantilla de `specs/features/README.md`:

   **Front-matter:**

   ```yaml
   ---
   id: NNN-slug
   version: 0.1.0
   status: draft
   cultural-gate: false # true si toca nombres Misak, copy en español o glosario
   ---
   ```

   **Secciones:**

   - `# <Título de la feature>` — formato `NNN — <título>`.
   - `## Contexto` — por qué existe este trabajo, 3-5 líneas.
   - `## Requisitos (EARS)` — numerados `R-001`, `R-002`, … en formato
     `CUANDO/MIENTRAS <evento>, EL SISTEMA DEBERÁ/NO DEBERÁ <respuesta medible>`.
     Cada requisito debe ser verificable y atómico.
   - `## Criterios de aceptación (Gherkin)` — un bloque `gherkin` por requisito con
     `Dado/Cuando/Entonces` (escenarios verificables, sin ambigüedad).
   - `## Fuera de alcance` — lo que explícitamente NO se hará.
   - `## Trazabilidad` — tabla vacía `| Requisito | Archivos | Tests |` (se rellena
     al implementar).

4. Si `cultural-gate` es `true` (nombres Misak, `name`/`nameSpanish`, copy en español
   o términos del glosario), indícalo al final: la spec requiere `/gate-cultural`
   antes de pasar a `approved` (Constitución C1.1-C1.3).
5. Reporta la ruta creada, el número `NNN` asignado y el valor de `cultural-gate`.
   La spec queda en `draft`; la aprobación es humana.

Contexto adicional del usuario: $ARGUMENTS
