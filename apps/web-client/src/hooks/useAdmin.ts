/**
 * useAdmin
 * Spec 006 (R-006..R-019, R-025..R-027) — Hooks de React Query para todas las
 * operaciones administrativas y de gobierno con invalidación de caché reactiva.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminHttp } from '@/services/adminHttp';

export interface AdminSentidosParams {
  nodo?: string;
  estado?: 'borrador' | 'ratificado';
  tipo?: 'estandar' | 'dialogico' | string;
  q?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface AdminSentidoItem {
  id: string;
  codigo: string;
  version: number;
  tipo: 'estandar' | 'dialogico' | string;
  estado: 'borrador' | 'ratificado';
  espanolGlosa?: string;
  espanolExplicacion?: string | null;
  namtrikContexto?: string | null;
  nombreCientifico?: string | null;
  createdAt?: string;
  updatedAt: string;
  // Campos de conveniencia para la UI del panel
  lema?: string;
  glosa?: string;
  categoriaGramatical?: string | null;
  nodo?: {
    codigo: string;
    titulo: string;
  } | null;
  formas?: Array<{
    id?: string;
    orden?: number;
    lema: string;
    acepcionHomonima?: number | null;
    categoriaGramatical?: string | null;
    variante?: string | null;
    esNeologismo?: boolean;
    rasgosGramaticales?: string[];
    etiquetaOriginal?: string | null;
  }>;
  dialogo?: {
    respuestaNamtrik: string | null;
    respuestaNamtrikContexto: string | null;
    respuestaEspanolGlosa: string | null;
    respuestaEspanolExplicacion: string | null;
  } | null;
  ubicacion?: {
    nivel: 'campo' | 'subcampo' | 'microcampo';
    id: string;
    codigo: string;
    etiqueta: string;
  } | null;
}

export interface AdminSentidosResponse {
  items: AdminSentidoItem[];
  nextCursor?: string | null;
  total?: number;
}

export interface ProgresoNodo {
  codigo: string;
  titulo?: string;
  tipo?: 'campo' | 'subcampo' | 'microcampo' | string;
  nivel?: 'campo' | 'subcampo' | 'microcampo';
  namtrik?: string;
  espanol?: string;
  total: number;
  ratificados: number;
  borradores: number;
  porcentaje: number;
}

export interface ProgresoRatificacionResponse {
  global: {
    total: number;
    ratificados: number;
    borradores: number;
    porcentaje: number;
  };
  nodos: ProgresoNodo[];
}

export interface PapeleraItem {
  id: string;
  codigo: string;
  tipo?: string;
  nivel?: 'campo' | 'subcampo' | 'microcampo' | 'sentido';
  lema?: string;
  glosa?: string;
  etiqueta?: string;
  deletedAt: string;
  deletedBy?: string;
  diasEliminado?: number;
  puedePurgar?: boolean;
}

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  nombres?: string | null;
  apellidos?: string | null;
  tipoIdentificacion?: string | null;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles: string[];
  permissions?: string[];
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUsername?: string;
  userId?: string;
  oldData?: unknown;
  newData?: unknown;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ========== 1. Sentidos & CRUD ==========

export function useAdminSentidos(params: AdminSentidosParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.nodo) queryParams.set('nodo', params.nodo);
  if (params.estado) queryParams.set('estado', params.estado);
  if (params.tipo) queryParams.set('tipo', params.tipo);
  const searchVal = params.search ?? params.q;
  if (searchVal) queryParams.set('q', searchVal);
  if (params.cursor) queryParams.set('cursor', params.cursor);
  if (params.limit) queryParams.set('limit', String(params.limit));

  const qs = queryParams.toString();
  const path = `/api/admin/dictionary/sentidos${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['admin', 'sentidos', params],
    queryFn: async () => {
      const res = await adminHttp<AdminSentidosResponse>(path);
      // Mapear lema y glosa si vienen en formas o espanolGlosa
      const items = res.items.map((it) => ({
        ...it,
        lema: it.lema ?? it.formas?.[0]?.lema ?? '',
        glosa: it.glosa ?? it.espanolGlosa ?? '',
        categoriaGramatical: it.categoriaGramatical ?? it.formas?.[0]?.categoriaGramatical ?? null,
      }));
      return { ...res, items };
    },
  });
}

export function useAdminSentido(id?: string) {
  return useQuery({
    queryKey: ['admin', 'sentidos', id],
    queryFn: async () => {
      const it = await adminHttp<AdminSentidoItem>(`/api/admin/dictionary/sentidos/${id}`);
      return {
        ...it,
        lema: it.lema ?? it.formas?.[0]?.lema ?? '',
        glosa: it.glosa ?? it.espanolGlosa ?? '',
        categoriaGramatical: it.categoriaGramatical ?? it.formas?.[0]?.categoriaGramatical ?? null,
        nodo:
          it.nodo ??
          (it.ubicacion ? { codigo: it.ubicacion.codigo, titulo: it.ubicacion.etiqueta } : null),
      };
    },
    enabled: Boolean(id),
  });
}

export function useCreateSentido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => {
      const record = body as Record<string, unknown>;
      let payload = record;
      if ('lema' in record && !('formas' in record)) {
        payload = {
          codigo: record.codigo,
          ubicacion: { nivel: 'microcampo', id: record.nodoCodigo ?? 'default' },
          tipo: record.tipo === 'dialogico' ? 'dialogico' : 'estandar',
          formas: [
            {
              lema: record.lema,
              categoriaGramatical: record.categoriaGramatical ?? 'sustantivo',
            },
          ],
          espanolGlosa: record.glosa,
        };
      }
      return adminHttp<AdminSentidoItem>('/api/admin/dictionary/sentidos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

export function useUpdateSentido(defaultId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      ...body
    }: {
      id?: string;
      version: number;
      [key: string]: unknown;
    }) => {
      const targetId = id ?? defaultId;
      let payload: Record<string, unknown> = { version, ...body };
      if ('lema' in body && !('formas' in body)) {
        payload = {
          version,
          tipo: body.tipo === 'dialogico' ? 'dialogico' : 'estandar',
          formas: [
            {
              lema: body.lema,
              categoriaGramatical: body.categoriaGramatical ?? 'sustantivo',
            },
          ],
          espanolGlosa: body.glosa,
        };
      }
      return adminHttp<AdminSentidoItem>(`/api/admin/dictionary/sentidos/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      const targetId = variables.id ?? defaultId;
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      if (targetId) queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos', targetId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

export function useDeleteSentido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: string | { id: string }) => {
      const id = typeof param === 'string' ? param : param.id;
      return adminHttp<void>(`/api/admin/dictionary/sentidos/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'papelera'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

// ========== 2. Ratificación y Reversión ==========

export function useRatificarSentido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: { id: string; version?: number }) =>
      adminHttp<AdminSentidoItem>(`/api/admin/dictionary/sentidos/${param.id}/ratificar`, {
        method: 'POST',
        body: JSON.stringify({ version: param.version ?? 1 }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

export function useRevertirSentido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: { id: string; version?: number; motivo: string }) =>
      adminHttp<AdminSentidoItem>(`/api/admin/dictionary/sentidos/${param.id}/revertir`, {
        method: 'POST',
        body: JSON.stringify({ version: param.version ?? 1, motivo: param.motivo }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

export function useRatificarLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (param: {
      nivel?: 'campo' | 'subcampo' | 'microcampo';
      id?: string;
      microcampoCodigo?: string;
      checklist?: {
        ortografia?: boolean;
        categorias?: boolean;
        glosas?: boolean;
        cientificos?: boolean;
      };
      snapshot?: Array<{ id: string; version: number }>;
    }) => {
      const nivel = param.nivel ?? 'microcampo';
      const targetId = param.id ?? param.microcampoCodigo ?? '';
      const res = await adminHttp<{ ratificados?: number; count?: number }>(
        `/api/admin/governance/ratificar-lote/${nivel}/${targetId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            checklist: param.checklist ?? {
              ortografia: true,
              categorias: true,
              glosas: true,
              cientificos: true,
            },
            snapshot: param.snapshot ?? [],
          }),
        },
      );
      const count = res.count ?? res.ratificados ?? 0;
      return { count, ratificados: count };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

// ========== 3. Progreso & Dashboard ==========

export function useProgresoRatificacion() {
  return useQuery({
    queryKey: ['admin', 'progreso'],
    queryFn: async () => {
      const raw = await adminHttp<
        ProgresoRatificacionResponse | ProgresoNodo[] | { global?: unknown; nodos?: ProgresoNodo[] }
      >('/api/admin/governance/progreso');

      const nodos = Array.isArray(raw)
        ? raw
        : 'nodos' in raw && Array.isArray(raw.nodos)
          ? raw.nodos
          : [];

      const normalizedNodos: ProgresoNodo[] = nodos.map((n) => {
        const total = n.total ?? 0;
        const ratificados = n.ratificados ?? 0;
        const borradores = n.borradores !== undefined ? n.borradores : total - ratificados;
        const porcentaje =
          n.porcentaje !== undefined
            ? n.porcentaje
            : total > 0
              ? Math.round((ratificados / total) * 100)
              : 0;

        return {
          ...n,
          titulo: n.titulo ?? (n as any).termino ?? n.namtrik ?? n.espanol ?? n.codigo,
          tipo: n.tipo ?? n.nivel ?? 'campo',
          nivel: n.nivel ?? (n.tipo as any) ?? 'campo',
          total,
          ratificados,
          borradores,
          porcentaje,
        };
      });

      // Si el backend envió una sección global válida, respetarla
      const hasValidGlobal =
        raw &&
        'global' in raw &&
        typeof raw.global === 'object' &&
        raw.global !== null &&
        typeof (raw.global as any).total === 'number';

      if (hasValidGlobal) {
        const g = (raw as ProgresoRatificacionResponse).global;
        const total = g.total ?? 0;
        const ratificados = g.ratificados ?? 0;
        const borradores = g.borradores !== undefined ? g.borradores : total - ratificados;
        const porcentaje =
          g.porcentaje !== undefined
            ? g.porcentaje
            : total > 0
              ? Math.round((ratificados / total) * 100)
              : 0;

        return {
          global: { total, ratificados, borradores, porcentaje },
          nodos: normalizedNodos,
        };
      }

      // Si el backend envió la lista plana jerárquica de nodos, sumar solo los campos raíz
      // para evitar triplicar el conteo acumulativo de microcampos y subcampos.
      const rootCampos = normalizedNodos.filter(
        (n) => (n.tipo ?? n.nivel) === 'campo' || !(n as any).padreCodigo,
      );
      const nodosParaGlobal = rootCampos.length > 0 ? rootCampos : normalizedNodos;

      const total = nodosParaGlobal.reduce((acc, n) => acc + n.total, 0);
      const ratificados = nodosParaGlobal.reduce((acc, n) => acc + n.ratificados, 0);
      const borradores = total - ratificados;
      const porcentaje = total > 0 ? Math.round((ratificados / total) * 100) : 0;

      return {
        global: { total, ratificados, borradores, porcentaje },
        nodos: normalizedNodos,
      };
    },
  });
}

// ========== 4. Papelera & Purga ==========

export function usePapelera() {
  return useQuery({
    queryKey: ['admin', 'papelera'],
    queryFn: async () => {
      const res = await adminHttp<PapeleraItem[] | { items: PapeleraItem[] }>(
        '/api/admin/papelera',
      );
      const rawItems = Array.isArray(res) ? res : (res?.items ?? []);
      const items = rawItems.map((it: any) => ({
        ...it,
        tipo: it.tipo ?? it.nivel ?? 'sentido',
        lema: it.lema ?? it.etiqueta ?? it.namtrik ?? it.espanol ?? '',
        glosa: it.glosa ?? it.espanol ?? '',
        deletedAt: it.deletedAt ?? it.eliminadoAt ?? new Date().toISOString(),
      }));
      return { items };
    },
  });
}

export function useRestaurarPapelera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: { id: string; nivel?: string }) => {
      const nivel = param.nivel ?? 'sentido';
      return adminHttp<{ restored: boolean }>(
        `/api/admin/papelera/${nivel}/${param.id}/restaurar`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'papelera'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'progreso'] });
    },
  });
}

export function usePurgarPapelera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: { id: string; nivel?: string; codigo?: string }) => {
      const nivel = param.nivel ?? 'sentido';
      return adminHttp<void>(`/api/admin/papelera/${nivel}/${param.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ codigo: param.codigo }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'papelera'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

// ========== 5. Usuarios & Roles ==========

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await adminHttp<AdminUserItem[] | { items: AdminUserItem[] }>('/api/admin/users');
      const items = Array.isArray(res) ? res : res.items;
      return { items };
    },
  });
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  nombres?: string;
  apellidos?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  fullName?: string;
  roles: string[];
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  nombres?: string;
  apellidos?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  fullName?: string;
  roles?: string[];
  isActive?: boolean;
}

export function useSuggestUsername(nombres: string, apellidos: string, enabled = true) {
  const queryParams = new URLSearchParams();
  if (nombres) queryParams.set('nombres', nombres);
  if (apellidos) queryParams.set('apellidos', apellidos);

  return useQuery({
    queryKey: ['admin', 'users', 'suggest-username', nombres, apellidos],
    queryFn: () =>
      adminHttp<{ username: string; available: boolean }>(
        `/api/admin/users/suggest-username?${queryParams.toString()}`,
      ),
    enabled: enabled && (Boolean(nombres.trim()) || Boolean(apellidos.trim())),
    staleTime: 5000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) =>
      adminHttp<AdminUserItem>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserPayload }) =>
      adminHttp<AdminUserItem>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminHttp<AdminUserItem>(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      adminHttp<{ statusCode: number; message: string; user: AdminUserItem }>(
        `/api/admin/users/${userId}/unlock`,
        {
          method: 'POST',
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      adminHttp<AdminUserItem>(`/api/admin/users/${userId}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ roles }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

// ========== 6. Auditoría & Ajustes ==========

export function useAdminAudit(
  params: { action?: string; userId?: string; cursor?: string; limit?: number } = {},
) {
  const queryParams = new URLSearchParams();
  if (params.action) queryParams.set('action', params.action);
  if (params.userId) queryParams.set('userId', params.userId);
  if (params.cursor) queryParams.set('cursor', params.cursor);
  if (params.limit) queryParams.set('limit', String(params.limit));

  const qs = queryParams.toString();
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: () =>
      adminHttp<{ items: AuditLogItem[]; nextCursor?: string | null }>(
        `/api/admin/audit${qs ? `?${qs}` : ''}`,
      ),
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminHttp<{
        key?: string;
        value?: boolean;
        enabled?: boolean;
        publicOnlyRatified?: boolean;
      }>('/api/admin/settings/public-only-ratified');
      const val =
        res.enabled !== undefined
          ? res.enabled
          : res.publicOnlyRatified !== undefined
            ? res.publicOnlyRatified
            : res.value !== undefined
              ? Boolean(res.value)
              : false;
      return { enabled: val, publicOnlyRatified: val, value: val };
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      param: boolean | { publicOnlyRatified?: boolean; enabled?: boolean; value?: boolean },
    ) => {
      const val =
        typeof param === 'boolean'
          ? param
          : (param.publicOnlyRatified ?? param.enabled ?? param.value ?? false);
      return adminHttp<{
        key?: string;
        value: boolean;
        enabled: boolean;
        publicOnlyRatified: boolean;
      }>('/api/admin/settings/public-only-ratified', {
        method: 'PATCH',
        body: JSON.stringify({ value: val }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export type AdminMediaTipo = 'audio' | 'imagen' | 'video';

export interface AdminMediaItem {
  id: string;
  uuid: string;
  sentidoId?: string | null;
  formaId?: string | null;
  campoSemanticoId?: string | null;
  subcampoSemanticoId?: string | null;
  microcampoId?: string | null;
  tipo: AdminMediaTipo;
  proposito: string;
  filename: string;
  originalName?: string;
  mimetype: string;
  sizeBytes: string;
  hashSha256: string;
  duracionSegundos?: number | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  posterUuid?: string | null;
  metadata?: Record<string, unknown> | null;
  estado: 'borrador' | 'ratificado';
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria: string;
  subidoPorId?: string | null;
  ratificadoPorId?: string | null;
  ratificadoAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sentido?: {
    id: string;
    codigo: string;
    espanolGlosa: string;
    formas?: Array<{ id: string; lema: string }>;
  } | null;
  forma?: {
    id: string;
    lema: string;
  } | null;
  campoSemantico?: {
    id: string;
    codigo: string;
    namtrikTermino: string;
    espanolTermino?: string | null;
  } | null;
  subcampoSemantico?: {
    id: string;
    codigo: string;
    namtrikTermino: string;
    espanolTermino?: string | null;
  } | null;
  microcampo?: {
    id: string;
    codigo: string;
    namtrikTermino: string;
    espanolTermino?: string | null;
  } | null;
}

export interface AdminMediaListParams {
  tipo?: AdminMediaTipo;
  estado?: 'borrador' | 'ratificado';
  sentidoId?: string;
  formaId?: string;
  campoSemanticoId?: string;
  subcampoSemanticoId?: string;
  microcampoId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface AdminMediaListResponse {
  items: AdminMediaItem[];
  total: number;
  limit: number;
  offset: number;
}

export function useAdminMediaList(params: AdminMediaListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'medios', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.tipo) query.set('tipo', params.tipo);
      if (params.estado) query.set('estado', params.estado);
      if (params.sentidoId) query.set('sentidoId', params.sentidoId);
      if (params.formaId) query.set('formaId', params.formaId);
      if (params.campoSemanticoId) query.set('campoSemanticoId', params.campoSemanticoId);
      if (params.subcampoSemanticoId) query.set('subcampoSemanticoId', params.subcampoSemanticoId);
      if (params.microcampoId) query.set('microcampoId', params.microcampoId);
      if (params.query) query.set('query', params.query);
      if (params.limit !== undefined) query.set('limit', String(params.limit));
      if (params.offset !== undefined) query.set('offset', String(params.offset));

      const qs = query.toString();
      const res = await adminHttp<{
        success: boolean;
        data: AdminMediaListResponse | AdminMediaItem[];
        total?: number;
        limit?: number;
        offset?: number;
      }>(`/api/admin/medios${qs ? `?${qs}` : ''}`);

      if (Array.isArray(res.data)) {
        return {
          items: res.data,
          total: res.total ?? res.data.length,
          limit: res.limit ?? params.limit ?? 15,
          offset: res.offset ?? params.offset ?? 0,
        };
      }
      return res.data;
    },
  });
}

export function useUploadAdminMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => {
      return adminHttp<{ success: boolean; data: AdminMediaItem }>('/api/admin/medios/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'medios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useRatifyAdminMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return adminHttp<{ success: boolean; data: AdminMediaItem }>(
        `/api/admin/medios/${id}/ratify`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'medios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useDeleteAdminMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return adminHttp<{ success: boolean; message: string }>(`/api/admin/medios/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'medios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useUpdateAdminMediaMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminMediaItem> }) => {
      return adminHttp<{ success: boolean; data: AdminMediaItem }>(`/api/admin/medios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'medios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sentidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}
