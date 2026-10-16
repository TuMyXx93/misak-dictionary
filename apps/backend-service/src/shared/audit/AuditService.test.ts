import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../config/prisma.js';
import { AuditService, type AuditTransactionalClient } from './AuditService.js';

describe('AuditService', () => {
  const auditService = new AuditService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('record (asíncrono no transaccional)', () => {
    it('persiste el evento mapeando datos opcionales a null o valores definidos', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: mock fixture
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditService.record({
        actorUserId: 10n,
        actorUsername: 'test_user',
        action: 'dictionary.sentido.create',
        entity: 'SentidoLexico',
        entityId: '101',
        newData: { codigo: 'C1.S1.M1.E001' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 10n,
          actorUsername: 'test_user',
          action: 'dictionary.sentido.create',
          entity: 'SentidoLexico',
          entityId: '101',
          newData: { codigo: 'C1.S1.M1.E001' },
          ipAddress: null,
          userAgent: null,
        }),
      });
    });

    it('aísla excepciones de la base de datos sin propagarlas al llamador', async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB failure'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        auditService.record({
          action: 'test.fail',
          entity: 'Test',
        }),
      ).resolves.toBeUndefined();

      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('recordInTx (transaccional atómico)', () => {
    it('delega en tx.auditLog.create pasando los datos mapeados', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const fakeTx: AuditTransactionalClient = {
        auditLog: {
          create: mockCreate,
        },
      };

      await auditService.recordInTx(fakeTx, {
        actorUserId: 42n,
        actorUsername: 'namtrik_editor',
        action: 'dictionary.lote.ratify',
        entity: 'Microcampo',
        entityId: '19',
        oldData: { estado: 'borrador' },
        newData: { estado: 'ratificado' },
        ipAddress: '127.0.0.1',
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          actorUserId: 42n,
          actorUsername: 'namtrik_editor',
          action: 'dictionary.lote.ratify',
          entity: 'Microcampo',
          entityId: '19',
          oldData: { estado: 'borrador' },
          newData: { estado: 'ratificado' },
          ipAddress: '127.0.0.1',
          userAgent: null,
        },
      });
    });

    it('propaga errores de tx.auditLog.create para garantizar rollback transaccional (RK-3)', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('Tx rollback forced'));
      const fakeTx: AuditTransactionalClient = {
        auditLog: {
          create: mockCreate,
        },
      };

      await expect(
        auditService.recordInTx(fakeTx, {
          action: 'dictionary.sentido.ratify',
          entity: 'SentidoLexico',
          entityId: '202',
        }),
      ).rejects.toThrow('Tx rollback forced');
    });
  });
});
