/**
 * PublicHeader & MobileNavDrawer
 *
 * Navegación pública mobile-first (320px -> desktop) del Diccionario Cultural Misak.
 * - Incluye la cinta oficial de 4 franjas (#E52D6D, #0055AA, #FFFFFF, #000000) y el Escudo Misak.
 * - Drawer móvil con altura 100svh, bloqueo inert del contenido de fondo, Escape y light-dismiss.
 * - Sin selector Light/Dark (exclusivo del Panel Administrativo /admin/*).
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Link, useInRouterContext, useLocation } from 'react-router-dom';
import { MisakBandStripe, MisakBrandEmblem } from '@/components/ui/MisakBandStripe';
import { cn } from '@/utils/cn';

export interface PublicHeaderProps {
  /** ID del elemento contenedor principal para aplicar atributo inert al abrir el menú móvil */
  mainTargetId?: string;
  /** En el Home scrollytelling la barra puede flotar fija sobre el Hero */
  variant?: 'overlay' | 'sticky';
}

const PUBLIC_NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Campos Semánticos', to: '/campos' },
  { label: 'Recorrido', to: '/#recorrido' },
  { label: 'Símbolos', to: '/#simbolos' },
  { label: 'Créditos', to: '/#creditos' },
] as const;

export const PublicHeader = ({
  mainTargetId = 'main-content',
  variant = 'sticky',
}: PublicHeaderProps) => {
  const inRouter = useInRouterContext();
  if (!inRouter) return null;

  return <PublicHeaderInner mainTargetId={mainTargetId} variant={variant} />;
};

const PublicHeaderInner = ({ mainTargetId, variant }: Required<PublicHeaderProps>) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  return (
    <>
      <header
        className={cn(
          'w-full z-40 border-b border-[#0055AA]/35 backdrop-blur-md transition-colors',
          isOverlay ? 'fixed top-0 inset-x-0 bg-black/70' : 'sticky top-0 bg-black/88',
        )}
      >
        {/* Cinta superior en el orden canónico de la bandera Misak */}
        <MisakBandStripe className="h-[3px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Marca WAMTƟRMARƟPIK + Escudo Misak */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 min-w-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] rounded-xl p-1"
          >
            <MisakBrandEmblem
              emblem="escudo"
              alt="Escudo del Pueblo Misak"
              size={34}
              className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-display font-bold text-sm sm:text-base tracking-wide text-white truncate group-hover:text-[#E52D6D] transition-colors">
                WAMTƟRMARƟPIK
              </span>
              <span className="text-[10px] sm:text-[11px] text-secondary-light font-medium tracking-wider uppercase truncate">
                Namtrik · Castellano
              </span>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav
            aria-label="Navegación principal del diccionario"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {PUBLIC_NAV_LINKS.map((item) => {
              const isActive =
                item.to === '/campos'
                  ? location.pathname.startsWith('/campos')
                  : item.to === '/' && location.pathname === '/' && !location.hash;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors min-h-[40px] inline-flex items-center',
                    isActive
                      ? 'bg-[#0055AA]/30 text-white border border-[#0055AA]/70'
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
            <Link
              to="/campos"
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold bg-[#0055AA] text-white border border-[#0055AA] shadow-xs"
            >
              <span>Campos</span>
            </Link>

            <Link
              to="/admin/login"
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-[#0055AA] hover:bg-[#004488] text-white border border-white/15 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D]"
            >
              <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
              <span>Acceso Editorial</span>
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
                    <p className="font-display font-bold text-sm text-white truncate">
                      WAMTƟRMARƟPIK
                    </p>
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
                  const isActive =
                    item.to === '/campos'
                      ? location.pathname.startsWith('/campos')
                      : item.to === '/' && location.pathname === '/' && !location.hash;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
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

            <div className="p-4 border-t border-white/10 space-y-3 bg-black/50">
              <Link
                to="/admin/login"
                onClick={() => setDrawerOpen(false)}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0055AA] hover:bg-[#004488] text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
                <span>Acceso Editorial</span>
              </Link>
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
