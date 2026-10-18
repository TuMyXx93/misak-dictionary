/**
 * CampoSemanticoRepository Tests
 * Sprint 3 - Dictionary API · Spec 004 (árbol de microcampos)
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
import {
  buildHierarchyInclude,
  CampoSemanticoRepository,
  mapearSentidoUbicacion,
} from './CampoSemanticoRepository.js';

const SENTIDOS_UBICACIONES_ESPERADOS = {
  where: { sentido: { deletedAt: null } },
  orderBy: { posicion: 'asc' },
  include: {
    sentido: {
      include: {
        formas: { orderBy: { orden: 'asc' } },
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
  },
};

const INCLUDE_ESPERADO = {
  sentidosUbicacion: SENTIDOS_UBICACIONES_ESPERADOS,
  subcampos: {
    where: { deletedAt: null },
    orderBy: { posicion: 'asc' },
    include: {
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
    });
  });
});
