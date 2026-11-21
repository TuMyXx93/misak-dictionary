import { describe, expect, it } from 'vitest';
import type { AdminMediaItem, AdminMediaTaxonomyNode } from '@/hooks/useAdmin';
import {
  flattenTaxonomyCatalog,
  formatMediaBytes,
  formatMediaDuration,
  formatMediaVinculacionSummary,
  formatSelectedFileSize,
  getPropositoLabel,
  getPropositosByTipo,
  PROPOSITOS_AUDIO,
  PROPOSITOS_IMAGEN,
  PROPOSITOS_VIDEO,
  toAdminLightboxMediaItem,
} from './mediaCatalogHelpers';

const createBaseMediaItem = (overrides: Partial<AdminMediaItem> = {}): AdminMediaItem => ({
  id: '10',
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  tipo: 'imagen',
  proposito: 'ilustracion_cultural',
  filename: 'casa-misak.webp',
  mimetype: 'image/webp',
  sizeBytes: '2048',
  hashSha256: 'abc123',
  estado: 'borrador',
  licenciaComunitaria: 'Uso Comunitario Misak',
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
  ...overrides,
});

describe('mediaCatalogHelpers', () => {
  it('retorna propósitos según tipo y resuelve etiquetas conocidas y desconocidas', () => {
    expect(getPropositosByTipo('audio')).toBe(PROPOSITOS_AUDIO);
    expect(getPropositosByTipo('imagen')).toBe(PROPOSITOS_IMAGEN);
    expect(getPropositosByTipo('video')).toBe(PROPOSITOS_VIDEO);

    expect(getPropositoLabel('pronunciacion_lema')).toBe('Pronunciación estándar del lema');
    expect(getPropositoLabel('proposito_personalizado')).toBe('proposito_personalizado');
  });

  it('formatea tamaños de archivo seleccionados y de catálogo en kB o MB', () => {
    expect(formatSelectedFileSize(5120)).toBe('5.0 kB');
    expect(formatSelectedFileSize(2 * 1024 * 1024)).toBe('2.00 MB');

    expect(formatMediaBytes(0)).toBe('0.0 kB');
    expect(formatMediaBytes(-10, true)).toBe('0.0 MB');
    expect(formatMediaBytes('NaN')).toBe('0.0 kB');
    expect(formatMediaBytes(2048)).toBe('2.0 kB');
    expect(formatMediaBytes('2048', true)).toBe('0.0 MB');
    expect(formatMediaBytes(1572864)).toBe('1.5 MB');
  });

  it('formatea duraciones válidas e inválidas en mm:ss', () => {
    expect(formatMediaDuration(null)).toBeNull();
    expect(formatMediaDuration(undefined)).toBeNull();
    expect(formatMediaDuration(0)).toBeNull();
    expect(formatMediaDuration(-5)).toBeNull();
    expect(formatMediaDuration(Number.NaN)).toBeNull();
    expect(formatMediaDuration(9)).toBe('0:09');
    expect(formatMediaDuration(65.2)).toBe('1:05');
  });

  it('aplana recursivamente el árbol taxonómico conservando jerarquía y profundidad', () => {
    const tree: AdminMediaTaxonomyNode[] = [
      {
        id: '1',
        codigo: 'C1',
        slug: 'ya',
        namtrikTermino: 'Ya',
        espanolTermino: 'La casa',
        nivel: 'campo',
        hijos: [
          {
            id: '10',
            codigo: 'C1.S1',
            slug: 'espacios',
            namtrikTermino: 'Ya srɵ',
            espanolTermino: 'Espacios',
            nivel: 'subcampo',
            hijos: [
              {
                id: '100',
                codigo: 'C1.S1.M1',
                slug: 'fogon',
                namtrikTermino: 'Nak chik',
                espanolTermino: 'Fogón',
                nivel: 'microcampo',
                hijos: [
                  {
                    id: '101',
                    codigo: 'C1.S1.M1.1',
                    slug: 'ceniza',
                    namtrikTermino: 'Kɵsik',
                    espanolTermino: 'Ceniza',
                    nivel: 'subnivel',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '2',
        codigo: 'C2',
        slug: 'ya-tul',
        namtrikTermino: 'Ya tul',
        espanolTermino: 'La huerta',
        nivel: 'campo',
      },
    ];

    const flattened = flattenTaxonomyCatalog(tree);

    expect(flattened.campos).toHaveLength(2);
    expect(flattened.subcampos).toEqual([
      expect.objectContaining({ id: '10', parentCampoId: '1', depth: 0 }),
    ]);
    expect(flattened.microcampos).toEqual([
      expect.objectContaining({ id: '100', parentCampoId: '1', parentSubcampoId: '10', depth: 0 }),
      expect.objectContaining({ id: '101', parentCampoId: '1', parentSubcampoId: '10', depth: 1 }),
    ]);
  });

  it('genera resumen de vinculación para sentido, forma, taxonomía y sin vincular', () => {
    const conSentidoYForma = createBaseMediaItem({
      campoSemantico: { id: '1', codigo: 'C1', namtrikTermino: 'Ya', espanolTermino: null },
      subcampoSemantico: { id: '2', codigo: 'C1.S1', namtrikTermino: 'S1', espanolTermino: 'Sub' },
      microcampo: { id: '3', codigo: 'C1.S1.M1', namtrikTermino: 'M1', espanolTermino: 'Micro' },
      forma: { id: 'f1', lema: 'nak' },
      sentido: { id: 's1', codigo: 'S-001', espanolGlosa: 'Fuego' },
    });
    expect(formatMediaVinculacionSummary(conSentidoYForma)).toEqual({
      primary: 'S-001 · nak',
      secondary: 'Fuego',
      taxonomyPath: 'C1 · Ya › C1.S1 · Sub › C1.S1.M1 · Micro',
    });

    const sentidoFallbackMicro = createBaseMediaItem({
      sentido: {
        id: 's2',
        codigo: 'S-002',
        espanolGlosa: 'Agua',
        formas: [{ id: 'f2', lema: 'pi' }],
        ubicaciones: [
          {
            microcampo: { id: '3', codigo: 'C1.S1.M1', espanolTermino: 'Micro' },
          },
        ],
      },
    });
    expect(formatMediaVinculacionSummary(sentidoFallbackMicro)).toEqual({
      primary: 'S-002 · pi',
      secondary: 'Agua',
      taxonomyPath: 'C1.S1.M1 · Micro',
    });

    const sentidoFallbackSubcampo = createBaseMediaItem({
      sentido: {
        id: 's3',
        codigo: 'S-003',
        espanolGlosa: 'Tierra',
        ubicaciones: [
          {
            subcampo: { id: '2', codigo: 'C1.S1', espanolTermino: 'Sub' },
          },
        ],
      },
    });
    expect(formatMediaVinculacionSummary(sentidoFallbackSubcampo)).toEqual({
      primary: 'S-003 · S-003',
      secondary: 'Tierra',
      taxonomyPath: 'C1.S1 · Sub',
    });

    const sentidoFallbackCampoYSinUb = createBaseMediaItem({
      sentido: {
        id: 's4',
        codigo: 'S-004',
        espanolGlosa: 'Viento',
        ubicaciones: [
          {
            campo: { id: '1', codigo: 'C1', espanolTermino: 'Casa' },
          },
        ],
      },
    });
    expect(formatMediaVinculacionSummary(sentidoFallbackCampoYSinUb).taxonomyPath).toBe(
      'C1 · Casa',
    );

    const sentidoSinUbicacion = createBaseMediaItem({
      sentido: { id: 's5', codigo: 'S-005', espanolGlosa: 'Sol' },
    });
    expect(formatMediaVinculacionSummary(sentidoSinUbicacion).taxonomyPath).toBeUndefined();

    const soloForma = createBaseMediaItem({
      forma: { id: 'f3', lema: 'mɵrɵ' },
      campoSemantico: { id: '1', codigo: 'C1', namtrikTermino: 'Ya', espanolTermino: 'Casa' },
    });
    expect(formatMediaVinculacionSummary(soloForma)).toEqual({
      primary: 'mɵrɵ',
      secondary: 'Forma léxica',
      taxonomyPath: 'C1 · Casa',
    });

    const soloTaxonomia = createBaseMediaItem({
      subcampoSemantico: { id: '2', codigo: 'C1.S1', namtrikTermino: 'S1', espanolTermino: null },
      microcampo: { id: '3', codigo: 'C1.S1.M1', namtrikTermino: 'M1', espanolTermino: null },
    });
    expect(formatMediaVinculacionSummary(soloTaxonomia)).toEqual({
      primary: 'C1.S1 · S1 › C1.S1.M1 · M1',
      secondary: 'Recurso taxonómico',
    });

    expect(formatMediaVinculacionSummary(createBaseMediaItem())).toEqual({
      primary: 'Sin vincular',
    });
  });

  it('construye items de lightbox para imagen y video con y sin poster', () => {
    const imagen = createBaseMediaItem({
      descripcionEspanol: null,
      descripcionNamtrik: 'Ya sɵ',
      hablanteAutor: 'Taita',
      varianteDialectal: 'Guambia',
      anchoPx: 800,
      altoPx: 600,
    });
    expect(toAdminLightboxMediaItem(imagen, 'imagen')).toEqual({
      src: `/api/media/${imagen.uuid}/stream`,
      alt: 'casa-misak.webp',
      tipo: 'imagen',
      descripcionEspanol: null,
      descripcionNamtrik: 'Ya sɵ',
      autor: 'Taita',
      variante: 'Guambia',
      licencia: 'Uso Comunitario Misak',
      anchoPx: 800,
      altoPx: 600,
    });

    const videoConPoster = createBaseMediaItem({
      tipo: 'video',
      descripcionEspanol: 'Tejido',
      duracionSegundos: 42,
      posterUuid: 'poster-uuid-1',
    });
    expect(toAdminLightboxMediaItem(videoConPoster, 'video')).toMatchObject({
      alt: 'Tejido',
      tipo: 'video',
      duracionSegundos: 42,
      posterSrc: '/api/media/poster-uuid-1/stream',
    });

    const videoSinPoster = createBaseMediaItem({
      tipo: 'video',
      duracionSegundos: 15,
      posterUuid: null,
    });
    expect(toAdminLightboxMediaItem(videoSinPoster, 'video').posterSrc).toBeNull();
  });
});
