import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';
import { AjustesPage } from './AjustesPage';

vi.mock('@/hooks/useAdmin', () => ({
  useSystemSettings: vi.fn(),
  useUpdateSystemSettings: vi.fn(),
}));

describe('AjustesPage (T-050, R-026)', () => {
  const mockUpdateSettingsMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAdminModule.useSystemSettings).mockReturnValue({
      data: { publicOnlyRatified: false },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAdminModule.useUpdateSystemSettings).mockReturnValue({
      mutateAsync: mockUpdateSettingsMutateAsync,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('bloquea el acceso con alerta si el usuario no es super_admin (R-026)', () => {
    useAuthStore.getState().setSession(
      {
        userId: 'usr-admin-1',
        email: 'admin@namtrik.org',
        roles: ['admin'],
        permissions: ['system:users:manage'],
      },
      'token-admin',
    );

    render(<AjustesPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(/acceso denegado/i);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('muestra el switch y permite alternar la bandera PUBLIC_ONLY_RATIFIED a super_admin (R-026)', async () => {
    useAuthStore.getState().setSession(
      {
        userId: 'usr-root-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['system:settings:manage'],
      },
      'token-root',
    );

    mockUpdateSettingsMutateAsync.mockResolvedValueOnce({
      publicOnlyRatified: true,
    });

    render(<AjustesPage />);

    expect(
      screen.getByRole('heading', { name: /ajustes globales del sistema/i }),
    ).toBeInTheDocument();

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(mockUpdateSettingsMutateAsync).toHaveBeenCalledWith({
        publicOnlyRatified: true,
      });
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(/actualizada a activada/i);
    });
  });
});
