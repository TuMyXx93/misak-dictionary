/**
 * ConflictoVersionDialog
 * Spec 006 (R-007, R-010, T-044)
 * Diálogo accesible de resolución de conflictos de concurrencia optimista (HTTP 409).
 */

export interface ConflictoVersionDialogProps {
  isOpen: boolean;
  serverVersion?: number;
  serverData?: {
    lema?: string;
    glosa?: string;
    updatedAt?: string;
  };
  onReloadServer: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export function ConflictoVersionDialog({
  isOpen,
  serverVersion,
  serverData,
  onReloadServer,
  onOverwrite,
  onCancel,
}: ConflictoVersionDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="conflict-dialog-title"
      aria-describedby="conflict-dialog-desc"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-300">
        <div className="flex items-center gap-3 text-amber-600 mb-3">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 id="conflict-dialog-title" className="text-lg font-bold text-slate-900">
            Conflicto de Edición Concurrente (Versión {serverVersion ?? 'actualizada'})
          </h2>
        </div>

        <p id="conflict-dialog-desc" className="text-sm text-slate-700 leading-relaxed">
          Otro usuario editorial ha modificado y guardado este sentido mientras realizabas tus
          cambios. Para evitar pérdida accidental de datos, elige cómo deseas proceder:
        </p>

        {serverData && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
            <div className="font-semibold text-slate-800">Datos guardados en el servidor:</div>
            {serverData.lema && (
              <div>
                <span className="font-medium text-slate-600">Lema:</span>{' '}
                <span lang="gum">{serverData.lema}</span>
              </div>
            )}
            {serverData.glosa && (
              <div>
                <span className="font-medium text-slate-600">Glosa:</span> {serverData.glosa}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 min-h-[48px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar y revisar
          </button>
          <button
            type="button"
            onClick={onReloadServer}
            className="w-full sm:w-auto px-4 py-2 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-sm font-medium"
          >
            Cargar datos del servidor
          </button>
          <button
            type="button"
            onClick={onOverwrite}
            className="w-full sm:w-auto px-4 py-2 min-h-[48px] bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium"
          >
            Sobrescribir con mis cambios
          </button>
        </div>
      </div>
    </div>
  );
}
