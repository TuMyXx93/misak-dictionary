import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { AuditService } from '../audit/AuditService.js';
import {
  CACHE_TTL_MS,
  KEY_PUBLIC_ONLY_RATIFIED,
  SystemSettingsService,
} from './SystemSettingsService.js';

describe('SystemSettingsService', () => {
  const createMockPrisma = () => {
    const prisma = {
      $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
      systemSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    };
    return prisma;
  };
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { recordInTx: ReturnType<typeof vi.fn> };
  let service: SystemSettingsService;

  const actor = {
    userId: 1n,
    username: 'superadmin',
  };

  beforeEach(() => {
    vi.useRealTimers();
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    service = new SystemSettingsService(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
    service.invalidateCache();
  });

  it('obtiene la bandera desde la base de datos y la almacena en caché', async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: KEY_PUBLIC_ONLY_RATIFIED,
      value: true,
    });

    const valor1 = await service.getPublicOnlyRatified();
    expect(valor1).toBe(true);
    expect(mockPrisma.systemSetting.findUnique).toHaveBeenCalledTimes(1);

    // Segunda llamada debe salir de la caché sin consultar la BD
    const valor2 = await service.getPublicOnlyRatified();
    expect(valor2).toBe(true);
    expect(mockPrisma.systemSetting.findUnique).toHaveBeenCalledTimes(1);
  });

  it('devuelve false por defecto si el ajuste no existe en BD', async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue(null);

    const valor = await service.getPublicOnlyRatified();
    expect(valor).toBe(false);
  });

  it('invalida la caché después de que expira el TTL', async () => {
    vi.useFakeTimers();

    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: KEY_PUBLIC_ONLY_RATIFIED,
      value: false,
    });

    await service.getPublicOnlyRatified();
    expect(mockPrisma.systemSetting.findUnique).toHaveBeenCalledTimes(1);

    // Avanzar el tiempo más allá del TTL
    vi.advanceTimersByTime(CACHE_TTL_MS + 1000);

    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: KEY_PUBLIC_ONLY_RATIFIED,
      value: true,
    });

    const valorActualizado = await service.getPublicOnlyRatified();
    expect(valorActualizado).toBe(true);
    expect(mockPrisma.systemSetting.findUnique).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('actualiza el valor en BD, audita y actualiza la caché de inmediato', async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: KEY_PUBLIC_ONLY_RATIFIED,
      value: false,
    });
    mockPrisma.systemSetting.upsert.mockResolvedValue({});

    const nuevoValor = await service.setPublicOnlyRatified(true, actor);

    expect(nuevoValor).toBe(true);
    expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: KEY_PUBLIC_ONLY_RATIFIED },
        update: expect.objectContaining({ value: true, updatedById: 1n }),
      }),
    );

    expect(mockAuditService.recordInTx).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({
        action: 'update_setting',
        entity: 'system_setting',
        entityId: KEY_PUBLIC_ONLY_RATIFIED,
        oldData: { value: false },
        newData: { value: true },
      }),
    );

    // La siguiente llamada debe retornar true desde caché sin ir a BD
    mockPrisma.systemSetting.findUnique.mockClear();
    const lectura = await service.getPublicOnlyRatified();
    expect(lectura).toBe(true);
    expect(mockPrisma.systemSetting.findUnique).not.toHaveBeenCalled();

    // Otra instancia del servicio en el mismo proceso comparte e invalida la misma caché
    const otraInstancia = new SystemSettingsService(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
    expect(await otraInstancia.getPublicOnlyRatified()).toBe(true);
    expect(mockPrisma.systemSetting.findUnique).not.toHaveBeenCalled();
  });
});
