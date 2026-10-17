import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { UsuariosPage } from './UsuariosPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminUsers: vi.fn(),
  useUpdateUserRoles: vi.fn(),
}));

describe('UsuariosPage (T-048, R-018)', () => {
  const mockUsersData = {
    items: [
      {
        id: 'usr-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        mustChangePassword: false,
      },
      {
        id: 'usr-2',
        email: 'editor@namtrik.org',
        roles: ['content_admin'],
        mustChangePassword: true,
      },
    ],
  };

  const mockUpdateRolesMutateAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'usr-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['system:users:manage'],
      },
      'token-root',
    );

    vi.mocked(useAdminModule.useAdminUsers).mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    vi.mocked(useAdminModule.useUpdateUserRoles).mockReturnValue({
      mutateAsync: mockUpdateRolesMutateAsync,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza la lista de usuarios y roles correctamente', () => {
    render(<UsuariosPage />);

    expect(
      screen.getByRole('heading', { name: /gestión de usuarios y roles/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('root@namtrik.org')).toBeInTheDocument();
    expect(screen.getByText('editor@namtrik.org')).toBeInTheDocument();
    expect(screen.getByText('Cambio requerido')).toBeInTheDocument();
  });

  it('permite modificar roles y llamar a useUpdateUserRoles', async () => {
    mockUpdateRolesMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const editButtons = screen.getAllByRole('button', { name: /modificar roles/i });
    // Clic en editor@namtrik.org
    await userEvent.click(editButtons[1]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/modificar roles de editor@namtrik.org/i)).toBeInTheDocument();

    // Activar rol Revisor Cultural
    const reviewerCheckbox = screen.getByLabelText(/revisor cultural/i);
    await userEvent.click(reviewerCheckbox);

    const saveBtn = screen.getByRole('button', { name: /guardar roles/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateRolesMutateAsync).toHaveBeenCalledWith({
        userId: 'usr-2',
        roles: ['content_admin', 'cultural_reviewer'],
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/roles actualizados/i);
    });
  });

  it('maneja error 409 al intentar revocar rol al último super_admin (R-018)', async () => {
    const error409 = new AdminApiError(
      409,
      'No es posible revocar el rol super_admin al último super_admin activo.',
      'Conflict',
    );
    mockUpdateRolesMutateAsync.mockRejectedValueOnce(error409);

    render(<UsuariosPage />);

    const editButtons = screen.getAllByRole('button', { name: /modificar roles/i });
    // Clic en root@namtrik.org
    await userEvent.click(editButtons[0]);

    // Desmarcar super_admin y marcar admin
    const superAdminChk = screen.getByLabelText(/super admin/i);
    await userEvent.click(superAdminChk);
    const adminChk = screen.getByLabelText(/administrador/i);
    await userEvent.click(adminChk);

    const saveBtn = screen.getByRole('button', { name: /guardar roles/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No es posible revocar el rol super_admin al último super_admin activo.',
      );
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
