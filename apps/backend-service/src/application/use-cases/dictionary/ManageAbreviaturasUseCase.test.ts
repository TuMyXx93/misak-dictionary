import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { ManageAbreviaturasUseCase } from './ManageAbreviaturasUseCase.js';

describe('ManageAbreviaturasUseCase', () => {
  it('listarPublicas devuelve las abreviaturas activas', async () => {
    const mockPrisma = {
      abreviaturaGramatical: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 1n,
            codigo: 's.',
            etiquetaCompleta: 'Sustantivo',
            orden: 1,
            activo: true,
          },
        ]),
      },
    };

    const useCase = new ManageAbreviaturasUseCase(mockPrisma as unknown as PrismaClient);
    const result = await useCase.listarPublicas();

    expect(result).toHaveLength(1);
    expect(result[0]?.codigo).toBe('s.');
    expect(result[0]?.id).toBe('1');
  });

  it('bloquea la eliminación si la abreviatura está en uso (409 Conflict)', async () => {
    const mockPrisma = {
      abreviaturaGramatical: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1n,
          codigo: 's.',
          etiquetaCompleta: 'Sustantivo',
        }),
      },
      formaNamtrik: {
        count: vi.fn().mockResolvedValue(580),
      },
    };

    const useCase = new ManageAbreviaturasUseCase(mockPrisma as unknown as PrismaClient);
    await expect(useCase.eliminar(1n, { userId: 1n, username: 'admin' })).rejects.toThrow(AppError);
  });

  it('permite la eliminación si la abreviatura tiene 0 usos', async () => {
    const mockPrisma = {
      abreviaturaGramatical: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99n,
          codigo: 'temp.',
          etiquetaCompleta: 'Temporal',
        }),
        delete: vi.fn().mockResolvedValue({ id: 99n }),
      },
      formaNamtrik: {
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const mockAudit = { record: vi.fn().mockResolvedValue(undefined) };

    const useCase = new ManageAbreviaturasUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAudit as unknown as AuditService,
    );
    await useCase.eliminar(99n, { userId: 1n, username: 'admin' });

    expect(mockPrisma.abreviaturaGramatical.delete).toHaveBeenCalledWith({ where: { id: 99n } });
  });

  it('listarAdmin mapea usosCount y canDelete con y sin filtro de búsqueda', async () => {
    const now = new Date('2026-11-12T00:00:00.000Z');
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: 1n,
          codigo: 's.',
          etiqueta_completa: 'Sustantivo',
          orden: 1,
          activo: true,
          created_at: now,
          updated_at: now,
          usos_count: 5n,
        },
        {
          id: 2n,
          codigo: 'adj.',
          etiqueta_completa: 'Adjetivo',
          orden: 2,
          activo: false,
          created_at: now,
          updated_at: now,
          usos_count: 0n,
        },
      ]),
    };

    const useCase = new ManageAbreviaturasUseCase(mockPrisma as unknown as PrismaClient);
    const sinFiltro = await useCase.listarAdmin();
    const conFiltro = await useCase.listarAdmin({ q: 'sust' });

    expect(sinFiltro).toEqual([
      {
        id: '1',
        codigo: 's.',
        etiquetaCompleta: 'Sustantivo',
        orden: 1,
        activo: true,
        usosCount: 5,
        canDelete: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '2',
        codigo: 'adj.',
        etiquetaCompleta: 'Adjetivo',
        orden: 2,
        activo: false,
        usosCount: 0,
        canDelete: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(conFiltro).toHaveLength(2);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('crear valida campos obligatorios (400), duplicados (409) y crea abreviatura con defaults y auditoría', async () => {
    const now = new Date('2026-11-12T00:00:00.000Z');
    const mockPrisma = {
      abreviaturaGramatical: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 10n, codigo: 's.' })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: vi
          .fn()
          .mockResolvedValueOnce({
            id: 11n,
            codigo: 'adv.',
            etiquetaCompleta: 'Adverbio',
            orden: 99,
            activo: true,
            createdAt: now,
            updatedAt: now,
          })
          .mockResolvedValueOnce({
            id: 12n,
            codigo: 'pron.',
            etiquetaCompleta: 'Pronombre',
            orden: 4,
            activo: false,
            createdAt: now,
            updatedAt: now,
          }),
      },
    };
    const mockAudit = { record: vi.fn().mockResolvedValue(undefined) };

    const useCase = new ManageAbreviaturasUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAudit as unknown as AuditService,
    );
    const actor = { userId: 1n, username: 'admin' };

    await expect(
      useCase.crear({ codigo: '   ', etiquetaCompleta: 'Válida' }, actor),
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      useCase.crear({ codigo: 'v.', etiquetaCompleta: '   ' }, actor),
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      useCase.crear({ codigo: 's.', etiquetaCompleta: 'Sustantivo' }, actor),
    ).rejects.toMatchObject({ statusCode: 409 });

    const createdDefault = await useCase.crear(
      { codigo: ' adv. ', etiquetaCompleta: ' Adverbio ' },
      actor,
    );
    expect(createdDefault).toMatchObject({
      id: '11',
      codigo: 'adv.',
      etiquetaCompleta: 'Adverbio',
      orden: 99,
      activo: true,
      usosCount: 0,
      canDelete: true,
    });

    const createdExplicit = await useCase.crear(
      { codigo: 'pron.', etiquetaCompleta: 'Pronombre', orden: 4, activo: false },
      actor,
    );
    expect(createdExplicit).toMatchObject({
      id: '12',
      orden: 4,
      activo: false,
    });
    expect(mockAudit.record).toHaveBeenCalledTimes(2);
  });

  it('actualizar maneja 404, colisión 409, edición sin cambio de código y propagación transaccional de código', async () => {
    const now = new Date('2026-11-12T00:00:00.000Z');
    const mockTx = {
      formaNamtrik: {
        updateMany: vi.fn().mockResolvedValue({ count: 3 }),
        count: vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(3),
      },
      $executeRaw: vi.fn().mockResolvedValue(2),
      abreviaturaGramatical: {
        update: vi
          .fn()
          .mockResolvedValueOnce({
            id: 5n,
            codigo: 's.',
            etiquetaCompleta: 'Sustantivo común',
            orden: 1,
            activo: true,
            createdAt: now,
            updatedAt: now,
          })
          .mockResolvedValueOnce({
            id: 5n,
            codigo: 'sust.',
            etiquetaCompleta: 'Sustantivo común',
            orden: 3,
            activo: false,
            createdAt: now,
            updatedAt: now,
          }),
      },
    };
    const mockPrisma = {
      abreviaturaGramatical: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 5n, codigo: 's.', etiquetaCompleta: 'Sustantivo' })
          .mockResolvedValueOnce({ id: 8n, codigo: 'adj.' })
          .mockResolvedValueOnce({
            id: 5n,
            codigo: 's.',
            etiquetaCompleta: 'Sustantivo',
            orden: 1,
            activo: true,
          })
          .mockResolvedValueOnce({
            id: 5n,
            codigo: 's.',
            etiquetaCompleta: 'Sustantivo',
            orden: 1,
            activo: true,
          })
          .mockResolvedValueOnce(null),
      },
      $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    };
    const mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
      recordInTx: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ManageAbreviaturasUseCase(
      mockPrisma as unknown as PrismaClient,
      mockAudit as unknown as AuditService,
    );
    const actor = { userId: 1n, username: 'admin' };

    await expect(useCase.actualizar(999n, { etiquetaCompleta: 'X' }, actor)).rejects.toMatchObject({
      statusCode: 404,
    });

    await expect(useCase.actualizar(5n, { codigo: 'adj.' }, actor)).rejects.toMatchObject({
      statusCode: 409,
    });

    const sinCambioCodigo = await useCase.actualizar(
      5n,
      { etiquetaCompleta: ' Sustantivo común ' },
      actor,
    );
    expect(sinCambioCodigo).toMatchObject({
      id: '5',
      codigo: 's.',
      usosCount: 0,
      canDelete: true,
    });
    expect(mockTx.formaNamtrik.updateMany).not.toHaveBeenCalled();
    expect(mockTx.$executeRaw).not.toHaveBeenCalled();

    const conCambioCodigo = await useCase.actualizar(
      5n,
      { codigo: ' sust. ', orden: 3, activo: false },
      actor,
    );
    expect(conCambioCodigo).toMatchObject({
      id: '5',
      codigo: 'sust.',
      orden: 3,
      activo: false,
      usosCount: 3,
      canDelete: false,
    });
    expect(mockTx.formaNamtrik.updateMany).toHaveBeenCalledWith({
      where: { categoriaGramatical: 's.' },
      data: { categoriaGramatical: 'sust.' },
    });
    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(mockAudit.recordInTx).toHaveBeenCalledTimes(2);
  });

  it('eliminar lanza 404 cuando la abreviatura no existe', async () => {
    const mockPrisma = {
      abreviaturaGramatical: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const useCase = new ManageAbreviaturasUseCase(mockPrisma as unknown as PrismaClient);

    await expect(useCase.eliminar(404n, { userId: 1n, username: 'admin' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
