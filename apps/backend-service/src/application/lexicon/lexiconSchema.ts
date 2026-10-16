/**
 * Esquema Zod para el archivo de léxico versionado (data/lexicon/vN/lexico.yaml).
 * Valida la estructura completa (descripciones de nodos, sentidos, formas namtrik,
 * bloques dialógicos y ubicaciones taxonómicas) antes de comparar o persistir en BD.
 */

import { z } from 'zod';

const texto = z.string().trim().min(1, 'texto vacío');

/** Código de cualquier nodo taxonómico (C1, C1.S1, C1.S1.M1, C1.S1.M19.1) */
export const codigoNodoTaxonomicoSchema = z
  .string()
  .regex(
    /^C\d+(\.S\d+(\.M\d+(\.\d+)*)?)?$/,
    'código de nodo taxonómico inválido (ej. C1, C1.S5, C1.S1.M1 o C1.S1.M19.1)',
  );

/** Código estable de un sentido léxico (ej. C3.E001, C1.S1.M19.1.E001, C1.S1.M21.D001) */
export const codigoSentidoSchema = z
  .string()
  .regex(
    /^C\d+(\.S\d+(\.M\d+(\.\d+)*)?)?\.[ED]\d{3,4}$/,
    'código de sentido inválido (ej. C1.S1.M1.E001 o C1.S1.M21.D001)',
  );

export const formaNamtrikSchema = z.object({
  orden: z.number().int().min(1),
  lema: texto,
  acepcionHomonima: z.number().int().min(1).optional(),
  categoriaGramatical: texto.optional(),
  variante: texto.optional(),
  esNeologismo: z.boolean().default(false),
  rasgosGramaticales: z.array(texto).default([]),
  etiquetaOriginal: texto.optional(),
});

export const dialogoSaludoSchema = z.object({
  respuestaNamtrik: texto,
  respuestaNamtrikContexto: texto.optional(),
  respuestaEspanolGlosa: texto,
  respuestaEspanolExplicacion: texto.optional(),
});

export const sentidoLexicoSchema = z
  .object({
    codigo: codigoSentidoSchema,
    nodoCodigo: codigoNodoTaxonomicoSchema,
    posicion: z.number().int().min(1),
    tipo: z.enum(['estandar', 'dialogico']).default('estandar'),
    formas: z.array(formaNamtrikSchema).min(1, 'todo sentido requiere al menos una forma namtrik'),
    namtrikContexto: texto.optional(),
    espanolGlosa: texto,
    espanolExplicacion: texto.optional(),
    nombreCientifico: texto.optional(),
    dialogo: dialogoSaludoSchema.optional(),
    observacionEditorial: texto.optional(),
  })
  .refine((s) => (s.tipo === 'dialogico' ? s.dialogo !== undefined : true), {
    message: 'un sentido de tipo "dialogico" debe incluir el bloque "dialogo"',
    path: ['dialogo'],
  });

export const descripcionNodoSchema = z
  .object({
    nodoCodigo: codigoNodoTaxonomicoSchema,
    namtrikDescripcion: texto.optional(),
    espanolDescripcion: texto.optional(),
  })
  .refine(
    (d) => d.namtrikDescripcion !== undefined || d.espanolDescripcion !== undefined,
    'la descripción de nodo debe tener al menos namtrikDescripcion o espanolDescripcion',
  );

export const lexicoSchema = z.object({
  version: z.literal(1),
  fuente: z.object({
    documento: texto,
    revisor: texto,
    duplicadosColapsados: z.number().int().min(0).default(0),
    nota: texto.optional(),
  }),
  descripcionesNodos: z.array(descripcionNodoSchema).default([]),
  sentidos: z.array(sentidoLexicoSchema).min(1),
});

export type FormaNamtrikArchivo = z.infer<typeof formaNamtrikSchema>;
export type DialogoSaludoArchivo = z.infer<typeof dialogoSaludoSchema>;
export type SentidoLexicoArchivo = z.infer<typeof sentidoLexicoSchema>;
export type DescripcionNodoArchivo = z.infer<typeof descripcionNodoSchema>;
export type LexicoArchivo = z.infer<typeof lexicoSchema>;
