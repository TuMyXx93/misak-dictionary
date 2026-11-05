/**
 * PublicHeader & MobileNavDrawer
 *
 * Navegación pública mobile-first (320px -> desktop) del Diccionario Misak.
 * - Incluye la cinta oficial de 4 franjas (#E52D6D, #0055AA, #FFFFFF, #000000) y el Escudo Misak.
 * - Header condicional inteligente: oculto en el Hero de la Home, visible en scroll y en /campos/*.
 * - Sincronización precisa de estado activo para Inicio, Campos Semánticos, Recorrido, Símbolos y Créditos.
 * - Drawer móvil con altura 100svh, bloqueo inert del contenido de fondo, Escape y light-dismiss.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Link, useInRouterContext, useLocation } from 'react-router-dom';
import { MisakBandStripe, MisakBrandEmblem } from '@/components/ui/MisakBandStripe';
import { MisakWordmark } from '@/components/ui/MisakWordmark';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { cn } from '@/utils/cn';

export interface PublicHeaderProps {
  /** ID del elemento contenedor principal para aplicar atributo inert al abrir el menú móvil */
  mainTargetId?: string;
  /** En el Home scrollytelling la barra puede flotar fija sobre el contenido */
  variant?: 'overlay' | 'sticky';
  /** Si es false, oculta suavemente el header hacia arriba */
  isVisible?: boolean;
  /** Sección activa actualmente (p. ej. 'inicio', 'recorrido', 'simbolos', 'creditos') */
  activeSection?: string;
}

const PRIMARY_CAMPOS_NAV = {
  label: 'Campos semánticos',
  shortLabel: 'Campos',
  to: '/campos',
  sectionId: 'campos',
} as const;

const PUBLIC_NAV_LINKS = [
  { label: 'Inicio', to: '/', sectionId: 'inicio' },
  PRIMARY_CAMPOS_NAV,
  { label: 'Recorrido', to: '/#recorrido', sectionId: 'recorrido' },
  { label: 'Símbolos', to: '/#simbolos', sectionId: 'simbolos' },
  { label: 'Créditos', to: '/#creditos', sectionId: 'creditos' },
] as const;

export const PublicHeader = ({
  mainTargetId = 'main-content',
  variant = 'sticky',
  isVisible = true,
  activeSection,
}: PublicHeaderProps) => {
  const inRouter = useInRouterContext();
  if (!inRouter) return null;

  return (
    <PublicHeaderInner
      mainTargetId={mainTargetId}
      variant={variant}
      isVisible={isVisible}
      activeSection={activeSection}
    />
  );
};

interface PublicHeaderInnerProps {
  mainTargetId: string;
  variant: 'overlay' | 'sticky';
  isVisible: boolean;
  activeSection?: string;
}

const PublicHeaderInner = ({
  mainTargetId,
  variant,
  isVisible,
  activeSection,
}: PublicHeaderInnerProps) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { openSearch } = useGlobalSearch();

  // Cerrar el drawer al cambiar de ruta o hash
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  // Aplicar inert al contenedor principal y manejar tecla Escape cuando el drawer móvil está abierto
  useEffect(() => {
    const mainEl = document.getElementById(mainTargetId);
    if (drawerOpen) {
      if (mainEl) {
        mainEl.inert = true;
      }
      sheetRef.current?.focus();
    } else if (mainEl) {
      mainEl.inert = false;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      if (mainEl) {
        mainEl.inert = false;
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, mainTargetId]);

  const isOverlay = variant === 'overlay';

  // Manejador suave de clics únicamente para secciones de ancla dentro de la misma página (Home)
  const handleLinkClick = (to: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    setDrawerOpen(false);
    const isHomeAnchor = to === '/' || to.startsWith('/#');
    if (location.pathname === '/' && isHomeAnchor) {
      const targetId = to.includes('#') ? to.split('#')[1] : 'inicio';
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', to);
      }
    }
  };

  // Resolución determinista de enlace activo
  const checkIsActive = (to: string, sectionId: string): boolean => {
    if (to === '/campos') {
      return location.pathname.startsWith('/campos');
    }
    if (location.pathname === '/') {
      const currentActive = activeSection || location.hash.replace('#', '') || 'inicio';
      return currentActive === sectionId;
    }
    return false;
  };

  return (
    <>
      <header
        className={cn(
          'w-full z-40 border-b border-[#0055AA]/35 backdrop-blur-md transition-all duration-300',
          isOverlay ? 'fixed top-0 inset-x-0 bg-black/75' : 'sticky top-0 bg-black/88',
          !isVisible && !drawerOpen && 'opacity-0 -translate-y-full pointer-events-none',
        )}
      >
        {/* Cinta superior en el orden canónico de la bandera Misak */}
        <MisakBandStripe className="h-[3px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Marca Wamtɵrmarɵpik + Escudo Misak */}
          <Link
            to="/"
            onClick={handleLinkClick('/')}
            className="inline-flex items-center gap-2.5 min-w-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] rounded-xl p-1"
          >
            <MisakBrandEmblem
              emblem="escudo"
              alt="Escudo del Pueblo Misak"
              size={34}
              className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col min-w-0 text-left">
              <MisakWordmark
                variant="header"
                className="truncate group-hover:text-[#E52D6D] transition-colors"
              />
              <span className="text-[10px] sm:text-[11px] text-secondary-light font-medium tracking-wider truncate">
                Namtrik · Castellano
              </span>
            </div>
          </Link>

          {/* Navegación Desktop con indicador activo coherente */}
          <nav
            aria-label="Navegación principal del diccionario"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {PUBLIC_NAV_LINKS.map((item) => {
              const isActive = checkIsActive(item.to, item.sectionId);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick(item.to)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all min-h-[40px] inline-flex items-center',
                    isActive
                      ? 'bg-[#0055AA]/30 text-white border border-[#0055AA]/70 shadow-xs font-semibold'
                      : 'text-text-muted hover:text-white hover:bg-white/8',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Acciones Derecha (Desktop + Móvil) */}
          <div className="flex items-center gap-2">
            {/* Buscador global minimalista (Desktop y Tablet) */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar en el diccionario (Ctrl+K)"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] cursor-pointer"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-secondary-light"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <span className="hidden lg:inline text-xs">Buscar…</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-black/40 text-gray-400 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* Lupa minimalista móvil */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar en el diccionario"
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-secondary-light hover:text-white transition-colors cursor-pointer"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
            </button>

            <Link
              to={PRIMARY_CAMPOS_NAV.to}
              onClick={handleLinkClick(PRIMARY_CAMPOS_NAV.to)}
              aria-current={
                checkIsActive(PRIMARY_CAMPOS_NAV.to, PRIMARY_CAMPOS_NAV.sectionId)
                  ? 'page'
                  : undefined
              }
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold bg-[#0055AA] text-white border border-[#0055AA] shadow-xs"
            >
              <span>{PRIMARY_CAMPOS_NAV.shortLabel}</span>
            </Link>

            {/* Botón Hamburguesa Móvil (44x44px mínimo) */}
            <button
              ref={triggerRef}
              type="button"
              aria-label={drawerOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D]"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {drawerOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (100svh + light-dismiss + inert) */}
      {drawerOpen && (
        <div id={drawerId} className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú lateral"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-default"
          />

          {/* Sheet con 100svh para evitar saltos por barra de direcciones móvil */}
          <nav
            ref={sheetRef}
            tabIndex={-1}
            aria-label="Menú móvil del diccionario"
            className="relative z-10 w-[min(20rem,84dvw)] h-svh bg-[#05070b] border-l border-[#0055AA]/45 text-white flex flex-col justify-between overflow-y-auto shadow-2xl outline-none"
          >
            <div>
              <MisakBandStripe className="h-1.5" />
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MisakBrandEmblem emblem="escudo" alt="Escudo Misak" size={36} />
                  <div className="min-w-0">
                    <MisakWordmark variant="drawer" className="truncate" />
                    <p className="text-[11px] text-secondary-light truncate">
                      Resguardo de Guambia
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Cerrar menú"
                  className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <ul className="p-3 space-y-1.5">
                {PUBLIC_NAV_LINKS.map((item) => {
                  const isActive = checkIsActive(item.to, item.sectionId);

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={handleLinkClick(item.to)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-[#0055AA]/30 text-white border border-[#0055AA]'
                            : 'text-text-muted hover:text-white hover:bg-white/8',
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="text-[#E52D6D]" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/50">
              <p className="text-[11px] text-center text-text-disabled">
                Propiedad Intelectual Colectiva del Pueblo Misak
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
