import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoScrollOptions {
  /** Indica si el reverso informativo está activo y debe desplazarse */
  isActive: boolean;
  /** Tiempo de espera antes de iniciar el ascenso automático (ms, por defecto 1400) */
  initialDelayMs?: number;
  /** Velocidad de desplazamiento en píxeles por segundo (por defecto 26) */
  speedPxPerSec?: number;
  /** Desactiva el auto-scroll (p. ej. cuando prefers-reduced-motion está activo) */
  disabled?: boolean;
}

export interface UseAutoScrollReturn<T extends HTMLElement> {
  scrollRef: React.RefObject<T | null>;
  isAutoScrolling: boolean;
  isPausedByUser: boolean;
  pause: () => void;
  resume: () => void;
}

/**
 * Hook para desplazamiento vertical progresivo y accesible en contenedores informativos.
 *
 * Cumple con WCAG 2.2 SC 2.2.2:
 * - Inicia tras un tiempo estimado de lectura (initialDelayMs)
 * - Mantiene acumulador en sub-píxeles para tasas de refresco variables (60Hz / 120Hz / 144Hz)
 * - Cede inmediatamente el control manual ante eventos wheel, touch o interacción del usuario
 * - Limpia infaliblemente temporizadores y cuadros de animación al desactivar o desmontar
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>({
  isActive,
  initialDelayMs = 1400,
  speedPxPerSec = 26,
  disabled = false,
}: UseAutoScrollOptions): UseAutoScrollReturn<T> {
  const scrollRef = useRef<T | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const accumulatedPosRef = useRef<number>(0);

  const stopAnimation = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    lastTimestampRef.current = null;
    setIsAutoScrolling(false);
  }, []);

  const clearDelay = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    clearDelay();
    stopAnimation();
    setIsPausedByUser(true);
    const el = scrollRef.current;
    if (el) {
      accumulatedPosRef.current = el.scrollTop;
    }
  }, [clearDelay, stopAnimation]);

  const resume = useCallback(() => {
    if (disabled || !isActive) return;
    setIsPausedByUser(false);
  }, [disabled, isActive]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Si no está activo o está deshabilitado por reduced-motion, resetear y limpiar
    if (!isActive || disabled) {
      clearDelay();
      stopAnimation();
      setIsPausedByUser(false);
      accumulatedPosRef.current = 0;
      el.scrollTop = 0;
      return;
    }

    // Si el usuario pausó manualmente, no iniciar auto-scroll
    if (isPausedByUser) {
      return;
    }

    // Listener para detectar interacciones del usuario y ceder control
    const handleUserInteraction = () => {
      pause();
    };

    el.addEventListener('wheel', handleUserInteraction, { passive: true });
    el.addEventListener('touchstart', handleUserInteraction, { passive: true });
    el.addEventListener('touchmove', handleUserInteraction, { passive: true });
    el.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    // Iniciar con retardo estimado para dar tiempo a leer el encabezado
    accumulatedPosRef.current = el.scrollTop;
    clearDelay();
    stopAnimation();

    timeoutIdRef.current = setTimeout(() => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;

      setIsAutoScrolling(true);
      lastTimestampRef.current = null;

      const step = (timestamp: number) => {
        if (!scrollRef.current) return;
        const currentEl = scrollRef.current;
        const currentMax = currentEl.scrollHeight - currentEl.clientHeight;

        if (lastTimestampRef.current === null) {
          lastTimestampRef.current = timestamp;
          rafIdRef.current = requestAnimationFrame(step);
          return;
        }

        const deltaMs = timestamp - lastTimestampRef.current;
        lastTimestampRef.current = timestamp;

        const deltaPx = (speedPxPerSec * deltaMs) / 1000;
        accumulatedPosRef.current += deltaPx;

        if (accumulatedPosRef.current >= currentMax) {
          currentEl.scrollTop = currentMax;
          stopAnimation();
          return;
        }

        currentEl.scrollTop = accumulatedPosRef.current;
        rafIdRef.current = requestAnimationFrame(step);
      };

      rafIdRef.current = requestAnimationFrame(step);
    }, initialDelayMs);

    return () => {
      clearDelay();
      stopAnimation();
      el.removeEventListener('wheel', handleUserInteraction);
      el.removeEventListener('touchstart', handleUserInteraction);
      el.removeEventListener('touchmove', handleUserInteraction);
      el.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, [
    isActive,
    disabled,
    isPausedByUser,
    initialDelayMs,
    speedPxPerSec,
    clearDelay,
    stopAnimation,
    pause,
  ]);

  return {
    scrollRef,
    isAutoScrolling,
    isPausedByUser,
    pause,
    resume,
  };
}
