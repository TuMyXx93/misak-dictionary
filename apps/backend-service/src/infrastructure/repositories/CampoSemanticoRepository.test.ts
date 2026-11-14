/**
 * CampoSemanticoRepository Tests
 * Spec 003 / Spec 004 — Dictionary API (árbol de microcampos)
 * Tests para el repositorio de campos semánticos con Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    campoSemantico: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
    },
    homeSlot: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { SystemSettingsService } from '../../shared/settings/SystemSettingsService.js';
import {
  buildHierarchyInclude,
  CampoSemanticoRepository,
  mapearSentidoUbicacion,
} from './CampoSemanticoRepository.js';

const MEDIOS_INCLUDE_ESPERADO = {
  where: { deletedAt: null, estado: 'ratificado' },
  orderBy: { createdAt: 'asc' },
};

const SENTIDOS_UBICACIONES_ESPERADOS = {
  where: { sentido: { deletedAt: null } },
  orderBy: { posicion: 'asc' },
  include: {
    sentido: {
      include: {
        formas: {
          orderBy: { orden: 'asc' },
          include: {
            medios: MEDIOS_INCLUDE_ESPERADO,
          },
        },
        medios: MEDIOS_INCLUDE_ESPERADO,
      },
    },
  },
};

const MICROCAMPOS_ESPERADOS = {
  where: { deletedAt: null },
  orderBy: [{ posicion: 'asc' }, { codigo: 'asc' }],
  include: {
    palabrasM1: {
      where: { palabra: { deletedAt: null } },
      include: { palabra: true },
    },
    sentidosUbicacion: SENTIDOS_UBICACIONES_ESPERADOS,
    medios: MEDIOS_INCLUDE_ESPERADO,
  },
};

const INCLUDE_ESPERADO = {
  medios: MEDIOS_INCLUDE_ESPERADO,
  sentidosUbicacion: SENTIDOS_UBICACIONES_ESPERADOS,
  subcampos: {
    where: { deletedAt: null },
    orderBy: { posicion: 'asc' },
    include: {
      medios: MEDIOS_INCLUDE_ESPERADO,
      sentidosUbicacion: SENTIDOS_UBICACIONES_ESPERADOS,
      microcampos: MICROCAMPOS_ESPERADOS,
    },
  },
};

describe('CampoSemanticoRepository', () => {
  let repository: CampoSemanticoRepository;

  // ========== FIXTURES ==========
  // Microcampos planos, como los devuelve Prisma: el árbol lo arma el repositorio.
  const microcamposPlanos = [
    {
      id: BigInt(100),
      codigo: 'C1.S1.M1',
      padreId: null,
      posicion: 1,
      namtrikTermino: 'Aves',
      espanolTermino: 'Birds',
      deletedAt: null,
      palabrasM1: [],
    },
    {
      id: BigInt(101),
      codigo: 'C1.S1.M1.1',
      padreId: BigInt(100),
      posicion: 1,
      namtrikTermino: null,
      espanolTermino: 'Plumaje',
      deletedAt: null,
      palabrasM1: [],
    },
    {
      id: BigInt(102),
      codigo: 'C1.S1.M1.1.1',
      padreId: BigInt(101),
      posicion: 1,
      namtrikTermino: null,
      espanolTermino: 'Pluma',
      deletedAt: null,
      palabrasM1: [],
    },
  ];

  const mockCampoConJerarquia = {
    id: BigInt(1),
    codigo: 'C1',
    slug: 'naturaleza',
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Nature',
    deletedAt: null,
    subcampos: [
      {
        id: BigInt(10),
        codigo: 'C1.S1',
        namtrikTermino: 'Animales',
        espanolTermino: 'Animals',
        campoSemanticoId: BigInt(1),
        deletedAt: null,
        microcampos: microcamposPlanos,
      },
    ],
  };

  const mockCampoSimple = {
    id: BigInt(1),
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Nature',
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    new SystemSettingsService().invalidateCache();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    repository = new CampoSemanticoRepository();
  });

  // ========== findAllWithHierarchy ==========
  describe('findAllWithHierarchy', () => {
    it('debería devolver solo los microcampos de primer nivel, con sus subniveles anidados', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([mockCampoConJerarquia] as any);

      // Act
      const result = await repository.findAllWithHierarchy();

      // Assert
      const micros = result[0]?.subcampos[0]?.microcampos ?? [];
      expect(micros.map((m) => m.codigo)).toEqual(['C1.S1.M1']);
      expect(micros[0]?.subniveles[0]?.codigo).toBe('C1.S1.M1.1');
      expect(micros[0]?.subniveles[0]?.subniveles[0]?.codigo).toBe('C1.S1.M1.1.1');
    });

    it('debería llamar a Prisma con where/include/orderBy correctos', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([]);

      // Act
      await repository.findAllWithHierarchy();

      // Assert
      expect(prisma.campoSemantico.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: INCLUDE_ESPERADO,
        orderBy: { posicion: 'asc' },
      });
    });
  });

  // ========== findByIdWithHierarchy ==========
  describe('findByIdWithHierarchy', () => {
    it('debería retornar el campo con el árbol de microcampos cuando existe', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(mockCampoConJerarquia as any);

      // Act
      const result = await repository.findByIdWithHierarchy(BigInt(1));

      // Assert
      expect(result?.subcampos[0]?.microcampos[0]?.subniveles[0]?.subniveles).toHaveLength(1);
      expect(prisma.campoSemantico.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: INCLUDE_ESPERADO,
      });
    });

    it('debería retornar null cuando el campo no existe', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findByIdWithHierarchy(BigInt(999));

      // Assert
      expect(result).toBeNull();
    });
  });

  // ========== findBySlugWithHierarchy ==========
  describe('findBySlugWithHierarchy', () => {
    it('debería buscar por el slug persistido del campo, no por el nombre namtrik', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(mockCampoConJerarquia as any);

      // Act
      const result = await repository.findBySlugWithHierarchy('naturaleza');

      // Assert
      expect(result?.codigo).toBe('C1');
      expect(prisma.campoSemantico.findFirst).toHaveBeenCalledWith({
        where: { slug: 'naturaleza', deletedAt: null },
        include: INCLUDE_ESPERADO,
      });
    });

    it('debería retornar null cuando ningún campo activo tiene ese slug', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(null);

      // Act
      const result = await repository.findBySlugWithHierarchy('no-existe');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ========== findAll ==========
  describe('findAll', () => {
    it('debería retornar lista simple de campos semánticos ordenada por posición', async () => {
      // Arrange
      const mockCampos = [mockCampoSimple];
      // biome-ignore lint/suspicious/noExplicitAny: mock simplificado de Prisma
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue(mockCampos as any);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(mockCampos);
      expect(prisma.campoSemantico.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { posicion: 'asc' },
      });
    });
  });

  // ========== sentidos y formas multinivel (Spec 005) ==========
  describe('sentidos y formas multinivel', () => {
    it('debería proyectar sentidos en campo, subcampo y microcampos cuando existen ubicaciones', async () => {
      // Arrange
      const mockConSentidos = {
        ...mockCampoConJerarquia,
        sentidosUbicacion: [
          {
            posicion: 1,
            sentido: {
              id: BigInt(501),
              codigo: 'C1.SENT.1',
              tipo: 'estandar',
              namtrikContexto: 'Contexto campo',
              espanolGlosa: 'Glosa campo',
              espanolExplicacion: 'Explicación campo',
              nombreCientifico: null,
              respuestaNamtrik: null,
              respuestaNamtrikContexto: null,
              respuestaEspanolGlosa: null,
              respuestaEspanolExplicacion: null,
              formas: [
                {
                  id: BigInt(601),
                  orden: 1,
                  lema: 'Ya',
                  acepcionHomonima: null,
                  categoriaGramatical: 'sust.',
                  variante: null,
                  esNeologismo: false,
                  rasgosGramaticales: [],
                  etiquetaOriginal: null,
                },
              ],
            },
          },
        ],
        subcampos: [
          {
            ...mockCampoConJerarquia.subcampos[0],
            sentidosUbicacion: [
              {
                posicion: 1,
                sentido: {
                  id: BigInt(502),
                  codigo: 'C1.S1.SENT.1',
                  tipo: 'dialogico',
                  namtrikContexto: 'Pregunta saludo',
                  espanolGlosa: 'Hola',
                  espanolExplicacion: null,
                  nombreCientifico: null,
                  respuestaNamtrik: 'Yúsrɵ',
                  respuestaNamtrikContexto: 'Respuesta saludo',
                  respuestaEspanolGlosa: 'Hola respuesta',
                  respuestaEspanolExplicacion: null,
                  formas: [
                    {
                      id: BigInt(602),
                      orden: 1,
                      lema: 'Munásrɵ?',
                      acepcionHomonima: null,
                      categoriaGramatical: null,
                      variante: null,
                      esNeologismo: false,
                      rasgosGramaticales: [],
                      etiquetaOriginal: null,
                    },
                  ],
                },
              },
            ],
            microcampos: [
              {
                ...microcamposPlanos[0],
                sentidosUbicacion: [
                  {
                    posicion: 1,
                    sentido: {
                      id: BigInt(503),
                      codigo: 'C1.S1.M1.SENT.1',
                      tipo: 'estandar',
                      namtrikContexto: null,
                      espanolGlosa: 'Picaflor',
                      espanolExplicacion: 'Ave pequeña',
                      nombreCientifico: 'Trochilidae',
                      respuestaNamtrik: null,
                      respuestaNamtrikContexto: null,
                      respuestaEspanolGlosa: null,
                      respuestaEspanolExplicacion: null,
                      formas: [
                        {
                          id: BigInt(603),
                          orden: 1,
                          lema: 'Pichillim',
                          acepcionHomonima: null,
                          categoriaGramatical: 'sust.',
                          variante: null,
                          esNeologismo: false,
                          rasgosGramaticales: [],
                          etiquetaOriginal: null,
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      // biome-ignore lint/suspicious/noExplicitAny: mock con sentidos
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(mockConSentidos as any);

      // Act
      const result = await repository.findBySlugWithHierarchy('naturaleza');

      // Assert
      expect(result?.sentidos).toHaveLength(1);
      expect(result?.sentidos[0]?.codigo).toBe('C1.SENT.1');
      expect(result?.sentidos[0]?.namtrikTermino).toBe('Ya');

      const subcampo = result?.subcampos[0];
      expect(subcampo?.sentidos).toHaveLength(1);
      expect(subcampo?.sentidos[0]?.tipo).toBe('dialogico');
      expect(subcampo?.sentidos[0]?.dialogo?.respuestaNamtrik).toBe('Yúsrɵ');

      const micro = subcampo?.microcampos[0];
      expect(micro?.sentidos).toHaveLength(1);
      expect(micro?.sentidos[0]?.nombreCientifico).toBe('Trochilidae');
      expect(micro?.sentidos[0]?.formas[0]?.lema).toBe('Pichillim');
    });
  });

  // ========== findHomeSlots ==========
  describe('findHomeSlots', () => {
    it('debería mapear slots y excluir campos borrados', async () => {
      // Arrange
      const mockSlots = [
        {
          id: BigInt(1),
          clave: 'slot_1',
          etiqueta: 'Slot 1',
          posicion: 1,
          campo: {
            id: BigInt(10),
            codigo: 'C1',
            slug: 'ya',
            namtrikTermino: 'Ya',
            espanolTermino: 'La casa',
            espanolDescripcion: 'Descripción',
            deletedAt: null,
          },
        },
        {
          id: BigInt(2),
          clave: 'slot_2',
          etiqueta: 'Slot 2',
          posicion: 2,
          campo: {
            id: BigInt(20),
            codigo: 'C2',
            slug: 'borrado',
            namtrikTermino: 'Borrado',
            espanolTermino: 'Borrado',
            espanolDescripcion: null,
            deletedAt: new Date(),
          },
        },
      ];
      // biome-ignore lint/suspicious/noExplicitAny: mock Prisma
      vi.mocked(prisma.homeSlot.findMany).mockResolvedValue(mockSlots as any);

      // Act
      const result = await repository.findHomeSlots();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.campo?.codigo).toBe('C1');
      expect(result[1]?.campo).toBeNull();
    });
  });

  // ========== R-026: Exposición pública del estado y modo dual ==========
  describe('R-026: Exposición pública del estado y modo dual', () => {
    it('buildHierarchyInclude() construye el filtro correcto según onlyRatified', () => {
      const includeInclusivo = buildHierarchyInclude(false);
      expect(includeInclusivo.sentidosUbicacion.where.sentido).toEqual({
        deletedAt: null,
      });

      const includeEstricto = buildHierarchyInclude(true);
      expect(includeEstricto.sentidosUbicacion.where.sentido).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
    });

    it('mapearSentidoUbicacion expone el campo estado correctamente', () => {
      // biome-ignore lint/suspicious/noExplicitAny: row de prueba
      const rowBorrador: any = {
        posicion: 1,
        sentido: {
          id: BigInt(10),
          codigo: 'C1.SENT.1',
          tipo: 'estandar',
          estado: 'borrador',
          namtrikContexto: null,
          espanolGlosa: 'Término en borrador',
          espanolExplicacion: null,
          nombreCientifico: null,
          respuestaNamtrik: null,
          respuestaNamtrikContexto: null,
          respuestaEspanolGlosa: null,
          respuestaEspanolExplicacion: null,
          formas: [{ orden: 1, lema: 'Lema' }],
        },
      };

      const mapeado = mapearSentidoUbicacion(rowBorrador);
      expect(mapeado.estado).toBe('borrador');
      expect(mapeado.codigo).toBe('C1.SENT.1');
    });

    it('cuando PUBLIC_ONLY_RATIFIED es true, filtra con estado ratificado', async () => {
      // Arrange: simular bandera activa en BD
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        id: BigInt(1),
        key: 'PUBLIC_ONLY_RATIFIED',
        value: true,
        updatedAt: new Date(),
        updatedBy: BigInt(1),
      });
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([]);

      const customRepo = new CampoSemanticoRepository();

      // Act
      await customRepo.findAllWithHierarchy();

      // Assert
      const llamada = vi.mocked(prisma.campoSemantico.findMany).mock.calls[0]?.[0];
      expect(llamada?.include?.sentidosUbicacion?.where?.sentido).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
      expect(llamada?.include?.medios?.where).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
    });

    it('proyecta medios públicos en campo, subcampo, microcampo recursivo, sentido y forma preservando campos legados', async () => {
      const crearMedioFixture = (id: number, uuid: string, tipo: string, proposito: string) => ({
        id: BigInt(id),
        uuid,
        tipo,
        proposito,
        mimetype: tipo === 'video' ? 'video/mp4' : 'audio/mpeg',
        estado: 'ratificado',
        duracionSegundos: 12.5,
        anchoPx: tipo === 'video' ? 1920 : null,
        altoPx: tipo === 'video' ? 1080 : null,
        hablanteAutor: 'Taita Misak',
        varianteDialectal: 'Guambía',
        descripcionEspanol: 'Descripción medio',
        descripcionNamtrik: 'Wam',
        licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
        posterUuid: tipo === 'video' ? '11111111-1111-4111-8111-111111111111' : null,
        metadata: tipo === 'video' ? { codec: 'h264' } : null,
      });

      const mockJerarquiaMultimedia = {
        ...mockCampoConJerarquia,
        imagen: 'legacy-campo.webp',
        namtrikAudio: 'legacy-campo-nam.mp3',
        espanolAudio: 'legacy-campo-esp.mp3',
        medios: [
          crearMedioFixture(
            1,
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'video',
            'recorrido_territorial',
          ),
        ],
        sentidosUbicacion: [
          {
            posicion: 1,
            sentido: {
              id: BigInt(700),
              codigo: 'C1.SENT.1',
              tipo: 'estandar',
              estado: 'ratificado',
              namtrikContexto: null,
              espanolGlosa: 'Casa grande',
              espanolExplicacion: null,
              nombreCientifico: null,
              respuestaNamtrik: null,
              respuestaNamtrikContexto: null,
              respuestaEspanolGlosa: null,
              respuestaEspanolExplicacion: null,
              medios: [
                crearMedioFixture(
                  2,
                  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                  'video',
                  'registro_practica_cultural',
                ),
              ],
              formas: [
                {
                  id: BigInt(800),
                  orden: 1,
                  lema: 'Ya',
                  acepcionHomonima: null,
                  categoriaGramatical: 'sust.',
                  variante: null,
                  esNeologismo: false,
                  rasgosGramaticales: [],
                  etiquetaOriginal: null,
                  medios: [
                    crearMedioFixture(
                      3,
                      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                      'audio',
                      'pronunciacion_lema',
                    ),
                  ],
                },
              ],
            },
          },
        ],
        subcampos: [
          {
            ...mockCampoConJerarquia.subcampos[0],
            medios: [
              crearMedioFixture(
                4,
                'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                'video',
                'relato_oral_video',
              ),
            ],
            microcampos: [
              {
                ...microcamposPlanos[0],
                medios: [
                  crearMedioFixture(
                    5,
                    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
                    'audio',
                    'contexto_oracion',
                  ),
                ],
              },
              {
                ...microcamposPlanos[1],
                medios: [
                  crearMedioFixture(
                    6,
                    'ffffffff-ffff-4fff-8fff-ffffffffffff',
                    'video',
                    'demostracion_uso',
                  ),
                ],
              },
            ],
          },
        ],
      };

      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con medios en todos los niveles
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(mockJerarquiaMultimedia as any);

      const result = await repository.findBySlugWithHierarchy('naturaleza');

      expect(result?.imagen).toBe('legacy-campo.webp');
      expect(result?.namtrikAudio).toBe('legacy-campo-nam.mp3');
      expect(result?.espanolAudio).toBe('legacy-campo-esp.mp3');
      expect(result?.medios).toHaveLength(1);
      expect(result?.medios[0]).toMatchObject({
        uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        tipo: 'video',
        proposito: 'recorrido_territorial',
        posterUuid: '11111111-1111-4111-8111-111111111111',
        metadata: { codec: 'h264' },
        streamUrl: '/api/media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/stream',
      });

      expect(result?.sentidos[0]?.medios[0]?.streamUrl).toBe(
        '/api/media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/stream',
      );
      expect(result?.sentidos[0]?.formas[0]?.medios[0]?.streamUrl).toBe(
        '/api/media/cccccccc-cccc-4ccc-8ccc-cccccccccccc/stream',
      );
      expect(result?.subcampos[0]?.medios[0]?.proposito).toBe('relato_oral_video');
      expect(result?.subcampos[0]?.microcampos[0]?.medios[0]?.uuid).toBe(
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      );
      expect(result?.subcampos[0]?.microcampos[0]?.subniveles[0]?.medios[0]?.uuid).toBe(
        'ffffffff-ffff-4fff-8fff-ffffffffffff',
      );
    });

    it('mantiene filtro estado="ratificado" en medios públicos aunque PUBLIC_ONLY_RATIFIED sea false (Opción A)', async () => {
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        clave: 'PUBLIC_ONLY_RATIFIED',
        valor: 'false',
        // biome-ignore lint/suspicious/noExplicitAny: mock parcial de SystemSetting
      } as any);
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(null);

      await repository.findBySlugWithHierarchy('naturaleza');

      const findFirstArg = vi.mocked(prisma.campoSemantico.findFirst).mock.calls[0]?.[0] as {
        include: {
          medios: { where: { deletedAt: null; estado?: string } };
          sentidosUbicacion: {
            where: { sentido: { deletedAt: null; estado?: string } };
            include: {
              sentido: {
                include: {
                  medios: { where: { deletedAt: null; estado?: string } };
                  formas: { include: { medios: { where: { deletedAt: null; estado?: string } } } };
                };
              };
            };
          };
          subcampos: {
            include: {
              medios: { where: { deletedAt: null; estado?: string } };
              microcampos: { include: { medios: { where: { deletedAt: null; estado?: string } } } };
            };
          };
        };
      };

      expect(findFirstArg.include.sentidosUbicacion.where.sentido).toEqual({ deletedAt: null });
      expect(findFirstArg.include.medios.where).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
      expect(findFirstArg.include.sentidosUbicacion.include.sentido.include.medios.where).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
      expect(
        findFirstArg.include.sentidosUbicacion.include.sentido.include.formas.include.medios.where,
      ).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
      expect(findFirstArg.include.subcampos.include.medios.where).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
      expect(findFirstArg.include.subcampos.include.microcampos.include.medios.where).toEqual({
        deletedAt: null,
        estado: 'ratificado',
      });
    });
  });
});
