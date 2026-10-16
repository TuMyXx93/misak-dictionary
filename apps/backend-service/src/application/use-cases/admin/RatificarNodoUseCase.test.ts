import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { RatificarNodoUseCase } from './RatificarNodoUseCase.js';

describe('RatificarNodoUseCase', () => {
  let mockPrisma: any;
  let mockAuditService: any;
  let useCase: RatificarNodoUseCase;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      campoSemantico: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      subcampoSemantico: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      microcampo: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new RatificarNodoUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  it('ratifica un campo semántico exitosamente', async () => {
    mockPrisma.campoSemantico.findUnique.mockResolvedValue({
      id: 1n,
      codigo: 'C1',
      estado: 'borrador',
      version: 1,
      ultimoEditorId: 2n,
      deletedAt: null,
    });

    mockPrisma.campoSemantico.update.mockResolvedValue({
      id: 1n,
      codigo: 'C1',
      estado: 'ratificado',
      version: 2,
    });

    const actor = {
      userId: 5n,
      username: 'cultural_reviewer',
      roles: ['cultural_reviewer'],
    };

    const result = await useCase.execute({ nivel: 'campo', id: 1n, version: 1 }, actor);

    expect(mockPrisma.campoSemantico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1n },
        data: expect.objectContaining({
          estado: 'ratificado',
          version: 2,
          ratificadoPorId: 5n,
        }),
      }),
    );

    expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        action: 'ratify',
        entity: 'campo',
        entityId: '1',
      }),
    );

    expect(result.estado).toBe('ratificado');
  });

  it('bloquea la auto-ratificación de un microcampo para usuarios que no son super_admin', async () => {
    mockPrisma.microcampo.findUnique.mockResolvedValue({
      id: 10n,
      codigo: 'C1.S1.M1',
      estado: 'borrador',
      version: 1,
      ultimoEditorId: 8n,
      deletedAt: null,
    });

    const actor = {
      userId: 8n, // Mismo editor
      username: 'editor_user',
      roles: ['cultural_reviewer'],
    };

    await expect(
      useCase.execute({ nivel: 'microcampo', id: 10n, version: 1 }, actor),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'No puedes ratificar un nodo cuya última edición fue realizada por ti mismo',
    });
  });

  it('permite auto-ratificación si el actor tiene rol super_admin', async () => {
    mockPrisma.subcampoSemantico.findUnique.mockResolvedValue({
      id: 5n,
      codigo: 'C1.S1',
      estado: 'borrador',
      version: 1,
      ultimoEditorId: 1n,
      deletedAt: null,
    });

    mockPrisma.subcampoSemantico.update.mockResolvedValue({
      id: 5n,
      codigo: 'C1.S1',
      estado: 'ratificado',
      version: 2,
    });

    const superAdminActor = {
      userId: 1n,
      username: 'root',
      roles: ['super_admin'],
    };

    const result = await useCase.execute(
      { nivel: 'subcampo', id: 5n, version: 1 },
      superAdminActor,
    );

    expect(result.estado).toBe('ratificado');
  });

  it('lanza 409 si el nodo ya está ratificado o hay conflicto de versión', async () => {
    mockPrisma.campoSemantico.findUnique.mockResolvedValue({
      id: 1n,
      codigo: 'C1',
      estado: 'ratificado',
      version: 2,
      deletedAt: null,
    });

    const actor = {
      userId: 5n,
      username: 'reviewer',
      roles: ['cultural_reviewer'],
    };

    await expect(
      useCase.execute({ nivel: 'campo', id: 1n, version: 1 }, actor),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Conflicto de concurrencia: el nodo ha sido modificado por otro usuario',
    });
  });
});
