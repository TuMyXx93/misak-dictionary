---
name: api-endpoint
description: >
  Patron para crear endpoints Fastify 5 completos con controller, Zod schema para validacion,
  middleware de autenticacion, y registro de rutas. Incluye manejo de errores con AppError
  y response shapes estandarizadas. Usar cuando se necesite exponer una nueva ruta HTTP.
---

# Skill: API Endpoint (Fastify 5)

Patron para generar endpoints HTTP completos en Fastify 5 siguiendo las convenciones
del proyecto Misak Dictionary.

## Estructura de un Endpoint Completo

```
src/api/<dominio>/
├── <dominio>Routes.ts      # Registro de rutas y DI wiring
├── <dominio>Controller.ts  # Handlers HTTP
└── <dominio>Schema.ts      # Zod schemas para validacion
```

## 1. Zod Schemas (Validacion)

```ts
/**
 * @module wordSchema
 * @description Schemas de validacion para el endpoint de palabras.
 * @sprint Sprint X — Nombre del sprint
 */

import { z } from 'zod';

// ========== REQUEST SCHEMAS ==========

export const CreateWordBodySchema = z.object({
  term: z.string().min(1, 'El termino es requerido').max(100),
  definition: z.string().min(1, 'La definicion es requerida'),
  language: z.enum(['misak', 'spanish']),
  category: z.string().optional(),
});

export const GetWordParamsSchema = z.object({
  id: z.string().uuid('ID de palabra invalido'),
});

export const ListWordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  language: z.enum(['misak', 'spanish']).optional(),
});

// ========== TYPES ==========

export type CreateWordBody = z.infer<typeof CreateWordBodySchema>;
export type GetWordParams = z.infer<typeof GetWordParamsSchema>;
export type ListWordsQuery = z.infer<typeof ListWordsQuerySchema>;
```

## 2. Controller (Handlers HTTP)

```ts
/**
 * @module WordController
 * @description Controlador HTTP para el recurso de palabras del diccionario.
 * @sprint Sprint X — Nombre del sprint
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import type { CreateWordUseCase } from '../../application/use-cases/word/CreateWordUseCase.js';
import type { ListWordsUseCase } from '../../application/use-cases/word/ListWordsUseCase.js';
import { CreateWordBodySchema, ListWordsQuerySchema } from './wordSchema.js';
import { AppError } from '../../shared/errors/AppError.js';

// ========== CONTROLLER ==========

export class WordController {
  constructor(
    private readonly createWordUseCase: CreateWordUseCase,
    private readonly listWordsUseCase: ListWordsUseCase,
  ) {}

  /** POST /words — Crear una nueva palabra */
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // 1. Validar input
      const body = CreateWordBodySchema.parse(request.body);

      // 2. Ejecutar use case
      const word = await this.createWordUseCase.execute(body);

      // 3. Responder con exito
      await reply.status(201).send({
        statusCode: 201,
        message: 'Word created successfully',
        data: word,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: error.errors.map((e) => e.message).join(', '),
        });
        return;
      }
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

  /** GET /words — Listar palabras con paginacion */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // 1. Validar query params
      const query = ListWordsQuerySchema.parse(request.query);

      // 2. Ejecutar use case
      const result = await this.listWordsUseCase.execute(query);

      // 3. Responder con paginacion
      await reply.status(200).send({
        data: result.items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / query.limit),
        },
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

## 3. Route Registration (con DI Wiring)

```ts
/**
 * @module wordRoutes
 * @description Registro de rutas HTTP para el recurso de palabras.
 * @sprint Sprint X — Nombre del sprint
 */

import type { FastifyInstance } from 'fastify';

import { prisma } from '../../infrastructure/database/prismaClient.js';
import { WordRepository } from '../../infrastructure/repositories/WordRepository.js';
import { CreateWordUseCase } from '../../application/use-cases/word/CreateWordUseCase.js';
import { ListWordsUseCase } from '../../application/use-cases/word/ListWordsUseCase.js';
import { WordController } from './WordController.js';
import { authMiddleware } from '../../presentation/middleware/authMiddleware.js';

// ========== ROUTES ==========

export async function wordRoutes(fastify: FastifyInstance): Promise<void> {
  // 1. Wiring de dependencias
  const wordRepository = new WordRepository(prisma);
  const createWordUseCase = new CreateWordUseCase(wordRepository);
  const listWordsUseCase = new ListWordsUseCase(wordRepository);
  const controller = new WordController(createWordUseCase, listWordsUseCase);

  // 2. Rutas publicas
  fastify.get('/words', controller.list.bind(controller));

  // 3. Rutas protegidas
  fastify.post('/words', {
    preHandler: [authMiddleware],
    handler: controller.create.bind(controller),
  });
}
```

## Response Shapes

```ts
// Exito simple
{ statusCode: 200, message: 'Operation successful', data: { ... } }

// Exito con creacion
{ statusCode: 201, message: 'Resource created successfully', data: { ... } }

// Paginado
{
  data: [...],
  pagination: { page: 1, limit: 20, total: 150, totalPages: 8 }
}

// Error de validacion
{ statusCode: 400, error: 'Validation Error', message: 'El termino es requerido' }

// Error de autenticacion
{ statusCode: 401, error: 'Unauthorized', message: 'Token invalido o expirado' }

// Error de negocio
{ statusCode: 409, error: 'Conflict', message: 'La palabra ya existe' }

// Error interno
{ statusCode: 500, error: 'Internal Server Error', message: 'Error inesperado' }
```

## Checklist

- [ ] Zod schemas para body, params y query
- [ ] Tipos inferidos con `z.infer<>`
- [ ] Controller con manejo de ZodError y AppError
- [ ] Response shapes estandarizadas
- [ ] DI wiring en archivo de rutas
- [ ] `.bind(controller)` en handlers registrados
- [ ] Middleware de auth en rutas protegidas
- [ ] Imports con extensiones `.js`
- [ ] `import type` para type-only imports
- [ ] JSDoc con `@module`, `@description`, `@sprint`
