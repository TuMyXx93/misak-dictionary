/**
 * Fixtures del cliente de API para tests
 * Spec 003: réplica de la forma que devuelve el backend, basada en el
 * contenido sembrado (7 campos, "ya" con jerarquía completa).
 */

import type { ApiSemanticField } from '@/services/dictionaryApi';

export const API_FIELD_YA: ApiSemanticField = {
  id: '1',
  slug: 'ya',
  namtrikTermino: 'Ya',
  espanolTermino: 'La Casa',
  namtrikDescripcion:
    'El campo de la casa representa el núcleo de la vida Misak. El fogón, central en la cultura.',
  espanolDescripcion: 'El hogar y el fogón central de la vida Misak.',
  subcampos: [
    {
      id: '1',
      slug: 'namui',
      namtrikTermino: 'Namui',
      espanolTermino: 'Fogón',
      namtrikDescripcion: 'El fogón central de la casa Misak.',
      espanolDescripcion: 'El fogón central de la casa Misak.',
      microcampos: [
        {
          id: '1',
          slug: 'kawe',
          namtrikTermino: 'Kawe',
          espanolTermino: 'Utensilios del fogón',
          namtrikDescripcion: 'Instrumentos tradicionales para cocinar.',
          espanolDescripcion: 'Instrumentos tradicionales para cocinar.',
          palabrasM1: [
            {
              palabra: {
                id: '1',
                namtrikTermino: 'Sruik',
                espanolTermino: 'Olla de barro',
                namtrikDescripcion: null,
                espanolDescripcion: null,
              },
            },
            {
              palabra: {
                id: '2',
                namtrikTermino: 'Pɵta',
                espanolTermino: 'Plato hondo',
                namtrikDescripcion: null,
                espanolDescripcion: null,
              },
            },
          ],
        },
      ],
    },
    {
      id: '2',
      slug: 'ya-namɵ',
      namtrikTermino: 'Ya Namɵ',
      espanolTermino: 'Espacios de la casa',
      namtrikDescripcion: 'Los espacios que conforman la vivienda Misak.',
      espanolDescripcion: 'Los espacios que conforman la vivienda Misak.',
      microcampos: [],
    },
  ],
};

export const API_FIELD_YA_TUL: ApiSemanticField = {
  id: '2',
  slug: 'ya-tul',
  namtrikTermino: 'Ya Tul',
  espanolTermino: 'La Huerta',
  namtrikDescripcion: 'La huerta es el cultivo cercano a la casa.',
  espanolDescripcion: 'El cultivo cercano a la casa.',
  subcampos: [],
};

export const API_FIELDS_ALL: ApiSemanticField[] = [
  API_FIELD_YA,
  API_FIELD_YA_TUL,
  {
    id: '3',
    slug: 'kaumpu-ushamera',
    namtrikTermino: 'Kaumpu Ushamera',
    espanolTermino: 'Animales Silvestres',
    namtrikDescripcion: 'La fauna que habita el territorio Misak.',
    espanolDescripcion: 'La fauna que habita el territorio Misak.',
    subcampos: [],
  },
];

/** Mock por defecto del cliente de API (éxito) */
export const apiClientMockOk = {
  fetchSemanticFields: async () => API_FIELDS_ALL,
  fetchSemanticFieldBySlug: async (slug: string) =>
    API_FIELDS_ALL.find((f) => f.slug === slug) ?? API_FIELDS_ALL[0],
  fetchSearch: async () => ({
    data: [
      {
        id: '1',
        namtrikTermino: 'Sruik',
        espanolTermino: 'Olla de barro',
        microcampos: [
          {
            microcampo: {
              id: '1',
              slug: 'kawe',
              namtrikTermino: 'Kawe',
              subcampoSemantico: {
                id: '1',
                slug: 'namui',
                namtrikTermino: 'Namui',
                campoSemantico: { id: '1', slug: 'ya', namtrikTermino: 'Ya' },
              },
            },
          },
        ],
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  }),
};

/** Mock que falla (estado de error) */
export const apiClientMockError = {
  fetchSemanticFields: async () => {
    throw new Error('API 500: Internal Server Error');
  },
  fetchSemanticFieldBySlug: async () => {
    throw new Error('API 500: Internal Server Error');
  },
  fetchSearch: async () => {
    throw new Error('API 500: Internal Server Error');
  },
};
