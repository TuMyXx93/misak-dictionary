/**
 * AdminLayout
 * Spec 006 (R-005, R-021, R-024) — Layout administrativo con:
 * - Meta tag noindex/nofollow (R-024)
 * - Skip link accesible para teclado (R-021)
 * - Menú de navegación condicionado a permisos (R-005)
 * - Botón de cierre de sesión hacia POST /auth/logout
 */

import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminHttp } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

interface AdminLayoutProps {
  children?: ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  to: string;
  permission?: string;
  role?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', permission: 'analytics:read' },
  { label: 'Léxico y Sentidos', to: '/admin/sentidos', permission: 'taxonomy:read' },
  { label: 'Medios Culturales', to: '/admin/medios', permission: 'media:read' },
  { label: 'Cola de Revisión', to: '/admin/revision', permission: 'taxonomy:ratify' },
  { label: 'Papelera', to: '/admin/papelera', permission: 'taxonomy:delete' },
  { label: 'Usuarios', to: '/admin/usuarios', permission: 'system:users:manage' },
  { label: 'Auditoría', to: '/admin/auditoria', permission: 'system:audit:read' },
  { label: 'Ajustes', to: '/admin/ajustes', role: 'super_admin' },
];

export const AdminLayout = ({ children, title = 'Panel Editorial Misak' }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user, hasPermission, hasRole, clearSession } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // R-024: Asegurar meta noindex en cabecera
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    let created = false;

    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
      created = true;
    }

    const previousContent = metaRobots.getAttribute('content');
    metaRobots.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (created) {
        metaRobots?.remove();
      } else if (previousContent) {
        metaRobots?.setAttribute('content', previousContent);
      } else {
        metaRobots?.removeAttribute('content');
      }
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await adminHttp('/auth/logout', { method: 'POST' });
    } catch (_err) {
      // Ignorar error de red y limpiar sesión localmente
    } finally {
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.role && !hasRole(item.role)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col">
      {/* R-021: Skip link accesible para usuarios de teclado */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-background-dark focus:font-bold focus:rounded-lg focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header superior */}
      <header className="border-b border-primary/20 bg-background-dark/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-lg font-display font-bold tracking-tight text-white hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span>Namtrik Admin</span>
            </Link>
            <span className="text-xs text-text-muted hidden sm:inline-block border-l border-primary/20 pl-3">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-white/90">{user.username}</span>
                <span className="text-[11px] text-primary/80 capitalize">
                  {user.roles.join(', ').replace(/_/g, ' ')}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors min-h-[38px] disabled:opacity-50"
              aria-label="Cerrar sesión"
            >
              {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>

        {/* Barra de navegación horizontal */}
        <nav
          aria-label="Navegación del panel de administración"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-white/5 py-1 text-xs font-medium"
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg whitespace-nowrap transition-colors min-h-[36px] flex items-center ${
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Contenido principal */}
      <main
        id="admin-main"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 outline-none"
      >
        {children ?? <Outlet />}
      </main>

      <footer className="border-t border-primary/10 py-4 text-center text-xs text-text-muted">
        <span>Diccionario Cultural Misak — Panel de Gobierno Editorial (Spec 006)</span>
      </footer>
    </div>
  );
};
