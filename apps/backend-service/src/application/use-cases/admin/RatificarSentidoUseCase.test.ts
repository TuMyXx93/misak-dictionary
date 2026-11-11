import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { RatificarSentidoUseCase } from './RatificarSentidoUseCase.js';
import { RevertirRatificacionUseCase } from './RevertirRatificacionUseCase.js';

describe('RatificarSentidoUseCase & RevertirRatificacionUseCase', () => {
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
  let ratificarUseCase: RatificarSentidoUseCase;
  let revertirUseCase: RevertirRatificacionUseCase;

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    ratificarUseCase = new RatificarSentidoUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );

    revertirUseCase = new RevertirRatificacionUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  describe('RatificarSentidoUseCase', () => {
    it('ratifica exitosamente cuando el revisor es distinto al editor', async () => {
      const sentidoBorrador = {
        id: 10n,
        codigo: 'C1.S1.M1.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 2n, // Editado por el usuario 2
        deletedAt: null,
        formas: [],
      };

      mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoBorrador);
      mockPrisma.sentidoLexico.update.mockResolvedValue({
        ...sentidoBorrador,
        estado: 'ratificado',
        ratificadoPorId: 3n,
        version: 2,
      });

      const actor = {
        userId: 3n, // Usuario 3
        username: 'revisor_cultural',
        roles: ['cultural_reviewer'],
      };

      const result = await ratificarUseCase.execute(10n, { version: 1 }, actor);

      expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10n },
          data: expect.objectContaining({
            estado: 'ratificado',
            ratificadoPorId: 3n,
            version: 2,
          }),
        }),
      );

      expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          action: 'ratify',
          entity: 'sentido',
          entityId: '10',
          actorUserId: 3n,
        }),
      );

      expect(result.estado).toBe('ratificado');
    });

    it('bloquea la auto-ratificación si el revisor fue el último editor (R-012 / D-4)', async () => {
      const sentidoBorrador = {
        id: 10n,
        codigo: 'C1.S1.M1.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 5n, // Editado por el usuario 5
        deletedAt: null,
        formas: [],
      };

      mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoBorrador);

      const actor = {
        userId: 5n, // Mismo usuario 5
        username: 'editor_y_revisor',
        roles: ['cultural_reviewer', 'content_admin'],
      };

      await expect(ratificarUseCase.execute(10n, { version: 1 }, actor)).rejects.toMatchObject({
        statusCode: 409,
        message: 'No puedes ratificar un sentido cuya última edición fue realizada por ti mismo',
      });
    });

    it('permite auto-ratificación solo si el usuario tiene rol super_admin (D-4)', async () => {
      const sentidoBorrador = {
        id: 10n,
        codigo: 'C1.S1.M1.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 1n, // Editado por el usuario 1
        deletedAt: null,
        formas: [],
      };

      mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoBorrador);
      mockPrisma.sentidoLexico.update.mockResolvedValue({
        ...sentidoBorrador,
        estado: 'ratificado',
        ratificadoPorId: 1n,
        version: 2,
      });

      const superAdminActor = {
        userId: 1n, // Mismo usuario 1
        username: 'root_admin',
        roles: ['super_admin'],
      };

      const result = await ratificarUseCase.execute(10n, { version: 1 }, superAdminActor);

      expect(result.estado).toBe('ratificado');
      expect(mockPrisma.sentidoLexico.update).toHaveBeenCalled();
    });

    it('lanza 409 si el sentido ya se encuentra ratificado', async () => {
      mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
        id: 10n,
        estado: 'ratificado',
        version: 2,
        deletedAt: null,
        formas: [],
      });

      const actor = {
        userId: 3n,
        username: 'revisor',
        roles: ['cultural_reviewer'],
      };

      await expect(ratificarUseCase.execute(10n, { version: 2 }, actor)).rejects.toMatchObject({
        statusCode: 409,
        message: 'El sentido ya se encuentra ratificado',
      });
    });

    it('lanza 409 si la versión no coincide', async () => {
      mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
        id: 10n,
        estado: 'borrador',
        version: 3,
        deletedAt: null,
        formas: [],
      });

      const actor = {
        userId: 3n,
        username: 'revisor',
        roles: ['cultural_reviewer'],
      };

      await expect(ratificarUseCase.execute(10n, { version: 2 }, actor)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
      });
    });
  });

  describe('RevertirRatificacionUseCase', () => {
    it('revierte a borrador con motivo >= 10 caracteres y registra auditoría', async () => {
      const sentidoRatificado = {
        id: 20n,
        codigo: 'C1.S1.M1.E002',
        estado: 'ratificado',
        version: 2,
        ratificadoPorId: 4n,
        ratificadoAt: new Date(),
        deletedAt: null,
        formas: [],
      };

      mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoRatificado);
      mockPrisma.sentidoLexico.update.mockResolvedValue({
        ...sentidoRatificado,
        estado: 'borrador',
        ratificadoPorId: null,
        ratificadoAt: null,
        version: 3,
      });

      const actor = {
        userId: 9n,
        username: 'revisor2',
      };

      const result = await revertirUseCase.execute(
        20n,
        {
          version: 2,
          motivo: 'La categoría gramatical debe ser revisada por el anciano',
        },
        actor,
      );

      expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 20n },
          data: expect.objectContaining({
            estado: 'borrador',
            ratificadoPorId: null,
            ratificadoAt: null,
            version: 3,
            ultimoEditorId: 9n,
          }),
        }),
      );

      expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({
          action: 'revert_ratification',
          entity: 'sentido',
          entityId: '20',
          newData: expect.objectContaining({
            motivo: 'La categoría gramatical debe ser revisada por el anciano',
          }),
        }),
      );

      expect(result.estado).toBe('borrador');
    });

    it('lanza 400 si el motivo tiene menos de 10 caracteres', async () => {
      const actor = {
        userId: 9n,
        username: 'revisor2',
      };

      await expect(
        revertirUseCase.execute(
          20n,
          {
            version: 2,
            motivo: 'muy corto',
          },
          actor,
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'El motivo de reversión debe tener al menos 10 caracteres',
      });
    });

    it('lanza 409 si el sentido no estaba ratificado', async () => {
      mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
        id: 20n,
        estado: 'borrador',
        version: 2,
        deletedAt: null,
        formas: [],
      });

      const actor = {
        userId: 9n,
        username: 'revisor2',
      };

      await expect(
        revertirUseCase.execute(
          20n,
          {
            version: 2,
            motivo: 'Motivo suficientemente largo para la prueba',
          },
          actor,
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Solo se pueden revertir sentidos que estén ratificados',
      });
    });
  });
});
