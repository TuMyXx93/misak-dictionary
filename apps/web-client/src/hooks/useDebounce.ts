/**
 * useDebounce
 * Spec 003 — Integración vertical
 * Retrasa la propagación de un valor (para inputs de búsqueda).
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
