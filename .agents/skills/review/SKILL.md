---
name: review
description: >-
  Ejecuta code review del scope indicado o de los cambios recientes. Invocar con /review (equivalente a /review en OpenCode).
---

# Skill: /review

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/review`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `reviewer`. Puedes ejecutar este flujo directamente o delegarlo al subagente `reviewer` mediante `invoke_subagent` (`TypeName: "reviewer"`, `Model: "inherit"`).

Ejecuta un code review profesional del proyecto Misak Dictionary.

Scope del review: $ARGUMENTS

Si no se especifica scope, analiza los cambios recientes:
Ejecuta el comando:
```sh
git diff --stat HEAD~3
```

## Areas de Analisis

1. **Adherencia a convenciones** — naming, imports, exports, JSDoc, TypeScript strict
2. **Clean Architecture** — Dependency Rule, separation of concerns, ports/adapters
3. **Seguridad** — validacion de inputs, manejo de tokens, SQL injection
4. **Performance** — re-renders, N+1 queries, bundle size, lazy loading
5. **Testing** — cobertura, edge cases, patron AAA
6. **Calidad general** — DRY, SOLID, legibilidad, mantenibilidad

## Formato del Reporte

Estructura el reporte con:

- **Resumen** (1-2 lineas del estado general)
- **Hallazgos Criticos** (deben corregirse)
- **Advertencias** (mejoras recomendadas)
- **Buenas Practicas** (codigo que cumple las convenciones)
- **Recomendaciones** (acciones concretas con referencia a archivo y linea)

IMPORTANTE: Este agente es read-only. NO modifica archivos. Solo analiza y reporta.
