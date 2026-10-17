import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { AdminApiError, adminHttp } from './adminHttp';

describe('adminHttp client (R-002)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('adjunta Authorization Bearer cuando existe token en authStore', async () => {
    useAuthStore
      .getState()
      .setSession(
        { userId: '1', username: 'admin', roles: ['admin'], permissions: [] },
        'valid-access-token',
      );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    globalThis.fetch = mockFetch;

    const data = await adminHttp<{ success: boolean }>('/api/admin/test');

    expect(data).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/test',
      expect.objectContaining({
        headers: expect.any(Headers),
        credentials: 'include',
      }),
    );
    const headers = mockFetch.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer valid-access-token');
  });

  it('ante 401 ejecuta refresh single-flight y reintenta la petición original con éxito', async () => {
    useAuthStore
      .getState()
      .setSession(
        { userId: '1', username: 'admin', roles: ['admin'], permissions: [] },
        'expired-token',
      );

    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ accessToken: 'new-refreshed-token' }),
        });
      }

      callCount++;
      if (callCount === 1) {
        // Primera llamada falla con 401
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Token expired' }),
        });
      }

      // Reintento exitoso
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [1, 2, 3] }),
      });
    });
    globalThis.fetch = mockFetch;

    const result = await adminHttp<{ items: number[] }>('/api/admin/data');

    expect(result).toEqual({ items: [1, 2, 3] });
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1ra peticion, refresh, reintento
    expect(useAuthStore.getState().accessToken).toBe('new-refreshed-token');
  });

  it('ante 401 con refresh fallido limpia la sesión y lanza AdminApiError', async () => {
    useAuthStore
      .getState()
      .setSession(
        { userId: '1', username: 'admin', roles: ['admin'], permissions: [] },
        'expired-token',
      );

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Invalid refresh token' }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Unauthorized' }),
      });
    });
    globalThis.fetch = mockFetch;

    await expect(adminHttp('/api/admin/data')).rejects.toThrow(AdminApiError);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('mapea respuestas de error distintas de 401 a AdminApiError con código y detalles', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({
        statusCode: 409,
        error: 'Conflict',
        message: 'Versión obsoleta del sentido',
        conflictos: ['C1.SENT.1'],
      }),
    });
    globalThis.fetch = mockFetch;

    try {
      await adminHttp('/api/admin/sentidos/1');
      expect.fail('Debería haber lanzado AdminApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(AdminApiError);
      const apiErr = err as AdminApiError;
      expect(apiErr.statusCode).toBe(409);
      expect(apiErr.message).toBe('Versión obsoleta del sentido');
      expect(apiErr.errorName).toBe('Conflict');
    }
  });

  it('maneja respuestas 204 No Content retornando undefined', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });
    globalThis.fetch = mockFetch;

    const result = await adminHttp('/api/admin/sentidos/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('maneja respuestas de error con cuerpo no parseable como JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('Not JSON');
      },
    });
    globalThis.fetch = mockFetch;

    await expect(adminHttp('/api/admin/error')).rejects.toThrow(AdminApiError);
  });

  it('adminLogin realiza petición POST a /auth/login y almacena sesión en authStore', async () => {
    const mockUser = {
      userId: 'usr-1',
      username: 'editor1',
      roles: ['editor'],
      permissions: ['lexicon:write'],
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: mockUser,
        accessToken: 'jwt-access-token',
      }),
    });
    globalThis.fetch = mockFetch;

    const { adminLogin } = await import('./adminHttp');
    const res = await adminLogin('editor@test.com', 'Secret123!');

    expect(res.user.username).toBe('editor1');
    expect(res.accessToken).toBe('jwt-access-token');
    expect(useAuthStore.getState().user?.username).toBe('editor1');
    expect(useAuthStore.getState().accessToken).toBe('jwt-access-token');
  });

  it('adminLogout realiza POST a /auth/logout y limpia sesión en authStore incluso ante fallos', async () => {
    useAuthStore
      .getState()
      .setSession(
        { userId: 'usr-1', username: 'editor1', roles: ['editor'], permissions: [] },
        'jwt-token',
      );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Logged out' }),
    });
    globalThis.fetch = mockFetch;

    const { adminLogout } = await import('./adminHttp');
    await adminLogout();

    expect(mockFetch).toHaveBeenCalledWith(
      '/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Si la llamada a /auth/logout falla, la sesión debe limpiarse igualmente (finally block)
    useAuthStore
      .getState()
      .setSession(
        { userId: 'usr-1', username: 'editor1', roles: ['editor'], permissions: [] },
        'jwt-token',
      );
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await adminLogout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('adminChangePassword actualiza la contraseña y desactiva mustChangePassword', async () => {
    useAuthStore.getState().setSession(
      {
        userId: 'usr-1',
        username: 'editor1',
        roles: ['editor'],
        permissions: [],
        mustChangePassword: true,
      },
      'jwt-token',
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Contraseña cambiada con éxito' }),
    });
    globalThis.fetch = mockFetch;

    const { adminChangePassword } = await import('./adminHttp');
    const res = await adminChangePassword('oldPass', 'newPass123!');

    expect(res.message).toBe('Contraseña cambiada con éxito');
    expect(useAuthStore.getState().user?.mustChangePassword).toBe(false);
  });

  it('adminGetMe obtiene el usuario actual y actualiza authStore', async () => {
    const mockUser = {
      userId: 'usr-2',
      username: 'coordinador',
      roles: ['coordinador'],
      permissions: ['lexicon:approve'],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: mockUser }),
    });
    globalThis.fetch = mockFetch;

    const { adminGetMe } = await import('./adminHttp');
    const user = await adminGetMe();

    expect(user.username).toBe('coordinador');
    expect(useAuthStore.getState().user?.username).toBe('coordinador');
  });

  it('executeRefresh maneja respuesta con user además de accessToken', async () => {
    useAuthStore
      .getState()
      .setSession(
        { userId: '1', username: 'admin', roles: ['admin'], permissions: [] },
        'expired-token',
      );

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: 'refreshed-token-with-user',
            user: { userId: '1', username: 'admin-updated', roles: ['admin'], permissions: [] },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: 'ok' }),
      });
    });
    globalThis.fetch = mockFetch;

    // Provocar 401 inicial
    let firstCall = true;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: 'refreshed-token-with-user',
            user: { userId: '1', username: 'admin-updated', roles: ['admin'], permissions: [] },
          }),
        });
      }
      if (firstCall) {
        firstCall = false;
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Token expirado' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: 'ok' }),
      });
    });

    const res = await adminHttp<{ data: string }>('/api/admin/refresh-with-user');
    expect(res).toEqual({ data: 'ok' });
    expect(useAuthStore.getState().user?.username).toBe('admin-updated');
  });
});
