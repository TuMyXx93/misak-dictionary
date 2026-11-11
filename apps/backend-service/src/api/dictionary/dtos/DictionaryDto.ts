/**
 * Dictionary DTOs
 * Spec 003 — Dictionary API (Public endpoints)
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
 * Path params para obtener palabra por ID
 */
export const WordIdParamSchema = z.object({
  id: z.string().transform((val) => BigInt(val)),
});

export type WordIdParam = z.infer<typeof WordIdParamSchema>;
