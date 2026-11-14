/**
 * AdminMediaLinkExistingModal — Spec 014 (R-004)
 *
 * Modal para buscar y vincular recursos multimedia ya existentes en el repositorio
 * global (/admin/medios) directamente desde la edición de un sentido léxico,
 * evitando archivos binarios duplicados.
 */

import { useEffect, useState } from 'react';
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminSelect,
} from '@/components/admin/ui';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type AdminMediaItem,
  type AdminMediaTipo,
  useAdminMediaList,
  useUpdateAdminMediaMetadata,
} from '@/hooks/useAdmin';
import { formatMediaVinculacionSummary, getPropositoLabel } from './mediaCatalogHelpers';

export interface AdminMediaLinkExistingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentidoId: string;
  sentidoLema?: string;
  sentidoFormas?: Array<{
    id?: string;
    orden?: number;
    lema: string;
    variante?: string | null;
  }>;
  existingMediaIds?: string[];
  onSuccess?: (linked: AdminMediaItem) => void;
}

export const AdminMediaLinkExistingModal = ({
  isOpen,
  onClose,
  sentidoId,
  sentidoLema,
  sentidoFormas,
  existingMediaIds = [],
  onSuccess,
}: AdminMediaLinkExistingModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'' | AdminMediaTipo>('');
  const [targetFormaId, setTargetFormaId] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTipoFilter('');
      setTargetFormaId('');
      setLinkingId(null);
      setErrorLocal(null);
    }
  }, [isOpen]);

  const { data: listResult, isLoading } = useAdminMediaList(
    {
      query: searchQuery.trim() || undefined,
      tipo: tipoFilter || undefined,
      limit: 25,
      offset: 0,
    },
    { enabled: isOpen },
  );

  const updateMutation = useUpdateAdminMediaMetadata();
  const items = listResult?.items ?? [];
  const selectableFormas = (sentidoFormas ?? []).filter(
    (f): f is { id: string; lema: string; variante?: string | null } => Boolean(f.id),
  );

  const handleLink = async (item: AdminMediaItem) => {
    setErrorLocal(null);
    setLinkingId(item.id);
    try {
      const res = await updateMutation.mutateAsync({
        id: item.id,
        data: {
          sentidoId,
          formaId: targetFormaId || null,
        },
      });
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setErrorLocal(
        err instanceof Error ? err.message : 'No fue posible vincular el recurso seleccionado.',
      );
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular medio existente del repositorio"
      titleId="link-existing-media-title"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-[var(--admin-text-secondary)]">
          Asocia al sentido{' '}
          <strong className="text-[var(--admin-text)]">{sentidoLema || `#${sentidoId}`}</strong> un
          audio, imagen o video ya cargado en el catálogo multimedia sin duplicar archivos.
        </p>

        {errorLocal && (
          <div
            role="alert"
            className="p-3 text-sm rounded-xl bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 font-medium"
          >
            {errorLocal}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <AdminFieldLabel htmlFor="link-existing-search">Buscar en repositorio</AdminFieldLabel>
            <AdminInput
              id="link-existing-search"
              type="search"
              placeholder="Hablante, glosa, archivo o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <AdminFieldLabel htmlFor="link-existing-tipo">Filtrar por tipo</AdminFieldLabel>
            <AdminSelect
              id="link-existing-tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as '' | AdminMediaTipo)}
            >
              <option value="">Todos los tipos</option>
              <option value="audio">Audio</option>
              <option value="imagen">Imagen</option>
              <option value="video">Video</option>
            </AdminSelect>
          </div>
        </div>

        {selectableFormas.length > 0 && (
          <div>
            <AdminFieldLabel htmlFor="link-existing-forma">
              Asociar a forma específica (opcional)
            </AdminFieldLabel>
            <AdminSelect
              id="link-existing-forma"
              value={targetFormaId}
              onChange={(e) => setTargetFormaId(e.target.value)}
            >
              <option value="">Todo el sentido léxico</option>
              {selectableFormas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.lema}
                  {f.variante ? ` (${f.variante})` : ''}
                </option>
              ))}
            </AdminSelect>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--admin-border)] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-[var(--admin-text-muted)]">
              Cargando medios del repositorio...
            </p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--admin-text-muted)]">
              No se encontraron recursos disponibles con ese filtro.
            </p>
          ) : (
            items.map((item) => {
              const alreadyLinked =
                existingMediaIds.includes(item.id) || item.sentidoId === sentidoId;
              const vinculacion = formatMediaVinculacionSummary(item);

              return (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.tipo === 'audio' ? (
                      <AudioPlayButton
                        trackId={item.uuid}
                        audioUrl={`/api/media/${item.uuid}/stream`}
                        lema={item.originalName ?? item.filename}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] flex items-center justify-center shrink-0 text-[10px] font-bold uppercase text-[var(--admin-text-secondary)]">
                        {item.tipo}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--admin-text)] truncate">
                        {item.descripcionEspanol || item.originalName || item.filename}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <AdminBadge tone={item.estado === 'ratificado' ? 'success' : 'warning'}>
                          {item.estado}
                        </AdminBadge>
                        <span className="text-xs text-[var(--admin-text-secondary)]">
                          {getPropositoLabel(item.proposito)}
                        </span>
                        <span className="text-xs text-[var(--admin-text-muted)]">
                          · {vinculacion.primary}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AdminButton
                    type="button"
                    variant={alreadyLinked ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={alreadyLinked || linkingId === item.id || updateMutation.isPending}
                    onClick={() => handleLink(item)}
                  >
                    {alreadyLinked
                      ? 'Ya vinculado'
                      : linkingId === item.id
                        ? 'Vinculando...'
                        : 'Vincular aquí'}
                  </AdminButton>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <AdminButton type="button" variant="secondary" size="md" onClick={onClose}>
            Cerrar
          </AdminButton>
        </div>
      </div>
    </AdminDialog>
  );
};
