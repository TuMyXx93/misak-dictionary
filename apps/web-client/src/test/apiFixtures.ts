/**
 * Fixtures del cliente de API para tests
 * Spec 003: réplica de la forma que devuelve el backend, basada en el
 * contenido sembrado (7 campos, "ya" con jerarquía completa).
 */

import type { ApiHomeSlot, ApiSemanticField } from '@/services/dictionaryApi';

const API_HOME_SLOTS: ApiHomeSlot[] = [
  {
    id: '1',
    clave: 'ya',
    etiqueta: 'Ya',
    posicion: 1,
    campo: {
      id: '1',
      codigo: 'C1',
      slug: 'ya',
      namtrikTermino: 'Ya',
      espanolTermino: 'La Casa',
      espanolDescripcion: 'El hogar y el fogón central de la vida Misak.',
    },
  },
  {
    id: '2',
    clave: 'ya-tul',
    etiqueta: 'Ya tul',
    posicion: 2,
    campo: {
      id: '2',
      codigo: 'C2',
      slug: 'ya-tul',
      namtrikTermino: 'Ya tul',
      espanolTermino: 'La Huerta',
      espanolDescripcion: 'El cultivo cercano a la casa.',
    },
  },
  {
    id: '3',
    clave: 'kaumpu-ushamera',
    etiqueta: 'Tra tul',
    posicion: 3,
    campo: {
      id: '3',
      codigo: 'C3',
      slug: 'tra-tul',
      namtrikTermino: 'Tra tul',
      espanolTermino: 'La huerta lejana',
      espanolDescripcion: 'Cultivos distantes.',
    },
  },
  {
    id: '4',
    clave: 'tusrmera',
    etiqueta: 'Kau ushamera',
    posicion: 4,
    campo: {
      id: '4',
      codigo: 'C4',
      slug: 'kau-ushamera',
      namtrikTermino: 'Kau ushamera',
      espanolTermino: 'Los animales originarios',
      espanolDescripcion: 'Fauna silvestre.',
    },
  },
  {
    id: '5',
    clave: 'namui-nu-piro',
    etiqueta: 'Namui Nu Pirɵ',
    posicion: 5,
    campo: null,
  },
  {
    id: '6',
    clave: 'namui-nu-isuik',
    etiqueta: 'Namui Nu Isuik',
    posicion: 6,
    campo: null,
  },
  {
    id: '7',
    clave: 'sro-wammera',
    etiqueta: 'Srɵ Wammera',
    posicion: 7,
    campo: null,
  },
];

const API_FIELD_YA: ApiSemanticField = {
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
          subniveles: [
            {
              id: '10',
              slug: 'bordes',
              codigo: 'C1.S1.M1.1',
              profundidad: 1,
              namtrikTermino: null,
              espanolTermino: 'Bordes',
              namtrikDescripcion: null,
              espanolDescripcion: 'Partes del borde de la olla.',
              palabrasM1: [],
              subniveles: [
                {
                  id: '11',
                  slug: 'borde-interior',
                  codigo: 'C1.S1.M1.1.1',
                  profundidad: 2,
                  namtrikTermino: null,
                  espanolTermino: 'Interior del borde',
                  namtrikDescripcion: null,
                  espanolDescripcion: null,
                  palabrasM1: [
                    {
                      palabra: {
                        id: '3',
                        namtrikTermino: 'Pɵrɵ',
                        espanolTermino: 'Borde interior',
                        namtrikDescripcion: null,
                        espanolDescripcion: null,
                      },
                    },
                  ],
                },
              ],
            },
          ],
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

const API_FIELD_YA_TUL: ApiSemanticField = {
  id: '2',
  slug: 'ya-tul',
  namtrikTermino: 'Ya Tul',
  espanolTermino: 'La Huerta',
  namtrikDescripcion: 'La huerta es el cultivo cercano a la casa.',
  espanolDescripcion: 'El cultivo cercano a la casa.',
  subcampos: [],
};

const API_FIELDS_ALL: ApiSemanticField[] = [
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
  fetchHomeSlots: async () => API_HOME_SLOTS,
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
