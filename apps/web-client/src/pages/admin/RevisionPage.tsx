/**
 * RevisionPage
 * Spec 006 (R-011, R-013, R-014, R-025, T-045)
 * Cola de revisión de borradores con ratificación individual, reversión con motivo obligatorio
 * (>= 10 caracteres), checklist de validación y ratificación por lote de microcampo.
 */

import { useState } from 'react';
import { ChecklistRatificacion } from '@/components/admin/ChecklistRatificacion';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSurface,
  AdminTextarea,
} from '@/components/admin/ui';
import { AbbreviationBadge } from '@/components/ui/AbbreviationBadge';
import {
  type AdminSentidoItem,
  useAdminSentidos,
  useRatificarLote,
  useRatificarSentido,
  useRevertirSentido,
} from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

export function RevisionPage() {
  const { hasPermission } = useAuthStore();
  const canRatify = hasPermission('taxonomy:ratify');
  const canRevert = hasPermission('taxonomy:revert');

  // Estado de listado
  const [microcampoFilter, setMicrocampoFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError, error } = useAdminSentidos({
    estado: 'borrador',
    nodo: microcampoFilter || undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

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
      await ratificarMutation.mutateAsync({ id: ratifyTarget.id });
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
    if (!loteCodigo.trim()) return;
    try {
      const res = await ratificarLoteMutation.mutateAsync({
        microcampoCodigo: loteCodigo.trim(),
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

      {/* Filtros de búsqueda y microcampo */}
      <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
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
      </AdminSurface>

      {isLoading && (
        <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
          <div role="status">Cargando cola de revisión...</div>
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
            <div className="misak-table-region @container">
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
                          {canRatify && (
                            <AdminButton
                              variant="primary"
                              size="md"
                              onClick={() => handleOpenRatify(sentido)}
                            >
                              Ratificar
                            </AdminButton>
                          )}
                          {canRevert && (
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
            </div>
          )}
        </AdminSurface>
      )}

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
