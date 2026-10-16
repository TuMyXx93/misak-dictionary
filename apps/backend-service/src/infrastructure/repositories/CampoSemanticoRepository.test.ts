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
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { CampoSemanticoRepository } from './CampoSemanticoRepository.js';

const MICROCAMPOS_ESPERADOS = {
  where: { deletedAt: null },
  orderBy: [{ posicion: 'asc' }, { codigo: 'asc' }],
  include: {
    palabrasM1: {
      where: { palabra: { deletedAt: null } },
      include: { palabra: true },
    },
  },
};

const INCLUDE_ESPERADO = {
  subcampos: {
    where: { deletedAt: null },
    orderBy: { posicion: 'asc' },
    include: { microcampos: MICROCAMPOS_ESPERADOS },
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
});
