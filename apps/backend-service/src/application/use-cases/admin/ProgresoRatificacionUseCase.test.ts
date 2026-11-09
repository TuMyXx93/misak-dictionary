import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { ProgresoRatificacionUseCase } from './ProgresoRatificacionUseCase.js';

describe('ProgresoRatificacionUseCase', () => {
  let mockPrisma: any;
  let useCase: ProgresoRatificacionUseCase;

  beforeEach(() => {
    mockPrisma = {
      campoSemantico: {
        findMany: vi.fn(),
      },
      subcampoSemantico: {
        findMany: vi.fn(),
      },
      microcampo: {
        findMany: vi.fn(),
      },
      sentidoUbicacion: {
        findMany: vi.fn(),
      },
    };

    useCase = new ProgresoRatificacionUseCase(mockPrisma as unknown as PrismaClient);
  });

  it('calcula correctamente ratificados y total en árbol jerárquico acumulativo', async () => {
    mockPrisma.campoSemantico.findMany.mockResolvedValue([
      { id: 1n, codigo: 'C1', espanolTermino: 'Cosmovisión' },
    ]);

    mockPrisma.subcampoSemantico.findMany.mockResolvedValue([
      { id: 10n, codigo: 'C1.S1', espanolTermino: 'Espiritualidad', campoSemanticoId: 1n },
    ]);

    mockPrisma.microcampo.findMany.mockResolvedValue([
      {
        id: 100n,
        codigo: 'C1.S1.M1',
        espanolTermino: 'Rituales',
        subcampoSemanticoId: 10n,
        padreId: null,
      },
      {
        id: 101n,
        codigo: 'C1.S1.M1.1',
        espanolTermino: 'Limpieza',
        subcampoSemanticoId: 10n,
        padreId: 100n,
      },
    ]);

    mockPrisma.sentidoUbicacion.findMany.mockResolvedValue([
      // Sentido 1 en M1 (ratificado)
      {
        campoSemanticoId: null,
        subcampoSemanticoId: null,
        microcampoId: 100n,
        sentido: { id: 1n, estado: 'ratificado' },
      },
      // Sentido 2 en M1.1 (borrador)
      {
        campoSemanticoId: null,
        subcampoSemanticoId: null,
        microcampoId: 101n,
        sentido: { id: 2n, estado: 'borrador' },
      },
    ]);

    const resultado = await useCase.execute();

    const campo = resultado.find((r) => r.codigo === 'C1');
    const subcampo = resultado.find((r) => r.codigo === 'C1.S1');
    const m1 = resultado.find((r) => r.codigo === 'C1.S1.M1');
    const m11 = resultado.find((r) => r.codigo === 'C1.S1.M1.1');

    // M1.1: 0 ratificados / 1 total (0%)
    expect(m11).toMatchObject({
      codigo: 'C1.S1.M1.1',
      ratificados: 0,
      total: 1,
      porcentaje: 0,
      padreCodigo: 'C1.S1.M1',
    });

    // M1: 1 propio + 1 de M1.1 = 2 total, 1 ratificado (50%)
    expect(m1).toMatchObject({
      codigo: 'C1.S1.M1',
      ratificados: 1,
      total: 2,
      porcentaje: 50,
      padreCodigo: 'C1.S1',
    });

    // Subcampo: acumula los 2 sentidos de sus microcampos = 2 total, 1 ratificado (50%)
    expect(subcampo).toMatchObject({
      codigo: 'C1.S1',
      ratificados: 1,
      total: 2,
      porcentaje: 50,
      padreCodigo: 'C1',
    });

    // Campo: acumula los 2 sentidos = 2 total, 1 ratificado (50%)
    expect(campo).toMatchObject({
      codigo: 'C1',
      ratificados: 1,
      total: 2,
      porcentaje: 50,
    });
  });

  it('aplica filtro soloConPendientes excluyendo nodos 100% ratificados', async () => {
    mockPrisma.campoSemantico.findMany.mockResolvedValue([
      { id: 1n, codigo: 'C1', espanolTermino: 'Campo 1' },
      { id: 2n, codigo: 'C2', espanolTermino: 'Campo 2' },
    ]);
    mockPrisma.subcampoSemantico.findMany.mockResolvedValue([]);
    mockPrisma.microcampo.findMany.mockResolvedValue([]);

    mockPrisma.sentidoUbicacion.findMany.mockResolvedValue([
      // En C1: 1 ratificado
      {
        campoSemanticoId: 1n,
        subcampoSemanticoId: null,
        microcampoId: null,
        sentido: { id: 10n, estado: 'ratificado' },
      },
      // En C2: 1 borrador
      {
        campoSemanticoId: 2n,
        subcampoSemanticoId: null,
        microcampoId: null,
        sentido: { id: 20n, estado: 'borrador' },
      },
    ]);

    const resultado = await useCase.execute({ soloConPendientes: true });

    // C1 está 100% ratificado (1/1), debe excluirse
    expect(resultado.find((r) => r.codigo === 'C1')).toBeUndefined();

    // C2 tiene pendientes (0/1), debe incluirse
    expect(resultado.find((r) => r.codigo === 'C2')).toBeDefined();
  });
});
