/**
 * adminHttp
 * Spec 006 (R-002) — Cliente HTTP para el panel administrativo con interceptor
 * para refresh single-flight, un reintento y cierre de sesión local en memoria.
 */

import { type AdminUser, useAuthStore } from '@/stores/authStore';

export class AdminApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorName?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

let refreshPromise: Promise<string | null> | null = null;

async function executeRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      useAuthStore.getState().clearSession();
      return null;
    }

    const data = (await response.json()) as {
      accessToken: string;
      user?: AdminUser;
    };

    if (data.accessToken) {
      if (data.user) {
        useAuthStore.getState().setSession(data.user, data.accessToken);
      } else {
        useAuthStore.getState().setAccessToken(data.accessToken);
      }
      return data.accessToken;
    }

    useAuthStore.getState().clearSession();
    return null;
  } catch (_err) {
    useAuthStore.getState().clearSession();
    return null;
  } finally {
    refreshPromise = null;
  }
}

export async function adminHttp<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Necesario para transportar cookies httpOnly de refresh
  });

  if (
    response.status === 401 &&
    !isRetry &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/refresh')
  ) {
    // Iniciar o unirse al refresh single-flight
    if (!refreshPromise) {
      refreshPromise = executeRefresh();
    }

    const newAccessToken = await refreshPromise;

    if (newAccessToken) {
      // Reintentar la petición original una única vez
      return adminHttp<T>(path, options, true);
    }

    // Refresh falló: lanzar error de no autorizado
    throw new AdminApiError(401, 'Sesión expirada', 'Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorName = response.statusText;
    let details: unknown;

    try {
      const errorJson = (await response.json()) as {
        message?: string;
        error?: string;
        [key: string]: unknown;
      };
      if (errorJson.message) errorMessage = errorJson.message;
      if (errorJson.error) errorName = errorJson.error;
      details = errorJson;
    } catch {
      // Ignorar si el cuerpo no es JSON
    }

    throw new AdminApiError(response.status, errorMessage, errorName, details);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ user: AdminUser; accessToken: string }> {
  const res = await adminHttp<{ user: AdminUser; accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  useAuthStore.getState().setSession(res.user, res.accessToken);
  return res;
}

export async function adminLogout(): Promise<void> {
  try {
    await adminHttp('/auth/logout', { method: 'POST' });
  } catch {
    // Permitir cierre de sesión local incluso si el backend es inalcanzable
  } finally {
    useAuthStore.getState().clearSession();
  }
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await adminHttp<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  useAuthStore.getState().updateUser({ mustChangePassword: false });
  return res;
}

export async function adminGetMe(): Promise<AdminUser> {
  const res = await adminHttp<{ user: AdminUser }>('/auth/me', {
    method: 'GET',
  });
  useAuthStore.getState().setUser(res.user);
  return res.user;
}
