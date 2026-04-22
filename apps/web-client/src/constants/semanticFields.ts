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
    id: 'territorio',
    name: 'Territorio',
    shortDescription:
      'La tierra, los ríos, los caminos y los lugares sagrados que conforman el mundo Misak.',
    iconKey: 'territory',
    position: { x: 18, y: 68 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  },
  {
    id: 'hogar-cocina',
    name: 'Hogar y Cocina',
    shortDescription:
      'La casa, el fogón, los alimentos y los rituales culinarios que nutren a la comunidad.',
    iconKey: 'home',
    position: { x: 42, y: 75 },
    drift: { amplitudeX: 8, amplitudeY: 6, duration: 9, delay: 0.8 },
  },
  {
    id: 'saberes-tejidos',
    name: 'Saberes y Tejidos',
    shortDescription:
      'La artesanía, la ruana y el conocimiento textil que porta la memoria de los mayores.',
    iconKey: 'weave',
    position: { x: 68, y: 64 },
    drift: { amplitudeX: 5, amplitudeY: 9, duration: 11, delay: 1.5 },
  },
  {
    id: 'voces-palabras',
    name: 'Voces y Palabras',
    shortDescription:
      'La lengua, los cantos, las narraciones y los diálogos que dan vida al pensamiento Misak.',
    iconKey: 'voice',
    position: { x: 30, y: 82 },
    drift: { amplitudeX: 7, amplitudeY: 5, duration: 8, delay: 2.2 },
  },
  {
    id: 'ciclos-tiempo',
    name: 'Ciclos y Tiempo',
    shortDescription:
      'La luna, la cosecha, las ceremonias y el tiempo cíclico que organiza la vida Misak.',
    iconKey: 'fire',
    position: { x: 78, y: 78 },
    drift: { amplitudeX: 4, amplitudeY: 7, duration: 12, delay: 1.0 },
  },
];
