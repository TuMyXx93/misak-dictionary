/**
 * Esquema de la taxonomía versionada (data/taxonomy/vN/*.yaml).
 * Valida la forma del archivo antes de cualquier comparación con la base de datos.
 *
 * Los microcampos forman un árbol: cada microcampo puede tener "subniveles", que son
 * microcampos hijos de cualquier profundidad. Cada nivel de profundidad incorpora un
 * segmento al código (C1.S1.M19 → C1.S1.M19.1 → C1.S1.M19.1.2 …).
 */

import { z } from 'zod';

/** Profundidad máxima de subniveles (defensa contra archivos mal formados). */
export const MAX_PROFUNDIDAD_SUBNIVELES = 8;

const texto = z.string().trim().min(1, 'texto vacío');
const codigoCampo = z.string().regex(/^C\d+$/, 'código de campo inválido (ej. C1)');
const codigoSubcampo = z.string().regex(/^C\d+\.S\d+$/, 'código de subcampo inválido (ej. C1.S1)');
const codigoMicrocampo = z
  .string()
  .regex(
    /^C\d+\.S\d+\.M\d+(\.\d+)*$/,
    'código de microcampo inválido (ej. C1.S1.M1 o C1.S1.M19.1)',
  );

export interface MicrocampoArchivo {
  codigo: string;
  namtrik?: string | undefined;
  espanol: string;
  glosa?: string | undefined;
  subniveles: MicrocampoArchivo[];
}

const microcampoSchema: z.ZodType<MicrocampoArchivo> = z.lazy(() =>
  z.object({
    codigo: codigoMicrocampo,
    namtrik: texto.optional(),
    espanol: texto,
    glosa: texto.optional(),
    subniveles: z.array(microcampoSchema).default([]),
  }),
);

const subcampoSchema = z.object({
  codigo: codigoSubcampo,
  namtrik: texto,
  espanol: texto,
  glosa: texto.optional(),
  microcampos: z.array(microcampoSchema).default([]),
});

const campoSchema = z.object({
  codigo: codigoCampo,
  namtrik: texto,
  espanol: texto,
  glosa: texto.optional(),
  subcampos: z.array(subcampoSchema).default([]),
});

export const taxonomiaSchema = z.object({
  version: z.literal(1),
  fuente: z.object({
    documento: texto,
    revisor: texto,
    nota: texto.optional(),
  }),
  campos: z.array(campoSchema).min(1),
});

export const botonesHomeSchema = z.object({
  version: z.literal(1),
  botones: z
    .array(
      z.object({
        clave: z.string().regex(/^[a-z0-9-]+$/, 'clave de botón en minúsculas y guiones'),
        etiqueta: texto,
        campo: codigoCampo.nullable(),
      }),
    )
    .length(7, 'el home tiene exactamente 7 botones'),
});

export type TaxonomiaArchivo = z.infer<typeof taxonomiaSchema>;
export type BotonesHomeArchivo = z.infer<typeof botonesHomeSchema>;
