import { describe, expect, it } from 'vitest';
import {
  construirPlanLexico,
  type NodoTaxonomicoRef,
  type SentidoExistenteSnapshot,
} from './lexiconPlan.js';
import type { LexicoArchivo } from './lexiconSchema.js';

const archivoBase: LexicoArchivo = {
  version: 1,
  fuente: {
    documento: 'diccionario-campo-namtrik-castellano.xlsm',
    revisor: 'Equipo lingüístico Misak',
    duplicadosColapsados: 0,
  },
  descripcionesNodos: [
    {
      nodoCodigo: 'C3',
      namtrikDescripcion: 'Ya pulu mamik',
      espanolDescripcion: 'Espacio de trabajo lejano',
    },
  ],
  sentidos: [
    {
      codigo: 'C3.E001',
      nodoCodigo: 'C3',
      posicion: 1,
      tipo: 'estandar',
      formas: [
        {
          orden: 1,
          lema: 'Wela',
          categoriaGramatical: 's.',
          esNeologismo: false,
          rasgosGramaticales: [],
          etiquetaOriginal: 's.',
        },
      ],
      namtrikContexto: 'Tsin kusrup pirɵ',
      espanolGlosa: 'Túmulos agrícolas',
      espanolExplicacion: 'eras de cultivo',
    },
  ],
};

describe('lexiconPlan — cálculo e idempotencia del plan léxico (R-007, R-008)', () => {
  it('clasifica sentidos y descripciones nuevas como crear/actualizar en base limpia', () => {
    const nodos = new Map<string, NodoTaxonomicoRef>([
      [
        'C3',
        {
          id: 3n,
          nivel: 'campo',
          codigo: 'C3',
          namtrikDescripcion: null,
          espanolDescripcion: null,
        },
      ],
    ]);

    const plan = construirPlanLexico(archivoBase, nodos, new Map());
    expect(plan.errores).toEqual([]);
    expect(plan.resumenSentidos).toEqual({ crear: 1, actualizar: 0, sinCambios: 0 });
    expect(plan.resumenDescripciones).toEqual({ actualizar: 1, sinCambios: 0 });
  });

  it('produce 0 cambios en segunda ejecución idéntica (idempotencia R-008)', () => {
    const nodos = new Map<string, NodoTaxonomicoRef>([
      [
        'C3',
        {
          id: 3n,
          nivel: 'campo',
          codigo: 'C3',
          namtrikDescripcion: 'Ya pulu mamik',
          espanolDescripcion: 'Espacio de trabajo lejano',
        },
      ],
    ]);

    const existentes = new Map<string, SentidoExistenteSnapshot>([
      [
        'C3.E001',
        {
          id: 100n,
          codigo: 'C3.E001',
          nodoCodigo: 'C3',
          posicion: 1,
          tipo: 'estandar',
          namtrikContexto: 'Tsin kusrup pirɵ',
          espanolGlosa: 'Túmulos agrícolas',
          espanolExplicacion: 'eras de cultivo',
          nombreCientifico: null,
          respuestaNamtrik: null,
          respuestaNamtrikContexto: null,
          respuestaEspanolGlosa: null,
          respuestaEspanolExplicacion: null,
          observacionEditorial: null,
          formas: archivoBase.sentidos[0]?.formas ?? [],
        },
      ],
    ]);

    const plan = construirPlanLexico(archivoBase, nodos, existentes);
    expect(plan.errores).toEqual([]);
    expect(plan.resumenSentidos).toEqual({ crear: 0, actualizar: 0, sinCambios: 1 });
    expect(plan.resumenDescripciones).toEqual({ actualizar: 0, sinCambios: 1 });
  });

  it('reporta error cuando un sentido apunta a un nodo taxonómico inexistente', () => {
    const plan = construirPlanLexico(archivoBase, new Map(), new Map());
    expect(plan.errores).toHaveLength(2);
    expect(plan.errores[0]).toContain('C3');
  });
});
