import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminHttp from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from './LoginPage';

vi.mock('@/services/adminHttp', () => ({
  adminLogin: vi.fn(),
  adminChangePassword: vi.fn(),
  adminHttp: vi.fn(),
}));

describe('LoginPage (T-042, R-001, R-028)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialRoute = '/admin/login') => {
    window.history.pushState({}, '', initialRoute);
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/sentidos" element={<div>Destino Admin Sentidos</div>} />
        </Routes>
      </BrowserRouter>,
    );
  };

  it('muestra el formulario de login accesible y permite ingresar datos', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /diccionario namtrik/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/correo institucional/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(submitBtn).toBeInTheDocument();
  });

  it('muestra mensaje genérico ante credenciales inválidas sin revelar la causa (R-001)', async () => {
    vi.mocked(adminHttp.adminLogin).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo institucional/i), 'admin@namtrik.org');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Credenciales inválidas. Por favor verifique sus datos.');
  });

  it('navega al panel cuando el login es exitoso y no requiere cambio de contraseña', async () => {
    vi.mocked(adminHttp.adminLogin).mockResolvedValueOnce({
      user: {
        userId: 'u1',
        email: 'editor@namtrik.org',
        roles: ['content_admin'],
        mustChangePassword: false,
      },
      accessToken: 'jwt-123',
    });

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo institucional/i), 'editor@namtrik.org');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'SecretPass123!');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Destino Admin Sentidos')).toBeInTheDocument();
    });
  });

  it('activa el flujo de cambio obligatorio de contraseña cuando mustChangePassword es true (R-028)', async () => {
    vi.mocked(adminHttp.adminLogin).mockResolvedValueOnce({
      user: {
        userId: 'root-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        mustChangePassword: true,
      },
      accessToken: 'jwt-root',
    });
    vi.mocked(adminHttp.adminChangePassword).mockResolvedValueOnce({
      message: 'Contraseña actualizada',
    });

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo institucional/i), 'root@namtrik.org');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'TempPass123!');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    // Debe mostrar la pantalla de cambio obligatorio
    expect(
      await screen.findByRole('heading', {
        name: /cambio de contraseña obligatorio/i,
      }),
    ).toBeInTheDocument();

    const newPassInput = screen.getByLabelText(/^nueva contraseña/i);
    const confirmPassInput = screen.getByLabelText(/confirmar nueva contraseña/i);
    const updateBtn = screen.getByRole('button', {
      name: /actualizar contraseña/i,
    });

    // Validar error de coincidencia
    await userEvent.type(newPassInput, 'NewSecurePass2026!');
    await userEvent.type(confirmPassInput, 'MismatchPass!');
    await userEvent.click(updateBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');

    // Corregir confirmación
    await userEvent.clear(confirmPassInput);
    await userEvent.type(confirmPassInput, 'NewSecurePass2026!');
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminHttp.adminChangePassword).toHaveBeenCalledWith(
        'TempPass123!',
        'NewSecurePass2026!',
      );
      expect(screen.getByText('Destino Admin Sentidos')).toBeInTheDocument();
    });
  });
});
