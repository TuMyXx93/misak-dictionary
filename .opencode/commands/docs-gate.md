---
description: Valida si los cambios del changelog deben reflejarse en la documentacion principal
agent: reviewer
subtask: true
---

Documentation Sync Gate para el proyecto Misak Dictionary.

Scope solicitado: **$1**

Argumentos adicionales: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta la seccion **Documentation Sync Gate**.
2. Ejecuta el analisis en modo **read-only**. NUNCA modifiques archivos.
3. Determina el alcance del analisis:
   - Si `$1` es `latest` o esta vacio, inspecciona la ultima release documentada en `CHANGELOG.md`
   - Si `$1` parece una version o tag, analiza esa release especifica
   - Si `$1` parece un rango git, usa ese contexto para identificar los cambios relevantes
4. Revisa siempre estos documentos canonicos:
   - `README.md`
   - `docs/project.md`
   - `docs/CURRENT-STATE.md`
5. Revisa ademas los README por aplicacion solo si el cambio afecta ese dominio:
   - `apps/web-client/README.md`
   - `apps/backend-service/README.md`

## Matriz de Decision

### BLOCKERS

Marca como blocker cualquier cambio del changelog que deba reflejarse en la documentacion principal y no este documentado todavia.

Esto incluye:

- `BREAKING CHANGE`
- Cambios de setup, instalacion o requisitos minimos (`pnpm`, Node, entornos)
- Cambios de comandos globales o flujos de release
- Cambios de tooling visible para contributors (`Biome`, hooks, CI, lint/format)
- Cambios de arquitectura, politicas o convenciones presentadas como fuente de verdad
- Cambios de version publicada mostrada en docs canonicas

### WARNINGS

Reporta como warning cambios que conviene documentar, pero no deberian bloquear una release:

- Metricas de tests, coverage o performance publicadas y desalineadas
- README de una app desactualizado para cambios no criticos
- Documentacion secundaria que conviene sincronizar despues

### NO ACTION

Clasifica como `NO ACTION` las entradas del changelog que deben permanecer solo en `CHANGELOG.md`:

- Fixes internos sin impacto de uso
- Refactors internos
- Ajustes de tests o mocks sin cambio visible para usuarios o contributors

## Formato del Reporte

Genera el reporte con este formato exacto:

```md
## Docs Gate Report

### BLOCKERS

- [lista de blockers o "Ninguno"]

### WARNINGS

- [lista de warnings o "Ninguno"]

### NO ACTION

- [lista de entradas que pueden quedarse solo en el changelog o "Ninguno"]

### FILES TO UPDATE

- [archivo: razon concreta o "Ninguno"]

### STATUS

- Scope: [latest / version / range]
- Release analyzed: [version o rango]
- Canonical docs checked: [lista]

### VERDICT: [PASS / WARNING / FAIL]
```

## Reglas del Veredicto

- `FAIL`: existe al menos un blocker
- `WARNING`: no hay blockers, pero si hay warnings
- `PASS`: no hay blockers ni warnings

IMPORTANTE: Este gate no reemplaza `CHANGELOG.md`; valida si los cambios del changelog tambien deben quedar reflejados en la documentacion principal.
