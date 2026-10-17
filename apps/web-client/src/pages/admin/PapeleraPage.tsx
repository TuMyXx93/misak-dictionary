/**
 * PapeleraPage
 * Spec 006 (R-016, R-017, T-047)
 * Listado de elementos en papelera, restauración con confirmación y manejo de 409,
 * y purga definitiva protegida por rol super_admin, retención mínima de 30 días y ConfirmarPorCodigo.
 */

import { useState } from 'react';
import { ConfirmarPorCodigo } from '@/components/admin/ConfirmarPorCodigo';
import {
  type PapeleraItem,
  usePapelera,
  usePurgarPapelera,
  useRestaurarPapelera,
} from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

export function PapeleraPage() {
  const { hasRole, hasPermission } = useAuthStore();
  const isSuperAdmin = hasRole('super_admin');
  const canDelete = hasPermission('taxonomy:delete');

  const { data, isLoading, isError, error } = usePapelera();
  const restaurarMutation = useRestaurarPapelera();
  const purgarMutation = usePurgarPapelera();

  // Estados de diálogo de restauración
  const [restoreTarget, setRestoreTarget] = useState<PapeleraItem | null>(null);
  // Estados de diálogo de purga
  const [purgeTarget, setPurgeTarget] = useState<PapeleraItem | null>(null);

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
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Papelera del Sistema</h1>
        <p className="text-sm text-slate-600 mt-1">
          Elementos eliminados lógicamente disponibles para restauración o purga permanente (R-016,
          R-017).
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-md text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 text-slate-500" role="status">
          Cargando papelera...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          Error al cargar elementos: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">La papelera está vacía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Tipo / Código
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Lema
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Glosa
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Fecha Eliminación
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Antigüedad
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.items.map((item) => {
                    const dias = getDiasEliminado(item.deletedAt);
                    const canPurgeItem = isSuperAdmin && dias >= 30;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="font-mono text-slate-600 font-semibold">
                            {item.codigo}
                          </span>
                          <span className="block text-xs text-slate-400 capitalize">
                            {item.tipo}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900"
                          lang="gum"
                        >
                          {item.lema}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                          {item.glosa}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(item.deletedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${
                              dias >= 30 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {dias} días
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setRestoreTarget(item)}
                              className="text-sky-700 hover:text-sky-900 inline-block px-2 py-1 min-h-[44px]"
                            >
                              Restaurar
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              disabled={!canPurgeItem}
                              onClick={() => setPurgeTarget(item)}
                              title={
                                dias < 30
                                  ? 'Requiere retención mínima de 30 días'
                                  : 'Purgar definitivamente'
                              }
                              className="text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed inline-block px-2 py-1 min-h-[44px]"
                            >
                              Purgar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de restauración */}
      {restoreTarget && (
        <div
          role="dialog"
          aria-labelledby="restore-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-300">
            <h2 id="restore-dialog-title" className="text-lg font-bold text-slate-900 mb-2">
              ¿Restaurar elemento ({restoreTarget.codigo})?
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              El elemento volverá a la taxonomía activa. Si otro elemento activo ya utiliza su
              código, se notificará un conflicto (R-016).
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 min-h-[48px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={restaurarMutation.isPending}
                onClick={handleConfirmRestore}
                className="px-4 py-2 min-h-[48px] bg-sky-700 hover:bg-sky-800 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {restaurarMutation.isPending ? 'Restaurando...' : 'Confirmar restauración'}
              </button>
            </div>
          </div>
        </div>
      )}

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
