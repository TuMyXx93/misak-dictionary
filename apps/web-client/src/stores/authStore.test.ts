import { beforeEach, describe, expect, it } from 'vitest';
import { firstAllowedRoute, useAuthStore } from './authStore';

describe('authStore (R-002)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('inicia con sesión vacía y no autenticada', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setSession establece usuario, token e isAuthenticated en true', () => {
    const user = {
      userId: '1',
      username: 'editor-namtrik',
      roles: ['linguistic_editor'],
      permissions: ['dictionary:read', 'dictionary:write'],
    };

    useAuthStore.getState().setSession(user, 'test-access-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('test-access-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('hasPermission valida permisos ordinarios y otorga acceso total a super_admin', () => {
    // Usuario editor
    useAuthStore.getState().setSession(
      {
        userId: '2',
        username: 'editor',
        roles: ['linguistic_editor'],
        permissions: ['dictionary:write'],
      },
      'token-editor',
    );

    expect(useAuthStore.getState().hasPermission('dictionary:write')).toBe(true);
    expect(useAuthStore.getState().hasPermission('users:manage')).toBe(false);

    // Usuario super_admin
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'root',
        roles: ['super_admin'],
        permissions: [],
      },
      'token-root',
    );

    expect(useAuthStore.getState().hasPermission('users:manage')).toBe(true);
    expect(useAuthStore.getState().hasPermission('cualquier:permiso')).toBe(true);
  });

  it('clearSession restablece todo a null y false', () => {
    useAuthStore.getState().setSession(
      {
        userId: '1',
        username: 'test',
        roles: ['reader'],
        permissions: [],
      },
      'token',
    );

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  describe('firstAllowedRoute', () => {
    it('retorna /admin/login si user es null', () => {
      expect(firstAllowedRoute(null)).toBe('/admin/login');
    });

    it('retorna /admin/cambiar-password si mustChangePassword es true', () => {
      expect(
        firstAllowedRoute({
          userId: '1',
          username: 'u',
          roles: ['admin'],
          permissions: ['users:manage'],
          mustChangePassword: true,
        }),
      ).toBe('/admin/cambiar-password');
    });

    it('retorna /admin/usuarios para super_admin o usuario con users:manage', () => {
      expect(
        firstAllowedRoute({
          userId: '1',
          username: 'root',
          roles: ['super_admin'],
          permissions: [],
        }),
      ).toBe('/admin/usuarios');

      expect(
        firstAllowedRoute({
          userId: '2',
          username: 'admin',
          roles: ['admin'],
          permissions: ['users:manage'],
        }),
      ).toBe('/admin/usuarios');
    });

    it('retorna /admin/sentidos para usuario con dictionary:read o dictionary:write', () => {
      expect(
        firstAllowedRoute({
          userId: '3',
          username: 'editor',
          roles: ['content_admin'],
          permissions: ['dictionary:write'],
        }),
      ).toBe('/admin/sentidos');

      expect(
        firstAllowedRoute({
          userId: '3b',
          username: 'lector',
          roles: ['content_admin'],
          permissions: ['dictionary:read'],
        }),
      ).toBe('/admin/sentidos');
    });

    it('retorna /admin/medios para usuario con media:read o media:write', () => {
      expect(
        firstAllowedRoute({
          userId: '4',
          username: 'medios',
          roles: ['media_admin'],
          permissions: ['media:write'],
        }),
      ).toBe('/admin/medios');

      expect(
        firstAllowedRoute({
          userId: '4b',
          username: 'medios-lector',
          roles: ['media_admin'],
          permissions: ['media:read'],
        }),
      ).toBe('/admin/medios');
    });

    it('retorna /admin/revision para usuario con taxonomy:ratify', () => {
      expect(
        firstAllowedRoute({
          userId: '4c',
          username: 'revisor',
          roles: ['cultural_reviewer'],
          permissions: ['taxonomy:ratify'],
        }),
      ).toBe('/admin/revision');
    });

    it('retorna /admin/auditoria para usuario con audit:read', () => {
      expect(
        firstAllowedRoute({
          userId: '5',
          username: 'auditor',
          roles: ['auditor'],
          permissions: ['audit:read'],
        }),
      ).toBe('/admin/auditoria');
    });

    it('retorna /admin/ajustes para usuario con settings:manage', () => {
      expect(
        firstAllowedRoute({
          userId: '6',
          username: 'configurador',
          roles: ['configurador'],
          permissions: ['settings:manage'],
        }),
      ).toBe('/admin/ajustes');
    });

    it('retorna /admin/sentidos por defecto si no tiene permisos reconocidos', () => {
      expect(
        firstAllowedRoute({
          userId: '7',
          username: 'anon',
          roles: [],
          permissions: [],
        }),
      ).toBe('/admin/sentidos');
    });
  });
});
