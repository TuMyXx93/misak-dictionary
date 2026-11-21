/**
 * ResetPasswordPanel.tsx
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-005)
 * Modal para restablecimiento de contraseña temporal:
 * genera clave segura, muestra en visualización única, copia al portapapeles
 * y notifica que se forzará cambio en el primer inicio de sesión.
 */

import { useState } from 'react';
import { AdminButton, AdminDialog } from '@/components/admin/ui';
import type { AdminUserItem } from '@/hooks/useAdmin';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { USER_COPY } from './userCopy';

interface ResetPasswordPanelProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: (userId: string) => Promise<{ temporaryPassword: string }>;
}

export const ResetPasswordPanel = ({
  user,
  isOpen,
  onClose,
  onResetPassword,
}: ResetPasswordPanelProps) => {
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await onResetPassword(user.id);
      setTemporaryPassword(result.temporaryPassword);
    } catch (err: unknown) {
      setErrorMessage(
        getErrorMessage(err, 'No fue posible restablecer la contraseña del usuario.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleClose = () => {
    setTemporaryPassword(null);
    setCopied(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={
        temporaryPassword
          ? USER_COPY.dialogs.temporalGeneradaTitle
          : USER_COPY.dialogs.resetPasswordTitle
      }
      subtitle={`Usuario: ${user.fullName} (@${user.username})`}
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

        {!temporaryPassword ? (
          <>
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>ℹ️</span> Procedimiento de seguridad:
              </p>
              <p>{USER_COPY.dialogs.resetPasswordWarning}</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <AdminButton variant="secondary" onClick={handleClose} disabled={isLoading}>
                {USER_COPY.dialogs.btnCancelar}
              </AdminButton>
              <AdminButton variant="primary" onClick={handleGenerate} disabled={isLoading}>
                {USER_COPY.dialogs.btnGenerarTemporal}
              </AdminButton>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed">
              {USER_COPY.dialogs.temporalInstruccion}
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-between gap-3 shadow-inner">
              <span className="font-mono text-base font-bold text-emerald-400 tracking-wider select-all break-all">
                {temporaryPassword}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-200 hover:text-white border-slate-700'
                }`}
              >
                {copied ? '✓ Copiada' : '📋 Copiar'}
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <AdminButton variant="primary" onClick={handleClose}>
                {USER_COPY.dialogs.btnCerrar}
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </AdminDialog>
  );
};
