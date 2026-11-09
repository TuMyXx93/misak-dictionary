/**
 * GlobalSearchContext
 * Spec 012 (R-010, R-019) — Contexto y listener global para el buscador del diccionario
 * - Controla apertura/cierre de GlobalSearchModal.
 * - Atajo primario Ctrl+K / ⌘K y atajo rápido `/` fuera de campos editables.
 * - En `/campos`, enfoca y selecciona inmediatamente el buscador inline `#dictionary-search`.
 * - Aísla las rutas administrativas `/admin/*` para evitar colisiones con formularios editoriales.
 */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export interface OpenSearchOptions {
  /** Indica si la apertura fue disparada por una interacción táctil (tap móvil) */
  viaTouch?: boolean;
}

interface GlobalSearchContextType {
  isOpen: boolean;
  openSearch: (options?: OpenSearchOptions | unknown) => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  /** Indica si la apertura actual provino de un toque móvil (para exigir pointerdown previo antes de light-dismiss) */
  openedViaTouch: boolean;
}

const defaultContext: GlobalSearchContextType = {
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  toggleSearch: () => {},
  openedViaTouch: false,
};

const GlobalSearchContext = createContext<GlobalSearchContextType>(defaultContext);

const isEditableElement = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return el.getAttribute('contenteditable') === 'true';
};

const focusInlineCamposSearch = (): boolean => {
  const input = (document.getElementById('dictionary-search') ??
    document.getElementById('dictionary-search-input')) as HTMLInputElement | null;
  if (!input) return false;
  if (typeof input.scrollIntoView === 'function') {
    const rect = input.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  input.focus({ preventScroll: true });
  input.select();
  return true;
};

export const GlobalSearchProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openedViaTouch, setOpenedViaTouch] = useState(false);

  const focusGlobalModalInput = useCallback(() => {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('global-dictionary-search') as HTMLInputElement | null;
    if (!input) return;
    input.focus({ preventScroll: true });
  }, []);

  const openSearch = useCallback(
    (options?: OpenSearchOptions | unknown) => {
      const isTouchOpen = Boolean(
        options &&
          typeof options === 'object' &&
          'viaTouch' in options &&
          (options as OpenSearchOptions).viaTouch,
      );
      try {
        flushSync(() => {
          setOpenedViaTouch(isTouchOpen);
          setIsOpen(true);
        });
      } catch {
        setOpenedViaTouch(isTouchOpen);
        setIsOpen(true);
      }
      // Ejecutar focus() sincrónicamente dentro del stack frame del gesto de usuario (touchend/click)
      focusGlobalModalInput();
    },
    [focusGlobalModalInput],
  );

  const closeSearch = useCallback(() => {
    setOpenedViaTouch(false);
    setIsOpen(false);
  }, []);
  const toggleSearch = useCallback(() => {
    setOpenedViaTouch(false);
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) {
        return;
      }

      // Atajo global primario Ctrl+K o ⌘K
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (pathname === '/campos' && focusInlineCamposSearch()) {
          return;
        }
        setIsOpen((prev) => !prev);
        return;
      }

      // Atajo rápido `/` estilo command-palette (solo cuando el foco no está en un input/editor)
      if (
        event.key === '/' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isOpen &&
        !isEditableElement(document.activeElement)
      ) {
        event.preventDefault();
        if (pathname === '/campos' && focusInlineCamposSearch()) {
          return;
        }
        setIsOpen(true);
        return;
      }

      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <GlobalSearchContext.Provider
      value={{
        isOpen,
        openSearch,
        closeSearch,
        toggleSearch,
        openedViaTouch,
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};

// biome-ignore lint/style/useComponentExportOnlyModules: hook exportado junto a su provider para cohesión del contexto
export const useGlobalSearch = (): GlobalSearchContextType => {
  return useContext(GlobalSearchContext);
};
