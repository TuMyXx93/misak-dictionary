/**
 * ChecklistRatificacion
 * Spec 006 (R-011, R-025, T-045)
 * Diálogo modal accesible con verificación editorial antes de ratificar un sentido o lote.
 */

import { useState } from 'react';

export interface ChecklistRatificacionProps {
  isOpen: boolean;
  sentidoCodigo?: string;
  isLote?: boolean;
  microcampoCodigo?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ChecklistRatificacion({
  isOpen,
  sentidoCodigo,
  isLote,
  microcampoCodigo,
  onConfirm,
  onCancel,
  isLoading,
}: ChecklistRatificacionProps) {
  const [checkOrtografia, setCheckOrtografia] = useState(false);
  const [checkGlosa, setCheckGlosa] = useState(false);
  const [checkConflicto, setCheckConflicto] = useState(false);

  if (!isOpen) return null;

  const allChecked = checkOrtografia && checkGlosa && checkConflicto;

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm();
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="ratify-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-300">
        <h2 id="ratify-dialog-title" className="text-lg font-bold text-slate-900 mb-2">
          {isLote
            ? `Ratificación Editorial por Lote (${microcampoCodigo ?? ''})`
            : `Ratificación Editorial de Sentido (${sentidoCodigo ?? ''})`}
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          La ratificación cambiará el estado a{' '}
          <span className="font-semibold text-emerald-700">ratificado</span> y publicará la entrada
          en el diccionario. Confirme la lista de verificación editorial:
        </p>

        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-md border border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="chk-ortografia"
              checked={checkOrtografia}
              onChange={(e) => setCheckOrtografia(e.target.checked)}
              className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
            />
            <span className="text-sm text-slate-800">
              He verificado la ortografía, fonética Namtrik y uso del caracter ɵ/Ɵ (R-022).
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="chk-glosa"
              checked={checkGlosa}
              onChange={(e) => setCheckGlosa(e.target.checked)}
              className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
            />
            <span className="text-sm text-slate-800">
              La glosa en castellano y significado cultural han sido validados con la comunidad.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="chk-conflicto"
              checked={checkConflicto}
              onChange={(e) => setCheckConflicto(e.target.checked)}
              className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
            />
            <span className="text-sm text-slate-800">
              No soy el último editor de estos contenidos (separación de funciones R-012).
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 min-h-[48px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!allChecked || isLoading}
            onClick={handleConfirm}
            className="px-4 py-2 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isLoading ? 'Ratificando...' : 'Confirmar ratificación'}
          </button>
        </div>
      </div>
    </div>
  );
}
