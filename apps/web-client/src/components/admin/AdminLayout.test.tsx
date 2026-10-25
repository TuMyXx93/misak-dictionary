import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from './AdminLayout';

vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn(),
}));

import { adminHttp } from '@/services/adminHttp';

describe('AdminLayout (R-005, R-021, R-024)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    window.localStorage.removeItem('misak-admin-theme');
    vi.clearAllMocks();
  });

  it('renderiza skip-link accesible con ancla a #admin-main (R-021)', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Contenido de prueba</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#admin-main');
    expect(document.getElementById('admin-main')).toBeInTheDocument();
  });

  it('inicia en Modo Claro (light) por defecto y permite alternar a Modo Oscuro (dark)', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminLayout>
          <div>Contenido de tema</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const adminRoot = container.querySelector('.misak-admin-scope');
    expect(adminRoot).toHaveAttribute('data-admin-theme', 'light');

    const toggleBtn = screen.getByRole('button', { name: /cambiar panel a modo oscuro/i });
    fireEvent.click(toggleBtn);

    expect(adminRoot).toHaveAttribute('data-admin-theme', 'dark');
    expect(window.localStorage.getItem('misak-admin-theme')).toBe('dark');
  });

  it('inyecta meta tag noindex, nofollow en document.head (R-024)', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Vista administrativa</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const metaRobots = document.querySelector('meta[name="robots"]');
    expect(metaRobots).not.toBeNull();
    expect(metaRobots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('muestra solo los enlaces permitidos según el rol del usuario (R-005)', () => {
    useAuthStore.getState().setSession(
      {
        userId: '10',
        username: 'revisor-namtrik',
        roles: ['cultural_reviewer'],
        permissions: ['taxonomy:ratify', 'taxonomy:read'],
      },
      'token-revisor',
    );

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Dashboard</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Cola de Revisión')).toBeInTheDocument();
    expect(screen.getByText('Léxico y Sentidos')).toBeInTheDocument();
    expect(screen.queryByText('Ajustes')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
  });

  it('super_admin puede ver todas las secciones incluyendo Usuarios y Ajustes', () => {
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'namtrik-admin',
        roles: ['super_admin'],
        permissions: [],
      },
      'token-root',
    );

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Dashboard</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
    expect(screen.getByText('Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Papelera')).toBeInTheDocument();
  });

  it('abre y cierra el menú móvil accesible con Escape', () => {
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'namtrik-admin',
        roles: ['super_admin'],
        permissions: [],
      },
      'token-root',
    );

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Contenido</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const menuBtn = screen.getByRole('button', { name: 'Abrir menú administrativo' });
    fireEvent.click(menuBtn);

    expect(screen.getByLabelText('Menú móvil de administración')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('Menú móvil de administración')).toBeNull();
  });

  it('el botón de cerrar sesión llama a POST /auth/logout y limpia la sesión local', async () => {
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'editor',
        roles: ['linguistic_editor'],
        permissions: ['dictionary:read'],
      },
      'token-valido',
    );
    vi.mocked(adminHttp).mockResolvedValue({});

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Contenido</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const logoutBtn = screen.getByRole('button', { name: 'Cerrar sesión' });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(adminHttp).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
