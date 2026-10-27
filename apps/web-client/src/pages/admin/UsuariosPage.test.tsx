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
  useResetUserPassword: vi.fn(),
}));

describe('UsuariosPage (T-048, R-004, R-005, R-006)', () => {
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
  const mockResetPasswordMutateAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'usr-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['users:manage'],
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

    vi.mocked(useAdminModule.useResetUserPassword).mockReturnValue({
      mutateAsync: mockResetPasswordMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useResetUserPassword>);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza la lista de usuarios con nombres de roles en español sin tecnicismos en inglés (R-006)', () => {
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

    // Comprobar que muestra nombres en español
    expect(screen.getByText('Superadministrador')).toBeInTheDocument();
    expect(screen.getAllByText('Editor de Contenido').length).toBeGreaterThan(0);

    // No debe mostrar los identificadores técnicos en inglés en la tabla
    expect(screen.queryByText('super_admin')).toBeNull();
    expect(screen.queryByText('content_admin')).toBeNull();

    expect(screen.getByText('Cambio requerido')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(container.querySelector('table.misak-responsive-table')).toBeInTheDocument();
  });

  it('permite abrir el expediente y guardar cambios con UserFormFields y RoleSelector', {
    timeout: 30000,
  }, async () => {
    mockUpdateUserMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const editButton = screen.getByRole('button', {
      name: /modificar expediente de editor@namtrik\.org/i,
    });
    await userEvent.click(editButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/expediente: editor contenido/i)).toBeInTheDocument();

    // Modificar teléfono rápidamente sin sobrecargar timers
    const telInput = screen.getByLabelText(/teléfono de contacto/i);
    fireEvent.change(telInput, { target: { value: '3119998877' } });

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

  it('permite suspender cuenta confirmando con motivo opcional mediante SuspendUserDialog (R-004)', async () => {
    mockToggleStatusMutateAsync.mockResolvedValueOnce({ success: true });

    render(<UsuariosPage />);

    const suspendButton = screen.getByRole('button', {
      name: /suspender cuenta de editor@namtrik\.org/i,
    });
    await userEvent.click(suspendButton);

    // Debe abrir el diálogo de suspensión
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirmar suspensión de cuenta/i)).toBeInTheDocument();
    expect(
      screen.getByText(/todas sus sesiones abiertas serán cerradas de inmediato/i),
    ).toBeInTheDocument();

    // Ingresar motivo opcional
    const reasonInput = screen.getByLabelText(/motivo de la suspensión/i);
    await userEvent.type(reasonInput, 'Licencia médica');

    const confirmBtn = screen.getByRole('button', { name: /^suspender cuenta$/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockToggleStatusMutateAsync).toHaveBeenCalledWith({
        userId: 'usr-2',
        isActive: false,
        motivo: 'Licencia médica',
      });
    });
  });

  it('permite restablecer contraseña temporal mediante ResetPasswordPanel (R-005)', async () => {
    mockResetPasswordMutateAsync.mockResolvedValueOnce({
      statusCode: 200,
      message: 'OK',
      temporaryPassword: 'TempPassword123#',
      mustChangePassword: true,
      user: { id: 'usr-2', username: 'editor' },
    });

    render(<UsuariosPage />);

    const resetButton = screen.getByRole('button', {
      name: /restablecer contraseña de editor@namtrik\.org/i,
    });
    await userEvent.click(resetButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/restablecer contraseña de acceso/i)).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /generar clave temporal/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockResetPasswordMutateAsync).toHaveBeenCalledWith({ userId: 'usr-2' });
      expect(screen.getByText('TempPassword123#')).toBeInTheDocument();
      expect(
        screen.getByText(/copia y entrega esta clave segura al integrante/i),
      ).toBeInTheDocument();
    });
  });

  it('permite crear nuevo usuario con copys neutrales humanizados sin doble scroll (R-006)', async () => {
    mockCreateUserMutateAsync.mockResolvedValueOnce({
      id: 'usr-4',
      email: 'nuevo@namtrik.org',
    });

    render(<UsuariosPage />);

    const createBtn = screen.getByRole('button', { name: /\+ nuevo usuario/i });
    await userEvent.click(createBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Crear nuevo usuario')).toBeInTheDocument();
    expect(
      screen.getByText(/completa la información para registrar a un nuevo integrante/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/correo electrónico \*/i), {
      target: { value: 'nuevo@namtrik.org' },
    });
    fireEvent.change(screen.getByLabelText(/nombre\(s\) \*/i), {
      target: { value: 'Pedro' },
    });
    fireEvent.change(screen.getByLabelText(/apellido\(s\) \*/i), {
      target: { value: 'Tunubalá' },
    });
    fireEvent.change(screen.getByLabelText(/número de documento \*/i), {
      target: { value: '1061222333' },
    });

    // Campos de ubicación
    fireEvent.change(screen.getByLabelText(/dirección principal/i), {
      target: { value: 'Vereda Guambía' },
    });
    fireEvent.change(screen.getByLabelText(/barrio \/ sector \/ localidad/i), {
      target: { value: 'Sector Central' },
    });
    fireEvent.change(screen.getByLabelText(/departamento/i), {
      target: { value: 'Cauca' },
    });
    fireEvent.change(screen.getByLabelText(/ciudad \/ municipio/i), {
      target: { value: 'Silvia' },
    });

    // Generar contraseña automática
    const genPassBtn = screen.getByRole('button', {
      name: /generar contraseña automática/i,
    });
    fireEvent.click(genPassBtn);

    // Debe existir botón de copiar contraseña
    expect(screen.getByRole('button', { name: /copiar contraseña/i })).toBeInTheDocument();

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
        }),
      );
      expect(screen.getByRole('alert')).toHaveTextContent(/usuario nuevo@namtrik.org creado/i);
    });
  }, 30000);
});
