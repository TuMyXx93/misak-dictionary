/**
 * RequireAuth
 * Spec 006 (R-001, R-028) — Guarda de autenticación para rutas administrativas.
 * Redirige a /admin/login si no hay sesión activa, o a /admin/cambiar-password si
 * mustChangePassword es true.
 */

import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { restoreSession } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

interface RequireAuthProps {
  children?: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const { isAuthenticated, user, clearSession } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(!isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      if (isAuthenticated) {
        setIsVerifying(false);
        return;
      }

      try {
        // Spec 008 (R-001): Restaura la sesión en F5 con refresh single-flight
        const restoredUser = await restoreSession();
        if (!isMounted) return;
        if (!restoredUser) {
          clearSession();
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
  }, [isAuthenticated, clearSession]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <output
            aria-label="Verificando sesión"
            className="block w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
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

  return children ?? null;
};
