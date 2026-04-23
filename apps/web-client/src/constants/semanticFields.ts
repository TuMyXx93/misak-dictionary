/**
 * Semantic Fields Constants
 *
 * Contains the 5 semantic field placeholders for Phase 1.
 * COPY IS PROVISIONAL — must be validated with the Misak community before Phase 2.
 * Nomenclatura, iconografía y tono definitivo requieren workshop con hablantes.
 */

import type { SemanticFieldSummary } from '@/types/semanticField';

export const SEMANTIC_FIELDS: SemanticFieldSummary[] = [
  {
    id: 'ya',
    name: 'Ya',
    shortDescription: 'La casa',
    iconKey: 'home',
    position: { x: 18, y: 68 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  },
  {
    id: 'wallikato',
    name: 'Wallikatɵ',
    shortDescription: 'Sala',
    iconKey: 'home',
    position: { x: 42, y: 75 },
    drift: { amplitudeX: 8, amplitudeY: 6, duration: 9, delay: 0.8 },
  },
  {
    id: 'yaketa',
    name: 'Yaketa',
    shortDescription: 'Corredor de la casa',
    iconKey: 'home',
    position: { x: 68, y: 64 },
    drift: { amplitudeX: 5, amplitudeY: 9, duration: 11, delay: 1.5 },
  },
  {
    id: 'yamenta',
    name: 'Yamenta',
    shortDescription: 'Al lado de la casa',
    iconKey: 'territory',
    position: { x: 30, y: 82 },
    drift: { amplitudeX: 7, amplitudeY: 5, duration: 8, delay: 2.2 },
  },
  {
    id: 'ya-chito-tokaik-kuik',
    name: 'Ya chitɵ tɵkaik kuik',
    shortDescription: 'Materiales, estructura y partes de la casa',
    iconKey: 'weave',
    position: { x: 78, y: 78 },
    drift: { amplitudeX: 4, amplitudeY: 7, duration: 12, delay: 1.0 },
  },
];
