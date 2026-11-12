/**
 * AdminLayout
 * Spec 006 (R-005, R-021, R-024) — Shell administrativo Misak Mobile-First:
 * - Único espacio de la aplicación con gestión de Modo Claro y Modo Oscuro (AdminThemeProvider)
 * - Paleta oficial Misak (#E52D6D, #0055AA, #FFFFFF, #000000) y Escudo de Guambia
 * - Sidebar fijo en escritorio + Drawer móvil accesible (100svh, Escape, inert)
 * - Meta tag noindex/nofollow (R-024) y Skip link accesible (R-021)
 * - Menú de navegación condicionado a permisos RBAC (R-005)
 */

import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminThemeQuickToggle } from '@/components/admin/ui';
import { MisakBandStripe, MisakBrandEmblem } from '@/components/ui/MisakBandStripe';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import { getRoleVisualDef } from '@/pages/admin/usuarios/roleCatalog';
import { adminHttp } from '@/services/adminHttp';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

export interface AdminLayoutProps {
  children?: ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  to: string;
  permission?: string;
  role?: string;
  iconPath: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    iconPath: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  },
  {
    label: 'Léxico y Sentidos',
    to: '/admin/sentidos',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    label: 'Taxonomía y Campos',
    to: '/admin/taxonomia',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    iconPath:
      'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    label: 'Medios Culturales',
    to: '/admin/medios',
    permission: PERMISSIONS.MEDIOS_LEER,
    iconPath:
      'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  {
    label: 'Cola de Revisión',
    to: '/admin/revision',
    permission: PERMISSIONS.TAXONOMIA_RATIFICAR,
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Papelera',
    to: '/admin/papelera',
    permission: PERMISSIONS.DICCIONARIO_BORRAR,
    iconPath:
      'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
  {
    label: 'Usuarios',
    to: '/admin/usuarios',
    permission: PERMISSIONS.USUARIOS_GESTIONAR,
    iconPath:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Auditoría',
    to: '/admin/auditoria',
    permission: PERMISSIONS.AUDITORIA_LEER,
    iconPath:
      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    label: 'Ajustes',
    to: '/admin/ajustes',
    permission: PERMISSIONS.AJUSTES_GESTIONAR,
    iconPath:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

const AdminLayoutShell = ({ children, title = 'Panel Editorial Misak' }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, resolvedTheme } = useAdminTheme();
  const { user, hasPermission, hasRole, clearSession } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPasswordChangedBanner, setShowPasswordChangedBanner] = useState(false);

  useEffect(() => {
    const state = location.state as { passwordChanged?: boolean } | null;
    if (state?.passwordChanged) {
      setShowPasswordChangedBanner(true);
    }
  }, [location.state]);

  // Cerrar el cajón móvil automáticamente al cambiar de ruta
  // biome-ignore lint/correctness/useExhaustiveDependencies: cerrar drawer al cambiar pathname
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Cerrar cajón móvil con Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

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
      await adminHttp('/auth/logout', {
        method: 'POST',
        headers: { 'X-Client': 'web-admin' },
      });
    } catch {
      // Ignorar error de red y limpiar sesión localmente
    } finally {
      navigate('/admin/login', { replace: true, state: null });
      clearSession();
    }
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.role && !hasRole(item.role)) return false;
    return true;
  });

  const renderNavLinks = (onSelect?: () => void) =>
    visibleNavItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/admin'}
        onClick={onSelect}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]',
            isActive
              ? 'bg-[#0055AA] text-white font-semibold shadow-xs'
              : 'text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface-muted)]',
          )
        }
      >
        {({ isActive }) => (
          <>
            <svg
              aria-hidden="true"
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-[var(--admin-text-muted)] group-hover:text-[#0055AA]',
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
            </svg>
            <span className="truncate">{item.label}</span>
            {isActive && (
              <span
                aria-hidden="true"
                className="ml-auto w-2 h-2 rounded-full bg-[#E52D6D] ring-2 ring-white/80 shrink-0"
              />
            )}
          </>
        )}
      </NavLink>
    ));

  return (
    <div
      data-admin-theme={mode}
      data-admin-resolved={resolvedTheme}
      className="misak-admin-scope min-h-dvh bg-[var(--admin-bg)] text-[var(--admin-text)] flex flex-col"
    >
      {/* R-021: Skip link accesible para usuarios de teclado */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0055AA] focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header superior pegajoso */}
      <header className="sticky top-0 z-40 border-b border-[var(--admin-border)] bg-[var(--admin-header-bg)] backdrop-blur-md">
        <MisakBandStripe className="h-1" />

        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label="Abrir menú administrativo"
              aria-expanded={drawerOpen}
              className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[var(--admin-control-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-muted)] transition-colors cursor-pointer"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link
              to="/admin"
              className="flex items-center gap-2.5 min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA] rounded-xl p-1"
            >
              <MisakBrandEmblem emblem="escudo" alt="Escudo Misak" size={36} className="w-9 h-9" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base font-display font-bold tracking-tight text-[var(--admin-text)] group-hover:text-[var(--admin-primary-text)] transition-colors truncate">
                  Namtrik Admin
                </span>
                <span className="text-[11px] text-[var(--admin-text-secondary)] hidden sm:block truncate">
                  {title}
                </span>
              </div>
            </Link>
          </div>

          {/* Controles derechos: Portal Público + Switch Exclusivo Light/Dark + Usuario + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-primary-text)] transition-colors"
            >
              <span>Ver Diccionario</span>
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>

            {/* Único conmutador rápido de Modo Claro / Oscuro en toda la aplicación */}
            <AdminThemeQuickToggle />

            {user && (
              <div className="hidden sm:flex flex-col text-right border-l border-[var(--admin-border)] pl-3">
                <span className="text-xs font-bold text-[var(--admin-text)] truncate max-w-[140px]">
                  {user.username ?? user.email}
                </span>
                <span className="text-[11px] text-[var(--admin-accent-text)] font-medium truncate max-w-[160px]">
                  {user.roles.map((r) => getRoleVisualDef(r).name).join(', ')}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text)] border border-[var(--admin-control-border)] transition-colors min-h-[40px] disabled:opacity-50 cursor-pointer"
              aria-label="Cerrar sesión"
            >
              {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </header>

      {/* Cajón móvil condicional (evita nodos duplicados cuando está cerrado) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />
          <aside
            aria-label="Menú móvil de administración"
            className="relative z-10 w-72 max-w-[85vw] h-svh bg-[var(--admin-sidebar-bg)] border-r border-[var(--admin-border)] shadow-2xl flex flex-col overflow-y-auto"
          >
            <MisakBandStripe className="h-1.5" />
            <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <MisakBrandEmblem emblem="escudo" alt="Escudo Misak" size={34} />
                <div className="min-w-0">
                  <div className="text-sm font-display font-bold text-[var(--admin-text)] truncate">
                    Gobierno Editorial
                  </div>
                  {user && (
                    <div className="text-xs text-[var(--admin-text-secondary)] truncate">
                      @{user.username ?? user.email}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar cajón administrativo"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-muted)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <nav aria-label="Secciones administrativas móviles" className="p-3 space-y-1 flex-1">
              {renderNavLinks(() => setDrawerOpen(false))}
            </nav>

            <div className="p-4 border-t border-[var(--admin-border)] space-y-2">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--admin-control-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-primary-text)]"
              >
                Ir al Diccionario Público
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Cuerpo principal con Sidebar lateral fijo en escritorio */}
      <div inert={drawerOpen || undefined} className="flex-1 max-w-[1440px] w-full mx-auto flex">
        <aside className="hidden lg:flex lg:w-64 shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-sidebar-bg)] flex-col justify-between">
          <nav
            aria-label="Navegación del panel de administración"
            className="p-4 space-y-1 sticky top-17"
          >
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Módulos Editoriales
            </div>
            {renderNavLinks()}
          </nav>

          <div className="p-4 border-t border-[var(--admin-border)] text-[11px] text-[var(--admin-text-muted)] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--admin-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
              <span className="w-2 h-2 rounded-full bg-[#0055AA]" aria-hidden="true" />
              <span>Resguardo de Guambia</span>
            </div>
            <p>Gobierno Editorial Namtrik</p>
          </div>
        </aside>

        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 outline-none"
        >
          {showPasswordChangedBanner && (
            <output
              aria-live="polite"
              className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
            >
              <span className="font-medium">
                ✓ Contraseña actualizada exitosamente. Tu sesión está activa y protegida.
              </span>
              <button
                type="button"
                onClick={() => setShowPasswordChangedBanner(false)}
                aria-label="Cerrar notificación de contraseña"
                className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
              >
                Cerrar
              </button>
            </output>
          )}
          {children ?? <Outlet />}
        </main>
      </div>

      <footer className="border-t border-[var(--admin-border)] bg-[var(--admin-surface)] py-4 px-4 text-center text-xs text-[var(--admin-text-secondary)]">
        <span>Diccionario Misak — Panel administrativo</span>
      </footer>
    </div>
  );
};

export const AdminLayout = (props: AdminLayoutProps) => (
  <AdminThemeProvider>
    <AdminLayoutShell {...props} />
  </AdminThemeProvider>
);
