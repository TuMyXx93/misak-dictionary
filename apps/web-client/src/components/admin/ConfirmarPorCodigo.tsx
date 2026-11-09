/**
 * ConfirmarPorCodigo
 * Spec 006 (R-017, T-047)
 * Modal accesible de confirmación estricta para purga definitiva en papelera.
 * Exige tipear exactamente el código del elemento para habilitar la acción.
 */

import { useEffect, useState } from 'react';
import { AdminButton, AdminDialog, AdminInput } from '@/components/admin/ui';

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

  useEffect(() => {
    if (isOpen) {
      setTypedCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = typedCode.trim() === targetCodigo.trim();

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onCancel}
      title="Purga Definitiva (Irreversible)"
      titleId="purge-dialog-title"
      maxWidthClass="max-w-md"
      footer={
        <>
          <AdminButton variant="secondary" size="lg" onClick={onCancel}>
            Cancelar
          </AdminButton>
          <AdminButton
            variant="danger"
            size="lg"
            disabled={!isMatched || isLoading}
            onClick={onConfirm}
          >
            {isLoading ? 'Purgando...' : 'Confirmar purga permanente'}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-[var(--admin-text-secondary)] mb-4 leading-relaxed">
        Esta acción eliminará permanentemente el elemento de la base de datos sin posibilidad de
        recuperación.
      </p>

      <div>
        <label
          htmlFor="confirm-code-input"
          className="block text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1.5"
        >
          Escriba <span className="font-mono text-[#E52D6D]">{targetCodigo}</span> para confirmar:
        </label>
        <AdminInput
          id="confirm-code-input"
          type="text"
          value={typedCode}
          onChange={(e) => setTypedCode(e.target.value)}
          placeholder={targetCodigo}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
      </div>
    </AdminDialog>
  );
}
