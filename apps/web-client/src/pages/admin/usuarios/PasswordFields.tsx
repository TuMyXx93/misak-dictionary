/**
 * PasswordFields.tsx
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-006)
 * Campos de contraseña con icono de visualización (mostrar/ocultar),
 * botón de copiado al portapapeles y generación automática segura.
 */

import { useState } from 'react';
import { AdminFieldLabel, AdminInput } from '@/components/admin/ui';
import { USER_COPY } from './userCopy';

interface PasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onGenerateAutoPassword: () => void;
}

export const PasswordFields = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onGenerateAutoPassword,
}: PasswordFieldsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="pt-2 border-t border-slate-700/60 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
          {USER_COPY.fields.seccionPassword}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowPassword(true);
              onGenerateAutoPassword();
            }}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors cursor-pointer"
          >
            {USER_COPY.fields.btnGenerarPassword}
          </button>
          {password && (
            <button
              type="button"
              onClick={handleCopy}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {copied ? '✓ Copiada' : USER_COPY.fields.btnCopiarPassword}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contraseña inicial */}
        <div>
          <AdminFieldLabel htmlFor="field-password">
            {USER_COPY.fields.passwordInicial}
          </AdminFieldLabel>
          <div className="relative">
            <AdminInput
              id="field-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={USER_COPY.fields.passwordPlaceholder}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <AdminFieldLabel htmlFor="field-confirm-password">
            {USER_COPY.fields.confirmarPassword}
          </AdminFieldLabel>
          <div className="relative">
            <AdminInput
              id="field-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder={USER_COPY.fields.passwordPlaceholder}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
