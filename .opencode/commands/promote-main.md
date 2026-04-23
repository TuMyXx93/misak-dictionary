---
description: Orquesta `dev -> main -> push opcional -> retorno seguro a dev`
agent: devops
subtask: true
---

Promote Main para el flujo completo de promocion `dev -> main -> push -> retorno a dev`
del proyecto Misak Dictionary.

Contexto del usuario: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta las secciones **Pre-Merge Readiness Gate dev**, **Merge Gate dev -> main**, **Push Gate main -> remote** y **Branch Firewall Policy**.
2. Este command puede invocar `/pre-merge-gate`, `/merge-gate` y `/push-gate`.
3. Este command NO hace force push, NO hace rollback automatico y NO reescribe historia.
4. Debes orquestar el flujo completo y respetar la politica de firewall:
   - Si el push falla, permanecer en `main`
   - Si el push sale pero CI remoto falla, permanecer en `main`
   - Si todo sale bien, volver a `dev`
   - Si la persona usuaria decide no hacer push o cancela el push, volver a `dev`

## Flujo Obligatorio

### Fase 1 - Readiness en `dev`

1. Ejecuta `/pre-merge-gate promote-main readiness`.
2. Si `/pre-merge-gate` devuelve `FAIL`, detente.
3. Si `/pre-merge-gate` devuelve `WARNING`, reporta los warnings y pide confirmacion explicita antes de continuar.

### Fase 2 - Merge local `dev -> main`

4. Ejecuta `/merge-gate promote-main dev -> main`.
5. Si `/merge-gate` devuelve `FAIL`, detente y reporta el estado actual de ramas.
6. Si `/merge-gate` devuelve `WARNING`, reporta los warnings y pide confirmacion explicita antes de continuar al push.

### Fase 3 - Decision de push

7. Despues de un merge local exitoso, pregunta explicitamente: `Deseas hacer push de main ahora? [si/no]`
8. Si la respuesta es `no`, ejecuta `git checkout dev` y reporta `Push: NOT EXECUTED`.
9. Si la respuesta es `si`, ejecuta `/push-gate promote-main main -> remote`.
10. El resultado final debe respetar el outcome de `/push-gate`.

## Formato del Reporte

Genera el reporte con este formato exacto:

```md
## Promote Main Report

### FLOW

- /pre-merge-gate: [PASS / WARNING / FAIL]
- /merge-gate: [PASS / WARNING / FAIL / NOT EXECUTED]
- Push decision: [YES / NO]
- /push-gate: [PASS / WARNING / FAIL / NOT EXECUTED]

### BLOCKERS

- [lista de blockers o "Ninguno"]

### WARNINGS

- [lista de warnings o "Ninguno"]

### STATUS

- Current branch: [branch actual]
- Dev SHA: [sha]
- Main SHA: [sha]
- Push: [SUCCESS / CANCELED / FAIL / NOT EXECUTED]
- Remote CI: [PASS / WARNING / FAIL / NOT EXECUTED]

### NEXT STEP

- [Retorno a dev completado / Permanecer en main hasta resolver push o CI remoto / NO continuar hasta resolver blockers]

### VERDICT: [PASS / WARNING / FAIL]
```

## Reglas del Veredicto

- `FAIL`: falla `/pre-merge-gate`, falla `/merge-gate`, falla el push o falla CI remoto
- `WARNING`: no hay blockers fatales, pero existe algun warning aceptado o la observacion remota queda inconclusa
- `PASS`: readiness ok, merge ok y:
  - se decide no hacer push y se vuelve a `dev`, o
  - el push sale bien, CI remoto pasa y se vuelve a `dev`

IMPORTANTE: `/promote-main` es el orquestador del flujo completo. Si la persona usuaria elige no hacer push, el flujo debe volver a `dev`. Si push o CI remoto fallan, el flujo debe quedarse en `main`.
