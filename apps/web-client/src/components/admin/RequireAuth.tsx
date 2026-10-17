/**
 * RequireAuth
 * Spec 006 (R-001, R-028) — Guarda de autenticación para rutas administrativas.
 * Redirige a /admin/login si no hay sesión activa, o a /admin/cambiar-password si
 * mustChangePassword es true.
 */

import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminHttp } from '@/services/adminHttp';
import { type AdminUser, useAuthStore } from '@/stores/authStore';

interface RequireAuthProps {
  children?: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const { isAuthenticated, user, setSession, clearSession } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(!isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      if (isAuthenticated) {
        setIsVerifying(false);
        return;
      }

      try {
        // Intenta obtener datos de sesión si existe cookie httpOnly de refresh
        const data = await adminHttp<{
          accessToken?: string;
          user: AdminUser;
        }>('/auth/me');

        if (isMounted && data.user) {
          // Si /auth/me devolvió el usuario pero no token nuevo, usar el del store o vacío
          setSession(data.user, data.accessToken ?? useAuthStore.getState().accessToken ?? '');
        }
      } catch (_err) {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setSession, clearSession]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div
            role="status"
            aria-label="Verificando sesión"
            className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          />
          <span className="text-sm text-text-muted">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // R-028: Cambio de contraseña obligatorio en primer acceso
  if (user.mustChangePassword && location.pathname !== '/admin/cambiar-password') {
    return <Navigate to="/admin/cambiar-password" replace />;
  }

  return children ? <>{children}</> : null;
};
