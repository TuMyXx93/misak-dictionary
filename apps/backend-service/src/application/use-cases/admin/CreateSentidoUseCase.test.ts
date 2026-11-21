import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { CreateSentidoUseCase } from './CreateSentidoUseCase.js';

describe('CreateSentidoUseCase', () => {
  const createMockPrisma = () => {
    const prisma = {
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
      $executeRaw: vi.fn().mockResolvedValue(1),
      campoSemantico: {
        findUnique: vi.fn(),
      },
      subcampoSemantico: {
        findUnique: vi.fn(),
      },
      microcampo: {
        findUnique: vi.fn(),
      },
      sentidoLexico: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };
    return prisma;
  };
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { recordInTx: ReturnType<typeof vi.fn> };
  let useCase: CreateSentidoUseCase;

  const actor = {
    userId: 1n,
    username: 'namtrik_editor',
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new CreateSentidoUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  it('crea un sentido con código secuencial E001, normalización ɵ y auditoría', async () => {
    mockPrisma.microcampo.findUnique.mockResolvedValue({
      id: 5n,
      codigo: 'C1.S1.M5',
      deletedAt: null,
    });

    mockPrisma.sentidoLexico.findMany.mockResolvedValue([]);
    mockPrisma.sentidoLexico.create.mockResolvedValue({
      id: 101n,
      codigo: 'C1.S1.M5.E001',
      tipo: 'estandar',
      estado: 'borrador',
      version: 1,
      espanolGlosa: 'montaña sagrada',
      formas: [
        {
          id: 1n,
          orden: 1,
          lema: 'pishɵ',
        },
      ],
      ubicaciones: [
        {
          microcampoId: 5n,
        },
      ],
    });

    const dto = {
      ubicacion: {
        nivel: 'microcampo' as const,
        id: '5',
      },
      formas: [
        {
          lema: 'pisho', // 'o' debe normalizarse a 'ɵ'
        },
      ],
      espanolGlosa: 'montaña sagrada',
      namtrikContexto: 'contexto con o',
    };

    const result = await useCase.execute(dto, actor);

    expect(mockPrisma.microcampo.findUnique).toHaveBeenCalledWith({
      where: { id: 5n },
      select: { id: true, codigo: true, deletedAt: true },
    });

    expect(mockPrisma.sentidoLexico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigo: 'C1.S1.M5.E001',
          estado: 'borrador',
          version: 1,
          ultimoEditorId: 1n,
          namtrikContexto: 'cɵntextɵ cɵn ɵ',
          formas: {
            create: [
              expect.objectContaining({
                orden: 1,
                lema: 'pishɵ',
              }),
            ],
          },
          ubicaciones: {
            create: [
              expect.objectContaining({
                microcampoId: 5n,
                campoSemanticoId: null,
                subcampoSemanticoId: null,
              }),
            ],
          },
        }),
      }),
    );

    expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        action: 'create',
        entity: 'sentido',
        entityId: '101',
        actorUserId: 1n,
      }),
    );

    expect(result.codigo).toBe('C1.S1.M5.E001');
  });

  it('incrementa el código secuencial si ya existen sentidos', async () => {
    mockPrisma.campoSemantico.findUnique.mockResolvedValue({
      id: 1n,
      codigo: 'C1',
      deletedAt: null,
    });

    mockPrisma.sentidoLexico.findMany.mockResolvedValue([
      { codigo: 'C1.E001' },
      { codigo: 'C1.E002' },
      { codigo: 'C1.E009' },
    ]);

    mockPrisma.sentidoLexico.create.mockResolvedValue({
      id: 102n,
      codigo: 'C1.E010',
      estado: 'borrador',
      version: 1,
      formas: [],
      ubicaciones: [],
    });

    const dto = {
      ubicacion: {
        nivel: 'campo' as const,
        id: '1',
      },
      formas: [{ lema: 'yal' }],
      espanolGlosa: 'casa',
    };

    await useCase.execute(dto, actor);

    expect(mockPrisma.sentidoLexico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigo: 'C1.E010',
        }),
      }),
    );
  });

  it('lanza 404 si el nodo de ubicación no existe o está eliminado', async () => {
    mockPrisma.subcampoSemantico.findUnique.mockResolvedValue({
      id: 2n,
      codigo: 'C1.S1',
      deletedAt: new Date(),
    });

    const dto = {
      ubicacion: {
        nivel: 'subcampo' as const,
        id: '2',
      },
      formas: [{ lema: 'yal' }],
      espanolGlosa: 'casa',
    };

    await expect(useCase.execute(dto, actor)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Nodo taxonómico de ubicación no encontrado',
    });
  });

  it('lanza 400 si la lista de formas está vacía', async () => {
    const dto = {
      ubicacion: {
        nivel: 'campo' as const,
        id: '1',
      },
      formas: [],
      espanolGlosa: 'casa',
    };

    await expect(useCase.execute(dto, actor)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Debe incluir al menos una forma léxica',
    });
  });
});
