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
});
