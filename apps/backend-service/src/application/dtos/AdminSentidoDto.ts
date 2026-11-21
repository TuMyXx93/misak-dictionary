/**
 * Admin Sentido DTOs
 * Spec 006 - Panel Administrativo y Gobierno Editorial
 * Validación Zod para listado, creación, edición y ratificación de sentidos léxicos.
 */

import { z } from 'zod';

const UbicacionSentidoSchema = z.object({
  nivel: z.enum(['campo', 'subcampo', 'microcampo']),
  id: z.string().min(1),
});

const FormaNamtrikInputSchema = z.object({
  id: z.string().optional(),
  orden: z.number().int().positive().optional(),
  lema: z.string().min(1).max(255),
  acepcionHomonima: z.number().int().positive().nullable().optional(),
  categoriaGramatical: z.string().max(100).nullable().optional(),
  variante: z.string().max(100).nullable().optional(),
  esNeologismo: z.boolean().optional().default(false),
  rasgosGramaticales: z.array(z.string()).optional().default([]),
  etiquetaOriginal: z.string().max(255).nullable().optional(),
});

export const CreateSentidoSchema = z.object({
  ubicacion: UbicacionSentidoSchema,
  tipo: z.enum(['estandar', 'dialogico']).optional().default('estandar'),
  formas: z.array(FormaNamtrikInputSchema).min(1, 'Debe incluir al menos una forma léxica'),
  espanolGlosa: z.string().min(1, 'La glosa en español es obligatoria'),
  espanolExplicacion: z.string().nullable().optional(),
  namtrikContexto: z.string().nullable().optional(),
  nombreCientifico: z.string().nullable().optional(),
  observacionEditorial: z.string().nullable().optional(),
  respuestaNamtrik: z.string().nullable().optional(),
  respuestaNamtrikContexto: z.string().nullable().optional(),
  respuestaEspanolGlosa: z.string().nullable().optional(),
  respuestaEspanolExplicacion: z.string().nullable().optional(),
});

export type CreateSentidoDTO = z.infer<typeof CreateSentidoSchema>;

export const UpdateSentidoSchema = z.object({
  version: z.number().int().positive('La versión es obligatoria para control de concurrencia'),
  tipo: z.enum(['estandar', 'dialogico']).optional(),
  formas: z.array(FormaNamtrikInputSchema).min(1).optional(),
  espanolGlosa: z.string().min(1).optional(),
  espanolExplicacion: z.string().nullable().optional(),
  namtrikContexto: z.string().nullable().optional(),
  nombreCientifico: z.string().nullable().optional(),
  observacionEditorial: z.string().nullable().optional(),
  respuestaNamtrik: z.string().nullable().optional(),
  respuestaNamtrikContexto: z.string().nullable().optional(),
  respuestaEspanolGlosa: z.string().nullable().optional(),
  respuestaEspanolExplicacion: z.string().nullable().optional(),
});

export type UpdateSentidoDTO = z.infer<typeof UpdateSentidoSchema>;

export const ListSentidosAdminQuerySchema = z.object({
  nodo: z.string().optional(),
  estado: z.enum(['borrador', 'ratificado']).optional(),
  tipo: z.enum(['estandar', 'dialogico']).optional(),
  q: z.string().optional(),
  categoriaGramatical: z.string().optional(),
  conNombreCientifico: z.enum(['true', 'false', 'todos']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSentidosAdminQuery = z.infer<typeof ListSentidosAdminQuerySchema>;

export const RatificarSentidoSchema = z.object({
  version: z.number().int().positive(),
});

export type RatificarSentidoDTO = z.infer<typeof RatificarSentidoSchema>;

export const RevertirRatificacionSchema = z.object({
  version: z.number().int().positive(),
  motivo: z.string().min(10, 'El motivo de reversión debe tener al menos 10 caracteres'),
});

export type RevertirRatificacionDTO = z.infer<typeof RevertirRatificacionSchema>;

const ChecklistRatificacionSchema = z.object({
  ortografia: z.literal(true, {
    message: 'Debe verificar la ortografía y el uso de ɵ',
  }),
  categorias: z.literal(true, {
    message: 'Debe verificar las categorías gramaticales',
  }),
  glosas: z.literal(true, {
    message: 'Debe verificar las glosas en español',
  }),
  cientificos: z.literal(true, {
    message: 'Debe verificar los nombres científicos',
  }),
});

export const RatificarLoteSchema = z.object({
  checklist: ChecklistRatificacionSchema,
  snapshot: z
    .array(
      z.object({
        id: z.string(),
        version: z.number().int().positive(),
      }),
    )
    .min(1, 'El lote debe contener al menos un sentido para ratificar'),
});

export type RatificarLoteDTO = z.infer<typeof RatificarLoteSchema>;
