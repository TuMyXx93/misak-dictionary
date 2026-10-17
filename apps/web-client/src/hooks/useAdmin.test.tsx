import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAdminSentidos,
  useRatificarSentido,
  useSystemSettings,
  useUpdateSystemSettings,
} from './useAdmin';

vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn(),
}));

import { adminHttp } from '@/services/adminHttp';

describe('useAdmin hooks (R-006..R-019)', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('useAdminSentidos construye los query params y llama a adminHttp', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ items: [], total: 0 });

    const { result } = renderHook(
      () => useAdminSentidos({ estado: 'borrador', q: 'casa', limit: 10 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos?estado=borrador&q=casa&limit=10',
    );
  });

  it('useRatificarSentido invalida las queries de sentidos y progreso al mutar', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ id: 'sent-1', estado: 'ratificado' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRatificarSentido(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'sent-1', version: 2 });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos/sent-1/ratificar',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ version: 2 }),
      }),
    );

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useSystemSettings y useUpdateSystemSettings gestionan la bandera pública', async () => {
    vi.mocked(adminHttp)
      .mockResolvedValueOnce({ key: 'PUBLIC_ONLY_RATIFIED', value: false })
      .mockResolvedValueOnce({ key: 'PUBLIC_ONLY_RATIFIED', value: true });

    const { result: settingsQuery } = renderHook(() => useSystemSettings(), { wrapper });
    await waitFor(() => expect(settingsQuery.current.isSuccess).toBe(true));
    expect(settingsQuery.current.data?.value).toBe(false);

    const { result: updateMutation } = renderHook(() => useUpdateSystemSettings(), { wrapper });
    await act(async () => {
      await updateMutation.current.mutateAsync(true);
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/settings/public-only-ratified',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ value: true }),
      }),
    );
  });
});
