---
description: Crea una migracion Prisma con nombre descriptivo
agent: backend
---

Crea una migracion Prisma para el backend del proyecto Misak Dictionary.

Nombre de la migracion: **$1**

Antes de ejecutar, carga el skill `prisma-migration` para seguir el patron establecido.

Pasos:

1. Lee el schema actual en `apps/backend-service/prisma/schema.prisma`
2. Pregunta al usuario que cambios necesita en el modelo de datos (si no se especifica)
3. Edita el schema siguiendo las convenciones:
   - Nombres de modelos: PascalCase singular
   - Nombres de campos: camelCase
   - Mapping a DB: snake_case con `@map` y `@@map`
   - UUIDs como IDs primarios
   - Timestamps (`createdAt`, `updatedAt`) en todos los modelos
   - Indices en campos de busqueda frecuente
   - Documentacion con `///` en modelos
4. Ejecuta `pnpm prisma:generate` para regenerar el Prisma Client
5. Ejecuta `pnpm db:push` para aplicar los cambios a la base de datos
6. Si se requieren datos iniciales, sugiere actualizar el seed

Contexto adicional del usuario: $ARGUMENTS
