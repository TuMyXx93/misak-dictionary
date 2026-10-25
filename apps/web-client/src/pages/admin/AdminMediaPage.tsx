/**
 * AdminMediaPage — Phase 5 · Spec 007 (Medios Escalonados + Video Cultural)
 *
 * Página de administración y catálogo de medios culturales (/admin/medios, R-014):
 * - Tabla responsiva (@container) de recursos multimedia (audio, imagen y video cultural).
 * - Filtros por tipo, estado (borrador/ratificado) y texto.
 * - Previsualización directa de audio (AudioPlayButton), imágenes y videos (CulturalMediaLightbox).
 * - Acciones de ratificación comunitaria (media:write) y borrado lógico (media:delete).
 * - Modal de carga y catalogación comunitaria (AdminMediaUploadModal).
 */

import { useState } from 'react';
import { AdminMediaUploadModal } from '@/components/admin/AdminMediaUploadModal';
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminSurface,
} from '@/components/admin/ui';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import {
  type AdminMediaItem,
  type AdminMediaTipo,
  useAdminMediaList,
  useDeleteAdminMedia,
  useRatifyAdminMedia,
} from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

type AdminLightboxMediaItem = CulturalMediaItem & {
  tipo?: 'imagen' | 'video';
  duracionSegundos?: number | null;
  posterSrc?: string | null;
};

function formatReadableSize(sizeBytes: string | number): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 kB';
  const kb = bytes / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} kB`;
}

function formatVideoSizeMb(sizeBytes: string | number): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number | null): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function renderMediaVinculacion(item: AdminMediaItem) {
  if (item.sentido) {
    return (
      <div>
        <p className="font-semibold text-[var(--admin-text)]" lang="gum">
          {item.sentido.formas?.[0]?.lema ?? item.sentido.codigo}
        </p>
        <p className="text-xs text-[var(--admin-text-secondary)] truncate max-w-[180px]">
          {item.sentido.espanolGlosa}
        </p>
      </div>
    );
  }
  if (item.forma) {
    return (
      <div>
        <p className="font-semibold text-[var(--admin-text)]" lang="gum">
          {item.forma.lema}
        </p>
        <p className="text-xs text-[var(--admin-text-muted)]">Forma léxica</p>
      </div>
    );
  }
  const taxonomyNode = item.microcampo ?? item.subcampoSemantico ?? item.campoSemantico;
  if (taxonomyNode) {
    return (
      <div>
        <p className="font-semibold text-[var(--admin-text)]" lang="gum">
          {taxonomyNode.codigo} · {taxonomyNode.namtrikTermino}
        </p>
        {taxonomyNode.espanolTermino && (
          <p className="text-xs text-[var(--admin-text-secondary)] truncate max-w-[180px]">
            {taxonomyNode.espanolTermino}
          </p>
        )}
      </div>
    );
  }
  if (item.microcampoId) {
    return <AdminBadge tone="neutral">Microcampo #{item.microcampoId}</AdminBadge>;
  }
  if (item.subcampoSemanticoId) {
    return <AdminBadge tone="neutral">Subcampo #{item.subcampoSemanticoId}</AdminBadge>;
  }
  if (item.campoSemanticoId) {
    return <AdminBadge tone="neutral">Campo #{item.campoSemanticoId}</AdminBadge>;
  }
  if (item.sentidoId) {
    return <AdminBadge tone="neutral">Sentido #{item.sentidoId}</AdminBadge>;
  }
  if (item.formaId) {
    return <AdminBadge tone="neutral">Forma #{item.formaId}</AdminBadge>;
  }
  return <span className="text-xs text-[var(--admin-text-muted)] italic">Sin vincular</span>;
}

export function AdminMediaPage() {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission('media:write');
  const canDelete = hasPermission('media:delete');

  const [tipoFilter, setTipoFilter] = useState<AdminMediaTipo | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<'borrador' | 'ratificado' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<AdminLightboxMediaItem | null>(null);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState<AdminMediaItem | null>(null);

  const { data, isLoading, isError, error } = useAdminMediaList({
    tipo: tipoFilter || undefined,
    estado: estadoFilter || undefined,
    query: searchQuery || undefined,
    limit,
    offset,
  });

  const ratifyMutation = useRatifyAdminMedia();
  const deleteMutation = useDeleteAdminMedia();

  const handleRatify = async (id: string) => {
    try {
      await ratifyMutation.mutateAsync(id);
    } catch {
      // Error manejado reactivamente por React Query
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteMedia) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteMedia.id);
      setConfirmDeleteMedia(null);
    } catch {
      // Error manejado reactivamente
    }
  };

  const handlePreviewImage = (item: AdminMediaItem) => {
    setLightboxMedia({
      src: `/api/media/${item.uuid}/stream`,
      alt: item.descripcionEspanol ?? item.filename,
      tipo: 'imagen',
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
    });
  };

  const handlePreviewVideo = (item: AdminMediaItem) => {
    setLightboxMedia({
      src: `/api/media/${item.uuid}/stream`,
      alt: item.descripcionEspanol ?? item.filename,
      tipo: 'video',
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
      duracionSegundos: item.duracionSegundos,
      posterSrc: item.posterUuid ? `/api/media/${item.posterUuid}/stream` : null,
    });
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Repositorio Audiovisual"
        title="Medios Culturales"
        description="Audios de pronunciación, ilustraciones y videos culturales del pueblo Misak (R-014)."
        actions={
          canWrite ? (
            <AdminButton variant="accent" size="lg" onClick={() => setIsUploadModalOpen(true)}>
              <svg
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Cargar medio</span>
            </AdminButton>
          ) : undefined
        }
      />

      {/* Barra de Filtros */}
      <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <AdminFieldLabel htmlFor="filter-query">Buscar por texto</AdminFieldLabel>
          <AdminInput
            id="filter-query"
            type="text"
            placeholder="Hablante, variante, descripción..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
          />
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-tipo">Tipo de Medio</AdminFieldLabel>
          <AdminSelect
            id="filter-tipo"
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value as AdminMediaTipo | '');
              setOffset(0);
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="audio">Audios (Pronunciación)</option>
            <option value="imagen">Imágenes (Ilustraciones)</option>
            <option value="video">Videos Culturales</option>
          </AdminSelect>
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-estado">Estado Editorial</AdminFieldLabel>
          <AdminSelect
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value as 'borrador' | 'ratificado' | '');
              setOffset(0);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="borrador">En revisión (Borrador)</option>
            <option value="ratificado">Ratificado</option>
          </AdminSelect>
        </div>
      </AdminSurface>

      {/* Contenido / Tabla */}
      {isLoading ? (
        <AdminSurface className="p-12 text-center text-[var(--admin-text-secondary)]">
          <div role="status">
            <svg
              aria-hidden="true"
              className="w-8 h-8 animate-spin mx-auto text-[#0055AA] mb-2"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Cargando catálogo multimedia...</span>
          </div>
        </AdminSurface>
      ) : isError ? (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 text-sm font-medium"
        >
          Error al cargar los medios: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : items.length === 0 ? (
        <AdminSurface className="p-12 text-center text-[var(--admin-text-secondary)]">
          No se encontraron recursos multimedia con los filtros aplicados.
        </AdminSurface>
      ) : (
        <AdminSurface className="overflow-hidden">
          <div className="misak-table-region @container">
            <table className="misak-responsive-table text-left text-sm text-[var(--admin-text)]">
              <thead className="bg-[var(--admin-surface-muted)] text-xs uppercase font-bold tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)]">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    Recurso
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Tipo / Propósito
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Vinculación
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Autoría / Variante
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {items.map((item) => {
                  const durationFormatted = formatDuration(item.duracionSegundos);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                    >
                      {/* Previsualización */}
                      <td data-label="Recurso" className="px-4 py-3.5">
                        {item.tipo === 'audio' ? (
                          <div className="flex items-center gap-2.5">
                            <AudioPlayButton
                              trackId={item.uuid}
                              audioUrl={`/api/media/${item.uuid}/stream`}
                              lema={item.sentido?.formas?.[0]?.lema ?? item.filename}
                              className="scale-90"
                            />
                            <div className="min-w-0 max-w-[140px] text-left">
                              <p
                                className="text-xs font-mono text-[var(--admin-text)] truncate"
                                title={item.filename}
                              >
                                {item.filename}
                              </p>
                              <p className="text-[11px] text-[var(--admin-text-muted)]">
                                {formatReadableSize(item.sizeBytes)}
                              </p>
                            </div>
                          </div>
                        ) : item.tipo === 'video' ? (
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewVideo(item)}
                              aria-label={`Ver video ${item.descripcionEspanol ?? item.filename}`}
                              className="relative w-16 h-12 rounded-xl overflow-hidden border border-[var(--admin-control-border)] bg-black shrink-0 flex items-center justify-center group hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] cursor-pointer"
                            >
                              {item.posterUuid && (
                                <img
                                  src={`/api/media/${item.posterUuid}/stream`}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                                />
                              )}
                              <span className="relative z-10 w-7 h-7 rounded-full bg-[#E52D6D] text-white flex items-center justify-center shadow-md">
                                <svg
                                  aria-hidden="true"
                                  className="w-3.5 h-3.5 ml-0.5"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </span>
                            </button>
                            <div className="min-w-0 max-w-[140px] text-left">
                              <p
                                className="text-xs font-mono text-[var(--admin-text)] truncate"
                                title={item.filename}
                              >
                                {item.filename}
                              </p>
                              <p className="text-[11px] text-[var(--admin-text-muted)]">
                                {formatVideoSizeMb(item.sizeBytes)}
                                {durationFormatted ? ` · ${durationFormatted}` : ''}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePreviewImage(item)}
                            aria-label={`Ver imagen ${item.descripcionEspanol ?? item.filename}`}
                            className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--admin-control-border)] shrink-0 hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA] cursor-pointer"
                          >
                            <LazyImage
                              src={`/api/media/${item.uuid}/stream`}
                              alt={item.descripcionEspanol ?? item.filename}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                      </td>

                      {/* Tipo / Propósito */}
                      <td data-label="Tipo / Propósito" className="px-4 py-3.5">
                        <div>
                          {item.tipo === 'audio' ? (
                            <AdminBadge tone="primary">Audio</AdminBadge>
                          ) : item.tipo === 'video' ? (
                            <AdminBadge tone="accent">Video</AdminBadge>
                          ) : (
                            <AdminBadge tone="success">Imagen</AdminBadge>
                          )}
                          <p className="text-xs text-[var(--admin-text-secondary)] mt-1 capitalize">
                            {item.proposito.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </td>

                      {/* Vinculación */}
                      <td data-label="Vinculación" className="px-4 py-3.5">
                        {renderMediaVinculacion(item)}
                      </td>

                      {/* Autor / Variante */}
                      <td data-label="Autoría / Variante" className="px-4 py-3.5 text-xs">
                        <div>
                          {item.hablanteAutor && (
                            <p className="font-semibold text-[var(--admin-text)]">
                              {item.hablanteAutor}
                            </p>
                          )}
                          {item.varianteDialectal && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)]">
                              {item.varianteDialectal}
                            </span>
                          )}
                          {!item.hablanteAutor && !item.varianteDialectal && (
                            <span className="text-[var(--admin-text-muted)]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td data-label="Estado" className="px-4 py-3.5">
                        {item.estado === 'ratificado' ? (
                          <AdminBadge tone="success">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                              aria-hidden="true"
                            />
                            Ratificado
                          </AdminBadge>
                        ) : (
                          <AdminBadge tone="warning">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500"
                              aria-hidden="true"
                            />
                            En revisión
                          </AdminBadge>
                        )}
                      </td>

                      {/* Acciones */}
                      <td
                        data-label="Acciones"
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                      >
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {canWrite && item.estado === 'borrador' && (
                            <AdminButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleRatify(item.id)}
                              disabled={ratifyMutation.isPending}
                            >
                              Ratificar
                            </AdminButton>
                          )}

                          {canDelete && (
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmDeleteMedia(item)}
                              disabled={deleteMutation.isPending}
                            >
                              Eliminar
                            </AdminButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 text-xs text-[var(--admin-text-secondary)]">
            <span>
              Mostrando {items.length} de {total} recursos (Página {currentPage} de {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              >
                Anterior
              </AdminButton>
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={offset + limit >= total}
                onClick={() => setOffset((prev) => prev + limit)}
              >
                Siguiente
              </AdminButton>
            </div>
          </div>
        </AdminSurface>
      )}

      {/* Modal de Carga */}
      <AdminMediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Modal de Previsualización Lightbox */}
      <CulturalMediaLightbox
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />

      {/* Diálogo de Confirmación de Eliminación */}
      <AdminDialog
        isOpen={Boolean(confirmDeleteMedia)}
        onClose={() => setConfirmDeleteMedia(null)}
        title="¿Eliminar recurso multimedia?"
        titleId="confirm-delete-title"
        maxWidthClass="max-w-md"
        footer={
          <>
            <AdminButton variant="secondary" size="md" onClick={() => setConfirmDeleteMedia(null)}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="danger"
              size="md"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-[var(--admin-text-secondary)]">
          Se eliminará el recurso{' '}
          <span className="font-mono font-semibold text-[var(--admin-text)]">
            {confirmDeleteMedia?.filename}
          </span>
          . Esta acción no se puede deshacer.
        </p>
      </AdminDialog>
    </div>
  );
}
