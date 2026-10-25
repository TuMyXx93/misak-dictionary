import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminThemeProvider } from '@/contexts/AdminThemeContext';
import * as useAdminModule from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';
import { UsuariosPage } from './UsuariosPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminUsers: vi.fn(),
  useUpdateUserRoles: vi.fn(),
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useToggleUserStatus: vi.fn(),
  useUnlockUser: vi.fn(),
}));

describe('UsuariosPage (T-048, R-018)', () => {
  const mockUsersData = {
    items: [
      {
        id: 'usr-1',
        username: 'root',
        email: 'root@namtrik.org',
        fullName: 'Root Super Admin',
        nombres: 'Root',
        apellidos: 'Admin',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '1000000000',
        telefonoContacto: '3001234567',
        direccionResidencia: 'Calle 1 # 2-3',
        barrio: 'Centro',
        departamento: 'Cauca',
        ciudadMunicipio: 'Silvia',
        roles: ['super_admin'],
        isActive: true,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      {
        id: 'usr-2',
        username: 'editor',
        email: 'editor@namtrik.org',
        fullName: 'Editor Contenido',
        nombres: 'Editor',
        apellidos: 'Contenido',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '1000000001',
        roles: ['content_admin'],
        isActive: true,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      {
        id: 'usr-3',
        username: 'bloqueado',
        email: 'bloqueado@namtrik.org',
        fullName: 'Usuario Bloqueado',
        roles: ['content_admin'],
        isActive: true,
        mustChangePassword: false,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 600000).toISOString(),
      },
    ],
  };

  const mockUpdateRolesMutateAsync = vi.fn();
  const mockCreateUserMutateAsync = vi.fn();
  const mockUpdateUserMutateAsync = vi.fn();
  const mockToggleStatusMutateAsync = vi.fn();
  const mockUnlockUserMutateAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

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
    } as unknown as ReturnType<typeof useAdminModule.useAdminUsers>);

    vi.mocked(useAdminModule.useUpdateUserRoles).mockReturnValue({
      mutateAsync: mockUpdateRolesMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateUserRoles>);

    vi.mocked(useAdminModule.useCreateUser).mockReturnValue({
      mutateAsync: mockCreateUserMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useCreateUser>);

    vi.mocked(useAdminModule.useUpdateUser).mockReturnValue({
      mutateAsync: mockUpdateUserMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateUser>);

    vi.mocked(useAdminModule.useToggleUserStatus).mockReturnValue({
      mutateAsync: mockToggleStatusMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useToggleUserStatus>);

    vi.mocked(useAdminModule.useUnlockUser).mockReturnValue({
      mutateAsync: mockUnlockUserMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUnlockUser>);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza la lista de usuarios y roles correctamente', () => {
    const { container } = render(
      <AdminThemeProvider>
        <UsuariosPage />
      </AdminThemeProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /gestión de usuarios y roles/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('root@namtrik.org • @root')).toBeInTheDocument();
    expect(screen.getByText('editor@namtrik.org • @editor')).toBeInTheDocument();
    expect(screen.getByText('Cambio requerido')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(container.querySelector('table.misak-responsive-table')).toBeInTheDocument();
    expect(container.querySelector('td[data-label="Usuario / Correo"]')).toBeInTheDocument();
  });

  it('permite abrir el expediente de usuario y guardar cambios', async () => {
    mockUpdateUserMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const editButtons = screen.getAllByRole('button', { name: /modificar roles/i });
    // Clic en editor@namtrik.org (usr-2)
    await userEvent.click(editButtons[1]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/expediente de usuario: editor contenido/i)).toBeInTheDocument();

    // Modificar teléfono
    const telInput = screen.getByLabelText(/número de contacto/i);
    await userEvent.clear(telInput);
    await userEvent.type(telInput, '3119998877');

    // Activar rol Revisor Cultural
    const reviewerCheckbox = screen.getByLabelText(/revisor cultural/i);
    await userEvent.click(reviewerCheckbox);

    const saveBtn = screen.getByRole('button', { name: /guardar expediente/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateUserMutateAsync).toHaveBeenCalledWith({
        userId: 'usr-2',
        data: expect.objectContaining({
          telefonoContacto: '3119998877',
          roles: ['content_admin', 'cultural_reviewer'],
        }),
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/expediente actualizado exitosamente/i);
    });
  });

  it('permite desactivar y activar acceso en crudo', async () => {
    mockToggleStatusMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const editButtons = screen.getAllByRole('button', { name: /modificar roles/i });
    await userEvent.click(editButtons[1]);

    const toggleBtn = screen.getByRole('button', { name: /desactivar acceso en crudo/i });
    await userEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockToggleStatusMutateAsync).toHaveBeenCalledWith({
        userId: 'usr-2',
        isActive: false,
      });
    });
  });

  it('muestra aviso de cuenta bloqueada y botón para desbloquear de inmediato', async () => {
    mockUnlockUserMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const editButtons = screen.getAllByRole('button', { name: /modificar roles/i });
    // Clic en bloqueado@namtrik.org (usr-3)
    await userEvent.click(editButtons[2]);

    expect(screen.getByText(/cuenta bloqueada por intentos fallidos/i)).toBeInTheDocument();

    const unlockBtn = screen.getByRole('button', {
      name: /desbloquear cuenta de inmediato/i,
    });
    await userEvent.click(unlockBtn);

    await waitFor(() => {
      expect(mockUnlockUserMutateAsync).toHaveBeenCalledWith('usr-3');
      expect(screen.getByRole('alert')).toHaveTextContent(/desbloqueada de inmediato/i);
    });
  });

  it('permite abrir modal de nuevo usuario, autogenerar contraseña y crearlo', async () => {
    mockCreateUserMutateAsync.mockResolvedValueOnce({
      id: 'usr-4',
      email: 'nuevo@namtrik.org',
    });

    render(<UsuariosPage />);

    const createBtn = screen.getByRole('button', { name: /\+ nuevo usuario/i });
    await userEvent.click(createBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Crear Nuevo Usuario')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/correo de usuario \*/i), {
      target: { value: 'nuevo@namtrik.org' },
    });
    fireEvent.change(screen.getByLabelText(/nombre o nombres \*/i), {
      target: { value: 'Pedro' },
    });
    fireEvent.change(screen.getByLabelText(/apellido o apellidos \*/i), {
      target: { value: 'Tunubalá' },
    });
    fireEvent.change(screen.getByLabelText(/número identificación \*/i), {
      target: { value: '1061222333' },
    });

    // Campos opcionales de ubicación y contacto
    fireEvent.change(screen.getByLabelText(/1\) Dirección como tal/i), {
      target: { value: 'Vereda Guambía' },
    });
    fireEvent.change(screen.getByLabelText(/2\) Sección de barrio/i), {
      target: { value: 'Sector Central' },
    });
    fireEvent.change(screen.getByLabelText(/3\) Sección de departamento/i), {
      target: { value: 'Cauca' },
    });
    fireEvent.change(screen.getByLabelText(/4\) Sección de ciudad\/municipio/i), {
      target: { value: 'Silvia' },
    });

    // Asignar rol adicional
    const culturalReviewerCheckbox = screen.getByRole('checkbox', { name: /revisor cultural/i });
    fireEvent.click(culturalReviewerCheckbox);

    // Usar generador de contraseñas automáticas
    const genPassBtn = screen.getByRole('button', {
      name: /generar contraseña segura automática/i,
    });
    fireEvent.click(genPassBtn);

    // Debe mostrar nivel de robustez Fuerte
    expect(screen.getByText('Fuerte')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /crear usuario/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateUserMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@namtrik.org',
          nombres: 'Pedro',
          apellidos: 'Tunubalá',
          numeroIdentificacion: '1061222333',
          direccionResidencia: 'Vereda Guambía',
          barrio: 'Sector Central',
          departamento: 'Cauca',
          ciudadMunicipio: 'Silvia',
          roles: expect.arrayContaining(['content_admin', 'cultural_reviewer']),
        }),
      );
      expect(screen.getByRole('alert')).toHaveTextContent(/usuario nuevo@namtrik.org creado/i);
    });
  });

  it('muestra mensaje de error cuando la creación de usuario falla y permite cancelar', async () => {
    mockCreateUserMutateAsync.mockRejectedValueOnce(new Error('El correo ya está en uso'));

    render(<UsuariosPage />);

    const createBtn = screen.getByRole('button', { name: /\+ nuevo usuario/i });
    fireEvent.click(createBtn);

    fireEvent.change(screen.getByLabelText(/correo de usuario \*/i), {
      target: { value: 'duplicado@namtrik.org' },
    });
    fireEvent.change(screen.getByLabelText(/nombre o nombres \*/i), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText(/apellido o apellidos \*/i), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText(/número identificación \*/i), {
      target: { value: '999888' },
    });

    const genPassBtn = screen.getByRole('button', {
      name: /generar contraseña segura automática/i,
    });
    fireEvent.click(genPassBtn);

    const submitBtn = screen.getByRole('button', { name: /crear usuario/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/el correo ya está en uso/i);
    });

    const cancelBtn = screen.getByRole('button', { name: /^cancelar$/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
