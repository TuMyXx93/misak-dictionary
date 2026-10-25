import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminHttpModule from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { CambiarPasswordPage } from './CambiarPasswordPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/services/adminHttp', () => ({
  adminChangePassword: vi.fn(),
}));

describe('CambiarPasswordPage (R-005, R-007)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setSession(
      {
        userId: 'usr-1',
        email: 'usuario@namtrik.org',
        roles: ['admin'],
        permissions: ['users:manage'],
        mustChangePassword: true,
      },
      'token-test',
    );
  });

  it('renderiza encabezado institucional y mensaje de cambio obligatorio si mustChangePassword está activo', () => {
    render(<CambiarPasswordPage />);

    expect(screen.getByText('Actualizar Contraseña')).toBeInTheDocument();
    expect(
      screen.getByText(/debes cambiar tu contraseña temporal antes de continuar/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña actual \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nueva contraseña \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nueva contraseña \*/i)).toBeInTheDocument();
  });

  it('permite alternar visibilidad de las contraseñas con los botones de ojo', async () => {
    render(<CambiarPasswordPage />);

    const currentInput = screen.getByLabelText(/contraseña actual \*/i);
    expect(currentInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button', { name: /ver contraseña/i });
    await userEvent.click(toggleButtons[0]);
    await userEvent.click(toggleButtons[1]);
    await userEvent.click(toggleButtons[2]);

    expect(currentInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/^nueva contraseña \*/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/confirmar nueva contraseña \*/i)).toHaveAttribute('type', 'text');

    const hideButtons = screen.getAllByRole('button', { name: /ocultar contraseña/i });
    await userEvent.click(hideButtons[0]);
    await userEvent.click(hideButtons[1]);
    await userEvent.click(hideButtons[2]);

    expect(currentInput).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^nueva contraseña \*/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmar nueva contraseña \*/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('valida que la contraseña actual no esté vacía', () => {
    const { container } = render(<CambiarPasswordPage />);

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(
      screen.getByText(/por favor ingresa tu contraseña actual o temporal/i),
    ).toBeInTheDocument();
    expect(adminHttpModule.adminChangePassword).not.toHaveBeenCalled();
  });

  it('valida que la nueva contraseña tenga al menos 8 caracteres', () => {
    const { container } = render(<CambiarPasswordPage />);

    const currentInput = screen.getByLabelText(/contraseña actual \*/i);
    const newInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/confirmar nueva contraseña \*/i);

    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(
      screen.getByText(/la nueva contraseña debe tener al menos 8 caracteres/i),
    ).toBeInTheDocument();
    expect(adminHttpModule.adminChangePassword).not.toHaveBeenCalled();
  });

  it('valida coincidencia entre la nueva contraseña y su confirmación', () => {
    const { container } = render(<CambiarPasswordPage />);

    const currentInput = screen.getByLabelText(/contraseña actual \*/i);
    const newInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/confirmar nueva contraseña \*/i);

    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'SecurePassword123#' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchPassword123#' } });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(
      screen.getByText(/las contraseñas no coinciden\. por favor verifica los datos/i),
    ).toBeInTheDocument();
    expect(adminHttpModule.adminChangePassword).not.toHaveBeenCalled();
  });

  it('envía la actualización con éxito y redirige a la ruta autorizada con replace', async () => {
    vi.mocked(adminHttpModule.adminChangePassword).mockImplementationOnce(async () => {
      const u = useAuthStore.getState().user!;
      useAuthStore.getState().setSession({ ...u, mustChangePassword: false }, 'token-test');
      return { statusCode: 200, message: 'Password updated' };
    });

    const { container } = render(<CambiarPasswordPage />);

    const currentInput = screen.getByLabelText(/contraseña actual \*/i);
    const newInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/confirmar nueva contraseña \*/i);

    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'NewSecurePass123#' } });
    fireEvent.change(confirmInput, { target: { value: 'NewSecurePass123#' } });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(adminHttpModule.adminChangePassword).toHaveBeenCalledWith(
        'OldPass123!',
        'NewSecurePass123#',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/admin/usuarios', { replace: true });
    });
  });

  it('muestra mensaje de error amigable cuando adminChangePassword rechaza la petición', async () => {
    vi.mocked(adminHttpModule.adminChangePassword).mockRejectedValueOnce(
      new Error('La contraseña actual es incorrecta.'),
    );

    const { container } = render(<CambiarPasswordPage />);

    const currentInput = screen.getByLabelText(/contraseña actual \*/i);
    const newInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/confirmar nueva contraseña \*/i);

    fireEvent.change(currentInput, { target: { value: 'WrongOldPass!' } });
    fireEvent.change(newInput, { target: { value: 'NewSecurePass123#' } });
    fireEvent.change(confirmInput, { target: { value: 'NewSecurePass123#' } });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/la contraseña actual es incorrecta/i)).toBeInTheDocument();
    });
  });
});
