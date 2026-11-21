/**
 * GlobalSearchModal
 * Spec 012 (R-010, R-019, R-021) — Modal Accesible de Búsqueda Global del Diccionario
 * - Usa elemento nativo <dialog> abierto con showModal() (top-layer, bloqueo de foco inerte,
 *   soporte de controles nativos de plataforma como gesto "Atrás" en Android vía closedby="any").
 * - Se adapta en tiempo real a window.visualViewport (--vvh / --vv-top) en móviles y tablets
 *   para que el teclado virtual nunca oculte los resultados inferiores.
 * - Enfoca automáticamente el campo de entrada en una sola acción (Ctrl+K / ⌘K / `/` / FAB).
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { SearchBox } from '@/components/features/semantic-fields/SearchBox';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

const GlobalSearchModalContent = () => {
  const { isOpen, closeSearch, openedViaTouch } = useGlobalSearch();
  const dialogElRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropPointerDownRef = useRef(false);
  const dialogPointerDownRef = useRef(false);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const dialog = dialogElRef.current;
    if (!dialog) return;

    backdropPointerDownRef.current = false;
    dialogPointerDownRef.current = false;

    const inputEl = dialog.querySelector<HTMLInputElement>('#global-dictionary-search');
    inputEl?.setAttribute('autofocus', '');

    // Si se abrió por toque móvil, iniciar con 'closerequest' hasta recibir el primer pointerdown
    // dentro del dialog para impedir que un click sintético residual cierre el modal nativamente.
    dialog.setAttribute('closedby', openedViaTouch ? 'closerequest' : 'any');

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute('open', '');
        }
      }
    } else {
      dialog.setAttribute('open', '');
    }

    const syncVisualViewport = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;
      dialog.style.setProperty('--vvh', `${Math.max(240, Math.round(height))}px`);
      dialog.style.setProperty('--vv-top', `${Math.max(0, Math.round(offsetTop))}px`);
    };

    syncVisualViewport();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', syncVisualViewport);
    vv?.addEventListener('scroll', syncVisualViewport);
    window.addEventListener('resize', syncVisualViewport);

    // Garantizar enfoque inmediato del combobox después de abrir el top-layer <dialog>
    const focusInput = () => {
      const input = dialog.querySelector<HTMLInputElement>('#global-dictionary-search');
      if (!input) return;
      if (document.activeElement !== input) {
        input.focus({ preventScroll: true });
      }
    };
    focusInput();
    const rafId = window.requestAnimationFrame(focusInput);
    const focusCheckTimer = window.setTimeout(() => {
      const active = document.activeElement;
      if (
        !active ||
        active === document.body ||
        active === dialog ||
        active.getAttribute('aria-label') === 'Cerrar buscador'
      ) {
        focusInput();
      }
    }, 40);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(focusCheckTimer);
      vv?.removeEventListener('resize', syncVisualViewport);
      vv?.removeEventListener('scroll', syncVisualViewport);
      window.removeEventListener('resize', syncVisualViewport);
      if (typeof dialog.close === 'function') {
        if (dialog.open) {
          try {
            dialog.close();
          } catch {
            dialog.removeAttribute('open');
          }
        }
      } else {
        dialog.removeAttribute('open');
      }
    };
  }, [isOpen, openedViaTouch]);

  const handleDialogPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    dialogPointerDownRef.current = true;
    const isOutsidePanel = Boolean(
      panelRef.current && !panelRef.current.contains(e.target as Node),
    );
    backdropPointerDownRef.current = isOutsidePanel;
    if (dialogElRef.current?.getAttribute('closedby') !== 'any') {
      dialogElRef.current?.setAttribute('closedby', 'any');
    }
  };

  // Manejo de clic fuera del panel (backdrop o contenedor exterior)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const isOutsidePanel = Boolean(
      panelRef.current && !panelRef.current.contains(e.target as Node),
    );
    if (!isOutsidePanel) {
      // Si un click residual post-tap móvil cae en una zona no interactiva del panel,
      // preservar el foco en el campo de búsqueda.
      if (openedViaTouch && !dialogPointerDownRef.current) {
        const input = dialogElRef.current?.querySelector<HTMLInputElement>(
          '#global-dictionary-search',
        );
        input?.focus({ preventScroll: true });
      }
      return;
    }

    // Exigir que el gesto de cierre (pointerdown) haya iniciado en el backdrop cuando se abrió por tap móvil
    if (openedViaTouch && !backdropPointerDownRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const input = dialogElRef.current?.querySelector<HTMLInputElement>(
        '#global-dictionary-search',
      );
      input?.focus({ preventScroll: true });
      return;
    }

    closeSearch();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogElRef}
      aria-label="Buscador global del diccionario"
      onClose={closeSearch}
      onCancel={(e) => {
        e.preventDefault();
        closeSearch();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          closeSearch();
        }
      }}
      onPointerDown={handleDialogPointerDown}
      onMouseDown={(e) => {
        if (openedViaTouch && !dialogPointerDownRef.current) {
          e.preventDefault();
          const input = dialogElRef.current?.querySelector<HTMLInputElement>(
            '#global-dictionary-search',
          );
          input?.focus({ preventScroll: true });
        }
      }}
      onClick={handleBackdropClick}
      className="misak-search-dialog fixed inset-0 z-50 m-0 h-[var(--vvh,100dvh)] max-h-none w-full max-w-none translate-y-[var(--vv-top,0px)] border-0 bg-black/80 backdrop-blur-md p-3 pt-4 sm:p-6 sm:pt-14 md:pt-20 text-white"
    >
      <div className="flex h-full w-full items-start justify-center">
        <div
          ref={panelRef}
          className="relative flex w-full max-w-2xl max-h-full flex-col overflow-hidden bg-[#080b11] border border-[#0055AA]/70 rounded-3xl p-4 sm:p-6 shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-[#E52D6D] animate-pulse" />
              <h2 className="text-sm font-display font-semibold text-white tracking-wide truncate">
                Búsqueda Global en Wamtɵrmarɵpik
              </h2>
            </div>
            <button
              type="button"
              onClick={(e) => {
                if (openedViaTouch && !dialogPointerDownRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = dialogElRef.current?.querySelector<HTMLInputElement>(
                    '#global-dictionary-search',
                  );
                  input?.focus({ preventScroll: true });
                  return;
                }
                closeSearch();
              }}
              aria-label="Cerrar buscador"
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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

          <SearchBox
            variant="modal"
            autoFocus
            inputId="global-dictionary-search"
            onNavigate={closeSearch}
          />

          <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/10 text-[11px] text-gray-400">
            <span className="hidden sm:inline">
              ↑↓ / Ctrl+N·P navegar · ↵ ir · Ctrl/⌘+↵ nueva pestaña · Alt+O ɵ
            </span>
            <span className="sm:hidden">Toca un resultado o presiona Buscar</span>
            <kbd className="px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[10px]">
              ESC para cerrar
            </kbd>
          </div>
        </div>
      </div>
    </dialog>
  );
};

const GlobalSearchModalWithRouter = () => {
  const { closeSearch } = useGlobalSearch();
  const location = useLocation();

  // Cerrar al navegar a una nueva ruta o ancla profunda (#term-* / #subnivel-*)
  // biome-ignore lint/correctness/useExhaustiveDependencies: se dispara intencionalmente en cada cambio de pathname/hash
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
