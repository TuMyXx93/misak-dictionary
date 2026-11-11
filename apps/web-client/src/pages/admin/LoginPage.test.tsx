import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminHttp from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from './LoginPage';

vi.mock('@/services/adminHttp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/adminHttp')>();
  return {
    ...actual,
    adminLogin: vi.fn(),
    adminChangePassword: vi.fn(),
    adminHttp: vi.fn(),
  };
});

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
          <Route path="/" element={<div>Inicio Público</div>} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/sentidos" element={<div>Destino Admin Sentidos</div>} />
        </Routes>
      </BrowserRouter>,
    );
  };

  it('muestra el formulario dual accesible (correo o usuario), emblema Misak y sin toggle de tema', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /wamtɵrmarɵpik/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir al diccionario/i })).toHaveAttribute('href', '/');

    const identifierInput = screen.getByLabelText(/correo o nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    expect(identifierInput).toHaveAttribute('type', 'text');
    expect(identifierInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(submitBtn).toBeInTheDocument();

    // No debe existir conmutador de modo claro/oscuro fuera de /admin/*
    expect(screen.queryByRole('button', { name: /modo claro|modo oscuro/i })).toBeNull();

    // Permite alternar visibilidad de la clave
    await userEvent.click(screen.getByRole('button', { name: /mostrar clave/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('muestra mensaje genérico ante credenciales inválidas sin revelar la causa (R-001)', async () => {
    vi.mocked(adminHttp.adminLogin).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo o nombre de usuario/i), 'admin@namtrik.org');
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Credenciales inválidas. Por favor verifique sus datos.');
  });

  it('permite iniciar sesión tanto por correo como por nombre de usuario autogenerado', async () => {
    vi.mocked(adminHttp.adminLogin).mockResolvedValueOnce({
      user: {
        userId: 'u1',
        username: 'pedro.tunubala',
        email: 'pedro@namtrik.org',
        roles: ['content_admin'],
        mustChangePassword: false,
      },
      accessToken: 'jwt-123',
    });

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo o nombre de usuario/i), 'pedro.tunubala');
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), 'SecretPass123!');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(adminHttp.adminLogin).toHaveBeenCalledWith('pedro.tunubala', 'SecretPass123!');
      expect(screen.getByText('Destino Admin Sentidos')).toBeInTheDocument();
    });
  });

  it('activa el flujo de cambio obligatorio de contraseña cuando mustChangePassword es true (R-028)', {
    timeout: 20000,
  }, async () => {
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

    fireEvent.change(screen.getByLabelText(/correo o nombre de usuario/i), {
      target: { value: 'root@namtrik.org' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: 'TempPass123!' },
    });
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

    // Validar botón de mostrar/ocultar contraseñas
    const toggleBtn = screen.getByRole('button', { name: /mostrar claves nuevas/i });
    await userEvent.click(toggleBtn);
    expect(newPassInput).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: /ocultar claves nuevas/i }));
    expect(newPassInput).toHaveAttribute('type', 'password');

    // Validar error de coincidencia y semáforo Fuerte
    fireEvent.change(newPassInput, { target: { value: 'NewSecurePass2026!' } });
    expect(screen.getByText('Fuerte')).toBeInTheDocument();
    fireEvent.change(confirmPassInput, { target: { value: 'MismatchPass!' } });
    await userEvent.click(updateBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');

    // Corregir confirmación
    fireEvent.change(confirmPassInput, { target: { value: 'NewSecurePass2026!' } });
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminHttp.adminChangePassword).toHaveBeenCalledWith(
        'TempPass123!',
        'NewSecurePass2026!',
      );
      expect(screen.getByText('Destino Admin Sentidos')).toBeInTheDocument();
    });
  });

  it('muestra error cuando falla adminChangePassword en cambio obligatorio', async () => {
    vi.mocked(adminHttp.adminLogin).mockResolvedValueOnce({
      user: {
        userId: 'root-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        mustChangePassword: true,
      },
      accessToken: 'jwt-root',
    });
    vi.mocked(adminHttp.adminChangePassword).mockRejectedValueOnce(
      new Error('La contraseña temporal no es válida.'),
    );

    renderComponent();

    fireEvent.change(screen.getByLabelText(/correo o nombre de usuario/i), {
      target: { value: 'root@namtrik.org' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: 'TempPass123!' },
    });
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(
      await screen.findByRole('heading', {
        name: /cambio de contraseña obligatorio/i,
      }),
    ).toBeInTheDocument();

    const newPassInput = screen.getByLabelText(/^nueva contraseña/i);
    const confirmPassInput = screen.getByLabelText(/confirmar nueva contraseña/i);
    const updateBtn = screen.getByRole('button', { name: /actualizar contraseña/i });

    fireEvent.change(newPassInput, { target: { value: 'NewSecurePass2026!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewSecurePass2026!' } });
    await userEvent.click(updateBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña temporal no es válida.',
    );
  });

  it('muestra temporizador regresivo ante cuenta bloqueada por intentos fallidos (R-003)', async () => {
    const lockedError = new adminHttp.AdminApiError(
      423,
      'Cuenta bloqueada temporalmente por intentos fallidos',
      'Locked',
      undefined,
      'AUTH_ACCOUNT_LOCKED',
      60,
    );
    vi.mocked(adminHttp.adminLogin).mockRejectedValueOnce(lockedError);

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo o nombre de usuario/i), 'bloqueado');
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Cuenta bloqueada temporalmente');
    expect(alert).toHaveTextContent('Tiempo de espera restante');
  });

  it('muestra mensaje semántico ante cuenta inactiva o suspendida (R-003)', async () => {
    const suspendedError = new adminHttp.AdminApiError(
      403,
      'Cuenta suspendida',
      'Forbidden',
      undefined,
      'AUTH_ACCOUNT_SUSPENDED',
    );
    vi.mocked(adminHttp.adminLogin).mockRejectedValueOnce(suspendedError);

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo o nombre de usuario/i), 'inactivo');
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), 'somepass');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/cuenta se encuentra inactiva o suspendida/i);
  });

  it('muestra el mensaje real del servidor ante un 403 que no es AUTH_ACCOUNT_SUSPENDED', async () => {
    const originForbiddenError = new adminHttp.AdminApiError(
      403,
      'Origin no permitido',
      'Forbidden',
    );
    vi.mocked(adminHttp.adminLogin).mockRejectedValueOnce(originForbiddenError);

    renderComponent();

    await userEvent.type(screen.getByLabelText(/correo o nombre de usuario/i), 'admin');
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), 'somepass');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Origin no permitido');
    expect(alert).not.toHaveTextContent(/cuenta se encuentra inactiva o suspendida/i);
  });
});
