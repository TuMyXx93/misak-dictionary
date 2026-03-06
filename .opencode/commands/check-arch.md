---
description: Valida que la estructura del proyecto respete Clean Architecture
agent: reviewer
subtask: true
---

Ejecuta una validacion completa de la arquitectura del backend del proyecto Misak Dictionary.

Analiza el directorio `apps/backend-service/src/` y verifica:

## 1. Estructura de Directorios

Verifica que existen y contienen los archivos correctos:

- `src/domain/` — entities y ports (interfaces `I*`)
- `src/application/` — use cases y DTOs (Zod schemas)
- `src/infrastructure/` — repositories (Prisma) y servicios (adapters)
- `src/presentation/` — controllers, middleware, route registration
- `src/api/` — route groups con controllers/DTOs dedicados
- `src/shared/` — errors (AppError), config (env), utils

## 2. Dependency Rule

CRITICAL: Verifica que las dependencias fluyen SOLO hacia adentro:

- `domain/` NO importa de `application/`, `infrastructure/`, `presentation/`
- `application/` NO importa de `infrastructure/`, `presentation/`
- `infrastructure/` puede importar de `domain/` y `application/`
- `presentation/` puede importar de `application/` y `domain/`

Busca violaciones con imports relativos y reporta archivo:linea.

## 3. Convenciones

- Interfaces de ports con prefijo `I` (ej: `IUserRepository`)
- Imports con extensiones `.js`
- Return types explicitos en todas las funciones
- Zod schemas para validacion de input
- Constructor injection para DI
- AppError para errores operacionales

## 4. Formato del Reporte

```
## Estado de la Arquitectura: [OK / ADVERTENCIAS / VIOLACIONES]

### Estructura de Directorios
[OK o problemas encontrados]

### Dependency Rule
[Lista de violaciones si existen, con archivo:linea]

### Convenciones
[Cumplimiento de naming, imports, types, etc.]

### Recomendaciones
[Acciones concretas para corregir problemas]
```

IMPORTANTE: Este comando es read-only. NO modifica archivos.
