/**
 * GlobalSearchContext
 * Spec 012 (R-010) — Contexto y listener global para el buscador del diccionario
 * Controla apertura/cierre de GlobalSearchModal y atajo de teclado Ctrl+K / ⌘K.
 */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface GlobalSearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const defaultContext: GlobalSearchContextType = {
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  toggleSearch: () => {},
};

const GlobalSearchContext = createContext<GlobalSearchContextType>(defaultContext);

export const GlobalSearchProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Atajo global Ctrl+K o ⌘K
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.location.pathname === '/campos') {
          const input = document.getElementById(
            'dictionary-search-input',
          ) as HTMLInputElement | null;
          input?.focus();
          return;
        }
        setIsOpen((prev) => !prev);
      } else if (event.key === 'Escape' && isOpen) {
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
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = (): GlobalSearchContextType => {
  return useContext(GlobalSearchContext);
};
