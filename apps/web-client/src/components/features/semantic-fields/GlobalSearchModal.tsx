/**
 * GlobalSearchModal
 * Spec 012 (R-010) — Modal Accesible de Búsqueda Global del Diccionario
 * Accesible vía Ctrl+K / ⌘K, botón en Header público o botón flotante móvil arrastrable.
 */

import { useEffect, useRef } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { SearchBox } from '@/components/features/semantic-fields/SearchBox';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

const GlobalSearchModalContent = () => {
  const { isOpen, closeSearch } = useGlobalSearch();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Manejo de clic en backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      closeSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscador global del diccionario"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeSearch();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 pt-16 sm:pt-24 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl bg-[#080b11] border border-[#0055AA]/70 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E52D6D] animate-pulse" />
            <h3 className="text-sm font-display font-semibold text-white tracking-wide">
              Búsqueda Global en Wamtɵrmarɵpik
            </h3>
          </div>
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Cerrar buscador"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <SearchBox />

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-gray-400">
          <span>Navega con flechas ↑ ↓ y Enter para saltar al término o microcampo</span>
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[10px]">
            ESC para cerrar
          </kbd>
        </div>
      </div>
    </div>
  );
};

const GlobalSearchModalWithRouter = () => {
  const { closeSearch } = useGlobalSearch();
  const location = useLocation();

  // Cerrar al navegar a una nueva ruta
  useEffect(() => {
    closeSearch();
  }, [location.pathname, location.hash, closeSearch]);

  return <GlobalSearchModalContent />;
};

export const GlobalSearchModal = () => {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    return <GlobalSearchModalContent />;
  }
  return <GlobalSearchModalWithRouter />;
};
