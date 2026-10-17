/**
 * LoginPage
 * Spec 006 (R-001, R-028, T-042)
 * Formulario de inicio de sesión administrativo con mensaje genérico de error
 * y flujo de cambio obligatorio de contraseña (mustChangePassword).
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminChangePassword, adminLogin } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el flujo de cambio obligatorio de contraseña
  const [mustChangePassword, setMustChangePassword] = useState(Boolean(user?.mustChangePassword));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const destination =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/admin/sentidos';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await adminLogin(email.trim(), password);
      if (res.user.mustChangePassword) {
        setMustChangePassword(true);
        setCurrentPassword(password);
      } else {
        navigate(destination, { replace: true });
      }
    } catch {
      // R-001: Mensaje genérico sin revelar si el correo existe o la clave es incorrecta
      setLoginError('Credenciales inválidas. Por favor verifique sus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 10) {
      setChangeError('La nueva contraseña debe tener al menos 10 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await adminChangePassword(currentPassword, newPassword);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cambiar la contraseña.';
      setChangeError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Diccionario Namtrik
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Panel de Administración y Gobierno Editorial
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {mustChangePassword ? (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Cambio de contraseña obligatorio
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Por motivos de seguridad, debe actualizar su contraseña antes de continuar al panel.
              </p>

              {changeError && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md"
                >
                  {changeError}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Contraseña actual
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Nueva contraseña (mínimo 10 caracteres)
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={10}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full min-h-[48px] flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Iniciar sesión</h2>

              {loginError && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md"
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Correo institucional
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base"
                    placeholder="usuario@namtrik.org"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Ingresar'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
