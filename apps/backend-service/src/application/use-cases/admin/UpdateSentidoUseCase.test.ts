import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { UpdateSentidoUseCase } from './UpdateSentidoUseCase.js';

describe('UpdateSentidoUseCase', () => {
  const createMockPrisma = () => {
    const prisma = {
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
      sentidoLexico: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      formaNamtrik: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    return prisma;
  };
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAuditService: { recordInTx: ReturnType<typeof vi.fn> };
  let useCase: UpdateSentidoUseCase;

  const actor = {
    userId: 10n,
    username: 'content_admin_user',
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();

    mockAuditService = {
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new UpdateSentidoUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAuditService as unknown as AuditService,
    );
  });

  it('actualiza exitosamente e incrementa versión', async () => {
    const sentidoActual = {
      id: 50n,
      version: 1,
      estado: 'borrador',
      espanolGlosa: 'árbol antiguo',
      espanolExplicacion: null,
      namtrikContexto: null,
      nombreCientifico: null,
      observacionEditorial: 'antigua nota',
      respuestaNamtrik: null,
      respuestaNamtrikContexto: null,
      respuestaEspanolGlosa: null,
      respuestaEspanolExplicacion: null,
      ratificadoPorId: null,
      ratificadoAt: null,
      deletedAt: null,
      formas: [
        {
          id: 1n,
          orden: 1,
          lema: 'mɵk',
        },
      ],
    };

    mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoActual);
    mockPrisma.sentidoLexico.update.mockResolvedValue({
      ...sentidoActual,
      version: 2,
      observacionEditorial: 'nueva nota editorial',
      formas: sentidoActual.formas,
    });

    const result = await useCase.execute(
      50n,
      {
        version: 1,
        observacionEditorial: 'nueva nota editorial',
      },
      actor,
    );

    expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 50n },
        data: expect.objectContaining({
          version: 2,
          observacionEditorial: 'nueva nota editorial',
          ultimoEditorId: 10n,
        }),
      }),
    );

    expect(mockAuditService.recordInTx).toHaveBeenCalled();
    expect(result.version).toBe(2);
  });

  it('lanza 409 si la versión enviada no coincide (conflicto de concurrencia)', async () => {
    mockPrisma.sentidoLexico.findUnique.mockResolvedValue({
      id: 50n,
      version: 3, // Ya está en versión 3
      deletedAt: null,
      formas: [],
    });

    await expect(
      useCase.execute(
        50n,
        {
          version: 2, // Se envía versión obsoleta 2
          espanolGlosa: 'intento desactualizado',
        },
        actor,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
    });
  });

  it('degrada automáticamente a borrador y limpia ratificado_* si se edita contenido cultural en un sentido ratificado (R-010)', async () => {
    const sentidoActual = {
      id: 50n,
      version: 2,
      estado: 'ratificado',
      espanolGlosa: 'montaña',
      espanolExplicacion: 'antigua explicacion',
      namtrikContexto: null,
      nombreCientifico: null,
      observacionEditorial: null,
      respuestaNamtrik: null,
      respuestaNamtrikContexto: null,
      respuestaEspanolGlosa: null,
      respuestaEspanolExplicacion: null,
      ratificadoPorId: 99n,
      ratificadoAt: new Date('2026-10-10'),
      deletedAt: null,
      formas: [{ id: 1n, orden: 1, lema: 'pish' }],
    };

    mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoActual);
    mockPrisma.sentidoLexico.update.mockResolvedValue({
      ...sentidoActual,
      version: 3,
      estado: 'borrador',
      espanolGlosa: 'montaña alta',
      ratificadoPorId: null,
      ratificadoAt: null,
    });

    await useCase.execute(
      50n,
      {
        version: 2,
        espanolGlosa: 'montaña alta', // Cambio en campo cultural
      },
      actor,
    );

    expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 50n },
        data: expect.objectContaining({
          version: 3,
          estado: 'borrador',
          ratificadoPorId: null,
          ratificadoAt: null,
        }),
      }),
    );
  });

  it('no degrada a borrador si la edición no es cultural (solo observacionEditorial)', async () => {
    const sentidoActual = {
      id: 50n,
      version: 2,
      estado: 'ratificado',
      espanolGlosa: 'montaña',
      espanolExplicacion: null,
      namtrikContexto: null,
      nombreCientifico: null,
      observacionEditorial: 'antigua nota',
      respuestaNamtrik: null,
      respuestaNamtrikContexto: null,
      respuestaEspanolGlosa: null,
      respuestaEspanolExplicacion: null,
      ratificadoPorId: 99n,
      ratificadoAt: new Date('2026-10-10'),
      deletedAt: null,
      formas: [{ id: 1n, orden: 1, lema: 'pish' }],
    };

    mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoActual);
    mockPrisma.sentidoLexico.update.mockResolvedValue({
      ...sentidoActual,
      version: 3,
      observacionEditorial: 'nueva nota solo editorial',
    });

    await useCase.execute(
      50n,
      {
        version: 2,
        observacionEditorial: 'nueva nota solo editorial',
      },
      actor,
    );

    expect(mockPrisma.sentidoLexico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 50n },
        data: expect.objectContaining({
          version: 3,
          estado: 'ratificado', // Mantiene ratificado
          ratificadoPorId: 99n,
        }),
      }),
    );
  });

  it('aplica normalización ɵ al actualizar formas y reemplaza ordenadamente', async () => {
    const sentidoActual = {
      id: 50n,
      version: 1,
      estado: 'borrador',
      espanolGlosa: 'casa',
      espanolExplicacion: null,
      namtrikContexto: null,
      nombreCientifico: null,
      observacionEditorial: null,
      respuestaNamtrik: null,
      respuestaNamtrikContexto: null,
      respuestaEspanolGlosa: null,
      respuestaEspanolExplicacion: null,
      ratificadoPorId: null,
      ratificadoAt: null,
      deletedAt: null,
      formas: [{ id: 1n, orden: 1, lema: 'yal' }],
    };

    mockPrisma.sentidoLexico.findUnique.mockResolvedValue(sentidoActual);
    mockPrisma.sentidoLexico.update.mockResolvedValue({
      ...sentidoActual,
      version: 2,
      formas: [{ id: 2n, orden: 1, lema: 'yəl' }],
    });

    await useCase.execute(
      50n,
      {
        version: 1,
        formas: [{ lema: 'yəl' }], // 'ə' se normaliza a 'ɵ'
      },
      actor,
    );

    expect(mockPrisma.formaNamtrik.deleteMany).toHaveBeenCalledWith({
      where: { sentidoId: 50n },
    });

    expect(mockPrisma.formaNamtrik.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          orden: 1,
          lema: 'yɵl',
          sentidoId: 50n,
        }),
      ],
    });
  });

  it('lanza 404 si el sentido no existe', async () => {
    mockPrisma.sentidoLexico.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute(999n, { version: 1, espanolGlosa: 'test' }, actor),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Sentido no encontrado',
    });
  });
});
