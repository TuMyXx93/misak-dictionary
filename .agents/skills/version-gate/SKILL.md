---
name: version-gate
description: >-
  Pre-task security gate - valida el estado del repositorio antes de cualquier tarea. Invocar con /version-gate (equivalente a /version-gate en OpenCode).
---

# Skill: /version-gate

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/version-gate`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `devops`. Puedes ejecutar este flujo directamente o delegarlo al subagente `devops` mediante `invoke_subagent` (`TypeName: "devops"`, `Model: "inherit"`).

Pre-task security gate para el proyecto Misak Dictionary. Actua como puerta de seguridad
obligatoria antes de cualquier tarea que modifique el proyecto.

Contexto del usuario: $ARGUMENTS

## Instrucciones

1. Carga el skill `versioning` y consulta la Seccion 7 (Pre-Task Security Gate)
2. Ejecuta el checklist completo sin modificar archivos del proyecto
3. Puedes ejecutar comandos de lectura en git y shell para verificar estado real del repositorio

## Checks a Ejecutar

### BLOCKERS (deben pasar obligatoriamente)

1. **Git Clean State**: Ejecuta `git status --porcelain` — debe estar vacio o solo contener archivos esperados
2. **Versiones Consistentes**: Lee y compara la version en:
   - `package.json` (raiz)
   - `apps/web-client/package.json`
   - `apps/backend-service/package.json`
   - Todas DEBEN tener la misma version

### WARNINGS (se reportan, permiten continuar con confirmacion)

3. **Branch Correcta**: Ejecuta `git branch --show-current` — no deberia ser `main` para features
4. **Tag Actualizado**: Compara `git tag -l --sort=-v:refname | head -1` con la version en `package.json`
5. **Commits Convencionales**: Valida `git log --oneline -10` contra el formato `<type>(<scope>): <description>`
6. **No Archivos Untracked Criticos**: Busca archivos `.ts`, `.tsx`, `.json` sin trackear en `git status --porcelain`
7. **CHANGELOG Sincronizado**: Verifica que `CHANGELOG.md` existe y su version coincide con el ultimo tag

## Formato del Reporte

Genera el reporte con este formato exacto:

```
## Version Gate Report

### BLOCKERS (deben resolverse)
- [lista de blockers encontrados o "Ninguno"]

### WARNINGS (recomendados)
- [lista de warnings encontrados o "Ninguno"]

### STATUS
- Branch: [nombre de la branch actual]
- Version: [version actual en package.json]
- Last tag: [ultimo tag] ([N] commits ahead)
- Working tree: [clean/dirty]

### VERDICT: [PASS / FAIL]
```

## Reglas de Veredicto

- **FAIL**: Si hay al menos un BLOCKER que no pasa. Listar acciones concretas para resolverlo.
- **PASS**: Si no hay BLOCKERS. Los warnings se reportan pero no bloquean.

IMPORTANTE: Este gate puede ejecutar comandos de verificacion (`git status`, `git log`, `git tag`, lecturas de archivos),
pero NO debe modificar archivos, crear commits, hacer merge ni hacer push. Solo analiza y reporta.
