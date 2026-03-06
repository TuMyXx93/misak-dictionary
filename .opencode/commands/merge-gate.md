---
description: Valida y ejecuta de forma segura el merge local dev -> main antes del push remoto
agent: devops
subtask: true
---

Merge Gate para el flujo local `dev -> main` del proyecto Misak Dictionary.

Contexto del usuario: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta las secciones **Pre-Task Security Gate**, **Documentation Sync Gate** y **Merge Gate dev -> main**.
2. Este command puede ejecutar comandos `git`, cambiar de branch y hacer merge local **fast-forward only**.
3. NUNCA hagas `git push`, `git push --force`, `git pull --rebase` ni ningun push automatico.
4. Antes de modificar ramas, ejecuta `/version-gate merge-gate precheck dev -> main`.
5. Si `/version-gate` devuelve `FAIL`, detente.
6. Si `/version-gate` devuelve warnings, reportalos y pide confirmacion explicita antes de continuar.

## Flujo Obligatorio

### Fase 1 - Pre-checks

1. Verifica que existan las ramas locales `dev` y `main`.
2. Verifica que el working tree este limpio con `git status --porcelain`.
3. Verifica el estado remoto solo si existe upstream para `dev` y `main`:
   - Si una branch tracked esta **behind** su remoto, marca **BLOCKER**
   - Si no existe upstream, marca **WARNING**
4. Verifica que `main` sea ancestro de `dev` para permitir `git merge --ff-only dev` desde `main`.
5. Si `main` tiene commits no contenidos en `dev`, marca **BLOCKER** y NO intentes merge manual ni rebase.

### Fase 2 - Merge local `dev -> main`

6. Cambia a `main`.
7. Ejecuta `git merge --ff-only dev`.
8. Si el merge fast-forward falla, detente y reporta `FAIL`.
9. NO intentes `git merge` normal, NO abras resolucion manual de conflictos y NO reescribas historia.

### Fase 3 - Validaciones post-merge en `main`

10. Ejecuta `/version-gate merge-gate post-merge main`.
11. Ejecuta `/docs-gate latest`.
12. Ejecuta las validaciones equivalentes al hook actual de `pre-push`:
    - `pnpm ci`
    - `pnpm build:web`
13. Si alguna validacion falla, reporta `FAIL`.
14. NO hagas rollback automatico de `main`. Solo reporta el estado local y los pasos a seguir.

## BLOCKERS

Marca como blocker cualquiera de estos casos:

- `/version-gate` falla antes del merge
- No existe `dev` o `main`
- Working tree sucio
- `dev` o `main` tracked estan behind su remoto
- `main` no es ancestro de `dev`
- `git merge --ff-only dev` falla
- `/version-gate` falla despues del merge
- `/docs-gate latest` falla
- `pnpm ci` falla
- `pnpm build:web` falla

## WARNINGS

Reporta como warning, pero permite continuar con confirmacion del usuario:

- `/version-gate` devuelve warnings
- `dev` o `main` no tienen upstream configurado
- `/docs-gate latest` devuelve `WARNING`

## Formato del Reporte

Genera el reporte con este formato exacto:

```md
## Merge Gate Report

### PRE-CHECKS

- [lista de resultados o "Ninguno"]

### MERGE RESULT

- Source: dev
- Target: main
- Mode: fast-forward only
- Result: [SUCCESS / NOT EXECUTED / FAIL]

### POST-MERGE VALIDATIONS

- /version-gate: [PASS / WARNING / FAIL / NOT EXECUTED]
- /docs-gate latest: [PASS / WARNING / FAIL / NOT EXECUTED]
- pnpm ci: [PASS / FAIL / NOT EXECUTED]
- pnpm build:web: [PASS / FAIL / NOT EXECUTED]

### BLOCKERS

- [lista de blockers o "Ninguno"]

### WARNINGS

- [lista de warnings o "Ninguno"]

### STATUS

- Current branch: [branch actual]
- Dev SHA: [sha]
- Main SHA: [sha]
- Working tree: [clean/dirty]
- Push: NOT EXECUTED

### NEXT STEP

- [Listo para push manual de main / Listo para push manual de main con warnings / NO hacer push hasta resolver los issues]

### VERDICT: [PASS / WARNING / FAIL]
```

## Reglas del Veredicto

- `FAIL`: existe al menos un blocker o falla cualquier validacion post-merge
- `WARNING`: no hay blockers, pero si hay warnings
- `PASS`: no hay blockers ni warnings

IMPORTANTE: Este command puede cambiar de branch y ejecutar un merge local fast-forward, pero NUNCA hace push. El push se realiza solo despues de validar `main` y siempre de forma manual por la persona usuaria.
