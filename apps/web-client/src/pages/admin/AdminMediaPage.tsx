/**
 * AdminMediaPage — Phase 5 · Spec 007 (Medios Escalonados)
 *
 * Página de administración y catálogo de medios culturales (/admin/medios, R-014):
 * - Tabla paginada de recursos multimedia (audio e imagen).
 * - Filtros por tipo, estado (borrador/ratificado) y texto.
 * - Previsualización directa de audio (AudioPlayButton) e imágenes (CulturalMediaLightbox).
 * - Acciones de ratificación comunitaria (media:write) y borrado lógico (media:delete).
 * - Modal de carga y catalogación comunitaria (AdminMediaUploadModal).
 */

import { useState } from 'react';
import { AdminMediaUploadModal } from '@/components/admin/AdminMediaUploadModal';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import {
  type AdminMediaItem,
  useAdminMediaList,
  useDeleteAdminMedia,
  useRatifyAdminMedia,
} from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

export function AdminMediaPage() {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission('media:write');
  const canDelete = hasPermission('media:delete');

  const [tipoFilter, setTipoFilter] = useState<'audio' | 'imagen' | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<'borrador' | 'ratificado' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<CulturalMediaItem | null>(null);
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
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
    });
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 tracking-tight">
            Medios Culturales
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Audios de pronunciación e ilustraciones comunitarias del pueblo Misak (R-014).
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[48px] rounded-xl shadow-md text-sm font-semibold text-slate-900 bg-primary hover:bg-primary-light transition-all focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
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
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="filter-query"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1"
          >
            Buscar por texto
          </label>
          <input
            id="filter-query"
            type="text"
            placeholder="Hablante, variante, descripción..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="filter-tipo"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1"
          >
            Tipo de Medio
          </label>
          <select
            id="filter-tipo"
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value as 'audio' | 'imagen' | '');
              setOffset(0);
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los tipos</option>
            <option value="audio">Audios (Pronunciación)</option>
            <option value="imagen">Imágenes (Ilustraciones)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-estado"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1"
          >
            Estado Editorial
          </label>
          <select
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value as 'borrador' | 'ratificado' | '');
              setOffset(0);
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">En revisión (Borrador)</option>
            <option value="ratificado">Ratificado</option>
          </select>
        </div>
      </div>

      {/* Contenido / Tabla */}
      {isLoading ? (
        <div role="status" className="p-12 text-center text-slate-500">
          <svg
            aria-hidden="true"
            className="w-8 h-8 animate-spin mx-auto text-primary mb-2"
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
      ) : isError ? (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
        >
          Error al cargar los medios: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
          No se encontraron recursos multimedia con los filtros aplicados.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Recurso
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tipo / Propósito
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vinculación
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Autoría / Variante
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Previsualización */}
                    <td className="px-4 py-3">
                      {item.tipo === 'audio' ? (
                        <div className="flex items-center gap-2">
                          <AudioPlayButton
                            trackId={item.uuid}
                            audioUrl={`/api/media/${item.uuid}/stream`}
                            lema={item.sentido?.formas?.[0]?.lema ?? item.filename}
                            className="scale-90"
                          />
                          <div className="min-w-0 max-w-[120px]">
                            <p
                              className="text-xs font-mono text-slate-500 truncate"
                              title={item.filename}
                            >
                              {item.filename}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {(Number(item.sizeBytes) / 1024).toFixed(1)} kB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePreviewImage(item)}
                          aria-label={`Ver imagen ${item.descripcionEspanol ?? item.filename}`}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 hover:scale-105 transition-all focus:outline-hidden focus:ring-2 focus:ring-primary"
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
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.tipo === 'audio'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.tipo === 'audio' ? 'Audio' : 'Imagen'}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                        {item.proposito.replace(/_/g, ' ')}
                      </p>
                    </td>

                    {/* Vinculación Léxica */}
                    <td className="px-4 py-3">
                      {item.sentido ? (
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.sentido.formas?.[0]?.lema ?? item.sentido.codigo}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">
                            {item.sentido.espanolGlosa}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin vincular</span>
                      )}
                    </td>

                    {/* Autor / Variante */}
                    <td className="px-4 py-3 text-xs">
                      {item.hablanteAutor && (
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {item.hablanteAutor}
                        </p>
                      )}
                      {item.varianteDialectal && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.varianteDialectal}
                        </span>
                      )}
                      {!item.hablanteAutor && !item.varianteDialectal && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      {item.estado === 'ratificado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ratificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          En revisión
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {canWrite && item.estado === 'borrador' && (
                        <button
                          type="button"
                          onClick={() => handleRatify(item.id)}
                          disabled={ratifyMutation.isPending}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                        >
                          Ratificar
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMedia(item)}
                          disabled={deleteMutation.isPending}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Mostrando {items.length} de {total} recursos (Página {currentPage} de {totalPages})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                className="min-h-[40px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={offset + limit >= total}
                onClick={() => setOffset((prev) => prev + limit)}
                className="min-h-[40px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
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
      {confirmDeleteMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 dark:border-rose-900 text-slate-800 dark:text-slate-100">
            <h3
              id="confirm-delete-title"
              className="text-lg font-bold text-rose-600 dark:text-rose-400"
            >
              ¿Eliminar recurso multimedia?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Se eliminará el recurso{' '}
              <span className="font-mono font-semibold">{confirmDeleteMedia.filename}</span>. Esta
              acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteMedia(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
