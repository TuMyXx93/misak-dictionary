/**
 * ConflictoVersionDialog
 * Spec 006 (R-007, R-010, T-044)
 * Diálogo accesible de resolución de conflictos de concurrencia optimista (HTTP 409).
 */

import { AdminButton, AdminDialog } from '@/components/admin/ui';

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
    <AdminDialog
      isOpen={isOpen}
      onClose={onCancel}
      title={`Conflicto de Edición Concurrente (Versión ${serverVersion ?? 'actualizada'})`}
      titleId="conflict-dialog-title"
      describedById="conflict-dialog-desc"
      maxWidthClass="max-w-lg"
      footer={
        <>
          <AdminButton variant="secondary" size="lg" onClick={onCancel}>
            Cancelar y revisar
          </AdminButton>
          <AdminButton variant="primary" size="lg" onClick={onReloadServer}>
            Cargar datos del servidor
          </AdminButton>
          <AdminButton variant="accent" size="lg" onClick={onOverwrite}>
            Sobrescribir con mis cambios
          </AdminButton>
        </>
      }
    >
      <p
        id="conflict-dialog-desc"
        className="text-sm text-[var(--admin-text-secondary)] leading-relaxed"
      >
        Otro usuario editorial ha modificado y guardado este sentido mientras realizabas tus
        cambios. Para evitar pérdida accidental de datos, elige cómo deseas proceder:
      </p>

      {serverData && (
        <div className="mt-4 p-3.5 bg-[var(--admin-surface-muted)] border border-[var(--admin-border)] rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-[var(--admin-text)] uppercase tracking-wider">
            Datos guardados en el servidor:
          </div>
          {serverData.lema && (
            <div>
              <span className="font-semibold text-[var(--admin-text-secondary)]">Lema:</span>{' '}
              <span lang="gum" className="font-semibold text-[var(--admin-text)]">
                {serverData.lema}
              </span>
            </div>
          )}
          {serverData.glosa && (
            <div>
              <span className="font-semibold text-[var(--admin-text-secondary)]">Glosa:</span>{' '}
              <span className="text-[var(--admin-text)]">{serverData.glosa}</span>
            </div>
          )}
        </div>
      )}
    </AdminDialog>
  );
}
