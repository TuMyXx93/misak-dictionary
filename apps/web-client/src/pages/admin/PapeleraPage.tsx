/**
 * PapeleraPage
 * Spec 006 (R-016, R-017, T-047)
 * Listado de elementos en papelera, restauración con confirmación y manejo de 409,
 * y purga definitiva protegida por rol super_admin, retención mínima de 30 días y ConfirmarPorCodigo.
 */

import { useState } from 'react';
import { ConfirmarPorCodigo } from '@/components/admin/ConfirmarPorCodigo';
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSurface,
} from '@/components/admin/ui';
import {
  type PapeleraItem,
  usePapelera,
  usePurgarPapelera,
  useRestaurarPapelera,
} from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';

export function PapeleraPage() {
  const { hasRole, hasPermission } = useAuthStore();
  const isSuperAdmin = hasRole('super_admin');
  const canDelete = hasPermission(PERMISSIONS.DICCIONARIO_BORRAR);

  const { data, isLoading, isError, error } = usePapelera();
  const restaurarMutation = useRestaurarPapelera();
  const purgarMutation = usePurgarPapelera();

  // Estados de diálogo de restauración
  const [restoreTarget, setRestoreTarget] = useState<PapeleraItem | null>(null);
  // Estados de diálogo de purga
  const [purgeTarget, setPurgeTarget] = useState<PapeleraItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeSearch = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[ɵø∅ɨ]/g, 'o')
      .trim();

  const filteredItems = (data?.items ?? []).filter((item) => {
    const q = normalizeSearch(searchQuery);
    if (!q) return true;
    const haystack = normalizeSearch(
      `${item.codigo ?? ''} ${item.lema ?? ''} ${item.glosa ?? ''} ${item.tipo ?? ''}`,
    );
    return haystack.includes(q);
  });

  // Feedback en UI
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const getDiasEliminado = (deletedAt: string) => {
    const diffMs = Date.now() - new Date(deletedAt).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setFeedback(null);

    try {
      await restaurarMutation.mutateAsync({ id: restoreTarget.id });
      setFeedback({
        type: 'success',
        text: `Elemento ${restoreTarget.codigo} restaurado correctamente.`,
      });
      setRestoreTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al restaurar elemento (posible colisión de código).';
      setFeedback({ type: 'error', text: msg });
      setRestoreTarget(null);
    }
  };

  const handleConfirmPurge = async () => {
    if (!purgeTarget) return;
    setFeedback(null);

    try {
      await purgarMutation.mutateAsync({ id: purgeTarget.id });
      setFeedback({
        type: 'success',
        text: `Elemento ${purgeTarget.codigo} purgado permanentemente.`,
      });
      setPurgeTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al purgar elemento.';
      setFeedback({ type: 'error', text: msg });
      setPurgeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Resguardo y Retención"
        title="Papelera del Sistema"
        description="Elementos eliminados lógicamente disponibles para restauración o purga permanente (R-016, R-017)."
      />

      <AdminSurface className="p-4 sm:p-5 max-w-md">
        <AdminFieldLabel htmlFor="filter-papelera-search">
          Buscar en papelera (código, lema o glosa)
        </AdminFieldLabel>
        <AdminInput
          id="filter-papelera-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ej: C1.S1, malɵ, corazon..."
        />
      </AdminSurface>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/35'
              : 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-600/35'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading && (
        <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
          <div role="status">Cargando papelera...</div>
        </AdminSurface>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
        >
          Error al cargar elementos: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <AdminSurface className="overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
              {data.items.length === 0
                ? 'La papelera está vacía.'
                : 'No se encontraron elementos en papelera para la búsqueda actual.'}
            </div>
          ) : (
            <div className="misak-table-region @container">
              <table className="misak-responsive-table text-left text-sm text-[var(--admin-text)]">
                <thead className="bg-[var(--admin-surface-muted)] text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Tipo / Código
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Lema
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Glosa
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Fecha Eliminación
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Antigüedad
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {filteredItems.map((item) => {
                    const dias = getDiasEliminado(item.deletedAt);
                    const canPurgeItem = isSuperAdmin && dias >= 30;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                      >
                        <td data-label="Tipo / Código" className="px-4 py-3.5 whitespace-nowrap">
                          <div>
                            <span className="font-mono text-xs text-[var(--admin-text)] font-bold">
                              {item.codigo}
                            </span>
                            <span className="block text-xs text-[var(--admin-text-muted)] capitalize">
                              {item.tipo}
                            </span>
                          </div>
                        </td>
                        <td
                          data-label="Lema"
                          className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-[var(--admin-text)]"
                          lang="gum"
                        >
                          {item.lema}
                        </td>
                        <td
                          data-label="Glosa"
                          className="px-4 py-3.5 text-sm text-[var(--admin-text-secondary)] max-w-xs truncate"
                        >
                          {item.glosa}
                        </td>
                        <td
                          data-label="Fecha Eliminación"
                          className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--admin-text-secondary)]"
                        >
                          {new Date(item.deletedAt).toLocaleDateString()}
                        </td>
                        <td data-label="Antigüedad" className="px-4 py-3.5 whitespace-nowrap">
                          <AdminBadge tone={dias >= 30 ? 'danger' : 'neutral'}>
                            {dias} días
                          </AdminBadge>
                        </td>
                        <td
                          data-label="Acciones"
                          className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium"
                        >
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            {canDelete && (
                              <AdminButton
                                variant="secondary"
                                size="md"
                                onClick={() => setRestoreTarget(item)}
                              >
                                Restaurar
                              </AdminButton>
                            )}
                            {isSuperAdmin && (
                              <AdminButton
                                variant="danger"
                                size="md"
                                disabled={!canPurgeItem}
                                onClick={() => setPurgeTarget(item)}
                                title={
                                  dias < 30
                                    ? 'Requiere retención mínima de 30 días'
                                    : 'Purgar definitivamente'
                                }
                              >
                                Purgar
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
          )}
        </AdminSurface>
      )}

      {/* Modal de confirmación de restauración */}
      <AdminDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        title={
          restoreTarget ? `¿Restaurar elemento (${restoreTarget.codigo})?` : '¿Restaurar elemento?'
        }
        titleId="restore-dialog-title"
        maxWidthClass="max-w-md"
        footer={
          <>
            <AdminButton variant="secondary" size="lg" onClick={() => setRestoreTarget(null)}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="primary"
              size="lg"
              disabled={restaurarMutation.isPending}
              onClick={handleConfirmRestore}
            >
              {restaurarMutation.isPending ? 'Restaurando...' : 'Confirmar restauración'}
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-[var(--admin-text-secondary)]">
          El elemento volverá a la taxonomía activa. Si otro elemento activo ya utiliza su código,
          se notificará un conflicto (R-016).
        </p>
      </AdminDialog>

      {/* Modal estricto de purga ConfirmarPorCodigo (R-017) */}
      <ConfirmarPorCodigo
        isOpen={Boolean(purgeTarget)}
        targetCodigo={purgeTarget?.codigo ?? ''}
        onConfirm={handleConfirmPurge}
        onCancel={() => setPurgeTarget(null)}
        isLoading={purgarMutation.isPending}
      />
    </div>
  );
}
