import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError.js';
import { ManageTaxonomiaUseCase } from './ManageTaxonomiaUseCase.js';

describe('ManageTaxonomiaUseCase (Spec 012 v0.2.0 - Protección Jerárquica 409)', () => {
  let useCase: ManageTaxonomiaUseCase;
  let mockPrisma: any;
  let mockAuditService: any;

  const mockActor = {
    userId: 101n,
    username: 'admin_test',
  };

  beforeEach(() => {
    mockPrisma = {
      campoSemantico: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      subcampoSemantico: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      microcampo: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ManageTaxonomiaUseCase(mockPrisma, mockAuditService);
  });

  describe('eliminarCampo', () => {
    it('lanza 409 Conflict si el campo contiene subcampos activos', async () => {
      mockPrisma.campoSemantico.findUnique.mockResolvedValueOnce({
        id: 1n,
        codigo: 'C1',
        deletedAt: null,
        subcampos: [{ id: 10n }],
        sentidosUbicacion: [],
      });

      await expect(useCase.eliminarCampo('1', mockActor)).rejects.toThrow(
        /contiene 1 subcampos activos/i,
      );
    });

    it('lanza 409 Conflict si el campo contiene términos directamente asociados', async () => {
      mockPrisma.campoSemantico.findUnique.mockResolvedValueOnce({
        id: 1n,
        codigo: 'C1',
        deletedAt: null,
        subcampos: [],
        sentidosUbicacion: [{ id: 100n }],
      });

      await expect(useCase.eliminarCampo('1', mockActor)).rejects.toThrow(
        /contiene 1 términos léxicos asociados/i,
      );
    });

    it('realiza soft-delete exitoso si el campo no tiene dependencias activas', async () => {
      mockPrisma.campoSemantico.findUnique.mockResolvedValueOnce({
        id: 1n,
        codigo: 'C1',
        deletedAt: null,
        subcampos: [],
        sentidosUbicacion: [],
      });
      mockPrisma.campoSemantico.update.mockResolvedValueOnce({ id: 1n, deletedAt: new Date() });

      const res = await useCase.eliminarCampo('1', mockActor);
      expect(res.success).toBe(true);
      expect(mockPrisma.campoSemantico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1n },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(mockAuditService.record).toHaveBeenCalled();
    });
  });

  describe('eliminarSubcampo', () => {
    it('lanza 409 Conflict si el subcampo contiene microcampos activos', async () => {
      mockPrisma.subcampoSemantico.findUnique.mockResolvedValueOnce({
        id: 10n,
        codigo: 'C1.S1',
        deletedAt: null,
        microcampos: [{ id: 100n }, { id: 101n }],
        sentidosUbicacion: [],
      });

      await expect(useCase.eliminarSubcampo('10', mockActor)).rejects.toThrow(
        /contiene 2 microcampos activos/i,
      );
    });

    it('lanza 409 Conflict si el subcampo contiene términos léxicos asociados', async () => {
      mockPrisma.subcampoSemantico.findUnique.mockResolvedValueOnce({
        id: 10n,
        codigo: 'C1.S1',
        deletedAt: null,
        microcampos: [],
        sentidosUbicacion: [{ id: 50n }],
      });

      await expect(useCase.eliminarSubcampo('10', mockActor)).rejects.toThrow(
        /contiene 1 términos léxicos asociados/i,
      );
    });
  });

  describe('eliminarMicrocampo', () => {
    it('lanza 409 Conflict si el microcampo contiene subniveles activos', async () => {
      mockPrisma.microcampo.findUnique.mockResolvedValueOnce({
        id: 100n,
        codigo: 'C1.S1.M1',
        deletedAt: null,
        subniveles: [{ id: 1000n }],
        sentidosUbicacion: [],
        palabrasM1: [],
        palabrasM2: [],
      });

      await expect(useCase.eliminarMicrocampo('100', mockActor)).rejects.toThrow(
        /contiene 1 subniveles activos/i,
      );
    });

    it('lanza 409 Conflict si el microcampo contiene términos léxicos asociados', async () => {
      mockPrisma.microcampo.findUnique.mockResolvedValueOnce({
        id: 100n,
        codigo: 'C1.S1.M1',
        deletedAt: null,
        subniveles: [],
        sentidosUbicacion: [{ id: 201n }],
        palabrasM1: [],
        palabrasM2: [],
      });

      await expect(useCase.eliminarMicrocampo('100', mockActor)).rejects.toThrow(
        /contiene 1 términos léxicos asociados/i,
      );
    });

    it('realiza soft-delete exitoso si el microcampo es una hoja vacía', async () => {
      mockPrisma.microcampo.findUnique.mockResolvedValueOnce({
        id: 100n,
        codigo: 'C1.S1.M1',
        deletedAt: null,
        subniveles: [],
        sentidosUbicacion: [],
        palabrasM1: [],
        palabrasM2: [],
      });
      mockPrisma.microcampo.update.mockResolvedValueOnce({ id: 100n, deletedAt: new Date() });

      const res = await useCase.eliminarMicrocampo('100', mockActor);
      expect(res.success).toBe(true);
      expect(mockPrisma.microcampo.update).toHaveBeenCalled();
    });
  });

  describe('obtenerArbol', () => {
    it('construye la jerarquía completa y suma los términos', async () => {
      mockPrisma.campoSemantico.findMany.mockResolvedValueOnce([
        {
          id: 1n,
          codigo: 'C1',
          slug: 'ya',
          namtrikTermino: 'Yá',
          espanolTermino: 'Naturaleza',
          posicion: 0,
        },
      ]);
      mockPrisma.subcampoSemantico.findMany.mockResolvedValueOnce([
        {
          id: 10n,
          campoSemanticoId: 1n,
          codigo: 'C1.S1',
          slug: 'nakchak',
          namtrikTermino: 'Nakchak',
          espanolTermino: 'Territorio',
          posicion: 0,
        },
      ]);
      mockPrisma.microcampo.findMany.mockResolvedValueOnce([
        {
          id: 100n,
          subcampoSemanticoId: 10n,
          padreId: null,
          profundidad: 0,
          codigo: 'C1.S1.M1',
          slug: 'wammera',
          namtrikTermino: 'Wammera',
          espanolTermino: 'Lengua y memoria',
          posicion: 0,
        },
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          campo_semantico_id: null,
          subcampo_semantico_id: null,
          microcampo_id: 100n,
          total: 7n,
        },
      ]);

      const tree = await useCase.obtenerArbol();
      expect(tree).toHaveLength(1);
      expect(tree[0].codigo).toBe('C1');
      expect(tree[0].totalTerminos).toBe(7);
      expect(tree[0].hijos).toHaveLength(1);
      expect(tree[0].hijos![0].codigo).toBe('C1.S1');
      expect(tree[0].hijos![0].totalTerminos).toBe(7);
      expect(tree[0].hijos![0].hijos![0].codigo).toBe('C1.S1.M1');
      expect(tree[0].hijos![0].hijos![0].totalTerminos).toBe(7);
    });
  });
});
