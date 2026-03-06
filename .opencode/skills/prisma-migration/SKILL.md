---
name: prisma-migration
description: >
  Patron para crear migraciones Prisma 7 con schema changes, seed data y validacion.
  Incluye workflow completo desde editar el schema hasta generar y aplicar la migracion.
  Usar cuando se necesite modificar el modelo de datos de PostgreSQL.
---

# Skill: Prisma Migration

Patron para gestionar cambios en el modelo de datos del proyecto Misak Dictionary
usando Prisma 7 con PostgreSQL.

## Workflow Completo

```
1. Editar prisma/schema.prisma
2. Generar migracion: pnpm prisma:generate
3. Aplicar a la base de datos: pnpm db:push
4. (Opcional) Crear seed data
5. Verificar la migracion
```

## 1. Editar el Schema

Ubicacion: `apps/backend-service/prisma/schema.prisma`

### Modelo de Ejemplo

```prisma
/// Palabra del diccionario Misak
model Word {
  id          String   @id @default(uuid())
  term        String   @db.VarChar(100)
  definition  String   @db.Text
  language    Language
  phonetic    String?  @db.VarChar(200)
  category    String?  @db.VarChar(50)
  examples    Json?
  audioUrl    String?  @db.VarChar(500)
  imageUrl    String?  @db.VarChar(500)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relaciones
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String   @map("author_id")

  @@map("words")
  @@index([term])
  @@index([language])
  @@index([category])
}

/// Idiomas soportados por el diccionario
enum Language {
  MISAK
  SPANISH
}
```

### Convenciones del Schema

- **Nombres de modelos**: PascalCase singular (`Word`, `User`, `Category`)
- **Nombres de campos**: camelCase (`createdAt`, `audioUrl`)
- **Mapping a DB**: snake_case con `@map` y `@@map` (`created_at`, `words`)
- **IDs**: UUID con `@default(uuid())`
- **Timestamps**: `createdAt` con `@default(now())`, `updatedAt` con `@updatedAt`
- **Soft delete**: `deletedAt DateTime?`
- **Indices**: en campos de busqueda frecuente
- **Documentacion**: `///` comments en modelos y campos criticos

## 2. Relaciones

### One-to-Many

```prisma
model User {
  id    String @id @default(uuid())
  words Word[]
  @@map("users")
}

model Word {
  id       String @id @default(uuid())
  author   User   @relation(fields: [authorId], references: [id])
  authorId String @map("author_id")
  @@map("words")
}
```

### Many-to-Many

```prisma
model Word {
  id         String     @id @default(uuid())
  categories Category[] @relation("WordCategories")
  @@map("words")
}

model Category {
  id    String @id @default(uuid())
  words Word[] @relation("WordCategories")
  @@map("categories")
}
```

## 3. Comandos

```sh
# Generar Prisma Client despues de cambios al schema
pnpm prisma:generate

# Aplicar cambios a la base de datos (desarrollo)
pnpm db:push

# Crear migracion con nombre descriptivo (produccion)
pnpm --filter @misak/backend-service exec prisma migrate dev --name nombre-descriptivo

# Ver el estado de las migraciones
pnpm --filter @misak/backend-service exec prisma migrate status

# Reset completo de la base de datos (CUIDADO)
pnpm --filter @misak/backend-service exec prisma migrate reset
```

## 4. Seed Data (Opcional)

Ubicacion: `apps/backend-service/prisma/seed.ts`

```ts
/**
 * @module seed
 * @description Datos iniciales para la base de datos del diccionario Misak.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Crear categorias
  await prisma.category.createMany({
    data: [
      { name: 'Saludos', description: 'Expresiones de saludo' },
      { name: 'Naturaleza', description: 'Palabras relacionadas con la naturaleza' },
      { name: 'Familia', description: 'Terminos familiares' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Checklist

- [ ] Schema con convenciones de naming (camelCase campos, snake_case DB)
- [ ] UUIDs como IDs primarios
- [ ] Timestamps (`createdAt`, `updatedAt`) en todos los modelos
- [ ] `@@map` para nombres de tabla en snake_case
- [ ] `@map` para nombres de columna en snake_case
- [ ] Indices en campos de busqueda frecuente
- [ ] Documentacion con `///` en modelos
- [ ] `pnpm prisma:generate` ejecutado despues de cambios
- [ ] `pnpm db:push` para aplicar a la base de datos
- [ ] Seed data si se requieren datos iniciales
