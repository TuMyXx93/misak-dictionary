/**
 * @module useRouteFocus
 * @description Hook that moves focus to the main heading (h1) when route changes.
 *              Used internally by FieldLayout for focus management on navigation.
 * @see FieldLayout
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isDeepLinkHash } from './useDeepLinkAnchor';

/**
 * Moves focus to the h1 element when the route pathname changes,
 * unless a deep-link hash (#term-* or #subnivel-*) is active so that
 * viewport scroll anchoring is never overridden back to the page top.
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   useRouteFocus();
 *   return <h1>Page Title</h1>;
 * };
 * ```
 */
export const useRouteFocus = (): void => {
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: el foco al h1 debe dispararse en cada transición de ruta (pathname) salvo hash de deep-link
  useEffect(() => {
    // Si la navegación apunta a un término o subnivel específico, no desplazar de vuelta al h1
    if (isDeepLinkHash(location.hash)) {
      return;
    }

    // Find the h1 in the document and move focus to it without forcing unexpected scroll jumps
    const h1 = document.querySelector('h1');
    if (h1) {
      const timer = setTimeout(() => {
        h1.focus({ preventScroll: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);
};
