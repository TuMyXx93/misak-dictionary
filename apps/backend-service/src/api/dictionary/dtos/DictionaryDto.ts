/**
 * Dictionary DTOs
 * Sprint 3 - Dictionary API (Public endpoints)
 * Validación con Zod para búsqueda y respuestas
 */

import { z } from 'zod';

/**
 * Query params para búsqueda de palabras
 */
export const SearchWordsQuerySchema = z.object({
  q: z.string().optional(), // query de búsqueda
  microcampoId: z
    .string()
    .optional()
    .transform((val) => (val ? BigInt(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20;
      return Math.min(parsed, 100); // máximo 100 items por página
    }),
  orderBy: z.enum(['namtrik', 'espanol', 'recent']).optional().default('namtrik'),
});

export type SearchWordsQuery = z.infer<typeof SearchWordsQuerySchema>;

/**
 * Response de búsqueda con paginación
 */
export const PaginatedWordsResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginatedWordsResponse = z.infer<typeof PaginatedWordsResponseSchema>;

/**
 * Path params para obtener palabra por ID
 */
export const WordIdParamSchema = z.object({
  id: z.string().transform((val) => BigInt(val)),
});

export type WordIdParam = z.infer<typeof WordIdParamSchema>;

/**
 * Response de una palabra Modelo 1
 */
export const WordModelo1ResponseSchema = z.object({
  id: z.bigint(),
  namtrikTermino: z.string(),
  espanolTermino: z.string(),
  namtrikDescripcion: z.string().nullable(),
  espanolDescripcion: z.string().nullable(),
  namtrikAudio: z.string().nullable(),
  espanolAudio: z.string().nullable(),
  imagen: z.string().nullable(),
  microcampos: z
    .array(
      z.object({
        microcampo: z.object({
          id: z.bigint(),
          nombre: z.string(),
          subcampoSemantico: z.object({
            id: z.bigint(),
            nombre: z.string(),
            campoSemantico: z.object({
              id: z.bigint(),
              nombre: z.string(),
            }),
          }),
        }),
      }),
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WordModelo1Response = z.infer<typeof WordModelo1ResponseSchema>;

/**
 * Response de una palabra Modelo 2
 */
export const WordModelo2ResponseSchema = z.object({
  id: z.bigint(),
  namtrikTermino: z.string(),
  espanolTermino: z.string(),
  situacion: z.string().nullable(),
  oracionNamtrik: z.string().nullable(),
  oracionEspanol: z.string().nullable(),
  audioOracion: z.string().nullable(),
  imagen: z.string().nullable(),
  microcampos: z
    .array(
      z.object({
        microcampo: z.object({
          id: z.bigint(),
          nombre: z.string(),
          subcampoSemantico: z.object({
            id: z.bigint(),
            nombre: z.string(),
            campoSemantico: z.object({
              id: z.bigint(),
              nombre: z.string(),
            }),
          }),
        }),
      }),
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WordModelo2Response = z.infer<typeof WordModelo2ResponseSchema>;
