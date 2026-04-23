/**
 * Semantic Field Types
 *
 * Minimal types for Phase 1 semantic field buttons on HeroSection.
 * Full model (Field → Subfield → Microfield → Term) comes in Phase 2+.
 */

export type SemanticFieldIconKey = 'territory' | 'home' | 'fire' | 'weave' | 'voice';

export interface SemanticFieldSummary {
  id: string;
  name: string;
  nameMisak?: string;
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
