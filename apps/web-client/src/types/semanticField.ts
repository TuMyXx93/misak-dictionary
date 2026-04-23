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
  heroImage?: string;
  subfields: Subfield[];
}

export interface Subfield {
  id: string;
  name: string;
  nameMisak?: string;
  description: string;
  microfields: Microfield[];
}

export interface Microfield {
  id: string;
  name: string;
  nameMisak?: string;
  description: string;
  terms: Term[];
}

export interface Term {
  id: string;
  misak: string;
  spanish: string;
  partOfSpeech?: string;
  exampleMisak?: string;
  exampleSpanish?: string;
  audioUrl?: string;
}
