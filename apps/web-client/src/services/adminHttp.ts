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
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

let refreshPromise: Promise<string | null> | null = null;
let restorePromise: Promise<AdminUser | null> | null = null;

async function executeRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Client': 'web-admin',
      },
    });

    if (!response.ok) {
      useAuthStore.getState().clearSession();
      return null;
    }

    const data = (await response.json()) as {
      accessToken?: string;
      user?: AdminUser;
      data?: {
        tokens?: {
          accessToken?: string;
        };
        user?: AdminUser;
      };
    };

    const accessToken = data.data?.tokens?.accessToken ?? data.accessToken;
    const user = data.data?.user ?? data.user;

    if (accessToken) {
      if (user) {
        useAuthStore.getState().setSession(user, accessToken);
      } else {
        useAuthStore.getState().setAccessToken(accessToken);
      }
      return accessToken;
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

/**
 * Spec 008 (R-001): Restaura la sesión administrativa en recarga de página (F5)
 * usando una llamada single-flight a /auth/refresh con cookie httpOnly
 */
export async function restoreSession(): Promise<AdminUser | null> {
  if (restorePromise) {
    return restorePromise;
  }

  restorePromise = (async () => {
    try {
      const currentToken = useAuthStore.getState().accessToken;
      const currentUser = useAuthStore.getState().user;

      if (currentToken && currentUser) {
        return currentUser;
      }

      if (!refreshPromise) {
        refreshPromise = executeRefresh();
      }
      const refreshedToken = await refreshPromise;
      if (!refreshedToken) {
        return null;
      }

      const storeUser = useAuthStore.getState().user;
      if (storeUser) {
        return storeUser;
      }

      const me = await adminGetMe();
      return me;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      restorePromise = null;
    }
  })();

  return restorePromise;
}

export async function adminHttp<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const headers = new Headers(options.headers ?? {});
  if (
    !headers.has('Content-Type') &&
    options.body !== undefined &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Necesario para transportar cookies httpOnly de refresh
    });
  } catch {
    throw new AdminApiError(
      0,
      'No hay conexión con el servidor. Verifique su conexión a internet.',
      'NetworkError',
      undefined,
      'NETWORK_ERROR',
    );
  }

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
    let errorCode: string | undefined;
    let retryAfterSeconds: number | undefined;
    let details: unknown;

    try {
      const errorJson = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
        retryAfterSeconds?: number;
        [key: string]: unknown;
      };
      if (errorJson.message) errorMessage = errorJson.message;
      if (errorJson.error) errorName = errorJson.error;
      errorCode = errorJson.code;
      if (errorJson.retryAfterSeconds !== undefined) {
        retryAfterSeconds = Number(errorJson.retryAfterSeconds);
      }
      details = errorJson;
    } catch {
      // Ignorar si el cuerpo no es JSON
    }

    const retryHeader = response.headers?.get?.('retry-after');
    if (retryHeader && !retryAfterSeconds) {
      const parsed = Number.parseInt(retryHeader, 10);
      if (!Number.isNaN(parsed)) {
        retryAfterSeconds = parsed;
      }
    }

    if (response.status === 403 && errorMessage.toLowerCase().includes('cambiar su contraseña')) {
      useAuthStore.getState().updateUser({ mustChangePassword: true });
    }

    throw new AdminApiError(
      response.status,
      errorMessage,
      errorName,
      details,
      errorCode,
      retryAfterSeconds,
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export async function adminLogin(
  identifier: string,
  password: string,
): Promise<{ user: AdminUser; accessToken: string }> {
  const trimmedIdentifier = identifier.trim();
  const loginPayload: Record<string, string> = {
    username: trimmedIdentifier,
    password,
  };
  if (trimmedIdentifier.includes('@')) {
    loginPayload.email = trimmedIdentifier;
  }

  const res = await adminHttp<{
    user?: AdminUser;
    accessToken?: string;
    data?: {
      user: AdminUser;
      tokens: {
        accessToken: string;
      };
    };
  }>('/auth/login', {
    method: 'POST',
    headers: {
      'X-Client': 'web-admin',
    },
    body: JSON.stringify(loginPayload),
  });

  const user = res.data?.user ?? res.user;
  const accessToken = res.data?.tokens?.accessToken ?? res.accessToken;

  if (!user || !accessToken) {
    throw new AdminApiError(500, 'Respuesta de autenticación incompleta');
  }

  useAuthStore.getState().setSession(user, accessToken);
  return { user, accessToken };
}

export async function adminLogout(): Promise<void> {
  try {
    await adminHttp('/auth/logout', {
      method: 'POST',
      headers: {
        'X-Client': 'web-admin',
      },
    });
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
  const res = await adminHttp<{ user?: AdminUser; data?: AdminUser }>('/auth/me', {
    method: 'GET',
  });
  const resolvedUser = res.data ?? res.user;
  if (!resolvedUser) {
    throw new AdminApiError(500, 'Respuesta de perfil de usuario incompleta');
  }
  useAuthStore.getState().setUser(resolvedUser);
  return resolvedUser;
}
