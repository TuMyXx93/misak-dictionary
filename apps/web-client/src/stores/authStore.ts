/**
 * authStore
 * Spec 006 (R-002) — Almacenamiento de sesión administrativa estrictamente en memoria.
 * No utiliza persistencia en localStorage ni sessionStorage para mitigar robo de tokens ante XSS.
 */

import { create } from 'zustand';
import {
  canAccessAdminPath,
  resolveFirstAllowedRoute,
  userHasPermission,
} from '@/shared/adminRoutes';

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

export { canAccessAdminPath };

/**
 * Calcula la primera ruta a la que tiene acceso el usuario según sus permisos resueltos
 */
export function firstAllowedRoute(user: AdminUser | null): string {
  return resolveFirstAllowedRoute(user);
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
    return userHasPermission(user, permission);
  },

  hasRole: (role: string) => {
    const user = get().user;
    if (!user) return false;
    return Boolean(user.roles?.includes(role));
  },
}));
