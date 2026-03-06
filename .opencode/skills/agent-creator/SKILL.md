---
name: agent-creator
description: >
  Meta-skill que ensenya al agente architect a crear nuevos agentes, skills y commands
  siguiendo las convenciones de OpenCode y del proyecto. Incluye templates, validaciones
  y mejores practicas para extender el sistema de herramientas sobre la marcha.
---

# Skill: Agent Creator

Meta-skill para el agente `architect`. Proporciona las instrucciones detalladas para
crear nuevas herramientas del ecosistema de agentes del proyecto Misak Dictionary.

## Crear un Nuevo Agente

### Ubicacion

`.opencode/agents/<nombre>.md`

### Template

```markdown
---
description: >
  [Descripcion clara de 1-3 lineas: que hace, cuando usarlo]
mode: subagent
temperature: [0.1-0.3 para tareas precisas, 0.3-0.5 para tareas creativas]
tools:
  write: [true/false]
  edit: [true/false]
  bash: [true/false]
  read: true
  glob: true
  grep: true
  skill: [true/false]
---

# [Nombre] — [Titulo Descriptivo]

Eres el agente **[nombre]**, especializado en [dominio].

## Tu Rol

[Descripcion del rol y responsabilidad]

## Convenciones (de AGENTS.md)

[Convenciones relevantes para este agente]

## Skills Disponibles

[Skills que puede cargar]

## Flujo de Trabajo

1. [Paso 1]
2. [Paso 2]
   ...
```

### Reglas para Agentes

- `description` es **obligatorio** y debe ser claro sobre cuando usar el agente
- `mode` debe ser `subagent` para agentes especializados
- `temperature` entre 0.1-0.3 para tareas de codigo, 0.5-0.7 para tareas creativas
- NO especificar `model` — los agentes son model-agnostic
- Los agentes read-only deben tener `write: false`, `edit: false`, `bash: false`
- Siempre referenciar las convenciones de AGENTS.md
- El prompt del agente debe ser autocontenido pero puede referenciar skills

## Crear un Nuevo Skill

### Ubicacion

`.opencode/skills/<nombre>/SKILL.md`

### Validacion del Nombre

- 1-64 caracteres
- Solo lowercase alfanumerico con guiones simples
- No empieza ni termina con `-`
- Sin guiones consecutivos `--`
- El nombre del directorio DEBE coincidir con `name` en frontmatter
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

### Template

```markdown
---
name: nombre-del-skill
description: >
  [Descripcion de 1-1024 caracteres. Debe ser lo suficientemente especifica
  para que el agente sepa cuando usar este skill]
---

# Skill: [Titulo]

[Descripcion del patron que ensenya este skill]

## [Seccion 1: Estructura/Template]

[Codigo de ejemplo con las convenciones del proyecto]

## [Seccion 2: Variantes]

[Variaciones del patron para diferentes casos]

## [Seccion N: Checklist]

- [ ] [Verificacion 1]
- [ ] [Verificacion 2]
```

### Reglas para Skills

- `name` y `description` son **obligatorios** en frontmatter
- `name` debe coincidir con el directorio padre
- El contenido debe incluir templates de codigo completos
- Los templates deben respetar TODAS las convenciones de AGENTS.md
- Incluir un Checklist al final para verificacion
- Los skills son **instrucciones**, no codigo ejecutable

## Crear un Nuevo Command

### Ubicacion

`.opencode/commands/<nombre>.md`

### Template

```markdown
---
description: [Descripcion corta del comando]
---

[Prompt template con $1, $2, $ARGUMENTS para argumentos]

[Instrucciones detalladas para el agente que ejecutara el comando]
```

### Variables Disponibles

- `$ARGUMENTS` — Todos los argumentos como string
- `$1`, `$2`, `$3`... — Argumentos posicionales
- `` !`comando` `` — Inyectar salida de comando bash
- `@ruta/archivo` — Incluir contenido de archivo

### Reglas para Commands

- `description` es **obligatorio**
- Si el command requiere un agente especifico, agregar `agent: nombre-agente`
- Si el command debe ejecutarse como subtarea, agregar `subtask: true`
- NO especificar `model` — hereda el modelo activo

## Despues de Crear una Herramienta

1. **Verificar** que el archivo tiene el formato correcto
2. **Probar** invocando la herramienta manualmente
3. **Sugerir** actualizar AGENTS.md si la nueva herramienta debe estar listada
4. **Documentar** el proposito y uso en el propio archivo

## Directrices de Calidad

- Cada herramienta debe resolver **un problema especifico**
- Evitar duplicacion de funcionalidad entre herramientas
- Las instrucciones deben ser **autocontenidas** (no depender de contexto externo)
- Los templates de codigo deben compilar y pasar lint sin errores
- Preferir herramientas composables sobre herramientas monoliticas
