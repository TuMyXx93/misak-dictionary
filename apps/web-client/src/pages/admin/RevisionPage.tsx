/**
 * RevisionPage
 * Spec 006 (R-011, R-013, R-014, R-025, T-045)
 * Cola de revisión de borradores con ratificación individual, reversión con motivo obligatorio
 * (>= 10 caracteres), checklist de validación y ratificación por lote de microcampo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChecklistRatificacion } from '@/components/admin/ChecklistRatificacion';
import {
  formatMediaVinculacionSummary,
  getPropositoLabel,
} from '@/components/admin/mediaCatalogHelpers';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminSurface,
  AdminTextarea,
} from '@/components/admin/ui';
import { AbbreviationBadge } from '@/components/ui/AbbreviationBadge';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import {
  type AdminMediaItem,
  type AdminMediaTipo,
  type AdminSentidoItem,
  useAdminMediaList,
  useAdminSentidos,
  useRatificarLote,
  useRatificarSentido,
  useRatifyAdminMedia,
  useRevertirSentido,
} from '@/hooks/useAdmin';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';

export function RevisionPage() {
  const { hasPermission } = useAuthStore();
  const canRatify = hasPermission('taxonomy:ratify');
  const canRevert = hasPermission('taxonomy:revert');
  const canReadMedia = hasPermission('media:read');

  // Pestaña activa de revisión
  const [activeQueueTab, setActiveQueueTab] = useState<'sentidos' | 'medios'>('sentidos');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const debouncedMediaSearchQuery = useDebounce(mediaSearchQuery, 250);
  const [mediaTipoFilter, setMediaTipoFilter] = useState<'' | AdminMediaTipo>('');
  const [lightboxMedia, setLightboxMedia] = useState<CulturalMediaItem | null>(null);

  // Estado de listado
  const [estadoFilter, setEstadoFilter] = useState<'borrador' | 'ratificado'>('borrador');
  const [microcampoFilter, setMicrocampoFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const { data, isLoading, isError, error } = useAdminSentidos({
    estado: estadoFilter,
    nodo: microcampoFilter || undefined,
    search: debouncedSearchQuery || undefined,
    limit: 50,
  });

  const {
    data: pendingMediaData,
    isLoading: isMediaLoading,
    isError: isMediaError,
    error: mediaError,
  } = useAdminMediaList(
    {
      estado: 'borrador',
      query: debouncedMediaSearchQuery.trim() || undefined,
      tipo: mediaTipoFilter || undefined,
      limit: 30,
    },
    { enabled: canReadMedia },
  );
  const ratifyMediaMutation = useRatifyAdminMedia();

  // Mutaciones
  const ratificarMutation = useRatificarSentido();
  const revertirMutation = useRevertirSentido();
  const ratificarLoteMutation = useRatificarLote();

  // Estados de diálogo de ratificación
  const [ratifyTarget, setRatifyTarget] = useState<AdminSentidoItem | null>(null);
  const [isLoteRatifyOpen, setIsLoteRatifyOpen] = useState(false);
  const [loteCodigo, setLoteCodigo] = useState('');

  // Estados de diálogo de reversión
  const [revertTarget, setRevertTarget] = useState<AdminSentidoItem | null>(null);
  const [revertMotivo, setRevertMotivo] = useState('');
  const [revertError, setRevertError] = useState<string | null>(null);

  // Mensajes de resultado
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleOpenRatify = (sentido: AdminSentidoItem) => {
    setFeedbackMessage(null);
    setRatifyTarget(sentido);
  };

  const handleConfirmRatify = async () => {
    if (!ratifyTarget) return;
    try {
      await ratificarMutation.mutateAsync({
        id: ratifyTarget.id,
        version: ratifyTarget.version,
      });
      setFeedbackMessage({
        type: 'success',
        text: `Sentido ${ratifyTarget.codigo} ratificado exitosamente.`,
      });
      setRatifyTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al ratificar el sentido.';
      setFeedbackMessage({ type: 'error', text: msg });
      setRatifyTarget(null);
    }
  };

  const handleConfirmLoteRatify = async () => {
    const trimmed = loteCodigo.trim();
    if (!trimmed) return;
    const normalizedCode = trimmed.toUpperCase();
    const snapshot = (data?.items ?? [])
      .filter(
        (item) =>
          item.estado === 'borrador' &&
          (item.codigo.toUpperCase() === normalizedCode ||
            item.codigo.toUpperCase().startsWith(`${normalizedCode}.`)),
      )
      .map((item) => ({ id: item.id, version: item.version }));

    try {
      const res = await ratificarLoteMutation.mutateAsync({
        microcampoCodigo: trimmed,
        snapshot,
      });
      setFeedbackMessage({
        type: 'success',
        text: `Lote ratificado exitosamente: ${res.count} sentidos aprobados.`,
      });
      setIsLoteRatifyOpen(false);
      setLoteCodigo('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al ratificar el lote.';
      setFeedbackMessage({ type: 'error', text: msg });
      setIsLoteRatifyOpen(false);
    }
  };

  const handleOpenRevert = (sentido: AdminSentidoItem) => {
    setFeedbackMessage(null);
    setRevertTarget(sentido);
    setRevertMotivo('');
    setRevertError(null);
  };

  const handleConfirmRevert = async () => {
    if (!revertTarget) return;

    if (revertMotivo.trim().length < 10) {
      setRevertError('El motivo de reversión debe tener al menos 10 caracteres.');
      return;
    }

    try {
      await revertirMutation.mutateAsync({
        id: revertTarget.id,
        version: revertTarget.version,
        motivo: revertMotivo.trim(),
      });
      setFeedbackMessage({
        type: 'success',
        text: `Sentido ${revertTarget.codigo} devuelto a revisión.`,
      });
      setRevertTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al revertir el sentido.';
      setFeedbackMessage({ type: 'error', text: msg });
      setRevertTarget(null);
    }
  };

  const handleRatifyMedia = async (media: AdminMediaItem) => {
    setFeedbackMessage(null);
    try {
      await ratifyMediaMutation.mutateAsync(media.id);
      setFeedbackMessage({
        type: 'success',
        text: `Medio cultural "${media.originalName ?? media.filename}" ratificado exitosamente.`,
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al ratificar el medio cultural.',
      });
    }
  };

  const openMediaLightbox = (item: AdminMediaItem) => {
    const streamUrl = item.streamUrl ?? `/api/media/${item.uuid}/stream`;
    const vinc = formatMediaVinculacionSummary(item);
    setLightboxMedia({
      uuid: item.uuid,
      tipo: item.tipo,
      src: streamUrl,
      alt: vinc.primary,
      mimetype: item.mimetype,
      posterUrl: item.posterUuid ? `/api/media/${item.posterUuid}/stream` : undefined,
      duracionSegundos: item.duracionSegundos ?? undefined,
      descripcionEspanol: item.descripcionEspanol ?? item.originalName ?? undefined,
      descripcionNamtrik: item.descripcionNamtrik ?? undefined,
      autor: item.hablanteAutor ?? undefined,
      variante: item.varianteDialectal ?? undefined,
      licencia: item.licenciaComunitaria ?? undefined,
      anchoPx: item.anchoPx ?? undefined,
      altoPx: item.altoPx ?? undefined,
    });
  };

  const renderSentidosQueue = () => (
    <>
      {/* Filtros de búsqueda, microcampo y estado editorial */}
      <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <AdminFieldLabel htmlFor="filter-revision-search">
            Buscar término o glosa (normalizado ɵ/o y sin tildes)
          </AdminFieldLabel>
          <AdminInput
            id="filter-revision-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: malɵ, corazon, Gastropoda..."
          />
        </div>
        <div>
          <AdminFieldLabel htmlFor="filter-revision-nodo">
            Filtrar por nodo microcampo
          </AdminFieldLabel>
          <AdminInput
            id="filter-revision-nodo"
            type="text"
            value={microcampoFilter}
            onChange={(e) => setMicrocampoFilter(e.target.value)}
            placeholder="Ej: C1.S1.M2"
            className="font-mono"
          />
        </div>
        <div>
          <AdminFieldLabel htmlFor="filter-revision-estado">Estado editorial</AdminFieldLabel>
          <AdminSelect
            id="filter-revision-estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as 'borrador' | 'ratificado')}
          >
            <option value="borrador">Borradores (pendientes)</option>
            <option value="ratificado">Ratificados (para revertir)</option>
          </AdminSelect>
        </div>
      </AdminSurface>

      {isLoading && (
        <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
          <output className="block">Cargando cola de revisión...</output>
        </AdminSurface>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
        >
          Error al cargar borradores: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <AdminSurface className="overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
              No hay sentidos en borrador pendientes de revisión.
            </div>
          ) : (
            <section
              // biome-ignore lint/a11y/noNoninteractiveTabindex: región de tabla desplazable por teclado (WCAG 2.1.1 / responsive-table)
              tabIndex={0}
              aria-label="Tabla de sentidos pendientes de revisión"
              className="misak-table-region @container"
            >
              <table className="misak-responsive-table text-left text-sm text-[var(--admin-text)]">
                <thead className="bg-[var(--admin-surface-muted)] text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Código
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Lema (Namtrik)
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Glosa
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Versión
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Acciones Editoriales
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {data.items.map((sentido) => (
                    <tr
                      key={sentido.id}
                      className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                    >
                      <td
                        data-label="Código"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-[var(--admin-text-secondary)]"
                      >
                        {sentido.codigo}
                      </td>
                      <td
                        data-label="Lema (Namtrik)"
                        className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-[var(--admin-text)]"
                        lang="gum"
                      >
                        <div className="flex items-center gap-2">
                          <span>{sentido.lema}</span>
                          {sentido.categoriaGramatical && (
                            <AbbreviationBadge value={sentido.categoriaGramatical} size="xs" />
                          )}
                        </div>
                      </td>
                      <td
                        data-label="Glosa"
                        className="px-4 py-3.5 text-sm text-[var(--admin-text-secondary)] max-w-sm truncate"
                      >
                        <div>{sentido.glosa}</div>
                        {sentido.nombreCientifico && (
                          <div className="text-xs font-serif italic text-emerald-800 dark:text-emerald-300">
                            {sentido.nombreCientifico}
                          </div>
                        )}
                      </td>
                      <td
                        data-label="Versión"
                        className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--admin-text-muted)] font-mono"
                      >
                        v{sentido.version}
                      </td>
                      <td
                        data-label="Acciones Editoriales"
                        className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium"
                      >
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {canRatify && sentido.estado !== 'ratificado' && (
                            <AdminButton
                              variant="primary"
                              size="md"
                              onClick={() => handleOpenRatify(sentido)}
                            >
                              Ratificar
                            </AdminButton>
                          )}
                          {canRevert && sentido.estado === 'ratificado' && (
                            <AdminButton
                              variant="secondary"
                              size="md"
                              onClick={() => handleOpenRevert(sentido)}
                            >
                              Revertir
                            </AdminButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </AdminSurface>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Curaduría Comunitaria"
        title="Cola Editorial de Revisión"
        description="Sentidos en borrador pendientes de verificación y ratificación comunitaria (R-011, R-014)."
        actions={
          canRatify ? (
            <div className="flex flex-wrap items-center gap-2">
              <AdminInput
                type="text"
                aria-label="Código microcampo"
                placeholder="Código microcampo (ej: C1.S1.M5)"
                value={loteCodigo}
                onChange={(e) => setLoteCodigo(e.target.value)}
                className="w-56 font-mono min-h-[48px]"
              />
              <AdminButton
                variant="primary"
                size="action"
                disabled={!loteCodigo.trim() || ratificarLoteMutation.isPending}
                onClick={() => setIsLoteRatifyOpen(true)}
              >
                Ratificar lote
              </AdminButton>
            </div>
          ) : undefined
        }
      />

      {feedbackMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-sm font-medium border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/35'
              : 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-600/35'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {canReadMedia && (
        <div
          role="tablist"
          aria-label="Colas de revisión editorial"
          className="flex flex-wrap gap-2 border-b border-[var(--admin-border)] pb-2"
        >
          <button
            type="button"
            role="tab"
            id="tab-revision-sentidos"
            aria-selected={activeQueueTab === 'sentidos'}
            aria-controls="panel-revision-sentidos"
            onClick={() => setActiveQueueTab('sentidos')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
              activeQueueTab === 'sentidos'
                ? 'bg-[#0055AA]/15 text-[#0055AA] dark:text-[#66B2FF] border-[#0055AA]/40'
                : 'bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border-[var(--admin-border)] hover:text-[var(--admin-text)]'
            }`}
          >
            Sentidos Léxicos ({data?.total ?? data?.items.length ?? 0})
          </button>
          <button
            type="button"
            role="tab"
            id="tab-revision-medios"
            aria-selected={activeQueueTab === 'medios'}
            aria-controls="panel-revision-medios"
            onClick={() => setActiveQueueTab('medios')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
              activeQueueTab === 'medios'
                ? 'bg-[#0055AA]/15 text-[#0055AA] dark:text-[#66B2FF] border-[#0055AA]/40'
                : 'bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border-[var(--admin-border)] hover:text-[var(--admin-text)]'
            }`}
          >
            Medios Culturales por Ratificar (
            {pendingMediaData?.total ?? pendingMediaData?.items.length ?? 0})
          </button>
        </div>
      )}

      {activeQueueTab === 'sentidos' &&
        (canReadMedia ? (
          <div
            id="panel-revision-sentidos"
            role="tabpanel"
            aria-labelledby="tab-revision-sentidos"
            className="space-y-6"
          >
            {renderSentidosQueue()}
          </div>
        ) : (
          <div className="space-y-6">{renderSentidosQueue()}</div>
        ))}

      {activeQueueTab === 'medios' && canReadMedia && (
        <div
          id="panel-revision-medios"
          role="tabpanel"
          aria-labelledby="tab-revision-medios"
          className="space-y-6"
        >
          <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            <div className="sm:col-span-2">
              <AdminFieldLabel htmlFor="filter-revision-media-search">
                Buscar medio pendiente (hablante, archivo, descripción o sentido)
              </AdminFieldLabel>
              <AdminInput
                id="filter-revision-media-search"
                type="search"
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                placeholder="Ej: Mama Manuela, pisindɵ, C4.S6.E021..."
              />
            </div>
            <div>
              <AdminFieldLabel htmlFor="filter-revision-media-tipo">Tipo de medio</AdminFieldLabel>
              <AdminSelect
                id="filter-revision-media-tipo"
                value={mediaTipoFilter}
                onChange={(e) => setMediaTipoFilter(e.target.value as '' | AdminMediaTipo)}
              >
                <option value="">Todos los tipos</option>
                <option value="audio">Audio (Pronunciación)</option>
                <option value="imagen">Ilustración / Imagen</option>
                <option value="video">Video Cultural</option>
              </AdminSelect>
            </div>
          </AdminSurface>

          {isMediaLoading && (
            <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
              <output className="block">Cargando medios pendientes de ratificación...</output>
            </AdminSurface>
          )}

          {isMediaError && (
            <div
              role="alert"
              className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
            >
              Error al cargar medios por ratificar:{' '}
              {mediaError instanceof Error ? mediaError.message : 'Error desconocido'}
            </div>
          )}

          {!isMediaLoading && !isMediaError && pendingMediaData && (
            <AdminSurface className="overflow-hidden">
              {pendingMediaData.items.length === 0 ? (
                <div className="p-10 text-center text-sm text-[var(--admin-text-secondary)]">
                  No hay medios culturales pendientes de ratificación con los filtros aplicados.
                </div>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {pendingMediaData.items.map((item) => {
                    const streamUrl = item.streamUrl ?? `/api/media/${item.uuid}/stream`;
                    const vinc = formatMediaVinculacionSummary(item);
                    const propositoLabel = getPropositoLabel(item.proposito);

                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[var(--admin-surface-muted)]/40 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="shrink-0">
                            {item.tipo === 'audio' ? (
                              <AudioPlayButton
                                trackId={`rev-media-${item.uuid}`}
                                audioUrl={streamUrl}
                                lema={item.originalName ?? item.filename}
                              />
                            ) : item.tipo === 'imagen' ? (
                              <button
                                type="button"
                                onClick={() => openMediaLightbox(item)}
                                aria-label={`Previsualizar ${item.originalName ?? item.filename}`}
                                className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--admin-border)] hover:border-[#0055AA] transition-colors cursor-pointer"
                              >
                                <LazyImage
                                  src={streamUrl}
                                  alt={item.descripcionEspanol ?? item.filename}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={() => openMediaLightbox(item)}
                              >
                                Ver video
                              </AdminButton>
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[var(--admin-text)] truncate max-w-xs sm:max-w-md">
                                {item.originalName ?? item.filename}
                              </span>
                              <span className="text-xs font-medium text-[var(--admin-text-secondary)]">
                                {propositoLabel}
                              </span>
                            </div>

                            <div className="text-xs text-[var(--admin-text-secondary)] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span>
                                Vinculación:{' '}
                                {item.sentido ? (
                                  <Link
                                    to={`/admin/sentidos/${item.sentido.id}/editar`}
                                    className="font-semibold text-[#0055AA] hover:underline"
                                  >
                                    {vinc.primary}
                                  </Link>
                                ) : (
                                  <strong className="text-[var(--admin-text)]">
                                    {vinc.primary}
                                  </strong>
                                )}
                              </span>
                              {item.hablanteAutor && (
                                <span>· Autor/Hablante: {item.hablanteAutor}</span>
                              )}
                              {item.varianteDialectal && (
                                <span>· Variante: {item.varianteDialectal}</span>
                              )}
                            </div>

                            {item.descripcionEspanol && (
                              <p className="text-xs text-[var(--admin-text-muted)] line-clamp-2">
                                {item.descripcionEspanol}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                          <a
                            href={`${streamUrl}?download=1`}
                            download={item.originalName ?? item.filename}
                            className="inline-flex items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:border-[#0055AA] transition-colors"
                          >
                            Descargar
                          </a>
                          {canRatify && (
                            <AdminButton
                              variant="primary"
                              size="md"
                              onClick={() => handleRatifyMedia(item)}
                              disabled={ratifyMediaMutation.isPending}
                            >
                              Ratificar medio
                            </AdminButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminSurface>
          )}
        </div>
      )}

      <CulturalMediaLightbox
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />

      {/* Diálogo individual de ratificación con checklist */}
      <ChecklistRatificacion
        isOpen={Boolean(ratifyTarget)}
        sentidoCodigo={ratifyTarget?.codigo}
        onConfirm={handleConfirmRatify}
        onCancel={() => setRatifyTarget(null)}
        isLoading={ratificarMutation.isPending}
      />

      {/* Diálogo por lote de ratificación con checklist */}
      <ChecklistRatificacion
        isOpen={isLoteRatifyOpen}
        isLote
        microcampoCodigo={loteCodigo}
        onConfirm={handleConfirmLoteRatify}
        onCancel={() => setIsLoteRatifyOpen(false)}
        isLoading={ratificarLoteMutation.isPending}
      />

      {/* Diálogo accesible de reversión con motivo obligatorio >= 10 chars (R-013) */}
      <AdminDialog
        isOpen={Boolean(revertTarget)}
        onClose={() => setRevertTarget(null)}
        title={revertTarget ? `Revertir sentido (${revertTarget.codigo})` : 'Revertir sentido'}
        titleId="revert-dialog-title"
        maxWidthClass="max-w-md"
        footer={
          <>
            <AdminButton variant="secondary" size="lg" onClick={() => setRevertTarget(null)}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="accent"
              size="lg"
              disabled={revertMotivo.trim().length < 10 || revertirMutation.isPending}
              onClick={handleConfirmRevert}
            >
              {revertirMutation.isPending ? 'Revirtiendo...' : 'Confirmar reversión'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--admin-text-secondary)]">
            Indique el motivo técnico o cultural por el cual se devuelve el sentido para corrección.
          </p>

          {revertError && (
            <div
              role="alert"
              className="p-3 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 text-xs font-medium rounded-xl"
            >
              {revertError}
            </div>
          )}

          <div>
            <AdminFieldLabel htmlFor="revert-motivo-input">
              Motivo obligatorio (mínimo 10 caracteres)
            </AdminFieldLabel>
            <AdminTextarea
              id="revert-motivo-input"
              rows={3}
              required
              minLength={10}
              value={revertMotivo}
              onChange={(e) => {
                setRevertMotivo(e.target.value);
                if (e.target.value.trim().length >= 10) setRevertError(null);
              }}
              placeholder="Explicación detallada de la reversión..."
            />
            <div className="text-xs text-[var(--admin-text-muted)] mt-1.5">
              Caracteres: {revertMotivo.trim().length} / 10 mínimo
            </div>
          </div>
        </div>
      </AdminDialog>
    </div>
  );
}
