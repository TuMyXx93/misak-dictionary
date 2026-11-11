/**
 * @module useDeepLinkAnchor
 * @description Spec 012 (R-018) — Deep linking determinista (#term-{id} y #subnivel-{slug})
 *              con estabilización anti-CLS multimodal (imágenes/audios/videos lazy) mediante
 *              MutationObserver + ResizeObserver acotados, cancelación inmediata ante scroll
 *              manual del usuario y resaltado accesible post-scroll (data-deep-linked="true").
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_INTERACTION_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

const MUTATION_WAIT_MS = 3000;
const CLS_STABILIZE_MS = 1200;
const HIGHLIGHT_DURATION_MS = 2600;

export const isDeepLinkHash = (hash: string): boolean => {
  return hash.startsWith('#term-') || hash.startsWith('#subnivel-');
};

export const useDeepLinkAnchor = (): void => {
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: el anclaje debe re-evaluarse también al navegar entre rutas con el mismo hash
  useEffect(() => {
    const rawHash = location.hash;
    if (!isDeepLinkHash(rawHash)) {
      return;
    }

    let targetId = '';
    try {
      targetId = decodeURIComponent(rawHash.slice(1));
    } catch {
      targetId = rawHash.slice(1);
    }
    if (!targetId) return;

    const isTerm = rawHash.startsWith('#term-');
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let userInteracted = false;
    let activeEl: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let mutationTimeoutId: number | null = null;
    let stabilizeTimeoutId: number | null = null;
    let highlightTimeoutId: number | null = null;
    let rafId: number | null = null;

    const stopStabilizing = () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (stabilizeTimeoutId !== null) {
        window.clearTimeout(stabilizeTimeoutId);
        stabilizeTimeoutId = null;
      }
    };

    const handleUserScrollInput = (event: Event) => {
      if (event.type === 'keydown') {
        const keyEvent = event as KeyboardEvent;
        if (!SCROLL_INTERACTION_KEYS.has(keyEvent.key)) return;
      }
      userInteracted = true;
      stopStabilizing();
    };

    window.addEventListener('wheel', handleUserScrollInput, { passive: true });
    window.addEventListener('touchmove', handleUserScrollInput, { passive: true });
    window.addEventListener('keydown', handleUserScrollInput, { passive: true });

    const scheduleHighlightCleanup = () => {
      if (highlightTimeoutId !== null) {
        window.clearTimeout(highlightTimeoutId);
      }
      highlightTimeoutId = window.setTimeout(() => {
        if (activeEl) {
          delete activeEl.dataset.deepLinked;
        }
      }, HIGHLIGHT_DURATION_MS);
    };

    const startResizeStabilizer = () => {
      if (resizeObserver || userInteracted || typeof ResizeObserver === 'undefined') return;
      const rootContainer = document.getElementById('main-content') ?? document.body;
      resizeObserver = new ResizeObserver(() => {
        if (cancelled || userInteracted) {
          stopStabilizing();
          return;
        }
        const currentEl = document.getElementById(targetId);
        if (!currentEl) return;
        if (activeEl !== currentEl) {
          if (activeEl) delete activeEl.dataset.deepLinked;
          activeEl = currentEl;
          currentEl.dataset.deepLinked = 'true';
        }
        if (typeof currentEl.scrollIntoView === 'function') {
          currentEl.scrollIntoView({
            behavior: 'auto',
            block: isTerm ? 'center' : 'start',
          });
        }
      });
      resizeObserver.observe(rootContainer);

      stabilizeTimeoutId = window.setTimeout(() => {
        stopStabilizing();
      }, CLS_STABILIZE_MS);
    };

    const applyAnchor = (smooth: boolean): boolean => {
      if (cancelled) return false;
      const el = document.getElementById(targetId);
      if (!el) return false;

      if (activeEl !== el) {
        if (activeEl) {
          delete activeEl.dataset.deepLinked;
        }
        activeEl = el;
        el.dataset.deepLinked = 'true';
        scheduleHighlightCleanup();
      }

      if (!userInteracted && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({
          behavior: smooth && !prefersReduced ? 'smooth' : 'auto',
          block: isTerm ? 'center' : 'start',
        });
      }

      startResizeStabilizer();
      return true;
    };

    rafId = window.requestAnimationFrame(() => {
      applyAnchor(true);
    });

    if (typeof MutationObserver !== 'undefined') {
      const observeTarget = document.getElementById('main-content') ?? document.body;
      mutationObserver = new MutationObserver(() => {
        if (cancelled) return;
        // Re-aplicar si el nodo aún no existía o si fue remontado tras transición de ruta (150ms)
        if (!activeEl || !activeEl.isConnected) {
          applyAnchor(!userInteracted);
        }
      });
      mutationObserver.observe(observeTarget, {
        childList: true,
        subtree: true,
      });

      mutationTimeoutId = window.setTimeout(() => {
        mutationObserver?.disconnect();
        mutationObserver = null;
      }, MUTATION_WAIT_MS);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('wheel', handleUserScrollInput);
      window.removeEventListener('touchmove', handleUserScrollInput);
      window.removeEventListener('keydown', handleUserScrollInput);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      mutationObserver?.disconnect();
      if (mutationTimeoutId !== null) {
        window.clearTimeout(mutationTimeoutId);
      }
      stopStabilizing();
      if (highlightTimeoutId !== null) {
        window.clearTimeout(highlightTimeoutId);
      }
      if (activeEl) {
        delete activeEl.dataset.deepLinked;
      }
    };
  }, [location.pathname, location.hash]);
};
