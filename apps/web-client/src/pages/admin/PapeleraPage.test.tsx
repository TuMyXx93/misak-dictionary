import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { PapeleraPage } from './PapeleraPage';

vi.mock('@/hooks/useAdmin', () => ({
  usePapelera: vi.fn(),
  useRestaurarPapelera: vi.fn(),
  usePurgarPapelera: vi.fn(),
}));

describe('PapeleraPage (T-047, R-016, R-017)', () => {
  const date40DaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const date5DaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const mockPapeleraData = {
    items: [
      {
        id: 'pap-1',
        codigo: 'C1.S1.M5.E099',
        tipo: 'sentido',
        lema: 'tɵ',
        glosa: 'piedra antigua',
        deletedAt: date40DaysAgo,
      },
      {
        id: 'pap-2',
        codigo: 'C1.S1.M5.E100',
        tipo: 'sentido',
        lema: 'may',
        glosa: 'camino reciente',
        deletedAt: date5DaysAgo,
      },
    ],
  };

  const mockRestaurarMutateAsync = vi.fn();
  const mockPurgarMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'admin-super',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['dictionary:read', 'dictionary:delete'],
      },
      'token-root',
    );

    vi.mocked(useAdminModule.usePapelera).mockReturnValue({
      data: mockPapeleraData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.usePapelera>);

    vi.mocked(useAdminModule.useRestaurarPapelera).mockReturnValue({
      mutateAsync: mockRestaurarMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRestaurarPapelera>);

    vi.mocked(useAdminModule.usePurgarPapelera).mockReturnValue({
      mutateAsync: mockPurgarMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.usePurgarPapelera>);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza la lista de elementos en papelera con fecha y días transcurridos', () => {
    render(<PapeleraPage />);

    expect(screen.getByRole('heading', { name: /papelera del sistema/i })).toBeInTheDocument();
    expect(screen.getByText('C1.S1.M5.E099')).toBeInTheDocument();
    expect(screen.getByText('C1.S1.M5.E100')).toBeInTheDocument();
    expect(screen.getByText(/40 días/i)).toBeInTheDocument();
    expect(screen.getByText(/5 días/i)).toBeInTheDocument();
  });

  it('restaura elemento tras confirmación y maneja error 409 de colisión (R-016)', async () => {
    mockRestaurarMutateAsync.mockRejectedValueOnce(
      new AdminApiError(409, 'El código ya está en uso por un sentido activo', 'Conflict'),
    );

    render(<PapeleraPage />);

    const restoreButtons = screen.getAllByRole('button', { name: /^restaurar$/i });
    await userEvent.click(restoreButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirmar restauración/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'El código ya está en uso por un sentido activo',
      );
    });
  });

  it('bloquea purga si tiene menos de 30 días y exige ConfirmarPorCodigo para purga permanente (R-017)', async () => {
    mockPurgarMutateAsync.mockResolvedValueOnce({ success: true });

    render(<PapeleraPage />);

    const purgeButtons = screen.getAllByRole('button', { name: /^purgar$/i });
    // Primer item tiene 40 días: habilitado
    expect(purgeButtons[0]).not.toBeDisabled();
    // Segundo item tiene 5 días: deshabilitado
    expect(purgeButtons[1]).toBeDisabled();

    // Clic en purgar del primer item
    await userEvent.click(purgeButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/purga definitiva \(irreversible\)/i)).toBeInTheDocument();

    const confirmPurgeBtn = screen.getByRole('button', { name: /confirmar purga permanente/i });
    expect(confirmPurgeBtn).toBeDisabled();

    // Escribir código erróneo
    const codeInput = screen.getByLabelText(/escriba .* para confirmar/i);
    await userEvent.type(codeInput, 'WRONG_CODE');
    expect(confirmPurgeBtn).toBeDisabled();

    // Escribir código exacto
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'C1.S1.M5.E099');
    expect(confirmPurgeBtn).not.toBeDisabled();

    await userEvent.click(confirmPurgeBtn);

    await waitFor(() => {
      expect(mockPurgarMutateAsync).toHaveBeenCalledWith({ id: 'pap-1' });
      expect(screen.getByRole('alert')).toHaveTextContent(/purgado permanentemente/i);
    });
  });
});
