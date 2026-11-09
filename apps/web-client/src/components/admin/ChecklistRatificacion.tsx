/**
 * ChecklistRatificacion
 * Spec 006 (R-011, R-025, T-045)
 * Diálogo modal accesible con verificación editorial antes de ratificar un sentido o lote.
 */

import { useEffect, useState } from 'react';
import { AdminButton, AdminDialog } from '@/components/admin/ui';

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

  useEffect(() => {
    if (isOpen) {
      setCheckOrtografia(false);
      setCheckGlosa(false);
      setCheckConflicto(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allChecked = checkOrtografia && checkGlosa && checkConflicto;

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm();
    }
  };

  const dialogTitle = isLote
    ? `Ratificación Editorial por Lote (${microcampoCodigo ?? ''})`
    : `Ratificación Editorial de Sentido (${sentidoCodigo ?? ''})`;

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onCancel}
      title={dialogTitle}
      titleId="ratify-dialog-title"
      maxWidthClass="max-w-lg"
      footer={
        <>
          <AdminButton variant="secondary" size="lg" onClick={onCancel}>
            Cancelar
          </AdminButton>
          <AdminButton
            variant="primary"
            size="lg"
            disabled={!allChecked || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? 'Ratificando...' : 'Confirmar ratificación'}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-[var(--admin-text-secondary)] mb-4 leading-relaxed">
        La ratificación cambiará el estado a{' '}
        <span className="font-semibold text-[var(--admin-primary-text)]">ratificado</span> y
        publicará la entrada en el diccionario. Confirme la lista de verificación editorial:
      </p>

      <div className="space-y-3 bg-[var(--admin-surface-muted)] p-4 rounded-xl border border-[var(--admin-border)]">
        <label className="flex items-start gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--admin-surface)] transition-colors">
          <input
            type="checkbox"
            id="chk-ortografia"
            checked={checkOrtografia}
            onChange={(e) => setCheckOrtografia(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[#0055AA] rounded border-[var(--admin-control-border)] shrink-0"
          />
          <span className="text-sm text-[var(--admin-text)]">
            He verificado la ortografía, fonética Namtrik y uso del caracter ɵ/Ɵ (R-022).
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--admin-surface)] transition-colors">
          <input
            type="checkbox"
            id="chk-glosa"
            checked={checkGlosa}
            onChange={(e) => setCheckGlosa(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[#0055AA] rounded border-[var(--admin-control-border)] shrink-0"
          />
          <span className="text-sm text-[var(--admin-text)]">
            La glosa en castellano y significado cultural han sido validados con la comunidad.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--admin-surface)] transition-colors">
          <input
            type="checkbox"
            id="chk-conflicto"
            checked={checkConflicto}
            onChange={(e) => setCheckConflicto(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[#0055AA] rounded border-[var(--admin-control-border)] shrink-0"
          />
          <span className="text-sm text-[var(--admin-text)]">
            No soy el último editor de estos contenidos (separación de funciones R-012).
          </span>
        </label>
      </div>
    </AdminDialog>
  );
}
