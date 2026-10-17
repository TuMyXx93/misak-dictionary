import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

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
});
