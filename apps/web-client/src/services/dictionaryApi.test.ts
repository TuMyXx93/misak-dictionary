import { describe, expect, it } from 'vitest';
import {
  type ApiMicrofield,
  type ApiSemanticField,
  type ApiSentido,
  type ApiTerm,
  toMicrofield,
  toSemanticField,
  toTerm,
} from './dictionaryApi';

describe('dictionaryApi adapters (R-026)', () => {
  describe('toTerm', () => {
    it('mapea correctamente un sentido en estado borrador', () => {
      const apiSentido: ApiSentido = {
        id: 'sent-1',
        codigo: 'C1.SENT.1',
        posicion: 1,
        tipo: 'estandar',
        estado: 'borrador',
        namtrikTermino: 'Ya',
        espanolTermino: 'Casa',
        espanolGlosa: 'Casa tradicional',
        formas: [
          {
            orden: 1,
            lema: 'Ya',
            esNeologismo: false,
            rasgosGramaticales: [],
          },
        ],
      };

      const term = toTerm(apiSentido);
      expect(term.id).toBe('sent-1');
      expect(term.codigo).toBe('C1.SENT.1');
      expect(term.estado).toBe('borrador');
      expect(term.misak).toBe('Ya');
      expect(term.spanish).toBe('Casa tradicional');
    });

    it('mapea correctamente un sentido en estado ratificado', () => {
      const apiSentido: ApiSentido = {
        id: 'sent-2',
        codigo: 'C1.SENT.2',
        posicion: 2,
        tipo: 'estandar',
        estado: 'ratificado',
        namtrikTermino: 'Pichillim',
        espanolTermino: 'Colibrí',
        espanolGlosa: 'Colibrí',
        formas: [
          {
            orden: 1,
            lema: 'Pichillim',
            esNeologismo: false,
            rasgosGramaticales: [],
          },
        ],
      };

      const term = toTerm(apiSentido);
      expect(term.id).toBe('sent-2');
      expect(term.codigo).toBe('C1.SENT.2');
      expect(term.estado).toBe('ratificado');
    });

    it('mapea un término legacy (ApiTerm) sin definir estado', () => {
      const apiTerm: ApiTerm = {
        id: 'term-legacy',
        namtrikTermino: 'Término',
        espanolTermino: 'Term',
        namtrikDescripcion: null,
        espanolDescripcion: null,
      };

      const term = toTerm(apiTerm);
      expect(term.id).toBe('term-legacy');
      expect(term.estado).toBeUndefined();
    });
  });

  describe('toMicrofield y toSemanticField', () => {
    it('preserva el estado de los sentidos dentro de microcampos y subcampos', () => {
      const apiMicro: ApiMicrofield = {
        id: 'micro-1',
        slug: 'aves',
        namtrikTermino: 'Aves',
        espanolTermino: 'Pájaros',
        namtrikDescripcion: null,
        espanolDescripcion: null,
        sentidos: [
          {
            id: 'sent-3',
            codigo: 'C1.S1.M1.SENT.1',
            posicion: 1,
            tipo: 'estandar',
            estado: 'borrador',
            namtrikTermino: 'Pichillim',
            espanolTermino: 'Colibrí',
          },
        ],
      };

      const micro = toMicrofield(apiMicro);
      expect(micro.terms).toHaveLength(1);
      expect(micro.terms[0]?.estado).toBe('borrador');

      const apiField: ApiSemanticField = {
        id: 'field-1',
        slug: 'naturaleza',
        namtrikTermino: 'Naturaleza',
        espanolTermino: 'Nature',
        namtrikDescripcion: null,
        espanolDescripcion: null,
        subcampos: [
          {
            id: 'sub-1',
            slug: 'fauna',
            namtrikTermino: 'Fauna',
            espanolTermino: 'Animales',
            namtrikDescripcion: null,
            espanolDescripcion: null,
            microcampos: [apiMicro],
          },
        ],
      };

      const field = toSemanticField(apiField);
      expect(field.subfields[0]?.microfields[0]?.terms[0]?.estado).toBe('borrador');
    });
  });

  describe('fetchSearch', () => {
    it('normaliza correctamente los resultados devueltos por la API de búsqueda', async () => {
      const mockRawResponse = {
        data: [
          {
            id: 101,
            namtrikTermino: 'Ya',
            espanolTermino: 'Casa',
            categoriaGramatical: 'Sustantivo',
            ubicacion: {
              campoSlug: 'ya',
              campoNombre: 'Ya',
              ruta: '/campos/ya#term-101',
            },
          },
          {
            id: 102,
            namtrik_termino: 'Pishau',
            espanol_termino: 'Pájaro',
            categoria_gramatical: 'Sustantivo',
            coincidencia: 'aproximada',
            campo_coincidencia: 'explicacion',
            extracto_coincidencia: '…ave del territorio ancestral…',
            microcampos: [
              {
                microcampo: {
                  id: 'mc-1',
                  slug: 'aves',
                  namtrikTermino: 'Aves',
                  subcampoSemantico: {
                    id: 'sub-1',
                    slug: 'fauna',
                    namtrikTermino: 'Fauna',
                    campoSemantico: {
                      id: 'c-1',
                      slug: 'naturaleza',
                      namtrikTermino: 'Naturaleza',
                    },
                  },
                },
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        ({
          ok: true,
          json: async () => mockRawResponse,
        }) as unknown as Response;

      try {
        const { fetchSearch } = await import('./dictionaryApi');
        const res = await fetchSearch('Ya');

        expect(res.data).toHaveLength(2);
        expect(res.data[0]?.id).toBe('101');
        expect(res.data[0]?.namtrikTermino).toBe('Ya');
        expect(res.data[0]?.espanolTermino).toBe('Casa');
        expect(res.data[0]?.categoriaGramatical).toBe('Sustantivo');
        expect(res.data[0]?.ubicacion?.ruta).toBe('/campos/ya#term-101');

        // Segundo elemento con snake_case y fallback a microcampos
        expect(res.data[1]?.id).toBe('102');
        expect(res.data[1]?.namtrikTermino).toBe('Pishau');
        expect(res.data[1]?.espanolTermino).toBe('Pájaro');
        expect(res.data[1]?.coincidencia).toBe('aproximada');
        expect(res.data[1]?.campoCoincidencia).toBe('explicacion');
        expect(res.data[1]?.extractoCoincidencia).toBe('…ave del territorio ancestral…');
        expect(res.data[1]?.ubicacion?.campoSlug).toBe('naturaleza');
        expect(res.data[1]?.ubicacion?.subcampoSlug).toBe('fauna');
        expect(res.data[1]?.ubicacion?.microcampoSlug).toBe('aves');
        expect(res.data[1]?.ubicacion?.ruta).toBe('/campos/naturaleza/fauna/aves#term-102');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('mapea correctamente campoCoincidencia: "equivalencia" y terminoEquivalente (Spec 012)', async () => {
      const mockRawResponse = {
        data: [
          {
            id: '745',
            codigo: 'C1.S3.E013',
            namtrik_termino: 'Kɵnchapik',
            espanol_termino: 'Representación de la estrella',
            campo_coincidencia: 'equivalencia',
            termino_equivalente: 'estrella',
            coincidencia: 'aproximada',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        ({
          ok: true,
          json: async () => mockRawResponse,
        }) as unknown as Response;

      try {
        const { fetchSearch } = await import('./dictionaryApi');
        const res = await fetchSearch('estrella');

        expect(res.data).toHaveLength(1);
        expect(res.data[0]?.id).toBe('745');
        expect(res.data[0]?.campoCoincidencia).toBe('equivalencia');
        expect(res.data[0]?.terminoEquivalente).toBe('estrella');
        expect(res.data[0]?.namtrikTermino).toBe('Kɵnchapik');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('maneja respuestas vacías de búsqueda sin fallar', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        ({
          ok: true,
          json: async () => ({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        }) as unknown as Response;

      try {
        const { fetchSearch } = await import('./dictionaryApi');
        const res = await fetchSearch('inexistente');
        expect(res.data).toEqual([]);
        expect(res.pagination.total).toBe(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('preserva tipoResultado, nivelJerarquico, totalTerminos y nombreCientifico en fetchSearch (Spec 012 v0.3.0 / R-019)', async () => {
      const mockRawResponse = {
        data: [
          {
            id: '7',
            codigo: 'C1.S1.M1',
            tipo_resultado: 'microcampo',
            nivel_jerarquico: 3,
            total_terminos: 14,
            namtrik_termino: 'Wammera',
            espanol_termino: 'Lengua y memoria ancestral',
            ubicacion: {
              campoSlug: 'ya',
              campoNombre: 'Ya',
              subcampoSlug: 'nakchak',
              subcampoNombre: 'Nakchak',
              microcampoSlug: 'wammera',
              microcampoNombre: 'Wammera',
              ruta: '/campos/ya/nakchak/wammera',
            },
          },
          {
            id: '1351',
            codigo: 'C4.S6.E021',
            tipoResultado: 'termino',
            nivelJerarquico: 5,
            totalTerminos: 1,
            nombre_cientifico: 'Gastropoda',
            namtrikTermino: 'Milu kalik',
            espanolTermino: 'Caracol',
            campoCoincidencia: 'cientifico',
          },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        ({
          ok: true,
          json: async () => mockRawResponse,
        }) as unknown as Response;

      try {
        const { fetchSearch } = await import('./dictionaryApi');
        const res = await fetchSearch('Wammera');

        expect(res.data[0]?.tipoResultado).toBe('microcampo');
        expect(res.data[0]?.nivelJerarquico).toBe(3);
        expect(res.data[0]?.totalTerminos).toBe(14);

        expect(res.data[1]?.tipoResultado).toBe('termino');
        expect(res.data[1]?.nivelJerarquico).toBe(5);
        expect(res.data[1]?.totalTerminos).toBe(1);
        expect(res.data[1]?.nombreCientifico).toBe('Gastropoda');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
