/**
 * @module useRouteFocus
 * @description Hook that moves focus to the main heading (h1) when route changes.
 *              Used internally by FieldLayout for focus management on navigation.
 * @see FieldLayout
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Moves focus to the h1 element when the route pathname changes.
 * Should be called once per route-level component to manage focus.
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

  useEffect(() => {
    // Find the h1 in the document and move focus to it
    const h1 = document.querySelector('h1');
    if (h1) {
      // Use setTimeout to ensure the DOM is ready after navigation
      setTimeout(() => {
        h1.focus();
      }, 0);
    }
  }, [location.pathname]);
};
