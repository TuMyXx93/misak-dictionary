import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';
import { RevisionPage } from './RevisionPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminSentidos: vi.fn(),
  useRatificarSentido: vi.fn(),
  useRevertirSentido: vi.fn(),
  useRatificarLote: vi.fn(),
}));

describe('RevisionPage (T-045, R-011, R-013, R-014, R-025)', () => {
  const mockBorradores = {
    items: [
      {
        id: 'rev-1',
        codigo: 'C1.S1.M2.E001',
        lema: 'kanɵ',
        glosa: 'uno / unidad',
        estado: 'borrador' as const,
        version: 1,
        tipo: 'termino',
        updatedAt: '2026-10-16T10:00:00Z',
      },
    ],
  };

  const mockRatificarMutateAsync = vi.fn();
  const mockRevertirMutateAsync = vi.fn();
  const mockRatificarLoteMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'rev-user-1',
        email: 'revisor@namtrik.org',
        roles: ['cultural_reviewer'],
        permissions: ['taxonomy:read', 'taxonomy:ratify', 'taxonomy:revert'],
      },
      'token-rev',
    );

    vi.mocked(useAdminModule.useAdminSentidos).mockReturnValue({
      data: mockBorradores,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAdminModule.useRatificarSentido).mockReturnValue({
      mutateAsync: mockRatificarMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useAdminModule.useRevertirSentido).mockReturnValue({
      mutateAsync: mockRevertirMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useAdminModule.useRatificarLote).mockReturnValue({
      mutateAsync: mockRatificarLoteMutateAsync,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <RevisionPage />
      </BrowserRouter>,
    );

  it('renderiza la cola de borradores y permite ratificar con checklist (R-011)', async () => {
    mockRatificarMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /cola editorial de revisión/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('C1.S1.M2.E001')).toBeInTheDocument();
    expect(screen.getByText('kanɵ')).toBeInTheDocument();

    const ratifyBtn = screen.getByRole('button', { name: /^ratificar$/i });
    await userEvent.click(ratifyBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirmar ratificación/i });
    expect(confirmBtn).toBeDisabled();

    // Marcar checkboxes del checklist
    const checkboxes = screen.getAllByRole('checkbox');
    for (const chk of checkboxes) {
      await userEvent.click(chk);
    }

    expect(confirmBtn).not.toBeDisabled();
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRatificarMutateAsync).toHaveBeenCalledWith({ id: 'rev-1' });
      expect(screen.getByRole('alert')).toHaveTextContent(/ratificado exitosamente/i);
    });
  });

  it('exige motivo de al menos 10 caracteres para revertir un sentido (R-013)', async () => {
    mockRevertirMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    const revertBtn = screen.getByRole('button', { name: /revertir/i });
    await userEvent.click(revertBtn);

    expect(
      screen.getByRole('heading', { name: /revertir sentido \(c1\.s1\.m2\.e001\)/i }),
    ).toBeInTheDocument();

    const motivoInput = screen.getByLabelText(/motivo obligatorio/i);
    const confirmRevertBtn = screen.getByRole('button', { name: /confirmar reversión/i });

    // Con menos de 10 caracteres permanece deshabilitado
    await userEvent.type(motivoInput, 'Corto');
    expect(confirmRevertBtn).toBeDisabled();

    // Con >= 10 caracteres se habilita
    await userEvent.type(motivoInput, ' motivo de prueba válido');
    expect(confirmRevertBtn).not.toBeDisabled();

    await userEvent.click(confirmRevertBtn);

    await waitFor(() => {
      expect(mockRevertirMutateAsync).toHaveBeenCalledWith({
        id: 'rev-1',
        motivo: 'Corto motivo de prueba válido',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/devuelto a revisión/i);
    });
  });

  it('permite ratificar por lote un microcampo completo (R-014, R-025)', async () => {
    mockRatificarLoteMutateAsync.mockResolvedValueOnce({ count: 12 });
    renderComponent();

    const loteInput = screen.getByPlaceholderText(/código microcampo/i);
    await userEvent.type(loteInput, 'C1.S1.M2');

    const loteBtn = screen.getByRole('button', { name: /ratificar lote/i });
    expect(loteBtn).not.toBeDisabled();
    await userEvent.click(loteBtn);

    // Diálogo de checklist para lote
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/ratificación editorial por lote \(c1\.s1\.m2\)/i)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    for (const chk of checkboxes) {
      await userEvent.click(chk);
    }

    const confirmBtn = screen.getByRole('button', { name: /confirmar ratificación/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRatificarLoteMutateAsync).toHaveBeenCalledWith({
        microcampoCodigo: 'C1.S1.M2',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/12 sentidos aprobados/i);
    });
  });
});
