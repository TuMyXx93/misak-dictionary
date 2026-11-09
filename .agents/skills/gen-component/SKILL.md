---
name: gen-component
description: >-
  Genera un componente React completo siguiendo las convenciones del proyecto. Invocar con /gen-component (equivalente a /gen-component en OpenCode).
---

# Skill: /gen-component

> [!NOTE]
> **Ejecución en Antigravity (app y CLI)**: Invocado mediante `/gen-component`.
> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).
> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.
> - **Agente asociado**: `frontend`. Aplica las convenciones del agente especialista `frontend` (o delégalo con `invoke_subagent` si forma parte de un flujo paralelo).

Genera un componente React llamado **$1** siguiendo las convenciones del proyecto Misak Dictionary.

Antes de generar, carga el skill `react-component` para seguir el patron establecido.

Requisitos:

1. Crear el archivo del componente con named export, props interface, JSDoc completo
2. Usar TailwindCSS para estilos y `cn()` para clases condicionales
3. Si es un UI primitive (Button, Input, etc.), usar `forwardRef` + `displayName`
4. Crear el archivo de test colocado (`.test.tsx`) con Arrange/Act/Assert
5. Si esta en un directorio propio, crear barrel export (`index.ts`)
6. Ubicar en el directorio correcto dentro de `apps/web-client/src/`

Contexto adicional del usuario: $ARGUMENTS
