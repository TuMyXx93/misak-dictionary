import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { RatificarLoteError, RatificarLoteUseCase } from './RatificarLoteUseCase.js';

describe('RatificarLoteUseCase', () => {
  const createMockPrisma = () => {
    const prisma = {
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
      sentidoLexico: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
    return prisma;
  };
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { recordInTx: ReturnType<typeof vi.fn> };
  let useCase: RatificarLoteUseCase;

  const actor = {
    userId: 10n,
    username: 'cultural_reviewer',
    roles: ['cultural_reviewer'],
  };

  const checklistValido = {
    ortografia: true as const,
    categorias: true as const,
    glosas: true as const,
    cientificos: true as const,
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new RatificarLoteUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  it('ratifica un lote completo en una transacción única con 1 auditoría de lote y N de sentidos', async () => {
    const sentidosEnBd = [
      {
        id: 101n,
        codigo: 'C1.S1.M5.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 2n,
      },
      {
        id: 102n,
        codigo: 'C1.S1.M5.E002',
        estado: 'borrador',
        version: 2,
        ultimoEditorId: 3n,
      },
    ];

    mockPrisma.sentidoLexico.findMany.mockResolvedValue(sentidosEnBd);
    mockPrisma.sentidoLexico.update.mockResolvedValue({});

    const dto = {
      checklist: checklistValido,
      snapshot: [
        { id: '101', version: 1 },
        { id: '102', version: 2 },
      ],
    };

    const result = await useCase.execute('microcampo', 5n, dto, actor);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledTimes(2);

    // 1 auditoría de lote + 2 auditorías de sentidos = 3 llamadas a recordInTx
    expect(mockAuditService.recordInTx).toHaveBeenCalledTimes(3);

    expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        action: 'ratify_batch',
        entity: 'microcampo',
        entityId: '5',
      }),
    );

    expect(result).toEqual({
      ratificados: 2,
      codigos: ['C1.S1.M5.E001', 'C1.S1.M5.E002'],
    });
  });

  it('rechaza el lote si al menos un sentido tiene conflicto de auto-ratificación (R-012 / R-025)', async () => {
    const sentidosEnBd = [
      {
        id: 101n,
        codigo: 'C1.S1.M5.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 2n, // Distinto
      },
      {
        id: 102n,
        codigo: 'C1.S1.M5.E002',
        estado: 'borrador',
        version: 2,
        ultimoEditorId: 10n, // Mismo que actor.userId
      },
    ];

    mockPrisma.sentidoLexico.findMany.mockResolvedValue(sentidosEnBd);

    const dto = {
      checklist: checklistValido,
      snapshot: [
        { id: '101', version: 1 },
        { id: '102', version: 2 },
      ],
    };

    try {
      await useCase.execute('microcampo', 5n, dto, actor);
      expect.fail('Debería haber lanzado RatificarLoteError');
    } catch (error) {
      expect(error).toBeInstanceOf(RatificarLoteError);
      const loteError = error as RatificarLoteError;
      expect(loteError.statusCode).toBe(409);
      expect(loteError.conflictos).toEqual([
        {
          codigo: 'C1.S1.M5.E002',
          motivo: 'auto_ratificacion',
        },
      ]);
      expect(mockPrisma.sentidoLexico.update).not.toHaveBeenCalled();
    }
  });

  it('rechaza el lote si hay conflicto de versión obsoleta en snapshot', async () => {
    const sentidosEnBd = [
      {
        id: 101n,
        codigo: 'C1.S1.M5.E001',
        estado: 'borrador',
        version: 2, // Ya avanzó a version 2
        ultimoEditorId: 2n,
      },
    ];

    mockPrisma.sentidoLexico.findMany.mockResolvedValue(sentidosEnBd);

    const dto = {
      checklist: checklistValido,
      snapshot: [
        { id: '101', version: 1 }, // El usuario vio la versión 1
      ],
    };

    try {
      await useCase.execute('microcampo', 5n, dto, actor);
      expect.fail('Debería haber lanzado RatificarLoteError');
    } catch (error) {
      expect(error).toBeInstanceOf(RatificarLoteError);
      const loteError = error as RatificarLoteError;
      expect(loteError.statusCode).toBe(409);
      expect(loteError.conflictos).toEqual([
        {
          codigo: 'C1.S1.M5.E001',
          motivo: 'version_obsoleta',
        },
      ]);
    }
  });

  it('lanza 400 si alguna casilla del checklist no está confirmada', async () => {
    const dto = {
      checklist: {
        ...checklistValido,
        ortografia: false as unknown as true, // Falla casilla de ortografía
      },
      snapshot: [{ id: '101', version: 1 }],
    };

    await expect(useCase.execute('microcampo', 5n, dto, actor)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Debe confirmar los 4 puntos de la lista de verificación para ratificar por lote',
    });
  });
});
