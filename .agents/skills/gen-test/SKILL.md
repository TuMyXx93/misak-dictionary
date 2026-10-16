---
name: gen-test
description: >-
  Genera tests completos para el archivo indicado con cobertura de happy path y edge cases. Invocar con /gen-test (equivalente a /gen-test en OpenCode).
---

# Skill: /gen-test

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/gen-test`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `tester`. Aplica las convenciones del agente especialista `tester` (o delégalo con `invoke_subagent` si forma parte de un flujo paralelo).

Genera tests completos para el archivo **$1**.

Antes de generar, carga el skill `vitest-testing` para seguir el patron establecido.

Pasos:

1. Lee el archivo fuente indicado para entender su API publica y comportamientos
2. Determina si es frontend (`.tsx`) o backend (`.ts`) para aplicar el framework correcto
3. Genera el archivo de test colocado junto al fuente con sufijo `.test.ts` o `.test.tsx`
4. Cubre: happy path, edge cases, error handling, boundary conditions
5. Usa patron Arrange/Act/Assert en cada test
6. Mockea dependencias externas con `vi.fn()` y `vi.mock()`
7. Ejecuta los tests para verificar que pasan:
   - Frontend: `pnpm --filter web-client exec vitest run $1`
   - Backend: `pnpm --filter @misak/backend-service exec vitest run $1`
8. Reporta el resultado y la cobertura estimada

Thresholds minimos:

- Frontend: 70% en lines/functions/branches/statements
- Backend: 80% en lines/functions/branches/statements
