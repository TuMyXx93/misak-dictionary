/**
 * AdminTaxonomiaDto
 * Spec 012 v0.2.0 — DTOs y esquemas de validación Zod para la gestión taxonómica administrativa:
 * Creación, edición y eliminación jerárquicamente protegida (409 Conflict) de
 * Campos (Nivel 1), Subcampos (Nivel 2), Microcampos (Nivel 3) y Subniveles (Nivel 4+).
 */

import { z } from 'zod';

export const CreateCampoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(20),
  slug: z.string().min(1, 'El slug es requerido').max(50),
  namtrikTermino: z.string().min(1, 'El término en Namtrik es requerido'),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1, 'El término en castellano es requerido'),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().default(0),
});

export const UpdateCampoSchema = z.object({
  namtrikTermino: z.string().min(1).optional(),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1).optional(),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().optional(),
});

export const CreateSubcampoSchema = z.object({
  campoSemanticoId: z.string().regex(/^\d+$/, 'ID de campo semántico inválido'),
  codigo: z.string().min(1, 'El código es requerido').max(30),
  slug: z.string().min(1, 'El slug es requerido').max(60),
  namtrikTermino: z.string().min(1, 'El término en Namtrik es requerido'),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1, 'El término en castellano es requerido'),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().default(0),
});

export const UpdateSubcampoSchema = z.object({
  namtrikTermino: z.string().min(1).optional(),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1).optional(),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().optional(),
});

export const CreateMicrocampoSchema = z.object({
  subcampoSemanticoId: z.string().regex(/^\d+$/, 'ID de subcampo semántico inválido'),
  padreId: z.string().regex(/^\d+$/).optional().nullable(),
  codigo: z.string().min(1, 'El código es requerido').max(40),
  slug: z.string().min(1, 'El slug es requerido').max(80),
  namtrikTermino: z.string().optional().nullable(),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1, 'El término en castellano es requerido'),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().default(0),
});

export const UpdateMicrocampoSchema = z.object({
  namtrikTermino: z.string().optional().nullable(),
  namtrikDescripcion: z.string().optional().nullable(),
  namtrikAudio: z.string().optional().nullable(),
  espanolTermino: z.string().min(1).optional(),
  espanolDescripcion: z.string().optional().nullable(),
  espanolAudio: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  posicion: z.number().int().optional(),
});

export const TaxonomyIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID numérico requerido'),
});

export type CreateCampoDTO = z.infer<typeof CreateCampoSchema>;
export type UpdateCampoDTO = z.infer<typeof UpdateCampoSchema>;
export type CreateSubcampoDTO = z.infer<typeof CreateSubcampoSchema>;
export type UpdateSubcampoDTO = z.infer<typeof UpdateSubcampoSchema>;
export type CreateMicrocampoDTO = z.infer<typeof CreateMicrocampoSchema>;
export type UpdateMicrocampoDTO = z.infer<typeof UpdateMicrocampoSchema>;
