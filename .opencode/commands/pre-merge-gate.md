---
description: Valida si `dev` esta lista para promoverse a `main` sin modificar ramas
agent: devops
subtask: true
---

Pre-Merge Gate para el flujo local de promocion `dev -> main` del proyecto Misak Dictionary.

Contexto del usuario: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta las secciones **Pre-Task Security Gate**, **Documentation Sync Gate** y **Pre-Merge Readiness Gate dev**.
2. Este command ejecuta validaciones de lectura y comandos locales de build/check, pero NO cambia de branch, NO hace merge, NO crea commits y NO hace push.
3. Antes de cualquier otra validacion, ejecuta `/version-gate pre-merge-gate readiness dev`.
4. Si `/version-gate` devuelve `FAIL`, detente.
5. Si `/version-gate` devuelve warnings, reportalos y pide confirmacion explicita antes de continuar.

## Flujo Obligatorio

### Fase 1 - Readiness en `dev`

1. Verifica que la branch actual sea `dev`.
2. Verifica que existan las ramas locales `dev` y `main`.
3. Verifica que el working tree este limpio con `git status --porcelain`.
4. Verifica el estado remoto solo si existe upstream para `dev` y `main`:
   - Si `dev` tracked esta **behind** su remoto, marca **BLOCKER**
   - Si `main` tracked esta **behind** su remoto, marca **BLOCKER**
   - Si no existe upstream, marca **WARNING**
5. Verifica que `main` sea ancestro de `dev`.
6. Si `main` tiene commits no contenidos en `dev`, marca **BLOCKER**.

### Fase 2 - Validaciones locales previas al merge

7. Ejecuta `/docs-gate latest`.
8. Ejecuta las validaciones locales de promocion:
   - `pnpm run ci`
   - `pnpm test:all`
   - `pnpm build:all`
9. Si alguna validacion falla, reporta `FAIL`.

## BLOCKERS

Marca como blocker cualquiera de estos casos:

- `/version-gate` falla
- La branch actual no es `dev`
- No existe `dev` o `main`
- Working tree sucio
- `dev` o `main` tracked estan behind su remoto
- `main` no es ancestro de `dev`
- `/docs-gate latest` falla
- `pnpm run ci` falla
- `pnpm test:all` falla
- `pnpm build:all` falla

## WARNINGS

Reporta como warning, pero permite continuar con confirmacion del usuario:

- `/version-gate` devuelve warnings
- `dev` o `main` no tienen upstream configurado
- `/docs-gate latest` devuelve `WARNING`

## Formato del Reporte

Genera el reporte con este formato exacto:

```md
## Pre-Merge Gate Report

### READINESS CHECKS

- Current branch (`dev`): [PASS / FAIL]
- Branches available (`dev`, `main`): [PASS / FAIL]
- Working tree: [PASS / FAIL]
- Upstream sync `dev`: [PASS / WARNING / FAIL]
- Upstream sync `main`: [PASS / WARNING / FAIL]
- `main` ancestor of `dev`: [PASS / FAIL]

### LOCAL VALIDATIONS

- /version-gate: [PASS / WARNING / FAIL]
- /docs-gate latest: [PASS / WARNING / FAIL / NOT EXECUTED]
- pnpm run ci: [PASS / FAIL / NOT EXECUTED]
- pnpm test:all: [PASS / FAIL / NOT EXECUTED]
- pnpm build:all: [PASS / FAIL / NOT EXECUTED]

### BLOCKERS

- [lista de blockers o "Ninguno"]

### WARNINGS

- [lista de warnings o "Ninguno"]

### STATUS

- Current branch: [branch actual]
- Dev SHA: [sha]
- Main SHA: [sha]
- Working tree: [clean/dirty]

### NEXT STEP

- [Listo para /merge-gate / Listo para /merge-gate con warnings / NO promover a main hasta resolver los issues]

### VERDICT: [PASS / WARNING / FAIL]
```

## Reglas del Veredicto

- `FAIL`: existe al menos un blocker o falla cualquier validacion local
- `WARNING`: no hay blockers, pero si hay warnings
- `PASS`: no hay blockers ni warnings

IMPORTANTE: Este command NO modifica ramas. Solo determina si `dev` esta lista para ejecutar `/merge-gate`.
