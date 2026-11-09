/**
 * abreviaturas.test.ts
 * Tests unitarios para el catálogo y resolución de abreviaturas lingüísticas oficiales y dinámicas.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbreviaturaItem } from './abreviaturas';
import {
  ABREVIATURAS_OFICIALES,
  ensureDynamicAbreviaturasLoaded,
  getAbreviaturaInfo,
  getDynamicAbreviaturasCatalog,
  parseComposedAbreviatura,
  setDynamicAbreviaturasCatalog,
  subscribeAbreviaturasCatalog,
} from './abreviaturas';

describe('Catálogo y resolución de abreviaturas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restaurar catálogo oficial por defecto
    setDynamicAbreviaturasCatalog(ABREVIATURAS_OFICIALES);
  });

  describe('ABREVIATURAS_OFICIALES', () => {
    it('contiene exactamente las 41 abreviaturas normativas del PDF', () => {
      expect(ABREVIATURAS_OFICIALES).toHaveLength(41);
      expect(ABREVIATURAS_OFICIALES.find((a) => a.codigo === 's.')).toBeDefined();
      expect(ABREVIATURAS_OFICIALES.find((a) => a.codigo === 'O. S. E. A. P. I.')).toBeDefined();
    });
  });

  describe('getAbreviaturaInfo', () => {
    it('retorna null ante código nulo, indefinido o vacío', () => {
      expect(getAbreviaturaInfo(null)).toBeNull();
      expect(getAbreviaturaInfo(undefined)).toBeNull();
      expect(getAbreviaturaInfo('')).toBeNull();
    });

    it('resuelve abreviatura canónica exacta', () => {
      const info = getAbreviaturaInfo('s.');
      expect(info).not.toBeNull();
      expect(info?.etiquetaCompleta).toBe('Sustantivo');
    });

    it('resuelve aliases comunes y variantes sin punto', () => {
      expect(getAbreviaturaInfo('sustantivo')?.codigo).toBe('s.');
      expect(getAbreviaturaInfo('verbo')?.codigo).toBe('v.');
      expect(getAbreviaturaInfo('v.pos.')?.codigo).toBe('v. pos.');
      expect(getAbreviaturaInfo('simb')?.codigo).toBe('símb.');
    });

    it('normaliza tildes y mayúsculas de forma insensible', () => {
      expect(getAbreviaturaInfo('SÍMB.')?.codigo).toBe('símb.');
      expect(getAbreviaturaInfo('ADJ.')?.etiquetaCompleta).toBe('Adjetivo');
    });

    it('soporta catálogo personalizado (customCatalog)', () => {
      const custom = [{ codigo: 'custom.', etiquetaCompleta: 'Abreviatura personalizada' }];
      const info = getAbreviaturaInfo('custom.', custom);
      expect(info?.etiquetaCompleta).toBe('Abreviatura personalizada');
    });

    it('retorna null cuando el código no existe en el catálogo', () => {
      expect(getAbreviaturaInfo('xyz.desconocido')).toBeNull();
    });
  });

  describe('parseComposedAbreviatura', () => {
    it('retorna arreglo vacío si la entrada está vacía', () => {
      expect(parseComposedAbreviatura(null)).toEqual([]);
      expect(parseComposedAbreviatura('')).toEqual([]);
      expect(parseComposedAbreviatura('   ')).toEqual([]);
    });

    it('preserva intacta la oración O. S. E. A. P. I. con comas internas', () => {
      const result = parseComposedAbreviatura('O. S. E. A. P. I.');
      expect(result).toHaveLength(1);
      expect(result[0].codigo).toBe('O. S. E. A. P. I.');
    });

    it('desglosa múltiples abreviaturas separadas por coma o barra', () => {
      const resultComa = parseComposedAbreviatura('s., adj.');
      expect(resultComa).toHaveLength(2);
      expect(resultComa[0].codigo).toBe('s.');
      expect(resultComa[1].codigo).toBe('adj.');

      const resultBarra = parseComposedAbreviatura('s. / v.');
      expect(resultBarra).toHaveLength(2);
      expect(resultBarra[0].codigo).toBe('s.');
      expect(resultBarra[1].codigo).toBe('v.');
    });

    it('genera fallback para partes no reconocidas', () => {
      const result = parseComposedAbreviatura('s., etiquetaDesconocida');
      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('s.');
      expect(result[1]).toEqual({
        codigo: 'etiquetaDesconocida',
        etiquetaCompleta: 'etiquetaDesconocida',
      });
    });
  });

  describe('Gestión reactiva del catálogo dinámico', () => {
    it('permite suscribirse, actualizar el catálogo y cancelar la suscripción', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeAbreviaturasCatalog(listener);

      const nuevoCatalogo = [
        { codigo: 'neo.', etiquetaCompleta: 'Neologismo Dinámico', activo: true },
      ];

      setDynamicAbreviaturasCatalog(nuevoCatalogo);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(getDynamicAbreviaturasCatalog()).toEqual(nuevoCatalogo);

      // Desuscribirse
      unsubscribe();
      setDynamicAbreviaturasCatalog(ABREVIATURAS_OFICIALES);
      expect(listener).toHaveBeenCalledTimes(1); // No vuelve a ser llamado
    });

    it('ignora arreglos vacíos o no válidos en setDynamicAbreviaturasCatalog', () => {
      const initial = getDynamicAbreviaturasCatalog();
      setDynamicAbreviaturasCatalog([] as unknown as readonly AbreviaturaItem[]);
      expect(getDynamicAbreviaturasCatalog()).toEqual(initial);
    });

    it('ensureDynamicAbreviaturasLoaded no lanza errores al ejecutarse', () => {
      expect(() => ensureDynamicAbreviaturasLoaded()).not.toThrow();
    });
  });
});
