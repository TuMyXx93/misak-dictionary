/**
 * Semantic Field Types
 *
 * Minimal types for Phase 1 semantic field buttons on HeroSection.
 * Full model (Field → Subfield → Microfield → Term) comes in Phase 2+.
 *
 * Iteration 1.1: 7 ratified Misak names, nameSpanish obligatory,
 * iconKey expanded to 7 semantically-aligned keys.
 */

export type SemanticFieldIconKey =
  | 'house'
  | 'garden'
  | 'wildlife'
  | 'flora'
  | 'territory'
  | 'cosmos'
  | 'neologism';

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
