/**
 * CambiarPasswordPage
 * Spec 008 (R-005, R-007) — Pantalla de cambio de contraseña obligatorio o voluntario.
 * Unificada visualmente con el diseño institucional Misak de LoginPage (Escudo de Guambia,
 * cinta cuatricolor, semáforo de fortaleza Débil/Media/Fuerte y controles SVG sin emojis de mico).
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MisakBandStripe,
  MisakBrandEmblem,
  MisakSelvedgeDivider,
} from '@/components/ui/MisakBandStripe';
import { adminChangePassword } from '@/services/adminHttp';
import { firstAllowedRoute, useAuthStore } from '@/stores/authStore';

function evaluateNewPasswordStrength(pass: string) {
  const hasMinLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  const checks = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial];
  const metCount = checks.filter(Boolean).length;

  if (!hasMinLength || metCount <= 2) {
    return {
      label: 'Débil' as const,
      barColor: 'bg-red-500',
      textColor: 'text-red-400',
      percent: pass.length === 0 ? 0 : 33,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  if (metCount <= 4) {
    return {
      label: 'Media' as const,
      barColor: 'bg-amber-400',
      textColor: 'text-amber-300',
      percent: 68,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  return {
    label: 'Fuerte' as const,
    barColor: 'bg-emerald-400',
    textColor: 'text-emerald-300',
    percent: 100,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

export const CambiarPasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const newPassStrength = useMemo(() => evaluateNewPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Por favor ingresa tu contraseña actual o temporal.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifica los datos.');
      return;
    }

    setIsLoading(true);
    try {
      await adminChangePassword(currentPassword, newPassword);
      setSuccessMessage('¡Contraseña actualizada exitosamente! Redirigiendo al panel...');
      // Navegar a la primera ruta permitida según los permisos actualizados del usuario
      const currentUser = useAuthStore.getState().user;
      const targetRoute = firstAllowedRoute(
        currentUser ? { ...currentUser, mustChangePassword: false } : null,
      );
      navigate(targetRoute, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'No fue posible cambiar la contraseña. Verifica tu contraseña actual.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="misak-public-scope relative min-h-screen bg-[#000000] text-white flex flex-col justify-center items-center px-4 py-8 overflow-hidden">
      <div className="mx-auto w-full max-w-md relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/15 shadow-lg mb-3">
            <MisakBrandEmblem
              emblem="escudo"
              alt="Escudo oficial del Resguardo Indígena de Guambia"
              size={56}
            />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Actualizar Contraseña</h1>
          <p className="text-sm text-white/75 mt-1.5">
            {user?.mustChangePassword
              ? 'Por seguridad institucional, debes cambiar tu contraseña temporal antes de continuar.'
              : 'Ingresa tu contraseña actual y define tu nueva contraseña segura.'}
          </p>
        </div>

        <div className="bg-[#0B0E17]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/15 overflow-hidden">
          <MisakBandStripe className="h-1" />

          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm flex items-start gap-2.5"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <output
                aria-live="polite"
                className="block mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-sm"
              >
                ✓ {successMessage}
              </output>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                >
                  Contraseña actual *
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full min-h-[46px] bg-[#05070C] border border-white/25 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] pr-20"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label={showCurrent ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                  >
                    {showCurrent ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                >
                  Nueva contraseña * (Mín. 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-[46px] bg-[#05070C] border border-white/25 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] pr-20"
                    placeholder="Nueva contraseña segura"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    aria-label={showNew ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                  >
                    {showNew ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">Nivel de seguridad:</span>
                      <span className={`font-bold ${newPassStrength.textColor}`}>
                        {newPassStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${newPassStrength.barColor}`}
                        style={{ width: `${newPassStrength.percent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] pt-0.5">
                      <span
                        className={
                          newPassStrength.hasMinLength ? 'text-emerald-300' : 'text-white/45'
                        }
                      >
                        ✓ 8+ car.
                      </span>
                      <span
                        className={newPassStrength.hasUpper ? 'text-emerald-300' : 'text-white/45'}
                      >
                        ✓ Mayúscula
                      </span>
                      <span
                        className={newPassStrength.hasLower ? 'text-emerald-300' : 'text-white/45'}
                      >
                        ✓ Minúscula
                      </span>
                      <span
                        className={newPassStrength.hasNumber ? 'text-emerald-300' : 'text-white/45'}
                      >
                        ✓ Número
                      </span>
                      <span
                        className={
                          newPassStrength.hasSpecial ? 'text-emerald-300' : 'text-white/45'
                        }
                      >
                        ✓ Símbolo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                >
                  Confirmar nueva contraseña *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-[46px] bg-[#05070C] border border-white/25 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] pr-20"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirm ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] mt-2 py-2.5 px-4 border border-[#0055AA] rounded-xl font-bold text-sm bg-[#0055AA] hover:bg-[#004488] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  'Actualizar contraseña y acceder'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-center">
          <MisakSelvedgeDivider className="max-w-48 mx-auto opacity-75" />
          <p className="text-xs text-white/55">
            Cabildo Indígena del Resguardo de Guambia • Uso administrativo exclusivo
          </p>
        </div>
      </div>
    </div>
  );
};
