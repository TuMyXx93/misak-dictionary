/**
 * LoginPage
 * Spec 006 (R-001, R-028, T-042)
 * Portal de acceso administrativo coherente con la identidad Misak (4 colores oficiales
 * + Escudo del Resguardo de Guambia), login dual (correo o nombre de usuario),
 * retorno directo al diccionario público y cambio obligatorio de contraseña con semáforo.
 *
 * Nota de arquitectura: Esta vista NO expone conmutador Light/Dark; la gestión de modo
 * claro y oscuro vive exclusivamente dentro del espacio autenticado `/admin/*`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MisakBandStripe,
  MisakBrandEmblem,
  MisakSelvedgeDivider,
} from '@/components/ui/MisakBandStripe';
import { AdminApiError, adminChangePassword, adminLogin } from '@/services/adminHttp';
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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cuenta regresiva para bloqueo o rate-limit
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // Estado para el flujo de cambio obligatorio de contraseña
  const [mustChangePassword, setMustChangePassword] = useState(Boolean(user?.mustChangePassword));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePasswords, setShowChangePasswords] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  const newPassStrength = useMemo(() => evaluateNewPasswordStrength(newPassword), [newPassword]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdownSeconds !== null && countdownSeconds > 0) return;
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await adminLogin(identifier.trim(), password);
      if (res.user.mustChangePassword) {
        setMustChangePassword(true);
        setCurrentPassword(password);
      } else {
        const destination =
          fromPath && fromPath !== '/admin/login' ? fromPath : firstAllowedRoute(res.user);
        navigate(destination, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        if (err.code === 'AUTH_ACCOUNT_LOCKED') {
          const waitSecs = err.retryAfterSeconds ?? 900;
          setCountdownSeconds(waitSecs);
          setLoginError(err.message);
          return;
        }

        if (err.code === 'RATE_LIMITED' || err.statusCode === 429) {
          const waitSecs = err.retryAfterSeconds ?? 60;
          setCountdownSeconds(waitSecs);
          setLoginError(
            'Demasiados intentos en poco tiempo. Por seguridad, espere antes de reintentar.',
          );
          return;
        }

        if (err.code === 'AUTH_ACCOUNT_SUSPENDED' || err.statusCode === 403) {
          setLoginError(
            'Esta cuenta se encuentra inactiva o suspendida. Comuníquese con el administrador.',
          );
          return;
        }

        if (err.code === 'SERVICE_UNAVAILABLE' || err.statusCode === 503) {
          setLoginError(
            'El servicio de autenticación está temporalmente no disponible. Intente más tarde.',
          );
          return;
        }

        if (err.statusCode === 0) {
          setLoginError('No se pudo conectar con el servidor. Verifique su conexión de red.');
          return;
        }

        setLoginError(err.message || 'Credenciales inválidas. Por favor verifique sus datos.');
      } else {
        setLoginError('Credenciales inválidas. Por favor verifique sus datos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);

    if (newPassword.length < 8) {
      setChangeError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await adminChangePassword(currentPassword, newPassword);
      setChangeSuccess('¡Contraseña actualizada exitosamente! Redirigiendo al panel...');
      const updatedUser = useAuthStore.getState().user;
      const nextDestination =
        fromPath && fromPath !== '/admin/login' && fromPath !== '/admin/cambiar-password'
          ? fromPath
          : updatedUser
            ? firstAllowedRoute({ ...updatedUser, mustChangePassword: false })
            : '/admin/sentidos';
      navigate(nextDestination, { replace: true, state: { passwordChanged: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cambiar la contraseña.';
      setChangeError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="misak-public-scope relative min-h-dvh bg-[#000000] text-white flex flex-col overflow-hidden">
      {/* Cinta superior cuatricolor Misak */}
      <MisakBandStripe className="h-1.5" />

      {/* Atmósfera cromática sutil con Azul Piurek (#0055AA) y Magenta Misak (#E52D6D) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 -left-24 w-96 h-96 rounded-full bg-[#0055AA]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-24 w-96 h-96 rounded-full bg-[#E52D6D]/20 blur-3xl"
      />

      {/* Barra superior de retorno al diccionario público */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white/85 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA]"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-[#0055AA]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver al Diccionario</span>
        </Link>

        <span className="hidden sm:inline-flex items-center gap-2 text-xs text-white/60 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
          Acceso Institucional Misak
        </span>
      </header>

      {/* Contenedor central */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Emblema y título institucional */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/15 shadow-lg mb-3">
              <MisakBrandEmblem
                emblem="escudo"
                alt="Escudo oficial del Resguardo Indígena de Guambia"
                size={64}
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
              Diccionario Namtrik
            </h1>
            <p className="mt-1.5 text-sm text-white/75">
              Panel de Administración y Gobierno Editorial
            </p>
          </div>

          {/* Tarjeta del formulario */}
          <div className="bg-[#0B0E17]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/15 overflow-hidden">
            <MisakBandStripe className="h-1" />

            <div className="p-6 sm:p-8">
              {mustChangePassword ? (
                <div>
                  <h2 className="text-xl font-display font-bold text-white mb-1.5">
                    Cambio de contraseña obligatorio
                  </h2>
                  <p className="text-sm text-white/70 mb-6 leading-relaxed">
                    Por seguridad editorial, actualice su contraseña inicial antes de ingresar al
                    panel administrativo.
                  </p>

                  {changeError && (
                    <div
                      role="alert"
                      className="mb-5 p-3.5 bg-red-500/15 border border-red-400/40 text-red-200 text-sm rounded-xl"
                    >
                      {changeError}
                    </div>
                  )}

                  {changeSuccess && (
                    <output
                      aria-live="polite"
                      className="block mb-5 p-3.5 bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-sm rounded-xl"
                    >
                      {changeSuccess}
                    </output>
                  )}

                  <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="current-password"
                        className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5"
                      >
                        Contraseña actual
                      </label>
                      <input
                        id="current-password"
                        type={showChangePasswords ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="block w-full min-h-[46px] px-3.5 py-2.5 bg-[#05070C] border border-white/25 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] text-base"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="new-password"
                          className="block text-xs font-bold uppercase tracking-wider text-white/80"
                        >
                          Nueva contraseña (mínimo 8 caracteres)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowChangePasswords((prev) => !prev)}
                          aria-label={
                            showChangePasswords ? 'Ocultar claves nuevas' : 'Mostrar claves nuevas'
                          }
                          className="text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                        >
                          {showChangePasswords ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        id="new-password"
                        type={showChangePasswords ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="block w-full min-h-[46px] px-3.5 py-2.5 bg-[#05070C] border border-white/25 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] text-base"
                      />

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
                              className={
                                newPassStrength.hasUpper ? 'text-emerald-300' : 'text-white/45'
                              }
                            >
                              ✓ Mayúscula
                            </span>
                            <span
                              className={
                                newPassStrength.hasLower ? 'text-emerald-300' : 'text-white/45'
                              }
                            >
                              ✓ Minúscula
                            </span>
                            <span
                              className={
                                newPassStrength.hasNumber ? 'text-emerald-300' : 'text-white/45'
                              }
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
                        Confirmar nueva contraseña
                      </label>
                      <input
                        id="confirm-password"
                        type={showChangePasswords ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="block w-full min-h-[46px] px-3.5 py-2.5 bg-[#05070C] border border-white/25 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] text-base"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full min-h-[48px] flex justify-center items-center py-2.5 px-4 border border-[#0055AA] rounded-xl shadow-md text-sm font-bold text-white bg-[#0055AA] hover:bg-[#004488] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E17] focus-visible:ring-[#0055AA] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isChangingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-display font-bold text-white">Iniciar sesión</h2>
                    <p className="text-xs text-white/65 mt-1">
                      Ingrese con su correo electrónico o nombre de usuario asignado.
                    </p>
                  </div>

                  {loginError && (
                    <div
                      role="alert"
                      className="mb-5 p-3.5 bg-red-500/15 border border-red-400/40 text-red-200 text-sm rounded-xl space-y-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">⚠️</span>
                        <span>{loginError}</span>
                      </div>
                      {countdownSeconds !== null && countdownSeconds > 0 && (
                        <div className="text-xs font-mono font-semibold text-amber-300 pl-6">
                          Tiempo de espera restante: {Math.floor(countdownSeconds / 60)}m{' '}
                          {countdownSeconds % 60}s
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="identifier"
                        className="block text-xs font-bold uppercase tracking-wider text-white/85 mb-1.5"
                      >
                        Correo o nombre de usuario
                      </label>
                      <input
                        id="identifier"
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="block w-full min-h-[46px] px-3.5 py-2.5 bg-[#05070C] border border-white/25 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] text-base"
                        placeholder="usuario@misak.local o nombre.apellido"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="password"
                          className="block text-xs font-bold uppercase tracking-wider text-white/85"
                        >
                          Contraseña
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          aria-label={showLoginPassword ? 'Ocultar clave' : 'Mostrar clave'}
                          className="text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                        >
                          {showLoginPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        id="password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="block w-full min-h-[46px] px-3.5 py-2.5 bg-[#05070C] border border-white/25 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] text-base"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || (countdownSeconds !== null && countdownSeconds > 0)}
                      className="w-full min-h-[48px] flex justify-center items-center py-2.5 px-4 border border-[#0055AA] rounded-xl shadow-md text-sm font-bold text-white bg-[#0055AA] hover:bg-[#004488] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E17] focus-visible:ring-[#0055AA] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {countdownSeconds !== null && countdownSeconds > 0
                        ? `Espera ${countdownSeconds}s...`
                        : isSubmitting
                          ? 'Iniciando sesión...'
                          : 'Ingresar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-2 text-center">
            <MisakSelvedgeDivider className="max-w-48 mx-auto opacity-75" />
            <p className="text-xs text-white/55">
              Cabildo Indígena del Resguardo de Guambia • Uso administrativo exclusivo
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
