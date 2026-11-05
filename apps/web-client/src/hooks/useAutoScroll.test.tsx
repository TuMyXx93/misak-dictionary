import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoScroll } from './useAutoScroll';

describe('useAutoScroll — Hook de Desplazamiento Accesible (Spec 009 Enmienda 0.3.0)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa con estados inactivos por defecto', () => {
    const { result } = renderHook(() =>
      useAutoScroll({
        isActive: false,
      }),
    );

    expect(result.current.scrollRef.current).toBeNull();
    expect(result.current.isAutoScrolling).toBe(false);
    expect(result.current.isPausedByUser).toBe(false);
  });

  it('no inicia auto-scroll si disabled es true (reduced motion)', () => {
    const mockDiv = document.createElement('div');
    Object.defineProperty(mockDiv, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(mockDiv, 'clientHeight', { value: 200, configurable: true });

    const { result, rerender } = renderHook(
      ({ active, disabled }) =>
        useAutoScroll({
          isActive: active,
          disabled,
        }),
      { initialProps: { active: false, disabled: true } },
    );

    result.current.scrollRef.current = mockDiv;
    rerender({ active: true, disabled: true });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isAutoScrolling).toBe(false);
    expect(mockDiv.scrollTop).toBe(0);
  });

  it('inicia auto-scroll tras initialDelayMs cuando isActive es true y hay contenido desplazable', () => {
    let rAFCallback: FrameRequestCallback | null = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rAFCallback = cb;
        return 101;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result, rerender } = renderHook(
      ({ active }) =>
        useAutoScroll({
          isActive: active,
          initialDelayMs: 1000,
          speedPxPerSec: 50,
        }),
      { initialProps: { active: false } },
    );

    const mockDiv = document.createElement('div');
    Object.defineProperty(mockDiv, 'scrollHeight', { value: 600, configurable: true });
    Object.defineProperty(mockDiv, 'clientHeight', { value: 200, configurable: true });
    result.current.scrollRef.current = mockDiv;

    // Activar
    rerender({ active: true });

    // Antes del delay no debe estar corriendo
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isAutoScrolling).toBe(false);

    // Cumplir initialDelayMs
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.isAutoScrolling).toBe(true);

    // Simular un frame
    if (rAFCallback) {
      act(() => {
        (rAFCallback as unknown as FrameRequestCallback)(1000);
      });
      act(() => {
        (rAFCallback as unknown as FrameRequestCallback)(1100); // 100ms después -> 5px
      });
    }

    expect(mockDiv.scrollTop).toBeGreaterThan(0);
  });

  it('cede el control inmediatamente ante eventos wheel o touch del usuario (WCAG 2.2 SC 2.2.2)', () => {
    const mockDiv = document.createElement('div');
    Object.defineProperty(mockDiv, 'scrollHeight', { value: 600, configurable: true });
    Object.defineProperty(mockDiv, 'clientHeight', { value: 200, configurable: true });

    const { result, rerender } = renderHook(
      ({ active }) =>
        useAutoScroll({
          isActive: active,
          initialDelayMs: 500,
        }),
      { initialProps: { active: false } },
    );

    // Asignar el nodo DOM como ocurre tras el montaje de React
    result.current.scrollRef.current = mockDiv;

    // Al activarse el volteo (active: true), el efecto se ejecuta con scrollRef.current ya asignado
    rerender({ active: true });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Simular que el usuario hace scroll con la rueda del ratón
    act(() => {
      mockDiv.dispatchEvent(new Event('wheel'));
    });

    expect(result.current.isPausedByUser).toBe(true);
    expect(result.current.isAutoScrolling).toBe(false);

    // Permite reanudar
    act(() => {
      result.current.resume();
    });
    expect(result.current.isPausedByUser).toBe(false);
  });

  it('resetea scrollTop a 0 y cancela timers cuando isActive pasa a false', () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAutoScroll({
          isActive: active,
          initialDelayMs: 500,
        }),
      { initialProps: { active: true } },
    );

    const mockDiv = document.createElement('div');
    Object.defineProperty(mockDiv, 'scrollHeight', { value: 600, configurable: true });
    Object.defineProperty(mockDiv, 'clientHeight', { value: 200, configurable: true });
    mockDiv.scrollTop = 120;
    result.current.scrollRef.current = mockDiv;

    // Desactivar
    rerender({ active: false });

    expect(mockDiv.scrollTop).toBe(0);
    expect(result.current.isAutoScrolling).toBe(false);
    expect(result.current.isPausedByUser).toBe(false);
  });
});
