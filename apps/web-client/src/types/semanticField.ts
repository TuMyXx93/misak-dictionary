/**
 * Semantic Field Types
 *
 * Phase 1: Minimal types for semantic field buttons on HeroSection.
 * Phase 2+: Extended model (Field → Subfield → Microfield → Term).
 *
 * Iteration 1.1: 7 ratified Misak names, nameSpanish obligatory,
 * iconKey expanded to 7 semantically-aligned keys.
 *
 * Phase 2: Extended with SemanticField (full), Subfield, Microfield, Term.
 * Spec 005: Modelo léxico «Sentido + Formas», ubicaciones multinivel y pares dialógicos.
 */

export type SemanticFieldIconKey =
  | 'house'
  | 'garden'
  | 'wildlife'
  | 'flora'
  | 'territory'
  | 'cosmos'
  | 'neologism';

export type FieldStatus = 'available' | 'coming-soon';

export interface SemanticFieldSummary {
  id: string;
  name: string;
  nameSpanish: string;
  shortDescription: string;
  iconKey: SemanticFieldIconKey;
  position: { x: number; y: number };
  drift: {
    amplitudeX: number;
    amplitudeY: number;
    duration: number;
    delay: number;
  };
}

export interface SemanticField extends SemanticFieldSummary {
  status: FieldStatus;
  longDescription?: string;
  descriptionMisak?: string;
  heroImage?: string;
  terms?: Term[];
  subfields: Subfield[];
}

export interface Subfield {
  id: string;
  name: string;
  nameMisak?: string;
  description: string;
  descriptionMisak?: string;
  terms?: Term[];
  microfields: Microfield[];
}

export interface Microfield {
  id: string;
  /** Nombre visible: namtrik si existe; si no (subniveles), el español */
  name: string;
  nameMisak?: string;
  nameSpanish?: string;
  description: string;
  descriptionMisak?: string;
  terms: Term[];
  /** Subniveles (microcampos hijos), a cualquier profundidad (spec 004) */
  subniveles?: Microfield[];
}

export interface FormaNamtrik {
  id?: string;
  orden: number;
  lema: string;
  acepcionHomonima?: number | null;
  categoriaGramatical?: string | null;
  variante?: string | null;
  esNeologismo: boolean;
  rasgosGramaticales: string[];
  etiquetaOriginal?: string | null;
}

export interface ParDialogico {
  respuestaNamtrik: string | null;
  respuestaNamtrikContexto: string | null;
  respuestaEspanolGlosa: string | null;
  respuestaEspanolExplicacion: string | null;
}

export interface Term {
  id: string;
  codigo?: string;
  tipo?: 'estandar' | 'dialogico';
  misak: string;
  spanish: string;
  partOfSpeech?: string;
  descriptionMisak?: string;
  descriptionSpanish?: string;
  scientificName?: string;
  exampleMisak?: string;
  exampleSpanish?: string;
  audioUrl?: string;
  formas?: FormaNamtrik[];
  dialogo?: ParDialogico | null;
}
