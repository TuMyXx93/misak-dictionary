/**
 * PalabraRepository Tests
 * Sprint 3 - Dictionary API
 * Tests para el repositorio de palabras con búsqueda full-text y Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    palabraModelo1: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    palabraModelo2: {
      findUnique: vi.fn(),
    },
    sentidoLexico: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { PalabraRepository } from './PalabraRepository.js';

describe('PalabraRepository', () => {
  let repository: PalabraRepository;

  // ========== FIXTURES ==========
  const mockRawWord = {
    id: BigInt(1),
    namtrik_termino: 'ñimku',
    espanol_termino: 'tierra',
    namtrik_descripcion: 'Descripción en namtrik',
    espanol_descripcion: 'Descripción en español',
    namtrik_audio: 'audio1.mp3',
    espanol_audio: 'audio2.mp3',
    imagen: 'image1.jpg',
  };

  const mockPrismaWord = {
    id: BigInt(1),
    namtrikTermino: 'ñimku',
    espanolTermino: 'tierra',
    namtrikDescripcion: 'Descripción en namtrik',
    espanolDescripcion: 'Descripción en español',
    namtrikAudio: 'audio1.mp3',
    espanolAudio: 'audio2.mp3',
    imagen: 'image1.jpg',
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    microcampos: [
      {
        microcampo: {
          id: BigInt(10),
          namtrikTermino: 'microcampo1',
          subcampoSemantico: {
            id: BigInt(5),
            namtrikTermino: 'subcampo1',
            campoSemantico: {
              id: BigInt(2),
              namtrikTermino: 'campo1',
            },
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    repository = new PalabraRepository();
  });

  // ========== searchModelo1 ==========
  describe('searchModelo1', () => {
    it('debería usar $queryRaw para búsqueda full-text cuando se proporciona query', async () => {
      // Arrange
      const mockWords = [mockRawWord];
      const mockCount = [{ count: BigInt(1) }];
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockWords).mockResolvedValueOnce(mockCount);

      // Act
      const result = await repository.searchModelo1({
        query: 'tierra',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toEqual(mockWords);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('debería usar Prisma findMany cuando no se proporciona query', async () => {
      // Arrange
      const mockWords = [mockPrismaWord];
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue(mockWords);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(1);

      // Act
      const result = await repository.searchModelo1({ page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual(mockWords);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        include: { microcampos: { include: { microcampo: true } } },
        orderBy: { namtrikTermino: 'asc' },
      });
      expect(prisma.palabraModelo1.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('debería aplicar paginación por defecto (page=1, limit=20)', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue([]);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(0);

      // Act
      const result = await repository.searchModelo1({});

      // Assert
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('debería filtrar por microcampoId cuando se proporciona', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue([]);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(0);

      // Act
      await repository.searchModelo1({ microcampoId: BigInt(5) });

      // Assert
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            microcampos: { some: { microcampoId: BigInt(5) } },
          },
        }),
      );
    });
  });

  // ========== fallback sobre sentidoLexico y modo dual (R-026) ==========
  describe('búsqueda de fallback sobre sentidoLexico y modo dual (R-026)', () => {
    const mockSentido = {
      id: BigInt(42),
      codigo: 'C1.SENT.42',
      estado: 'borrador',
      espanolGlosa: 'montaña',
      espanolExplicacion: 'elevación natural',
      namtrikContexto: 'contexto',
      nombreCientifico: null,
      formas: [{ orden: 1, lema: 'Urrɵ' }],
      ubicaciones: [
        {
          microcampo: {
            id: BigInt(10),
            slug: 'montana',
            namtrikTermino: 'Urrɵ',
            subcampoSemantico: {
              id: BigInt(5),
              slug: 'geografia',
              namtrikTermino: 'Geografía',
              campoSemantico: {
                id: BigInt(1),
                slug: 'naturaleza',
                namtrikTermino: 'Naturaleza',
              },
            },
          },
        },
      ],
    };

    it('busca en sentidoLexico cuando palabras_modelo_1 devuelve 0 y proyecta codigo y estado', async () => {
      // Arrange: $queryRaw devuelve 0 palabras
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      // biome-ignore lint/suspicious/noExplicitAny: mock Prisma
      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([mockSentido] as any);
      vi.mocked(prisma.sentidoLexico.count).mockResolvedValue(1);

      // Act
      const result = await repository.searchModelo1({ query: 'montaña', page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe(BigInt(42));
      expect(result.data[0]?.codigo).toBe('C1.SENT.42');
      expect(result.data[0]?.estado).toBe('borrador');
      expect(result.data[0]?.namtrik_termino).toBe('Urrɵ');
      expect(result.data[0]?.namtrikTermino).toBe('Urrɵ');
      expect(result.data[0]?.espanolTermino).toBe('montaña');
      expect(result.data[0]?.ubicacion?.ruta).toBe('/campos/naturaleza/geografia/montana#term-42');
      expect(result.data[0]?.medios).toEqual([]);

      const whereSentidos = vi.mocked(prisma.sentidoLexico.findMany).mock.calls[0]?.[0]?.where;
      expect(whereSentidos?.deletedAt).toBeNull();
      expect(whereSentidos?.estado).toBeUndefined(); // Modo inclusivo por defecto
    });

    it('cuando PUBLIC_ONLY_RATIFIED es true, el fallback filtra solo estado ratificado', async () => {
      // Arrange
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        id: BigInt(1),
        key: 'PUBLIC_ONLY_RATIFIED',
        value: true,
        updatedAt: new Date(),
        updatedBy: BigInt(1),
      });
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sentidoLexico.count).mockResolvedValue(0);

      // Act
      await repository.searchModelo1({ query: 'montaña' });

      // Assert
      const whereSentidos = vi.mocked(prisma.sentidoLexico.findMany).mock.calls[0]?.[0]?.where;
      expect(whereSentidos?.deletedAt).toBeNull();
      expect(whereSentidos?.estado).toBe('ratificado');
    });
  });

  // ========== findModelo1ById ==========
  describe('findModelo1ById', () => {
    it('debería retornar la palabra con sus relaciones incluidas', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados profundos
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(mockPrismaWord as any);

      // Act
      const result = await repository.findModelo1ById(BigInt(1));

      // Assert
      expect(result).toEqual(mockPrismaWord);
      expect(prisma.palabraModelo1.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: {
          microcampos: {
            include: {
              microcampo: {
                include: {
                  subcampoSemantico: {
                    include: {
                      campoSemantico: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('debería retornar null cuando la palabra no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findModelo1ById(BigInt(999));

      // Assert
      expect(result).toBeNull();
    });
  });

  // ========== findModelo2ById ==========
  describe('findModelo2ById', () => {
    it('debería retornar la palabra modelo 2 con sus relaciones incluidas', async () => {
      // Arrange
      const mockModelo2Word = {
        ...mockPrismaWord,
        id: BigInt(100),
      };
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados profundos
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(mockModelo2Word as any);

      // Act
      const result = await repository.findModelo2ById(BigInt(100));

      // Assert
      expect(result).toEqual(mockModelo2Word);
      expect(prisma.palabraModelo2.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(100) },
        include: {
          microcampos: {
            include: {
              microcampo: {
                include: {
                  subcampoSemantico: {
                    include: {
                      campoSemantico: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  });
});
