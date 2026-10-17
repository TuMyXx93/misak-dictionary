import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { RequireAuth } from './RequireAuth';
import { RequirePermission } from './RequirePermission';

vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn(),
}));

import { adminHttp } from '@/services/adminHttp';

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
  });
});
