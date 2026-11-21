/**
 * SuspendUserDialog.tsx
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-004)
 * Modal de confirmación para suspender o reactivar cuentas de usuario,
 * con captura de motivo opcional y advertencia clara de revocación de sesiones.
 */

import { useState } from 'react';
import { AdminButton, AdminDialog, AdminFieldLabel, AdminInput } from '@/components/admin/ui';
import type { AdminUserItem } from '@/hooks/useAdmin';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { USER_COPY } from './userCopy';

interface SuspendUserDialogProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  isSuspending: boolean;
  onClose: () => void;
  onConfirm: (motivo?: string) => Promise<void>;
}

export const SuspendUserDialog = ({
  user,
  isOpen,
  isSuspending,
  onClose,
  onConfirm,
}: SuspendUserDialogProps) => {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const isCurrentActive = user.isActive;
  // Si actualmente está activo, la acción es suspender; si está inactivo, la acción es reactivar.
  const isDeactivating = isCurrentActive;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm(motivo.trim() || undefined);
      setMotivo('');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        getErrorMessage(err, 'No fue posible cambiar el estado de la cuenta de usuario.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? USER_COPY.dialogs.suspensionTitle : 'Reactivar cuenta de usuario'}
      subtitle={
        isDeactivating
          ? `Estás a punto de suspender la cuenta de ${user.fullName} (@${user.username}).`
          : `Se reactivará el acceso al sistema para ${user.fullName} (@${user.username}).`
      }
    >
      <div className="space-y-4 pt-2">
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-red-500/15 border border-red-500/30 text-red-200 text-xs rounded-xl"
          >
            {errorMessage}
          </div>
        )}

        {isDeactivating ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span> Advertencia de acceso:
            </p>
            <p>{USER_COPY.dialogs.suspensionWarning}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed">
            El usuario podrá volver a ingresar normalmente a la plataforma con sus credenciales
            habituales.
          </p>
        )}

        {isDeactivating && (
          <div>
            <AdminFieldLabel htmlFor="suspension-motivo">
              {USER_COPY.dialogs.suspensionReasonLabel}
            </AdminFieldLabel>
            <AdminInput
              id="suspension-motivo"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={USER_COPY.dialogs.suspensionReasonPlaceholder}
              maxLength={255}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting || isSuspending}
          >
            {USER_COPY.dialogs.btnCancelar}
          </AdminButton>
          <AdminButton
            variant={isDeactivating ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isSubmitting || isSuspending}
          >
            {isDeactivating
              ? USER_COPY.dialogs.btnConfirmarSuspension
              : USER_COPY.dialogs.btnActivarCuenta}
          </AdminButton>
        </div>
      </div>
    </AdminDialog>
  );
};
