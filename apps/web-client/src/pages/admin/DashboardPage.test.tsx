import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { DashboardPage } from './DashboardPage';

vi.mock('@/hooks/useAdmin', () => ({
  useProgresoRatificacion: vi.fn(),
}));

describe('DashboardPage (T-046, R-027)', () => {
  const mockProgresoData = {
    global: {
      total: 100,
      ratificados: 75,
      borradores: 25,
      porcentaje: 75,
    },
    nodos: [
      {
        codigo: 'C1',
        titulo: 'Cosmovisión y Territorio',
        tipo: 'campo' as const,
        total: 50,
        ratificados: 50,
        borradores: 0,
        porcentaje: 100,
      },
      {
        codigo: 'C1.S1.M2',
        titulo: 'Espacios sagrados',
        tipo: 'microcampo' as const,
        total: 50,
        ratificados: 25,
        borradores: 25,
        porcentaje: 50,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminModule.useProgresoRatificacion).mockReturnValue({
      data: mockProgresoData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useProgresoRatificacion>);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza tarjetas de métricas globales y tabla de nodos con progreso', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', { name: /tablero de gobierno editorial/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // total
    expect(screen.getByText('75')).toBeInTheDocument(); // ratificados
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1); // borradores
    expect(screen.getByText('75%')).toBeInTheDocument(); // avance

    expect(screen.getByText('Cosmovisión y Territorio')).toBeInTheDocument();
    expect(screen.getByText('Espacios sagrados')).toBeInTheDocument();

    const progressbars = screen.getAllByRole('progressbar');
    expect(progressbars.length).toBeGreaterThanOrEqual(2);
  });

  it('filtra nodos ocultando los que tienen 0 borradores al activar solo con pendientes', async () => {
    render(<DashboardPage />);

    expect(screen.getByText('Cosmovisión y Territorio')).toBeInTheDocument();
    expect(screen.getByText('Espacios sagrados')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: /mostrar solo nodos con borradores pendientes/i,
    });
    await userEvent.click(checkbox);

    // C1 tenía 0 borradores, por lo que desaparece
    expect(screen.queryByText('Cosmovisión y Territorio')).not.toBeInTheDocument();
    // C1.S1.M2 tiene 25 borradores, por lo que permanece
    expect(screen.getByText('Espacios sagrados')).toBeInTheDocument();
  });

  it('preserva decimales de progreso real por debajo de 1% (2 / 1351 = 0.15%) sin redondear a 0%', () => {
    vi.mocked(useAdminModule.useProgresoRatificacion).mockReturnValue({
      data: {
        global: {
          total: 1351,
          ratificados: 2,
          borradores: 1349,
          porcentaje: 0.15,
        },
        nodos: [
          {
            codigo: 'C4.S6',
            titulo: 'Fauna local',
            tipo: 'subcampo',
            total: 1351,
            ratificados: 2,
            borradores: 1349,
            porcentaje: 0.15,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useProgresoRatificacion>);

    render(<DashboardPage />);

    expect(screen.getAllByText('1351')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('1349')).toHaveLength(2);
    expect(screen.getAllByText('0.15%')).toHaveLength(2);
  });
});
