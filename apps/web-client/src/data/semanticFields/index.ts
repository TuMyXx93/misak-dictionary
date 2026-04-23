/**
 * Data Layer — Semantic Fields
 *
 * Phase 2: 7 fields total (2 available, 5 coming-soon).
 * Each available field has subfields → microfields → terms.
 * Data is mock (demo) — to be validated with community.
 */

import type { SemanticField } from '@/types/semanticField';

export const SEMANTIC_FIELDS_DATA: SemanticField[] = [
  {
    id: 'ya',
    name: 'Ya',
    nameSpanish: 'La Casa',
    shortDescription: 'El hogar y el fogón central de la vida Misak.',
    longDescription:
      'El campo de la casa representa el núcleo de la vida Misak. El fogón, central en la cultura, es donde se prepara la comida, se transmite el conocimiento y se comparten las historias.',
    iconKey: 'house',
    status: 'available',
    position: { x: 20, y: 60 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
    subfields: [
      {
        id: 'fogon',
        name: 'Fogon',
        nameMisak: 'Namui',
        description: 'El fogón central de la casa Misak.',
        microfields: [
          {
            id: 'utensilios',
            name: 'Utensilios del fogón',
            nameMisak: 'Kawe',
            description: 'Instrumentos tradicionales para cocinar.',
            terms: [
              { id: 'sruik', misak: 'Sruik', spanish: 'Olla de barro' },
              { id: 'pɵta', misak: 'Pɵta', spanish: 'Plato hondo' },
              { id: 'kʊra', misak: 'Kʊra', spanish: 'Jarro para agua' },
              { id: 'wapa', misak: 'Wapa', spanish: 'Cuchara de madera' },
              { id: 'shɵka', misak: 'Shɵka', spanish: 'Totuma / recipiente' },
            ],
          },
          {
            id: 'alimentos',
            name: 'Alimentos del fogón',
            nameMisak: 'Yɵ',
            description: 'Alimentos preparados en el fogón.',
            terms: [
              { id: 'mʊru', misak: 'Mʊru', spanish: 'Mazamorra' },
              { id: 'sɵka', misak: 'Sɵka', spanish: 'Envuelto de maíz' },
              { id: 'tʊka', misak: 'Tʊka', spanish: 'Caldo de frijol' },
              { id: 'shɵ', misak: 'Shɵ', spanish: 'Café misak' },
              { id: 'kɵwa', misak: 'Kɵwa', spanish: 'Panela breakpoint' },
            ],
          },
        ],
      },
      {
        id: 'espacios-casa',
        name: 'Espacios de la casa',
        nameMisak: 'Ya Namɵ',
        description: 'Los espacios que conforman la vivienda Misak.',
        microfields: [
          {
            id: 'paredes-techo',
            name: 'Paredes y techo',
            nameMisak: 'Piro',
            description: 'Estructura física de la casa.',
            terms: [
              { id: 'tʊka', misak: 'Tʊka', spanish: 'Pared de bahareque' },
              { id: 'shɵra', misak: 'Shɵra', spanish: 'Techo de palma' },
              { id: 'pɵ', misak: 'Pɵ', spanish: 'Puerta' },
              { id: 'wɵ', misak: 'Wɵ', spanish: 'Ventana' },
              { id: 'sru', misak: 'Sru', spanish: 'Poste central' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ya-tul',
    name: 'Ya Tul',
    nameSpanish: 'La Huerta',
    shortDescription: 'El cultivo cercano a la casa, plantas y tradición agrícola.',
    iconKey: 'garden',
    status: 'coming-soon',
    position: { x: 36, y: 72 },
    drift: { amplitudeX: 7, amplitudeY: 6, duration: 9, delay: 0.8 },
    subfields: [],
  },
  {
    id: 'kaumpu-ushamera',
    name: 'Kaumpu Ushamera',
    nameSpanish: 'Animales Silvestres',
    shortDescription: 'La fauna que habita el territorio Misak.',
    iconKey: 'wildlife',
    status: 'coming-soon',
    position: { x: 52, y: 62 },
    drift: { amplitudeX: 5, amplitudeY: 7, duration: 11, delay: 1.5 },
    subfields: [],
  },
  {
    id: 'tusrmera',
    name: 'Tusrmera',
    nameSpanish: 'Flora',
    shortDescription: 'La vegetación silvestre y el páramo Misak.',
    iconKey: 'flora',
    status: 'coming-soon',
    position: { x: 68, y: 74 },
    drift: { amplitudeX: 8, amplitudeY: 5, duration: 8, delay: 2.0 },
    subfields: [],
  },
  {
    id: 'namui-nu-piro',
    name: 'Namui Nu Pirɵ',
    nameSpanish: 'Nuestro Territorio',
    shortDescription: 'El territorio como un todo: montañas, caminos y horizonte.',
    longDescription:
      'El territorio Misak abarca las montañas, los ríos, los caminos y el horizonte. Es el espacio físico y simbólico que define la identidad del pueblo.',
    iconKey: 'territory',
    status: 'available',
    position: { x: 82, y: 66 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 12, delay: 0.5 },
    subfields: [
      {
        id: 'montanas',
        name: 'Montañas',
        nameMisak: 'Namui Pɵ',
        description: 'Las montañas sagradas del territorio Misak.',
        microfields: [
          {
            id: 'cerros-sagrados',
            name: 'Cerros sagrados',
            nameMisak: 'Pɵ Namui',
            description: 'Cerros de importancia espiritual.',
            terms: [
              { id: 'pɵ-ya', misak: 'Pɵ Ya', spanish: 'Cerro de la casa' },
              { id: 'pɵ-ta', misak: 'Pɵ Ta', spanish: 'Cerro del sol' },
              { id: 'pɵ-shɵ', misak: 'Pɵ Shɵ', spanish: 'Cerro de la luna' },
              { id: 'pɵ-kɵ', misak: 'Pɵ Kɵ', spanish: 'Cerro del fuego' },
              { id: 'pɵ-ru', misak: 'Pɵ Ru', spanish: 'Cerro del agua' },
            ],
          },
          {
            id: 'rios',
            name: 'Ríos',
            nameMisak: 'Namui Ru',
            description: 'Los ríos que cruzan el territorio.',
            terms: [
              { id: 'ru-ya', misak: 'Ru Ya', spanish: 'Río de la casa' },
              { id: 'ru-pɵ', misak: 'Ru Pɵ', spanish: 'Río del cerro' },
              { id: 'ru-shɵ', misak: 'Ru Shɵ', spanish: 'Río de la luna' },
              { id: 'ru-kɵ', misak: 'Ru Kɵ', spanish: 'Río del fuego' },
            ],
          },
        ],
      },
      {
        id: 'caminos',
        name: 'Caminos',
        nameMisak: 'Tʊka Piro',
        description: 'Los caminos que recorren el territorio.',
        microfields: [
          {
            id: 'caminos-principales',
            name: 'Caminos principales',
            nameMisak: 'Tʊka Piro Namui',
            description: 'Rutas principales del territorio.',
            terms: [
              { id: 'tu-ya', misak: 'Tu Ya', spanish: 'Camino a la casa' },
              { id: 'tu-pɵ', misak: 'Tu Pɵ', spanish: 'Camino al cerro' },
              { id: 'tu-ru', misak: 'Tu Ru', spanish: 'Camino al río' },
              { id: 'tu-shɵ', misak: 'Tu Shɵ', spanish: 'Camino a la luna' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'namui-nu-isuik',
    name: 'Namui Nu Isuik',
    nameSpanish: 'Cosmovisión',
    shortDescription: 'El pensamiento cíclico y cosmogónico del pueblo Misak.',
    iconKey: 'cosmos',
    status: 'coming-soon',
    position: { x: 28, y: 82 },
    drift: { amplitudeX: 4, amplitudeY: 6, duration: 10, delay: 1.2 },
    subfields: [],
  },
  {
    id: 'sro-wammera',
    name: 'Srɵ Wammera',
    nameSpanish: 'Neologismos',
    shortDescription: 'Palabras nuevas que nacen de la vitalidad lingüística Misak.',
    iconKey: 'neologism',
    status: 'coming-soon',
    position: { x: 72, y: 84 },
    drift: { amplitudeX: 5, amplitudeY: 7, duration: 9, delay: 1.8 },
    subfields: [],
  },
];

export const getFieldBySlug = (slug: string): SemanticField | undefined =>
  SEMANTIC_FIELDS_DATA.find((f) => f.id === slug);

export const getAvailableFields = (): SemanticField[] =>
  SEMANTIC_FIELDS_DATA.filter((f) => f.status === 'available');

export const getComingSoonFields = (): SemanticField[] =>
  SEMANTIC_FIELDS_DATA.filter((f) => f.status === 'coming-soon');
