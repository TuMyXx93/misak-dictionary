/**
 * Admin Dictionary DTOs
 * Sprint 4 - Admin API
 * Validación con Zod para CRUD de diccionario
 */

import { z } from 'zod';

/**
 * DTO para crear palabra Modelo 1
 */
export const CreateWordModel1DTOSchema = z.object({
  namtrikTermino: z.string().min(1).max(255),
  espanolTermino: z.string().min(1).max(255),
  namtrikDescripcion: z.string().min(1),
  espanolDescripcion: z.string().min(1),
  namtrikAudio: z.string().url().optional(),
  espanolAudio: z.string().url().optional(),
  imagen: z.string().url().optional(),
  microcamposIds: z.array(z.string().transform((val) => BigInt(val))).optional(),
});

export type CreateWordModel1DTO = z.infer<typeof CreateWordModel1DTOSchema>;

/**
 * DTO para crear palabra Modelo 2
 */
export const CreateWordModel2DTOSchema = z.object({
  namtrikTerminoPregunta: z.string().min(1).max(255),
  espanolTraduccionPregunta: z.string().min(1),
  namtrikTerminoRespuesta: z.string().min(1).max(255),
  espanolTraduccionRespuesta: z.string().min(1),
  namtrikContextoPregunta: z.string().optional(),
  namtrikContextoRespuesta: z.string().optional(),
  namtrikAudioPregunta: z.string().url().optional(),
  espanolAudioPregunta: z.string().url().optional(),
  namtrikAudioRespuesta: z.string().url().optional(),
  espanolAudioRespuesta: z.string().url().optional(),
  imagenPregunta: z.string().url().optional(),
  imagenRespuesta: z.string().url().optional(),
  microcamposIds: z.array(z.string().transform((val) => BigInt(val))).optional(),
});

export type CreateWordModel2DTO = z.infer<typeof CreateWordModel2DTOSchema>;

/**
 * DTO para actualizar palabra Modelo 1
 */
export const UpdateWordModel1DTOSchema = CreateWordModel1DTOSchema.partial();

export type UpdateWordModel1DTO = z.infer<typeof UpdateWordModel1DTOSchema>;

/**
 * DTO para actualizar palabra Modelo 2
 */
export const UpdateWordModel2DTOSchema = CreateWordModel2DTOSchema.partial();

export type UpdateWordModel2DTO = z.infer<typeof UpdateWordModel2DTOSchema>;

/**
 * DTO para crear Campo Semántico
 */
export const CreateCampoSemanticoDTO = z.object({
  namtrikTermino: z.string().min(1).max(255),
  espanolTermino: z.string().min(1).max(255),
  namtrikDescripcion: z.string().min(1),
  espanolDescripcion: z.string().min(1),
  namtrikAudio: z.string().url().optional(),
  espanolAudio: z.string().url().optional(),
  imagen: z.string().url().optional(),
});

export type CreateCampoSemanticoDTO = z.infer<typeof CreateCampoSemanticoDTO>;

/**
 * DTO para actualizar Campo Semántico
 */
export const UpdateCampoSemanticoDTO = CreateCampoSemanticoDTO.partial();

export type UpdateCampoSemanticoDTO = z.infer<typeof UpdateCampoSemanticoDTO>;

/**
 * DTO para crear Subcampo Semántico
 */
export const CreateSubcampoSemanticoDTO = z.object({
  campoSemanticoId: z.string().transform((val) => BigInt(val)),
  namtrikTermino: z.string().min(1).max(255),
  espanolTermino: z.string().min(1).max(255),
  namtrikDescripcion: z.string().min(1),
  espanolDescripcion: z.string().min(1),
  namtrikAudio: z.string().url().optional(),
  espanolAudio: z.string().url().optional(),
  imagen: z.string().url().optional(),
});

export type CreateSubcampoSemanticoDTO = z.infer<typeof CreateSubcampoSemanticoDTO>;

/**
 * DTO para actualizar Subcampo Semántico
 */
export const UpdateSubcampoSemanticoDTO = CreateSubcampoSemanticoDTO.partial();

export type UpdateSubcampoSemanticoDTO = z.infer<typeof UpdateSubcampoSemanticoDTO>;

/**
 * DTO para crear Microcampo
 */
export const CreateMicrocampoDTO = z.object({
  subcampoSemanticoId: z.string().transform((val) => BigInt(val)),
  namtrikTermino: z.string().min(1).max(255),
  espanolTermino: z.string().min(1).max(255),
  namtrikDescripcion: z.string().min(1),
  espanolDescripcion: z.string().min(1),
  namtrikAudio: z.string().url().optional(),
  espanolAudio: z.string().url().optional(),
  imagen: z.string().url().optional(),
});

export type CreateMicrocampoDTO = z.infer<typeof CreateMicrocampoDTO>;

/**
 * DTO para actualizar Microcampo
 */
export const UpdateMicrocampoDTO = CreateMicrocampoDTO.partial();

export type UpdateMicrocampoDTO = z.infer<typeof UpdateMicrocampoDTO>;
