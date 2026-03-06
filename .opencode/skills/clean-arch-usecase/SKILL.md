---
name: clean-arch-usecase
description: >
  Patron completo para crear use cases siguiendo Clean Architecture en el backend Fastify.
  Genera entity, port interface, use case, Prisma repository, controller, DTO Zod schema
  y registro de rutas. Usar cuando se necesite implementar una nueva funcionalidad de negocio.
---

# Skill: Clean Architecture Use Case

Patron para generar use cases completos respetando la Dependency Rule y las convenciones
del backend del proyecto Misak Dictionary.

## Archivos a Generar (en orden de dependencia)

1. **Entity** — `src/domain/entities/NombreEntity.ts`
2. **Port Interface** — `src/domain/ports/INombreRepository.ts`
3. **DTO (Zod Schema)** — `src/application/dtos/NombreSchema.ts`
4. **Use Case** — `src/application/use-cases/<dominio>/NombreUseCase.ts`
5. **Repository (Prisma)** — `src/infrastructure/repositories/NombreRepository.ts`
6. **Controller** — `src/presentation/controllers/NombreController.ts`
7. **Routes** — registro en archivo de rutas existente o nuevo

## 1. Entity (Domain Layer)

```ts
/**
 * @module NombreEntity
 * @description Entidad de dominio que representa [descripcion].
 * @sprint Sprint X — Nombre del sprint
 */

// ========== ENTITY ==========

export interface NombreEntity {
  /** Identificador unico */
  id: string;
  /** Campo de ejemplo */
  campo: string;
  /** Fecha de creacion */
  createdAt: Date;
  /** Fecha de actualizacion */
  updatedAt: Date;
}
```

## 2. Port Interface (Domain Layer)

```ts
/**
 * @module INombreRepository
 * @description Puerto (interfaz) del repositorio de Nombre.
 *              Define el contrato que debe implementar la capa de infraestructura.
 * @sprint Sprint X — Nombre del sprint
 */

import type { NombreEntity } from '../entities/NombreEntity.js';

// ========== PORT ==========

export interface INombreRepository {
  /** Busca una entidad por su ID */
  findById(id: string): Promise<NombreEntity | null>;
  /** Crea una nueva entidad */
  create(data: Omit<NombreEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<NombreEntity>;
  /** Actualiza una entidad existente */
  update(id: string, data: Partial<NombreEntity>): Promise<NombreEntity>;
  /** Elimina una entidad */
  delete(id: string): Promise<void>;
}
```

## 3. DTO con Zod (Application Layer)

```ts
/**
 * @module NombreSchema
 * @description Schemas de validacion Zod para la entidad Nombre.
 * @sprint Sprint X — Nombre del sprint
 */

import { z } from 'zod';

// ========== SCHEMAS ==========

export const CreateNombreSchema = z.object({
  campo: z.string().min(1, 'El campo es requerido').max(255),
});

export const UpdateNombreSchema = CreateNombreSchema.partial();

export const NombreParamsSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

// ========== TYPES ==========

export type CreateNombreInput = z.infer<typeof CreateNombreSchema>;
export type UpdateNombreInput = z.infer<typeof UpdateNombreSchema>;
export type NombreParams = z.infer<typeof NombreParamsSchema>;
```

## 4. Use Case (Application Layer)

```ts
/**
 * @module CreateNombreUseCase
 * @description Caso de uso para crear una nueva entidad Nombre.
 * @sprint Sprint X — Nombre del sprint
 */

import type { INombreRepository } from '../../domain/ports/INombreRepository.js';
import type { NombreEntity } from '../../domain/entities/NombreEntity.js';
import type { CreateNombreInput } from '../dtos/NombreSchema.js';

// ========== USE CASE ==========

export class CreateNombreUseCase {
  constructor(private readonly nombreRepository: INombreRepository) {}

  async execute(input: CreateNombreInput): Promise<NombreEntity> {
    // 1. Validar reglas de negocio
    // (agregar validaciones especificas del dominio)

    // 2. Crear la entidad
    const nombre = await this.nombreRepository.create({
      campo: input.campo,
    });

    // 3. Retornar la entidad creada
    return nombre;
  }
}
```

## 5. Repository Prisma (Infrastructure Layer)

```ts
/**
 * @module NombreRepository
 * @description Implementacion Prisma del repositorio de Nombre.
 * @sprint Sprint X — Nombre del sprint
 */

import type { PrismaClient } from '@prisma/client';

import type { INombreRepository } from '../../domain/ports/INombreRepository.js';
import type { NombreEntity } from '../../domain/entities/NombreEntity.js';

// ========== REPOSITORY ==========

export class NombreRepository implements INombreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<NombreEntity | null> {
    const result = await this.prisma.nombre.findUnique({ where: { id } });
    return result;
  }

  async create(data: Omit<NombreEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<NombreEntity> {
    const result = await this.prisma.nombre.create({ data });
    return result;
  }

  async update(id: string, data: Partial<NombreEntity>): Promise<NombreEntity> {
    const result = await this.prisma.nombre.update({ where: { id }, data });
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.nombre.delete({ where: { id } });
  }
}
```

## 6. Controller (Presentation Layer)

```ts
/**
 * @module NombreController
 * @description Controlador HTTP para operaciones CRUD de Nombre.
 * @sprint Sprint X — Nombre del sprint
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

import { CreateNombreSchema, NombreParamsSchema } from '../../application/dtos/NombreSchema.js';
import type { CreateNombreUseCase } from '../../application/use-cases/nombre/CreateNombreUseCase.js';
import { AppError } from '../../shared/errors/AppError.js';

// ========== CONTROLLER ==========

export class NombreController {
  constructor(private readonly createNombreUseCase: CreateNombreUseCase) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // 1. Validar input
      const input = CreateNombreSchema.parse(request.body);

      // 2. Ejecutar use case
      const result = await this.createNombreUseCase.execute(input);

      // 3. Responder con exito
      await reply.status(201).send({
        statusCode: 201,
        message: 'Nombre created successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        await reply.status(error.statusCode).send({
          statusCode: error.statusCode,
          error: 'Error',
          message: error.message,
        });
        return;
      }
      throw error;
    }
  }
}
```

## Dependency Injection (Route File)

```ts
// En el archivo de rutas (ej: src/api/nombre/nombreRoutes.ts)
import { prisma } from '../../infrastructure/database/prismaClient.js';
import { NombreRepository } from '../../infrastructure/repositories/NombreRepository.js';
import { CreateNombreUseCase } from '../../application/use-cases/nombre/CreateNombreUseCase.js';
import { NombreController } from '../../presentation/controllers/NombreController.js';

// 1. Wiring de dependencias
const nombreRepository = new NombreRepository(prisma);
const createNombreUseCase = new CreateNombreUseCase(nombreRepository);
const nombreController = new NombreController(createNombreUseCase);
```

## Checklist

- [ ] Entity con JSDoc y tipos correctos
- [ ] Port interface con prefijo `I` y metodos documentados
- [ ] DTO con Zod schemas + tipos inferidos con `z.infer<>`
- [ ] Use case con constructor injection y return type explicito
- [ ] Repository implementa la interface del port
- [ ] Controller valida con Zod y usa AppError
- [ ] Response shape: `{ statusCode, message, data }`
- [ ] Imports con extensiones `.js`
- [ ] `import type` para type-only imports
- [ ] JSDoc en cada archivo con `@module`, `@description`, `@sprint`
- [ ] Wiring de DI en archivo de rutas
