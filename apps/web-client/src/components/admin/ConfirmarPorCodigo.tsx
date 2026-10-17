/**
 * ConfirmarPorCodigo
 * Spec 006 (R-017, T-047)
 * Modal accesible de confirmación estricta para purga definitiva en papelera.
 * Exige tipear exactamente el código del elemento para habilitar la acción.
 */

import { useState } from 'react';

export interface ConfirmarPorCodigoProps {
  isOpen: boolean;
  targetCodigo: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmarPorCodigo({
  isOpen,
  targetCodigo,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmarPorCodigoProps) {
  const [typedCode, setTypedCode] = useState('');

  if (!isOpen) return null;

  const isMatched = typedCode.trim() === targetCodigo.trim();

  return (
    <div
      role="dialog"
      aria-labelledby="purge-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-red-300">
        <div className="flex items-center gap-3 text-red-600 mb-2">
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <h2 id="purge-dialog-title" className="text-lg font-bold text-slate-900">
            Purga Definitiva (Irreversible)
          </h2>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Esta acción eliminará permanentemente el elemento de la base de datos sin posibilidad de
          recuperación.
        </p>

        <div className="mb-4">
          <label
            htmlFor="confirm-code-input"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Escriba <span className="font-mono text-red-700">{targetCodigo}</span> para confirmar:
          </label>
          <input
            id="confirm-code-input"
            type="text"
            value={typedCode}
            onChange={(e) => setTypedCode(e.target.value)}
            placeholder={targetCodigo}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-red-500 focus:border-red-500"
          />
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
            disabled={!isMatched || isLoading}
            onClick={onConfirm}
            className="px-4 py-2 min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Purgando...' : 'Confirmar purga permanente'}
          </button>
        </div>
      </div>
    </div>
  );
}
