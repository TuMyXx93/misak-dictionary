/**
 * Equivalencias Bilingües Tests (Spec 012 / ADR-0008)
 */

import { describe, expect, it } from 'vitest';
import {
  extractEquivalenciasFromSentido,
  extractGlosaCabeza,
  getDefaultYamlPath,
  loadCuratedYamlManifest,
} from './equivalenciasBilingues.js';

describe('equivalenciasBilingues', () => {
  describe('extractGlosaCabeza', () => {
    it('extrae el lema primario antes de aclaraciones taxonómicas o puntuación', () => {
      expect(extractGlosaCabeza('Vaca (mamífero doméstico)')).toBe('Vaca');
      expect(extractGlosaCabeza('maíz, choclo; planta')).toBe('maíz');
      expect(extractGlosaCabeza('casa: lugar donde se habita')).toBe('casa');
      expect(extractGlosaCabeza(null)).toBe('');
      expect(extractGlosaCabeza('   ')).toBe('');
    });
  });

  describe('extractEquivalenciasFromSentido', () => {
    it('extrae núcleo nominal de glosas descriptivas como "Representación de la estrella"', () => {
      const sentido = {
        id: BigInt(745),
        codigo: 'C1.S3.E013',
        espanolGlosa: 'Representación de la estrella',
        formas: [{ lema: 'Kɵnchapik', orden: 1 }],
      };

      const equivalencias = extractEquivalenciasFromSentido(sentido);

      expect(equivalencias).toHaveLength(2);
      expect(
        equivalencias.some(
          (e) =>
            e.terminoEs === 'Representación de la estrella' && e.tipoRelacion === 'glosa_directa',
        ),
      ).toBe(true);
      expect(
        equivalencias.some(
          (e) => e.terminoEs === 'estrella' && e.tipoRelacion === 'nucleo_nominal',
        ),
      ).toBe(true);
    });

    it('extrae núcleo nominal de glosas con "Nuestro/a"', () => {
      const sentido = {
        id: BigInt(1034),
        codigo: 'C2.S4.E019',
        espanolGlosa: 'Nuestro mundo',
        formas: [{ lema: 'Kɵrɵishik', orden: 1 }],
      };

      const equivalencias = extractEquivalenciasFromSentido(sentido);

      expect(
        equivalencias.some((e) => e.terminoEs === 'mundo' && e.tipoRelacion === 'nucleo_nominal'),
      ).toBe(true);
    });

    it('asocia la raíz morfológica "maíz" a sentidos con lema Namtrik pura*', () => {
      const sentido = {
        id: BigInt(101),
        codigo: 'C3.S1.E005',
        espanolGlosa: 'Maíz amarillo tostado',
        formas: [{ lema: 'Puratɵ', orden: 1 }],
      };

      const equivalencias = extractEquivalenciasFromSentido(sentido);

      expect(
        equivalencias.some((e) => e.terminoEs === 'maíz' && e.tipoRelacion === 'raiz_morfologica'),
      ).toBe(true);
    });

    it('extrae sub-acepciones separadas por coma o punto y coma ignorando stopwords', () => {
      const sentido = {
        id: BigInt(202),
        codigo: 'C4.S2.E010',
        espanolGlosa: 'colibrí, picaflor; pájaro mosca',
        formas: [{ lema: 'Pichillim', orden: 1 }],
      };

      const equivalencias = extractEquivalenciasFromSentido(sentido);

      expect(
        equivalencias.some((e) => e.terminoEs === 'colibrí' && e.tipoRelacion === 'glosa_directa'),
      ).toBe(true);
      expect(
        equivalencias.some((e) => e.terminoEs === 'picaflor' && e.tipoRelacion === 'sub_acepcion'),
      ).toBe(true);
      expect(
        equivalencias.some(
          (e) => e.terminoEs === 'pájaro mosca' && e.tipoRelacion === 'sub_acepcion',
        ),
      ).toBe(true);
    });
  });

  describe('loadCuratedYamlManifest', () => {
    it('carga correctamente el manifiesto curado YAML de equivalencias', () => {
      const yamlPath = getDefaultYamlPath();
      const manifest = loadCuratedYamlManifest(yamlPath);

      expect(manifest.version).toBe('1.0.0');
      expect(manifest.equivalencias.length).toBeGreaterThan(0);
      expect(
        manifest.equivalencias.some((e) => e.codigo === 'C1.S3.E013' && e.terminoEs === 'estrella'),
      ).toBe(true);
      expect(
        manifest.equivalencias.some((e) => e.codigo === 'C6.S5.E028' && e.terminoEs === 'flor'),
      ).toBe(true);
    });
  });
});
