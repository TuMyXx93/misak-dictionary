import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { ManageTaxonomiaUseCase } from './ManageTaxonomiaUseCase.js';

describe('ManageTaxonomiaUseCase (Spec 012 v0.2.0 - Protección Jerárquica 409)', () => {
  const createMockPrisma = () => ({
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
  });
  let useCase: ManageTaxonomiaUseCase;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { record: ReturnType<typeof vi.fn> };

  const mockActor = {
    userId: 101n,
    username: 'admin_test',
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ManageTaxonomiaUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
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
      expect(tree[0]?.codigo).toBe('C1');
      expect(tree[0]?.totalTerminos).toBe(7);
      expect(tree[0]?.hijos).toHaveLength(1);
      expect(tree[0]?.hijos?.[0]?.codigo).toBe('C1.S1');
      expect(tree[0]?.hijos?.[0]?.totalTerminos).toBe(7);
      expect(tree[0]?.hijos?.[0]?.hijos?.[0]?.codigo).toBe('C1.S1.M1');
      expect(tree[0]?.hijos?.[0]?.hijos?.[0]?.totalTerminos).toBe(7);
    });

    it('soporta microcampos subnivel recursivos y conteos directos en campo y subcampo', async () => {
      mockPrisma.campoSemantico.findMany.mockResolvedValueOnce([
        {
          id: 1n,
          codigo: 'C1',
          slug: 'ya',
          namtrikTermino: 'Ya',
          espanolTermino: 'Casa',
          posicion: 0,
        },
      ]);
      mockPrisma.subcampoSemantico.findMany.mockResolvedValueOnce([
        {
          id: 10n,
          campoSemanticoId: 1n,
          codigo: 'C1.S1',
          slug: 'espacios',
          namtrikTermino: 'Ya srɵ',
          espanolTermino: 'Espacios',
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
          slug: 'fogon',
          namtrikTermino: null,
          espanolTermino: 'Fogón',
          posicion: 0,
        },
        {
          id: 101n,
          subcampoSemanticoId: 10n,
          padreId: 100n,
          profundidad: 1,
          codigo: 'C1.S1.M1.1',
          slug: 'ceniza',
          namtrikTermino: 'Kɵsik',
          espanolTermino: 'Ceniza',
          posicion: 1,
        },
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { campo_semantico_id: 1n, subcampo_semantico_id: null, microcampo_id: null, total: 2n },
        { campo_semantico_id: null, subcampo_semantico_id: 10n, microcampo_id: null, total: 3n },
        { campo_semantico_id: null, subcampo_semantico_id: null, microcampo_id: 101n, total: 4n },
      ]);

      const tree = await useCase.obtenerArbol();
      expect(tree[0]?.totalTerminos).toBe(9);
      const subnivel = tree[0]?.hijos?.[0]?.hijos?.[0]?.hijos?.[0];
      expect(subnivel?.nivel).toBe('subnivel');
      expect(subnivel?.totalTerminos).toBe(4);
    });
  });

  describe('CRUD completo de Campos, Subcampos y Microcampos', () => {
    it('crearCampo valida colisión 409 y crea campo normalizando Namtrik', async () => {
      mockPrisma.campoSemantico.findFirst
        .mockResolvedValueOnce({ id: 1n, codigo: 'C1' })
        .mockResolvedValueOnce(null);
      mockPrisma.campoSemantico.create.mockResolvedValueOnce({
        id: 2n,
        codigo: 'C2',
        slug: 'ya-tul',
        namtrikTermino: 'Ya tul',
      });

      await expect(
        useCase.crearCampo(
          {
            codigo: 'C1',
            slug: 'ya',
            namtrikTermino: 'Ya',
            espanolTermino: 'Casa',
            posicion: 1,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 409 });

      const created = await useCase.crearCampo(
        {
          codigo: 'C2',
          slug: 'ya-tul',
          namtrikTermino: 'Ya tul',
          espanolTermino: 'Huerta',
          posicion: 2,
        },
        mockActor,
      );
      expect(created.codigo).toBe('C2');
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entity: 'campo_semantico' }),
      );
    });

    it('actualizarCampo maneja 404 y actualiza campos opcionales', async () => {
      mockPrisma.campoSemantico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1n, codigo: 'C1', deletedAt: null });
      mockPrisma.campoSemantico.update.mockResolvedValueOnce({ id: 1n, codigo: 'C1' });

      await expect(
        useCase.actualizarCampo('999', { espanolTermino: 'Nuevo' }, mockActor),
      ).rejects.toMatchObject({ statusCode: 404 });

      const updated = await useCase.actualizarCampo(
        '1',
        {
          namtrikTermino: 'Ya',
          namtrikDescripcion: 'Desc N',
          namtrikAudio: 'a.mp3',
          espanolTermino: 'La casa',
          espanolDescripcion: 'Desc E',
          espanolAudio: 'e.mp3',
          imagen: 'img.webp',
          posicion: 3,
        },
        mockActor,
      );
      expect(updated.id).toBe(1n);
    });

    it('eliminarCampo lanza 404 si el campo no existe o está eliminado', async () => {
      mockPrisma.campoSemantico.findUnique.mockResolvedValueOnce({
        id: 1n,
        deletedAt: new Date(),
        subcampos: [],
        sentidosUbicacion: [],
      });
      await expect(useCase.eliminarCampo('1', mockActor)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('crearSubcampo, actualizarSubcampo y eliminarSubcampo cubren 404, 409 y flujo feliz', async () => {
      mockPrisma.campoSemantico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1n, deletedAt: null })
        .mockResolvedValueOnce({ id: 1n, deletedAt: null });
      mockPrisma.subcampoSemantico.findFirst
        .mockResolvedValueOnce({ id: 10n, codigo: 'C1.S1' })
        .mockResolvedValueOnce(null);
      mockPrisma.subcampoSemantico.create.mockResolvedValueOnce({
        id: 11n,
        codigo: 'C1.S2',
        slug: 'sub-2',
      });

      await expect(
        useCase.crearSubcampo(
          {
            campoSemanticoId: '99',
            codigo: 'C1.S2',
            slug: 'sub-2',
            namtrikTermino: 'Sub',
            espanolTermino: 'Sub',
            posicion: 0,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 404 });

      await expect(
        useCase.crearSubcampo(
          {
            campoSemanticoId: '1',
            codigo: 'C1.S1',
            slug: 'sub-1',
            namtrikTermino: 'Sub',
            espanolTermino: 'Sub',
            posicion: 0,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 409 });

      const subCreated = await useCase.crearSubcampo(
        {
          campoSemanticoId: '1',
          codigo: 'C1.S2',
          slug: 'sub-2',
          namtrikTermino: 'Sub 2',
          espanolTermino: 'Sub 2',
          posicion: 1,
        },
        mockActor,
      );
      expect(subCreated.codigo).toBe('C1.S2');

      mockPrisma.subcampoSemantico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 11n, codigo: 'C1.S2', deletedAt: null })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 11n,
          codigo: 'C1.S2',
          deletedAt: null,
          microcampos: [],
          sentidosUbicacion: [],
        });
      mockPrisma.subcampoSemantico.update.mockResolvedValue({ id: 11n, codigo: 'C1.S2' });

      await expect(
        useCase.actualizarSubcampo('99', { espanolTermino: 'X' }, mockActor),
      ).rejects.toMatchObject({ statusCode: 404 });

      await useCase.actualizarSubcampo(
        '11',
        {
          namtrikTermino: 'Sub 2',
          namtrikDescripcion: 'ND',
          namtrikAudio: 'na',
          espanolTermino: 'Sub 2 edit',
          espanolDescripcion: 'ED',
          espanolAudio: 'ea',
          imagen: 'img',
          posicion: 5,
        },
        mockActor,
      );

      await expect(useCase.eliminarSubcampo('99', mockActor)).rejects.toMatchObject({
        statusCode: 404,
      });

      const subDeleted = await useCase.eliminarSubcampo('11', mockActor);
      expect(subDeleted.success).toBe(true);
    });

    it('crearMicrocampo, actualizarMicrocampo y eliminarMicrocampo cubren 404, 409, padreId y éxito', async () => {
      mockPrisma.subcampoSemantico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 10n, deletedAt: null })
        .mockResolvedValueOnce({ id: 10n, deletedAt: null })
        .mockResolvedValueOnce({ id: 10n, deletedAt: null });
      mockPrisma.microcampo.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 100n, profundidad: 0, deletedAt: null })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 101n, codigo: 'C1.S1.M1.1', deletedAt: null })
        .mockResolvedValueOnce(null);
      mockPrisma.microcampo.findFirst
        .mockResolvedValueOnce({ id: 100n, codigo: 'C1.S1.M1' })
        .mockResolvedValueOnce(null);
      mockPrisma.microcampo.create.mockResolvedValueOnce({
        id: 101n,
        codigo: 'C1.S1.M1.1',
        slug: 'subnivel-1',
        profundidad: 1,
      });
      mockPrisma.microcampo.update.mockResolvedValue({ id: 101n, codigo: 'C1.S1.M1.1' });

      await expect(
        useCase.crearMicrocampo(
          {
            subcampoSemanticoId: '99',
            codigo: 'M1',
            slug: 'm1',
            espanolTermino: 'M1',
            posicion: 0,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 404 });

      await expect(
        useCase.crearMicrocampo(
          {
            subcampoSemanticoId: '10',
            padreId: '888',
            codigo: 'M1',
            slug: 'm1',
            espanolTermino: 'M1',
            posicion: 0,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 404 });

      await expect(
        useCase.crearMicrocampo(
          {
            subcampoSemanticoId: '10',
            padreId: '100',
            codigo: 'C1.S1.M1',
            slug: 'm1',
            espanolTermino: 'M1',
            posicion: 0,
          },
          mockActor,
        ),
      ).rejects.toMatchObject({ statusCode: 409 });

      const microCreated = await useCase.crearMicrocampo(
        {
          subcampoSemanticoId: '10',
          codigo: 'C1.S1.M1.1',
          slug: 'subnivel-1',
          namtrikTermino: null,
          espanolTermino: 'Subnivel 1',
          posicion: 2,
        },
        mockActor,
      );
      expect(microCreated.codigo).toBe('C1.S1.M1.1');

      await expect(
        useCase.actualizarMicrocampo('999', { espanolTermino: 'X' }, mockActor),
      ).rejects.toMatchObject({ statusCode: 404 });

      await useCase.actualizarMicrocampo(
        '101',
        {
          namtrikTermino: 'Kɵsik',
          namtrikDescripcion: 'ND',
          namtrikAudio: 'na',
          espanolTermino: 'Ceniza',
          espanolDescripcion: 'ED',
          espanolAudio: 'ea',
          imagen: 'img',
          posicion: 4,
        },
        mockActor,
      );

      await expect(useCase.eliminarMicrocampo('999', mockActor)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
