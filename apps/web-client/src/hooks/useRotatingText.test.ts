/**
 * useRotatingText.test.ts
 * Pruebas unitarias para el hook useRotatingText
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/hooks/useRotatingText');

const mockUseReducedMotion = vi.fn().mockReturnValue(false);
vi.mock('framer-motion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

import { useRotatingText } from './useRotatingText';

describe('useRotatingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('retorna el primer texto inicialmente', () => {
    const { result } = renderHook(() =>
      useRotatingText({ texts: ['Texto 1', 'Texto 2', 'Texto 3'] }),
    );

    expect(result.current.displayText).toBe('Texto 1');
    expect(result.current.isVisible).toBe(true);
  });

  it('rota secuencialmente a través del array de textos según intervalMs', () => {
    const { result } = renderHook(() =>
      useRotatingText({
        texts: ['Primero', 'Segundo', 'Tercero'],
        intervalMs: 1000,
        fadeDurationMs: 100,
      }),
    );

    expect(result.current.displayText).toBe('Primero');

    // Avanzar hasta la transición
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.isVisible).toBe(false);

    // Avanzar duración del fade
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.displayText).toBe('Segundo');
    expect(result.current.isVisible).toBe(true);

    // Siguiente rotación
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.displayText).toBe('Tercero');

    // Vuelve al inicio (módulo)
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.displayText).toBe('Primero');
  });

  it('respeta prefers-reduced-motion fijando el primer elemento sin animar', () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() =>
      useRotatingText({ texts: ['Estático', 'Nunca'], intervalMs: 500 }),
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.displayText).toBe('Estático');
    expect(result.current.isVisible).toBe(true);
  });
});
