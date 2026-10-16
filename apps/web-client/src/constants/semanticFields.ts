/**
 * Semantic Fields Constants
 *
 * Contains the 7 semantic fields ratified by the Misak community for Phase 1.
 * Nombres Misak ratificados — ya no son placeholders.
 * Orden de declaración = orden normativo de navegación (tabulación, screen reader).
 */

import type { SemanticFieldSummary } from '@/types/semanticField';

export const SEMANTIC_FIELDS: SemanticFieldSummary[] = [
  {
    id: 'ya',
    name: 'Ya',
    nameSpanish: 'La Casa',
    shortDescription: 'El hogar y el fogón central de la vida Misak.',
    iconKey: 'house',
    position: { x: 20, y: 60 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  },
  {
    id: 'ya-tul',
    name: 'Ya Tul',
    nameSpanish: 'La Huerta',
    shortDescription: 'El cultivo cercano a la casa, plantas y tradición agrícola.',
    iconKey: 'garden',
    position: { x: 28, y: 82 },
    drift: { amplitudeX: 4, amplitudeY: 6, duration: 10, delay: 1.2 },
  },
  {
    id: 'kaumpu-ushamera',
    name: 'Kaumpu Ushamera',
    nameSpanish: 'Animales Silvestres',
    shortDescription: 'La fauna que habita el territorio Misak.',
    iconKey: 'wildlife',
    position: { x: 36, y: 72 },
    drift: { amplitudeX: 7, amplitudeY: 6, duration: 9, delay: 0.8 },
  },
  {
    id: 'tusrmera',
    name: 'Tusrmera',
    nameSpanish: 'Flora',
    shortDescription: 'La vegetación silvestre y el páramo Misak.',
    iconKey: 'flora',
    position: { x: 50, y: 62 },
    drift: { amplitudeX: 5, amplitudeY: 7, duration: 11, delay: 1.5 },
  },
  {
    id: 'namui-nu-piro',
    name: 'Namui Nu Pirɵ',
    nameSpanish: 'Nuestro Territorio',
    shortDescription: 'El territorio como un todo: montañas, caminos y horizonte.',
    iconKey: 'territory',
    position: { x: 60, y: 74 },
    drift: { amplitudeX: 8, amplitudeY: 5, duration: 8, delay: 2.0 },
  },
  {
    id: 'namui-nu-isuik',
    name: 'Namui Nu Isuik',
    nameSpanish: 'Cosmovisión',
    shortDescription: 'El pensamiento cíclico y cosmogónico del pueblo Misak.',
    iconKey: 'cosmos',
    position: { x: 72, y: 84 },
    drift: { amplitudeX: 5, amplitudeY: 7, duration: 9, delay: 1.8 },
  },
  {
    id: 'sro-wammera',
    name: 'Srɵ Wammera',
    nameSpanish: 'Neologismos',
    shortDescription: 'Palabras nuevas que nacen de la vitalidad lingüística Misak.',
    iconKey: 'neologism',
    position: { x: 82, y: 66 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 12, delay: 0.5 },
  },
];

/**
 * Mapeo de alias para relacionar slugs reales de campos en base de datos con
 * la configuración visual (icono, posición, drift) de sus respectivos slots o campos.
 */
const SLUG_TO_CONFIG_ID: Record<string, string> = {
  'tra-tul': 'kaumpu-ushamera',
  'kau-ushamera': 'tusrmera',
};

/**
 * Obtiene la configuración visual asociada a un slot (por clave) o a un campo (por slug).
 */
export function getSemanticFieldConfig(slugOrClave: string): SemanticFieldSummary | undefined {
  const targetId = SLUG_TO_CONFIG_ID[slugOrClave] ?? slugOrClave;
  return SEMANTIC_FIELDS.find((c) => c.id === targetId);
}
