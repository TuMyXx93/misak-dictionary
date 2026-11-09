import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminThemeProvider } from '@/contexts/AdminThemeContext';
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
    window.localStorage.removeItem('misak-admin-theme');

    vi.mocked(useAdminModule.useSystemSettings).mockReturnValue({
      data: { publicOnlyRatified: false },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useSystemSettings>);

    vi.mocked(useAdminModule.useUpdateSystemSettings).mockReturnValue({
      mutateAsync: mockUpdateSettingsMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateSystemSettings>);
  });

  afterEach(() => {
    cleanup();
    window.localStorage.removeItem('misak-admin-theme');
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

  it('permite cambiar entre Modo Claro, Modo Oscuro y Sistema persistiendo en localStorage (misak-admin-theme)', async () => {
    useAuthStore.getState().setSession(
      {
        userId: 'usr-root-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['system:settings:manage'],
      },
      'token-root',
    );

    render(
      <AdminThemeProvider>
        <AjustesPage />
      </AdminThemeProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /apariencia del panel administrativo/i }),
    ).toBeInTheDocument();

    // Solo debe existir 1 role="switch" (PUBLIC_ONLY_RATIFIED)
    expect(screen.getAllByRole('switch')).toHaveLength(1);

    const lightRadio = screen.getByRole('radio', { name: /modo claro/i });
    const darkRadio = screen.getByRole('radio', { name: /modo oscuro/i });
    const systemRadio = screen.getByRole('radio', { name: /sistema/i });

    expect(lightRadio).toBeChecked();

    await userEvent.click(darkRadio);
    expect(darkRadio).toBeChecked();
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('dark');
    expect(document.documentElement.dataset.adminTheme).toBe('dark');

    await userEvent.click(systemRadio);
    expect(systemRadio).toBeChecked();
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('system');
    expect(document.documentElement.dataset.adminTheme).toBe('system');

    await userEvent.click(lightRadio);
    expect(lightRadio).toBeChecked();
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('light');
    expect(document.documentElement.dataset.adminTheme).toBe('light');
  });
});
