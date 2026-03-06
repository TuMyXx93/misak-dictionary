/**
 * CampoSemanticoRepository Tests
 * Sprint 3 - Dictionary API
 * Tests para el repositorio de campos semánticos con Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    campoSemantico: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { CampoSemanticoRepository } from './CampoSemanticoRepository.js';

describe('CampoSemanticoRepository', () => {
  let repository: CampoSemanticoRepository;

  // ========== FIXTURES ==========
  const mockCampoWithHierarchy = {
    id: BigInt(1),
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Nature',
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    subcampos: [
      {
        id: BigInt(10),
        namtrikTermino: 'Animales',
        espanolTermino: 'Animals',
        campoSemanticoId: BigInt(1),
        deletedAt: null,
        microcampos: [
          {
            id: BigInt(100),
            namtrikTermino: 'Aves',
            espanolTermino: 'Birds',
            subcampoSemanticoId: BigInt(10),
            deletedAt: null,
          },
        ],
      },
    ],
  };

  const mockCampoSimple = {
    id: BigInt(1),
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Nature',
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    repository = new CampoSemanticoRepository();
  });

  // ========== findAllWithHierarchy ==========
  describe('findAllWithHierarchy', () => {
    it('debería retornar todos los campos con jerarquía completa', async () => {
      // Arrange
      const mockCampos = [mockCampoWithHierarchy];
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue(mockCampos as any);

      // Act
      const result = await repository.findAllWithHierarchy();

      // Assert
      expect(result).toEqual(mockCampos);
      expect(result).toHaveLength(1);
      // biome-ignore lint/suspicious/noExplicitAny: accediendo propiedades del mock tipado
      expect((result as any)[0].subcampos).toHaveLength(1);
      // biome-ignore lint/suspicious/noExplicitAny: accediendo propiedades del mock tipado
      expect((result as any)[0].subcampos[0].microcampos).toHaveLength(1);
    });

    it('debería llamar a Prisma con where/include/orderBy correctos', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([]);

      // Act
      await repository.findAllWithHierarchy();

      // Assert
      expect(prisma.campoSemantico.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          subcampos: {
            where: { deletedAt: null },
            include: {
              microcampos: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { namtrikTermino: 'asc' },
      });
    });
  });

  // ========== findByIdWithHierarchy ==========
  describe('findByIdWithHierarchy', () => {
    it('debería retornar el campo con jerarquía cuando existe', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(mockCampoWithHierarchy as any);

      // Act
      const result = await repository.findByIdWithHierarchy(BigInt(1));

      // Assert
      expect(result).toEqual(mockCampoWithHierarchy);
      expect(prisma.campoSemantico.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: {
          subcampos: {
            where: { deletedAt: null },
            include: {
              microcampos: {
                where: { deletedAt: null },
              },
            },
          },
        },
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

  // ========== findAll ==========
  describe('findAll', () => {
    it('debería retornar lista simple de campos semánticos', async () => {
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
        orderBy: { namtrikTermino: 'asc' },
      });
    });
  });
});
