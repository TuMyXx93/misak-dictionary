import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from './AdminLayout';

vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn(),
}));

import { adminHttp } from '@/services/adminHttp';

describe('AdminLayout (R-005, R-021, R-024, Spec 014 R-015)', () => {
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
        permissions: ['taxonomy:ratify', 'taxonomy:read', 'dictionary:read'],
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

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Cola de Revisión')).toBeInTheDocument();
    expect(screen.getByText('Léxico y Sentidos')).toBeInTheDocument();
    expect(screen.queryByText('Ajustes')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
  });

  it('el rol admin con settings:manage puede ver Ajustes en el menú lateral (Spec 013 R-008)', () => {
    useAuthStore.getState().setSession(
      {
        userId: '2',
        username: 'admin-general',
        roles: ['admin'],
        permissions: ['users:manage', 'settings:manage', 'dictionary:read'],
      },
      'token-admin',
    );

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Vista Admin</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Ajustes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
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
      expect(adminHttp).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        headers: { 'X-Client': 'web-admin' },
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  it('acota altura y habilita scroll independiente en el sidebar de escritorio con los 9 módulos >= 48px (Spec 014 R-015)', () => {
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
          <div>Contenido corto</div>
        </AdminLayout>
      </MemoryRouter>,
    );

    const desktopNav = screen.getByRole('navigation', {
      name: 'Navegación del panel de administración',
    });
    expect(desktopNav).toHaveClass(
      'flex-1',
      'min-h-0',
      'overflow-y-auto',
      'overscroll-contain',
      'misak-admin-sidebar-nav',
    );
    expect(desktopNav).not.toHaveClass('sticky', 'top-17');

    const desktopAside = desktopNav.closest('aside');
    expect(desktopAside).not.toBeNull();
    expect(desktopAside).toHaveClass(
      'misak-admin-sidebar',
      'lg:w-60',
      'xl:w-64',
      'lg:sticky',
      'lg:top-[var(--admin-header-h)]',
      'lg:self-start',
      'lg:overflow-hidden',
    );

    const footerBadge = screen.getByText('Resguardo de Guambia').parentElement?.parentElement;
    expect(footerBadge).toHaveClass('shrink-0');

    const navLinks = within(desktopNav).getAllByRole('link');
    expect(navLinks).toHaveLength(9);
    for (const link of navLinks) {
      expect(link.className).toMatch(/min-h-\[48px\]/);
    }
  });

  it('restaura el foco al botón de menú cuando se cierra el cajón móvil con Escape o botón de cierre (Spec 014 R-015)', async () => {
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
    expect(menuBtn).toHaveAttribute('aria-controls', 'admin-mobile-drawer');
    expect(menuBtn.className).toMatch(/min-h-\[48px\]/);

    fireEvent.click(menuBtn);
    const mobileDrawer = screen.getByLabelText('Menú móvil de administración');
    expect(mobileDrawer).toHaveAttribute('id', 'admin-mobile-drawer');
    expect(mobileDrawer).toHaveClass('overscroll-contain');

    const closeBtn = screen.getByRole('button', { name: 'Cerrar cajón administrativo' });
    expect(closeBtn.className).toMatch(/min-h-\[48px\]/);
    closeBtn.focus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('Menú móvil de administración')).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(menuBtn);
    });

    fireEvent.click(menuBtn);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú lateral' }));
    expect(screen.queryByLabelText('Menú móvil de administración')).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(menuBtn);
    });
  });

  it('cierra el cajón móvil y libera inert cuando el viewport cruza el breakpoint lg (>= 64rem) (Spec 014 R-015)', () => {
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'namtrik-admin',
        roles: ['super_admin'],
        permissions: [],
      },
      'token-root',
    );

    const originalMatchMedia = window.matchMedia;
    const changeListeners: Array<(event: MediaQueryListEvent) => void> = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === 'function' && query === '(min-width: 64rem)') {
            changeListeners.push(listener as (event: MediaQueryListEvent) => void);
          }
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    try {
      render(
        <MemoryRouter>
          <AdminLayout>
            <div>Contenido principal</div>
          </AdminLayout>
        </MemoryRouter>,
      );

      const mainWrapper = screen.getByRole('main').parentElement;
      expect(mainWrapper).not.toHaveAttribute('inert');

      const menuBtn = screen.getByRole('button', { name: 'Abrir menú administrativo' });
      fireEvent.click(menuBtn);

      expect(screen.getByLabelText('Menú móvil de administración')).toBeInTheDocument();
      expect(mainWrapper).toHaveAttribute('inert');
      expect(changeListeners.length).toBeGreaterThan(0);

      act(() => {
        for (const listener of changeListeners) {
          listener({ matches: true, media: '(min-width: 64rem)' } as MediaQueryListEvent);
        }
      });

      expect(screen.queryByLabelText('Menú móvil de administración')).toBeNull();
      expect(mainWrapper).not.toHaveAttribute('inert');
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});
