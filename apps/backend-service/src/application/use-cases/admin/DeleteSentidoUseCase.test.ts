import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { DeleteSentidoUseCase } from './DeleteSentidoUseCase.js';

describe('DeleteSentidoUseCase', () => {
  const createMockPrisma = () => {
    const prisma = {
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
      sentidoLexico: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    return prisma;
  };
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { recordInTx: ReturnType<typeof vi.fn> };
  let useCase: DeleteSentidoUseCase;

  const actor = {
    userId: 12n,
    username: 'admin_user',
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DeleteSentidoUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  it('aplica borrado lógico y registra auditoría en transacción', async () => {
    mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
      id: 70n,
      codigo: 'C1.S1.M1.E005',
      estado: 'borrador',
      version: 1,
      espanolGlosa: 'árbol',
      deletedAt: null,
      formas: [{ orden: 1, lema: 'mɵk' }],
    });

    mockPrisma.sentidoLexico.update.mockResolvedValue({
      id: 70n,
      deletedAt: new Date(),
    });

    await useCase.execute(70n, actor);

    expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 70n },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          ultimoEditorId: 12n,
        }),
      }),
    );

    expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        action: 'delete',
        entity: 'sentido',
        entityId: '70',
        actorUserId: 12n,
      }),
    );
  });

  it('lanza 404 si el sentido no existe o ya fue eliminado', async () => {
    mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
      id: 70n,
      deletedAt: new Date(),
    });

    await expect(useCase.execute(70n, actor)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Sentido no encontrado',
    });
  });
});
