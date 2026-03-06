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
