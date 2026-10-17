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
});
