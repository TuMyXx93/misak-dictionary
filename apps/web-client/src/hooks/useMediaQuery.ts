/**
 * @module useMediaQuery
 * @description Custom hook to detect media query matches.
 * @sprint Sprint 1 — Responsive Audit Fixes
 */

import { useEffect, useState } from 'react';

/**
 * Custom hook that returns true if the viewport matches the media query.
 *
 * @example
 * ```ts
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // Update state to match initial state
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Use modern event listener
    media.addEventListener('change', listener);
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [matches, query]);

  return matches;
};
