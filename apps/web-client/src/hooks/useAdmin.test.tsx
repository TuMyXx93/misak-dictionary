/**
 * useAdmin.test.tsx
 * Pruebas unitarias completas para los hooks de useAdmin
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdminHttp = vi.fn();
vi.mock('@/services/adminHttp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/adminHttp')>();
  return {
    ...actual,
    adminHttp: (...args: unknown[]) => mockAdminHttp(...args),
  };
});

import {
  useAdminAudit,
  useAdminMediaList,
  useAdminSentido,
  useAdminSentidos,
  useAdminUsers,
  useCreateSentido,
  useCreateUser,
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
  useSuggestUsername,
  useSystemSettings,
  useToggleUserStatus,
  useUnlockUser,
  useUpdateAdminMediaMetadata,
  useUpdateSentido,
  useUpdateSystemSettings,
  useUpdateUser,
  useUpdateUserRoles,
  useUploadAdminMedia,
} from './useAdmin';

describe('useAdmin hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Sentidos Queries and Mutations', () => {
    it('useAdminSentidos construye query string y mapea lema y glosa', async () => {
      mockAdminHttp.mockResolvedValueOnce({
        items: [
          {
            id: '1',
            codigo: 'C1.S1',
            formas: [{ lema: 'Wam', categoriaGramatical: 'sustantivo' }],
            espanolGlosa: 'Palabra',
          },
        ],
        total: 1,
      });

      const { result } = renderHook(
        () =>
          useAdminSentidos({
            nodo: 'C1',
            estado: 'borrador',
            tipo: 'estandar',
            q: 'wam',
            limit: 10,
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/dictionary/sentidos?'),
      );
      expect(result.current.data?.items[0].lema).toBe('Wam');
      expect(result.current.data?.items[0].glosa).toBe('Palabra');
    });

    it('useAdminSentido no consulta si id es undefined y procesa nodo si id está presente', async () => {
      const { result: idle } = renderHook(() => useAdminSentido(undefined), { wrapper });
      expect(idle.current.fetchStatus).toBe('idle');

      mockAdminHttp.mockResolvedValueOnce({
        id: '10',
        codigo: 'C1.S2',
        espanolGlosa: 'Agua',
        ubicacion: { codigo: 'C1', etiqueta: 'Cosmovisión' },
      });

      const { result } = renderHook(() => useAdminSentido('10'), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith('/api/admin/dictionary/sentidos/10');
      expect(result.current.data?.nodo).toEqual({ codigo: 'C1', titulo: 'Cosmovisión' });
    });

    it('useCreateSentido, useUpdateSentido y useDeleteSentido ejecutan llamadas HTTP', async () => {
      mockAdminHttp.mockResolvedValue({ id: 's-1' });

      const { result: create } = renderHook(() => useCreateSentido(), { wrapper });
      await create.current.mutateAsync({
        codigo: 'C1.S3',
        lema: 'Pik',
        glosa: 'Persona',
      });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: update } = renderHook(() => useUpdateSentido('s-1'), { wrapper });
      await update.current.mutateAsync({ version: 1, glosa: 'Nueva glosa' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-1',
        expect.objectContaining({ method: 'PATCH' }),
      );

      const { result: del } = renderHook(() => useDeleteSentido(), { wrapper });
      await del.current.mutateAsync('s-1');
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('useRatificarSentido, useRevertirSentido y useRatificarLote operan sobre estados editoriales', async () => {
      mockAdminHttp.mockResolvedValue({ success: true });

      const { result: ratify } = renderHook(() => useRatificarSentido(), { wrapper });
      await ratify.current.mutateAsync({ id: 's-1', version: 1 });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-1/ratificar',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: revert } = renderHook(() => useRevertirSentido(), { wrapper });
      await revert.current.mutateAsync({ id: 's-1', version: 2, motivo: 'Revisión dialectal' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-1/revertir',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ version: 2, motivo: 'Revisión dialectal' }),
        }),
      );

      const { result: lote } = renderHook(() => useRatificarLote(), { wrapper });
      await lote.current.mutateAsync({ nivel: 'microcampo', id: 'M1' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/governance/ratificar-lote/microcampo/M1',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('useProgresoRatificacion consulta progreso de ratificación', async () => {
      mockAdminHttp.mockResolvedValueOnce({
        global: { total: 50, ratificados: 40, borradores: 10, porcentaje: 80 },
        nodos: [],
      });

      const { result } = renderHook(() => useProgresoRatificacion(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith('/api/admin/governance/progreso');
      expect(result.current.data?.global.porcentaje).toBe(80);
    });

    it('useProgresoRatificacion calcula totales raíz si backend no envía sección global', async () => {
      mockAdminHttp.mockResolvedValueOnce({
        nodos: [
          { codigo: 'C1', titulo: 'Cosmovisión', tipo: 'campo', total: 10, ratificados: 6 },
          {
            codigo: 'C1.S1',
            titulo: 'Subcampo',
            tipo: 'subcampo',
            padreCodigo: 'C1',
            total: 5,
            ratificados: 3,
          },
        ],
      });
      const { result: fallbackProgreso } = renderHook(() => useProgresoRatificacion(), { wrapper });
      await waitFor(() => expect(fallbackProgreso.current.isSuccess).toBe(true));
      expect(fallbackProgreso.current.data?.global.total).toBe(10);
      expect(fallbackProgreso.current.data?.global.ratificados).toBe(6);
    });

    it('useCreateSentido, useUpdateSentido y useDeleteSentido manejan estructuras alternativas y defaultId', async () => {
      mockAdminHttp.mockResolvedValue({ id: 's-alt' });

      // useCreateSentido con formas ya preestructuradas
      const { result: create } = renderHook(() => useCreateSentido(), { wrapper });
      await create.current.mutateAsync({
        codigo: 'C1.S4',
        formas: [{ lema: 'Wam' }],
        tipo: 'dialogico',
      });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos',
        expect.objectContaining({ method: 'POST' }),
      );

      // useUpdateSentido usando defaultId sin id explícito y tipo dialógico
      const { result: update } = renderHook(() => useUpdateSentido('s-default-99'), { wrapper });
      await update.current.mutateAsync({
        version: 3,
        lema: 'Nuevo lema',
        glosa: 'Nueva glosa',
        tipo: 'dialogico',
      });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-default-99',
        expect.objectContaining({ method: 'PATCH' }),
      );

      // useDeleteSentido pasando objeto { id }
      const { result: del } = renderHook(() => useDeleteSentido(), { wrapper });
      await del.current.mutateAsync({ id: 's-obj-123' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/dictionary/sentidos/s-obj-123',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('Papelera Hooks', () => {
    it('usePapelera, useRestaurarPapelera y usePurgarPapelera operan sobre papelera de reciclaje', async () => {
      mockAdminHttp.mockResolvedValueOnce({ items: [] });

      const { result: list } = renderHook(() => usePapelera(), { wrapper });
      await waitFor(() => expect(list.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith('/api/admin/papelera');

      mockAdminHttp.mockResolvedValue({ restored: true });

      const { result: restore } = renderHook(() => useRestaurarPapelera(), { wrapper });
      await restore.current.mutateAsync({ id: 'pap-1', nivel: 'sentido' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/papelera/sentido/pap-1/restaurar',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: purge } = renderHook(() => usePurgarPapelera(), { wrapper });
      await purge.current.mutateAsync({ id: 'pap-1', nivel: 'sentido', codigo: 'C1.S1' });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/papelera/sentido/pap-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('User Management Hooks', () => {
    it('useAdminUsers y useSuggestUsername consultan usuarios y nombres sugeridos', async () => {
      mockAdminHttp.mockResolvedValueOnce([
        { id: 'u1', username: 'admin', email: 'admin@misak.org', isActive: true },
      ]);

      const { result: users } = renderHook(() => useAdminUsers(), { wrapper });
      await waitFor(() => expect(users.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith('/api/admin/users');

      mockAdminHttp.mockResolvedValueOnce({ username: 'ptunubala', available: true });

      const { result: suggest } = renderHook(() => useSuggestUsername('Pedro', 'Tunubalá', true), {
        wrapper,
      });
      await waitFor(() => expect(suggest.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/suggest-username?'),
      );
      expect(suggest.current.data?.username).toBe('ptunubala');

      // Consultar usuarios cuando backend retorna { items: [...] }
      mockAdminHttp.mockResolvedValueOnce({
        items: [{ id: 'u2', username: 'editor', email: 'ed@misak.org', isActive: true }],
      });
      const { result: objUsers } = renderHook(() => useAdminUsers(), { wrapper });
      await waitFor(() => expect(objUsers.current.isSuccess).toBe(true));
      expect(objUsers.current.data?.items).toHaveLength(1);

      const { result: idleSuggest } = renderHook(
        () => useSuggestUsername('Pedro', 'Tunubalá', false),
        { wrapper },
      );
      expect(idleSuggest.current.fetchStatus).toBe('idle');
    });

    it('mutaciones de usuarios ejecutan endpoints y llamadas correctas', async () => {
      mockAdminHttp.mockResolvedValue({ id: 'u1' });

      const { result: create } = renderHook(() => useCreateUser(), { wrapper });
      await create.current.mutateAsync({
        email: 'nuevo@misak.org',
        username: 'nuevo',
        password: 'Password123!',
        roles: ['content_admin'],
      });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: update } = renderHook(() => useUpdateUser(), { wrapper });
      await update.current.mutateAsync({ userId: 'u1', data: { telefonoContacto: '3101234567' } });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/users/u1',
        expect.objectContaining({ method: 'PATCH' }),
      );

      const { result: toggle } = renderHook(() => useToggleUserStatus(), { wrapper });
      await toggle.current.mutateAsync({ userId: 'u1', isActive: false });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/users/u1/status',
        expect.objectContaining({ method: 'PATCH' }),
      );

      const { result: unlock } = renderHook(() => useUnlockUser(), { wrapper });
      await unlock.current.mutateAsync('u1');
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/users/u1/unlock',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: roles } = renderHook(() => useUpdateUserRoles(), { wrapper });
      await roles.current.mutateAsync({ userId: 'u1', roles: ['media_admin'] });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/users/u1/roles',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('Audit and System Settings Hooks', () => {
    it('useAdminAudit consulta registros de auditoría', async () => {
      mockAdminHttp.mockResolvedValueOnce({ items: [] });

      const { result } = renderHook(
        () => useAdminAudit({ action: 'LOGIN', userId: 'usr1', cursor: 'cur-aud', limit: 25 }),
        { wrapper },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith(expect.stringContaining('/api/admin/audit?'));
    });

    it('useSystemSettings y useUpdateSystemSettings gestionan configuraciones globales', async () => {
      mockAdminHttp.mockResolvedValueOnce({ publicOnlyRatified: false });

      const { result: settings } = renderHook(() => useSystemSettings(), { wrapper });
      await waitFor(() => expect(settings.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith('/api/admin/settings/public-only-ratified');

      mockAdminHttp.mockResolvedValueOnce({ publicOnlyRatified: true });

      const { result: update } = renderHook(() => useUpdateSystemSettings(), { wrapper });
      await update.current.mutateAsync({ publicOnlyRatified: true });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/settings/public-only-ratified',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('Media Hooks', () => {
    it('useAdminMediaList y mutaciones de medios gestionan catálogo multimedia', async () => {
      mockAdminHttp.mockResolvedValueOnce({ success: true, data: [] });

      const { result: list } = renderHook(() => useAdminMediaList({ tipo: 'video', limit: 20 }), {
        wrapper,
      });
      await waitFor(() => expect(list.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith(expect.stringContaining('/api/admin/medios?'));

      mockAdminHttp.mockImplementation((path: string) => {
        if (typeof path === 'string' && path.startsWith('/api/admin/medios?')) {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: { id: 'm1' }, message: 'ok' });
      });

      const { result: upload } = renderHook(() => useUploadAdminMedia(), { wrapper });
      const formData = new FormData();
      await upload.current.mutateAsync(formData);
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/medios/upload',
        expect.objectContaining({ method: 'POST', body: formData }),
      );

      const { result: ratify } = renderHook(() => useRatifyAdminMedia(), { wrapper });
      await ratify.current.mutateAsync('m1');
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/medios/m1/ratify',
        expect.objectContaining({ method: 'POST' }),
      );

      const { result: del } = renderHook(() => useDeleteAdminMedia(), { wrapper });
      await del.current.mutateAsync('m1');
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/medios/m1',
        expect.objectContaining({ method: 'DELETE' }),
      );

      const { result: updateMeta } = renderHook(() => useUpdateAdminMediaMetadata(), { wrapper });
      await updateMeta.current.mutateAsync({
        id: 'm1',
        data: { hablanteAutor: 'Taita Misak' },
      });
      expect(mockAdminHttp).toHaveBeenCalledWith(
        '/api/admin/medios/m1',
        expect.objectContaining({ method: 'PATCH' }),
      );

      // useAdminMediaList con múltiples filtros y respuesta estructurada en objeto
      mockAdminHttp.mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          limit: 15,
          offset: 5,
        },
      });
      const { result: filteredMedia } = renderHook(
        () =>
          useAdminMediaList({
            tipo: 'imagen',
            estado: 'borrador',
            sentidoId: 's1',
            formaId: 'f1',
            campoSemanticoId: 'c1',
            subcampoSemanticoId: 'sc1',
            microcampoId: 'mc1',
            query: 'canto',
            limit: 15,
            offset: 5,
          }),
        { wrapper },
      );
      await waitFor(() => expect(filteredMedia.current.isSuccess).toBe(true));
      expect(mockAdminHttp).toHaveBeenCalledWith(
        expect.stringContaining('subcampoSemanticoId=sc1'),
      );
    });
  });
});
