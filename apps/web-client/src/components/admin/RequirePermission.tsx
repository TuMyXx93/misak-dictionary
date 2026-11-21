/**
 * RequirePermission
 * Spec 006 (R-004) — Bloquea el renderizado de componentes y peticiones de datos si
 * el usuario carece del permiso o rol requerido, mostrando mensaje accesible «Sin permiso».
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RequirePermissionProps {
  permission?: string;
  anyOfPermissions?: readonly string[];
  role?: string;
  children: ReactNode;
}

export const RequirePermission = ({
  permission,
  anyOfPermissions,
  role,
  children,
}: RequirePermissionProps) => {
  const { user, hasPermission, hasRole } = useAuthStore();

  const hasRequiredPermission = anyOfPermissions?.length
    ? anyOfPermissions.some((p) => hasPermission(p))
    : !permission || hasPermission(permission);

  const authorized = hasRequiredPermission && (!role || hasRole(role));

  if (!authorized) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="p-8 max-w-lg mx-auto text-center bg-background-dark/50 border border-primary/20 rounded-2xl my-8 flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <svg
            aria-hidden="true"
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-white">
          Sin permiso para acceder a esta sección
        </h2>
        <p className="text-sm text-text-muted">
          Tu cuenta ({user?.username ?? 'invitado'}) no cuenta con los privilegios necesarios
          {permission ? ` (${permission})` : role ? ` (rol: ${role})` : ''} para gestionar este
          recurso.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-background-dark hover:bg-primary-light transition-colors min-h-[44px]"
        >
          Volver al panel principal
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
