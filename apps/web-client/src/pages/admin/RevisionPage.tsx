/**
 * RevisionPage
 * Spec 006 (R-011, R-013, R-014, R-025, T-045)
 * Cola de revisión de borradores con ratificación individual, reversión con motivo obligatorio
 * (>= 10 caracteres), checklist de validación y ratificación por lote de microcampo.
 */

import { useState } from 'react';
import { ChecklistRatificacion } from '@/components/admin/ChecklistRatificacion';
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
  const { data, isLoading, isError, error } = useAdminSentidos({
    estado: 'borrador',
    nodo: microcampoFilter || undefined,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cola Editorial de Revisión
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sentidos en borrador pendientes de verificación y ratificación comunitaria (R-011,
            R-014).
          </p>
        </div>

        {canRatify && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Código microcampo (ej: C1.S1.M5)"
              value={loteCodigo}
              onChange={(e) => setLoteCodigo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm w-48 font-mono"
            />
            <button
              type="button"
              disabled={!loteCodigo.trim() || ratificarLoteMutation.isPending}
              onClick={() => setIsLoteRatifyOpen(true)}
              className="px-4 py-2 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              Ratificar lote
            </button>
          </div>
        )}
      </div>

      {feedbackMessage && (
        <div
          role="alert"
          className={`p-4 rounded-md text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Filtro por microcampo */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-sm">
        <label
          htmlFor="filter-revision-nodo"
          className="block text-xs font-semibold text-slate-700 uppercase mb-1"
        >
          Filtrar por nodo microcampo
        </label>
        <input
          id="filter-revision-nodo"
          type="text"
          value={microcampoFilter}
          onChange={(e) => setMicrocampoFilter(e.target.value)}
          placeholder="Ej: C1.S1.M2"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {isLoading && (
        <div className="text-center py-12 text-slate-500" role="status">
          Cargando cola de revisión...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          Error al cargar borradores: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No hay sentidos en borrador pendientes de revisión.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Código
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Lema (Namtrik)
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
                      Versión
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Acciones Editoriales
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.items.map((sentido) => (
                    <tr key={sentido.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-600">
                        {sentido.codigo}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900"
                        lang="gum"
                      >
                        {sentido.lema}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-sm truncate">
                        {sentido.glosa}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                        v{sentido.version}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {canRatify && (
                          <button
                            type="button"
                            onClick={() => handleOpenRatify(sentido)}
                            className="text-emerald-700 hover:text-emerald-900 inline-block px-3 py-1.5 min-h-[44px] font-semibold"
                          >
                            Ratificar
                          </button>
                        )}
                        {canRevert && (
                          <button
                            type="button"
                            onClick={() => handleOpenRevert(sentido)}
                            className="text-amber-700 hover:text-amber-900 inline-block px-3 py-1.5 min-h-[44px]"
                          >
                            Revertir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
      {revertTarget && (
        <div
          role="dialog"
          aria-labelledby="revert-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-300">
            <h2 id="revert-dialog-title" className="text-lg font-bold text-slate-900 mb-2">
              Revertir sentido ({revertTarget.codigo})
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Indique el motivo técnico o cultural por el cual se devuelve el sentido para
              corrección.
            </p>

            {revertError && (
              <div role="alert" className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-md">
                {revertError}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="revert-motivo-input"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Motivo obligatorio (mínimo 10 caracteres)
              </label>
              <textarea
                id="revert-motivo-input"
                rows={3}
                required
                minLength={10}
                value={revertMotivo}
                onChange={(e) => {
                  setRevertMotivo(e.target.value);
                  if (e.target.value.trim().length >= 10) setRevertError(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                placeholder="Explicación detallada de la reversión..."
              />
              <div className="text-xs text-slate-500 mt-1">
                Caracteres: {revertMotivo.trim().length} / 10 mínimo
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevertTarget(null)}
                className="px-4 py-2 min-h-[48px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={revertMotivo.trim().length < 10 || revertirMutation.isPending}
                onClick={handleConfirmRevert}
                className="px-4 py-2 min-h-[48px] bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {revertirMutation.isPending ? 'Revirtiendo...' : 'Confirmar reversión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
