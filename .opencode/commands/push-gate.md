---
description: Ejecuta push seguro de `main`, observa GitHub Actions y decide el retorno a `dev`
agent: devops
subtask: true
---

Push Gate para el flujo remoto `main -> origin/main` del proyecto Misak Dictionary.

Contexto del usuario: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta las secciones **Pre-Task Security Gate**, **Push Gate main -> remote**, **GitHub Actions Observation with gh** y **Branch Firewall Policy**.
2. Este command puede ejecutar `git push` normal y comandos `gh` de observacion, pero NUNCA `git push --force`, NUNCA reescribe historia y NUNCA ejecuta acciones destructivas.
3. Antes de cualquier push, ejecuta `/version-gate push-gate pre-push main`.
4. Si `/version-gate` devuelve `FAIL`, detente.
5. Si `/version-gate` devuelve warnings, reportalos y pide confirmacion explicita antes de continuar.
6. Debes pedir confirmacion explicita inmediata antes del `git push`.
7. Si la persona usuaria cancela el push, vuelve a `dev`.
8. Si el push falla o si las GitHub Actions del SHA empujado fallan, permanece en `main`.
9. Si el push sale bien y todas las GitHub Actions del SHA empujado pasan, vuelve a `dev`.

## Flujo Obligatorio

### Fase 1 - Pre-push en `main`

1. Verifica que la branch actual sea `main`.
2. Verifica que el working tree este limpio con `git status --porcelain`.
3. Verifica el upstream de `main`:
   - Si existe upstream y `main` tracked esta **behind** su remoto, marca **BLOCKER**
   - Si no existe upstream, marca **WARNING**
4. Verifica que `gh` este disponible y autenticado para consultar Actions.
5. Si `gh` no esta autenticado o no puede acceder al repo, marca **BLOCKER**.

### Fase 2 - Push seguro

6. Pide confirmacion explicita para hacer push.
7. Si la respuesta es negativa o se cancela el paso, ejecuta `git checkout dev` y reporta `Push: CANCELED`.
8. Si hay upstream configurado, ejecuta push seguro de `main`.
9. Si no hay upstream configurado, puedes ejecutar `git push -u origin main` solo con confirmacion explicita.
10. Si el push falla, detente y permanece en `main`.

### Fase 3 - Observacion de GitHub Actions

11. Identifica el SHA exacto que se empujo.
12. Usa `gh` para listar los workflows/runs disparados para ese SHA en `main`.
13. Observa los runs relevantes hasta que terminen o hasta que no sea posible continuar la observacion.
14. Si cualquier workflow para ese SHA concluye en fallo, marca **FAIL**.
15. Si la observacion queda inconclusa, entra en **WARNING** y permanece en `main`.
16. Si todos los workflows relevantes concluyen en exito, ejecuta `git checkout dev`.

## BLOCKERS

Marca como blocker cualquiera de estos casos:

- `/version-gate` falla
- La branch actual no es `main`
- Working tree sucio
- `main` tracked esta behind su remoto
- `gh` no esta disponible o no esta autenticado
- El push falla

## WARNINGS

Reporta como warning, pero permite continuar con confirmacion del usuario:

- `/version-gate` devuelve warnings
- `main` no tiene upstream configurado
- No fue posible observar todos los workflows del SHA empujado
- No existen workflows remotos detectables para el SHA empujado

## Formato del Reporte

Genera el reporte con este formato exacto:

```md
## Push Gate Report

### PRE-PUSH CHECKS

- Current branch (`main`): [PASS / FAIL]
- Working tree: [PASS / FAIL]
- Upstream sync `main`: [PASS / WARNING / FAIL]
- gh auth/access: [PASS / FAIL]
- /version-gate: [PASS / WARNING / FAIL]

### PUSH RESULT

- Branch: main
- Remote: [origin/main o equivalente]
- Result: [SUCCESS / CANCELED / FAIL / NOT EXECUTED]
- Mode: [tracked push / push -u origin main / NOT EXECUTED]

### GITHUB ACTIONS

- SHA observed: [sha o "N/A"]
- Runs found: [cantidad o "N/A"]
- Observation: [PASS / WARNING / FAIL / NOT EXECUTED]
- Summary:
  - [workflow: conclusion o "Ninguno"]

### BLOCKERS

- [lista de blockers o "Ninguno"]

### WARNINGS

- [lista de warnings o "Ninguno"]

### STATUS

- Current branch: [branch actual]
- Main local SHA: [sha]
- Main remote SHA: [sha o "unknown"]
- Working tree: [clean/dirty]

### NEXT STEP

- [Retorno a dev completado / Permanecer en main hasta resolver push o CI remoto / Permanecer en main hasta completar observacion]

### VERDICT: [PASS / WARNING / FAIL]
```

## Reglas del Veredicto

- `FAIL`: existe al menos un blocker, falla el push o falla cualquier GitHub Action observada para el SHA empujado
- `WARNING`: no hay blockers de pre-push, el push salio, pero la observacion remota quedo inconclusa o parcial
- `PASS`: el push salio bien, todas las GitHub Actions observadas para el SHA empujado pasaron y el retorno a `dev` fue completado

IMPORTANTE: Este command puede hacer push seguro y observar GitHub Actions con `gh`, pero NUNCA hace force push, NUNCA hace rollback automatico y NUNCA reescribe historia.
