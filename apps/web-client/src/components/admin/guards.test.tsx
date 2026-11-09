import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { RequireAuth } from './RequireAuth';
import { RequirePermission } from './RequirePermission';

vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn(),
  restoreSession: vi.fn(),
}));

import { adminHttp, restoreSession } from '@/services/adminHttp';

describe('Admin route guards (R-001, R-004, R-028)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  describe('RequireAuth', () => {
    it('redirige a /admin/login cuando no hay sesión activa ni en /auth/me', async () => {
      vi.mocked(adminHttp).mockRejectedValue(new Error('Unauthorized'));

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/login" element={<div>Página de Login</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Contenido Protegido</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Página de Login')).toBeInTheDocument();
      expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    });

    it('redirige a /admin/cambiar-password si mustChangePassword es true (R-028)', async () => {
      useAuthStore.getState().setSession(
        {
          userId: '1',
          username: 'namtrik-admin',
          roles: ['super_admin'],
          permissions: [],
          mustChangePassword: true,
        },
        'token-temp',
      );

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route
              path="/admin/cambiar-password"
              element={<div>Cambio Obligatorio de Contraseña</div>}
            />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Contenido Protegido</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Cambio Obligatorio de Contraseña')).toBeInTheDocument();
      expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    });

    it('renderiza el contenido protegido cuando el usuario está autenticado', async () => {
      useAuthStore.getState().setSession(
        {
          userId: '1',
          username: 'editor',
          roles: ['linguistic_editor'],
          permissions: ['dictionary:read'],
          mustChangePassword: false,
        },
        'valid-token',
      );

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Panel Administrativo Protegido</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Panel Administrativo Protegido')).toBeInTheDocument();
    });

    it('restaura sesión exitosamente con restoreSession y renderiza hijos', async () => {
      vi.mocked(restoreSession).mockResolvedValueOnce({
        id: '1',
        email: 'admin@namtrik.org',
        roles: ['super_admin'],
      } as any);
      useAuthStore.getState().setSession(
        {
          userId: '1',
          username: 'restored-admin',
          roles: ['super_admin'],
          permissions: [],
          mustChangePassword: false,
        },
        'token-restored',
      );

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Sesión Restaurada</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Sesión Restaurada')).toBeInTheDocument();
    });

    it('redirige a /admin/login cuando restoreSession devuelve null', async () => {
      vi.mocked(restoreSession).mockResolvedValueOnce(null);

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/login" element={<div>Página de Login</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Contenido Protegido</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Página de Login')).toBeInTheDocument();
    });

    it('limpia la sesión si restoreSession falla con excepción', async () => {
      vi.mocked(restoreSession).mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/login" element={<div>Página de Login</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <div>Contenido Protegido</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Página de Login')).toBeInTheDocument();
    });
  });

  describe('RequirePermission', () => {
    it('muestra «Sin permiso» y NO renderiza los hijos cuando falta el permiso (R-004)', () => {
      useAuthStore.getState().setSession(
        {
          userId: '2',
          username: 'editor',
          roles: ['linguistic_editor'],
          permissions: ['dictionary:read'],
        },
        'token-editor',
      );

      const spyChild = vi.fn();
      const ChildComponent = () => {
        spyChild();
        return <div>Datos Ultra Sensibles</div>;
      };

      render(
        <MemoryRouter>
          <RequirePermission permission="users:manage">
            <ChildComponent />
          </RequirePermission>
        </MemoryRouter>,
      );

      expect(screen.getByText('Sin permiso para acceder a esta sección')).toBeInTheDocument();
      expect(screen.queryByText('Datos Ultra Sensibles')).not.toBeInTheDocument();
      expect(spyChild).not.toHaveBeenCalled();
    });

    it('muestra «Sin permiso» con indicación de rol cuando falta el rol requerido', () => {
      useAuthStore.getState().setSession(
        {
          userId: '3',
          username: 'editor',
          roles: ['linguistic_editor'],
          permissions: [],
        },
        'token-editor',
      );

      render(
        <MemoryRouter>
          {/* biome-ignore lint/a11y/useValidAriaRole: prop 'role' de autorización, no rol ARIA */}
          <RequirePermission role="super_admin">
            <div>Solo Superadmin</div>
          </RequirePermission>
        </MemoryRouter>,
      );

      expect(screen.getByText('Sin permiso para acceder a esta sección')).toBeInTheDocument();
      expect(screen.getByText(/rol: super_admin/i)).toBeInTheDocument();
      expect(screen.queryByText('Solo Superadmin')).not.toBeInTheDocument();
    });

    it('muestra «Sin permiso» para invitado cuando no hay sesión activa', () => {
      useAuthStore.getState().clearSession();

      render(
        <MemoryRouter>
          <RequirePermission permission="dictionary:write">
            <div>Edición</div>
          </RequirePermission>
        </MemoryRouter>,
      );

      expect(screen.getByText(/invitado/i)).toBeInTheDocument();
      expect(screen.queryByText('Edición')).not.toBeInTheDocument();
    });

    it('renderiza los hijos cuando el usuario cuenta con el permiso o es super_admin', () => {
      useAuthStore.getState().setSession(
        {
          userId: '1',
          username: 'root',
          roles: ['super_admin'],
          permissions: [],
        },
        'token-root',
      );

      render(
        <MemoryRouter>
          <RequirePermission permission="users:manage">
            <div>Gestión de Usuarios</div>
          </RequirePermission>
        </MemoryRouter>,
      );

      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    });

    it('renderiza los hijos cuando ni permission ni role son requeridos', () => {
      render(
        <MemoryRouter>
          <RequirePermission>
            <div>Contenido Sin Restricciones</div>
          </RequirePermission>
        </MemoryRouter>,
      );
      expect(screen.getByText('Contenido Sin Restricciones')).toBeInTheDocument();
    });

    it('renderiza los hijos cuando solo role es requerido y el usuario lo tiene', () => {
      useAuthStore.getState().setSession(
        {
          userId: '1',
          username: 'editor',
          roles: ['linguistic_editor'],
          permissions: [],
        },
        'token-editor',
      );

      render(
        <MemoryRouter>
          {/* biome-ignore lint/a11y/useValidAriaRole: prop 'role' de autorización, no rol ARIA */}
          <RequirePermission role="linguistic_editor">
            <div>Panel de Editor</div>
          </RequirePermission>
        </MemoryRouter>,
      );
      expect(screen.getByText('Panel de Editor')).toBeInTheDocument();
    });
  });
});
