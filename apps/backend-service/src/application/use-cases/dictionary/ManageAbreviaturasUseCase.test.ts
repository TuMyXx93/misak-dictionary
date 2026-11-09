import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError.js';
import { ManageAbreviaturasUseCase } from './ManageAbreviaturasUseCase.js';

describe('ManageAbreviaturasUseCase', () => {
  it('listarPublicas devuelve las abreviaturas activas', async () => {
    const mockPrisma: any = {
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

    const useCase = new ManageAbreviaturasUseCase(mockPrisma);
    const result = await useCase.listarPublicas();

    expect(result).toHaveLength(1);
    expect(result[0]?.codigo).toBe('s.');
    expect(result[0]?.id).toBe('1');
  });

  it('bloquea la eliminación si la abreviatura está en uso (409 Conflict)', async () => {
    const mockPrisma: any = {
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

    const useCase = new ManageAbreviaturasUseCase(mockPrisma);
    await expect(useCase.eliminar(1n, { userId: 1n, username: 'admin' })).rejects.toThrow(AppError);
  });

  it('permite la eliminación si la abreviatura tiene 0 usos', async () => {
    const mockPrisma: any = {
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
    const mockAudit: any = { record: vi.fn().mockResolvedValue(undefined) };

    const useCase = new ManageAbreviaturasUseCase(mockPrisma, mockAudit);
    await useCase.eliminar(99n, { userId: 1n, username: 'admin' });

    expect(mockPrisma.abreviaturaGramatical.delete).toHaveBeenCalledWith({ where: { id: 99n } });
  });
});
