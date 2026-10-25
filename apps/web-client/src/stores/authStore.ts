/**
 * authStore
 * Spec 006 (R-002) — Almacenamiento de sesión administrativa estrictamente en memoria.
 * No utiliza persistencia en localStorage ni sessionStorage para mitigar robo de tokens ante XSS.
 */

import { create } from 'zustand';

export interface AdminUser {
  userId: string;
  username?: string;
  email?: string;
  mustChangePassword?: boolean;
  roles: string[];
  permissions?: string[];
}

export interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: AdminUser, accessToken: string) => void;
  setUser: (user: AdminUser) => void;
  updateUser: (partial: Partial<AdminUser>) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

/**
 * Calcula la primera ruta a la que tiene acceso el usuario según sus permisos resueltos
 */
export function firstAllowedRoute(user: AdminUser | null): string {
  if (!user) return '/admin/login';
  if (user.mustChangePassword) return '/admin/cambiar-password';

  const permissions = new Set(user.permissions ?? []);
  const isSuperAdmin = user.roles?.includes('super_admin');

  if (isSuperAdmin || permissions.has('users:manage')) {
    return '/admin/usuarios';
  }
  if (permissions.has('dictionary:read') || permissions.has('dictionary:write')) {
    return '/admin/sentidos';
  }
  if (permissions.has('media:read') || permissions.has('media:write')) {
    return '/admin/medios';
  }
  if (permissions.has('taxonomy:ratify')) {
    return '/admin/revision';
  }
  if (permissions.has('audit:read')) {
    return '/admin/auditoria';
  }
  if (permissions.has('settings:manage')) {
    return '/admin/ajustes';
  }

  return '/admin/sentidos';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setSession: (user: AdminUser, accessToken: string) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: AdminUser) => {
    set({ user });
  },

  updateUser: (partial: Partial<AdminUser>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...partial } });
    }
  },

  setAccessToken: (accessToken: string) => {
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken && get().user),
    });
  },

  clearSession: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    // super_admin tiene todos los permisos
    if (user.roles?.includes('super_admin')) return true;
    return Boolean(user.permissions?.includes(permission));
  },

  hasRole: (role: string) => {
    const user = get().user;
    if (!user) return false;
    return Boolean(user.roles?.includes(role));
  },
}));
