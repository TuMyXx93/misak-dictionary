import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAdminAudit,
  useAdminMediaList,
  useAdminSentido,
  useAdminSentidos,
  useAdminUsers,
  useCreateSentido,
  useDeleteAdminMedia,
  useDeleteSentido,
  usePapelera,
  useProgresoRatificacion,
  usePurgarPapelera,
  useRatificarLote,
  useRatificarSentido,
  useRatifyAdminMedia,
  useRestaurarPapelera,
  useRevertirSentido,
  useSystemSettings,
  useUpdateAdminMediaMetadata,
  useUpdateSentido,
  useUpdateSystemSettings,
  useUpdateUserRoles,
  useUploadAdminMedia,
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
    vi.mocked(adminHttp).mockResolvedValue({
      items: [
        {
          id: 's1',
          codigo: 'C1.SENT.1',
          version: 1,
          tipo: 'estandar',
          estado: 'borrador',
          formas: [{ lema: 'mɵrɵk', categoriaGramatical: 'sustantivo' }],
          espanolGlosa: 'casa',
          updatedAt: '2026-10-16',
        },
      ],
      total: 1,
    });

    const { result } = renderHook(
      () =>
        useAdminSentidos({
          nodo: 'N1',
          estado: 'borrador',
          tipo: 'estandar',
          search: 'casa',
          cursor: 'cur-1',
          limit: 10,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos?nodo=N1&estado=borrador&tipo=estandar&q=casa&cursor=cur-1&limit=10',
    );
    expect(result.current.data?.items[0]?.lema).toBe('mɵrɵk');
    expect(result.current.data?.items[0]?.glosa).toBe('casa');
    expect(result.current.data?.items[0]?.categoriaGramatical).toBe('sustantivo');
  });

  it('useAdminSentido obtiene un sentido individual con mapeo de nodo y lema', async () => {
    vi.mocked(adminHttp).mockResolvedValue({
      id: 's1',
      codigo: 'C1.SENT.1',
      version: 1,
      tipo: 'estandar',
      estado: 'ratificado',
      formas: [{ lema: 'latata', categoriaGramatical: 'verbo' }],
      espanolGlosa: 'correr',
      ubicacion: { nivel: 'microcampo', id: 'mc-1', codigo: 'MC1', etiqueta: 'Movimiento' },
      updatedAt: '2026-10-16',
    });

    const { result } = renderHook(() => useAdminSentido('s1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminHttp).toHaveBeenCalledWith('/api/admin/dictionary/sentidos/s1');
    expect(result.current.data?.lema).toBe('latata');
    expect(result.current.data?.glosa).toBe('correr');
    expect(result.current.data?.categoriaGramatical).toBe('verbo');
    expect(result.current.data?.nodo?.titulo).toBe('Movimiento');
  });

  it('useCreateSentido transforma payload simplificado e invalida cache', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ id: 's2', version: 1 });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSentido(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        codigo: 'C1.SENT.2',
        lema: 'kan',
        glosa: 'uno',
        categoriaGramatical: 'numeral',
        nodoCodigo: 'MC2',
        tipo: 'estandar',
      });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          codigo: 'C1.SENT.2',
          ubicacion: { nivel: 'microcampo', id: 'MC2' },
          tipo: 'estandar',
          formas: [{ lema: 'kan', categoriaGramatical: 'numeral' }],
          espanolGlosa: 'uno',
        }),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useUpdateSentido actualiza sentido y maneja defaultId', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ id: 's2', version: 2 });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSentido('s2'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        version: 1,
        lema: 'kan-updated',
        glosa: 'primero',
        tipo: 'estandar',
      });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos/s2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          version: 1,
          tipo: 'estandar',
          formas: [{ lema: 'kan-updated', categoriaGramatical: 'sustantivo' }],
          espanolGlosa: 'primero',
        }),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos', 's2'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useDeleteSentido envía DELETE e invalida papelera, sentidos y progreso', async () => {
    vi.mocked(adminHttp).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSentido(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 's-del' });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos/s-del',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'papelera'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
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
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos', 'sent-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useRevertirSentido envía motivo de reversión e invalida queries', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ id: 'sent-1', estado: 'borrador' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevertirSentido(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'sent-1',
        version: 3,
        motivo: 'Falta validar ortografía con mayores',
      });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/dictionary/sentidos/sent-1/revertir',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          version: 3,
          motivo: 'Falta validar ortografía con mayores',
        }),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos', 'sent-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useRatificarLote ratifica en lote con checklist y snapshot', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ ratificados: 5 });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRatificarLote(), { wrapper });

    let response: { count: number; ratificados: number } | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        microcampoCodigo: 'MC-1',
        checklist: { ortografia: true, categorias: true, glosas: true, cientificos: true },
        snapshot: [{ id: 's1', version: 1 }],
      });
    });

    expect(response?.count).toBe(5);
    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/governance/ratificar-lote/microcampo/MC-1',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'progreso'] });
  });

  it('useProgresoRatificacion calcula porcentaje global si recibe array de nodos', async () => {
    vi.mocked(adminHttp).mockResolvedValue([
      { codigo: 'N1', titulo: 'Nodo 1', total: 10, ratificados: 8, borradores: 2, porcentaje: 80 },
      { codigo: 'N2', titulo: 'Nodo 2', total: 10, ratificados: 2, borradores: 8, porcentaje: 20 },
    ]);

    const { result } = renderHook(() => useProgresoRatificacion(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.global).toEqual({
      total: 20,
      ratificados: 10,
      borradores: 10,
      porcentaje: 50,
    });
    expect(result.current.data?.nodos).toHaveLength(2);
  });

  it('usePapelera mapea elementos correctamente', async () => {
    vi.mocked(adminHttp).mockResolvedValue([
      {
        id: 'p1',
        codigo: 'C1.DEL.1',
        nivel: 'sentido',
        etiqueta: 'palabra',
        deletedAt: '2026-10-01',
      },
    ]);

    const { result } = renderHook(() => usePapelera(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.lema).toBe('palabra');
    expect(result.current.data?.items[0]?.tipo).toBe('sentido');
  });

  it('useRestaurarPapelera y usePurgarPapelera ejecutan acciones e invalidan cache', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({ restored: true }).mockResolvedValueOnce(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result: restMutation } = renderHook(() => useRestaurarPapelera(), { wrapper });
    await act(async () => {
      await restMutation.current.mutateAsync({ id: 'p1', nivel: 'sentido' });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/papelera/sentido/p1/restaurar',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'papelera'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'sentidos'] });

    const { result: purgarMutation } = renderHook(() => usePurgarPapelera(), { wrapper });
    await act(async () => {
      await purgarMutation.current.mutateAsync({ id: 'p1', nivel: 'sentido', codigo: 'C1.DEL.1' });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/papelera/sentido/p1',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ codigo: 'C1.DEL.1' }),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'papelera'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'audit'] });
  });

  it('useAdminUsers y useUpdateUserRoles consultan y actualizan roles', async () => {
    vi.mocked(adminHttp)
      .mockResolvedValueOnce([{ id: 'u1', username: 'usr', roles: ['editor'], permissions: [] }])
      .mockResolvedValueOnce({
        id: 'u1',
        username: 'usr',
        roles: ['coordinador'],
        permissions: [],
      });

    const { result: usersQuery } = renderHook(() => useAdminUsers(), { wrapper });
    await waitFor(() => expect(usersQuery.current.isSuccess).toBe(true));
    expect(usersQuery.current.data?.items[0]?.username).toBe('usr');

    const { result: updateRolesMutation } = renderHook(() => useUpdateUserRoles(), { wrapper });
    await act(async () => {
      await updateRolesMutation.current.mutateAsync({ userId: 'u1', roles: ['coordinador'] });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/users/u1/roles',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ roles: ['coordinador'] }),
      }),
    );
  });

  it('useAdminAudit pasa parámetros de consulta a adminHttp', async () => {
    vi.mocked(adminHttp).mockResolvedValue({ items: [], nextCursor: null });

    const { result } = renderHook(
      () =>
        useAdminAudit({
          action: 'LEXICON_APPROVE',
          userId: 'u1',
          cursor: 'c-1',
          limit: 20,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/audit?action=LEXICON_APPROVE&userId=u1&cursor=c-1&limit=20',
    );
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

  it('useAdminMediaList construye query params con tipo, estado y filtros', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'm1',
            uuid: 'uuid-1',
            tipo: 'audio',
            proposito: 'pronunciacion_lema',
            filename: 'audio.mp3',
            mimeType: 'audio/mpeg',
            sizeBytes: '1000',
            estado: 'borrador',
            createdAt: '2026-10-18',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      },
    });

    const { result } = renderHook(
      () =>
        useAdminMediaList({
          tipo: 'audio',
          estado: 'borrador',
          sentidoId: 's-123',
          formaId: 'f-456',
          query: 'audio',
          limit: 10,
          offset: 0,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/medios?tipo=audio&estado=borrador&sentidoId=s-123&formaId=f-456&query=audio&limit=10&offset=0',
    );
    expect(result.current.data?.total).toBe(1);
  });

  it('useUploadAdminMedia envía FormData a /api/admin/medios/upload', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({
      success: true,
      data: { id: 'm2', uuid: 'uuid-2', filename: 'test.mp3' },
    });

    const { result } = renderHook(() => useUploadAdminMedia(), { wrapper });
    const formData = new FormData();
    formData.append('tipo', 'audio');

    let res: any;
    await act(async () => {
      res = await result.current.mutateAsync(formData);
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/medios/upload',
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
    expect(res.data.id).toBe('m2');
  });

  it('useRatifyAdminMedia ejecuta POST a /api/admin/medios/:id/ratify', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({
      success: true,
      data: { id: 'm3', estado: 'ratificado' },
    });

    const { result } = renderHook(() => useRatifyAdminMedia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('m3');
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/medios/m3/ratify',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('useDeleteAdminMedia ejecuta DELETE a /api/admin/medios/:id', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({
      success: true,
      message: 'Eliminado',
    });

    const { result } = renderHook(() => useDeleteAdminMedia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('m4');
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/medios/m4',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('useUpdateAdminMediaMetadata ejecuta PATCH a /api/admin/medios/:id', async () => {
    vi.mocked(adminHttp).mockResolvedValueOnce({
      success: true,
      data: { id: 'm5', descripcionEspanol: 'Actualizado' },
    });

    const { result } = renderHook(() => useUpdateAdminMediaMetadata(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'm5',
        data: { descripcionEspanol: 'Actualizado' },
      });
    });

    expect(adminHttp).toHaveBeenCalledWith(
      '/api/admin/medios/m5',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ descripcionEspanol: 'Actualizado' }),
      }),
    );
  });
});
