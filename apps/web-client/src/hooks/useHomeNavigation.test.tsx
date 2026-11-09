import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHomeNavigation } from './useHomeNavigation';

describe('useHomeNavigation', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

  beforeEach(() => {
    vi.useFakeTimers();

    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    // Mock IntersectionObserver
    class MockIntersectionObserver {
      constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  const createWrapper = (initialEntry = '/') => {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    );
  };

  it('inicia en "inicio" con header oculto cuando no hay hash', () => {
    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    expect(result.current.activeSection).toBe('inicio');
    expect(result.current.isHeaderVisible).toBe(false);
  });

  it('reconoce el hash inicial válido y activa el header', () => {
    const el = document.createElement('div');
    el.id = 'recorrido';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/#recorrido'),
    });

    expect(result.current.activeSection).toBe('recorrido');
    expect(result.current.isHeaderVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('ignora hashes desconocidos y cae en "inicio"', () => {
    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/#inexistente'),
    });

    expect(result.current.activeSection).toBe('inicio');
    expect(result.current.isHeaderVisible).toBe(false);
  });

  it('scrollToSection desplaza suavemente al elemento por ID', () => {
    const el = document.createElement('div');
    el.id = 'simbolos';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    act(() => {
      result.current.scrollToSection('simbolos');
    });

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrollToSection maneja la ausencia del elemento sin lanzar error', () => {
    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    expect(() => {
      act(() => {
        result.current.scrollToSection('creditos');
      });
    }).not.toThrow();
  });

  it('actualiza activeSection e isHeaderVisible cuando IntersectionObserver detecta una sección visible', () => {
    const s1 = document.createElement('div');
    s1.id = 'simbolos';
    document.body.appendChild(s1);

    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    expect(result.current.activeSection).toBe('inicio');
    expect(mockObserve).toHaveBeenCalledWith(s1);

    act(() => {
      observerCallback([
        {
          target: s1,
          isIntersecting: true,
        },
      ]);
    });

    expect(result.current.activeSection).toBe('simbolos');
    expect(result.current.isHeaderVisible).toBe(true);
  });

  it('ignora entradas no intersectadas en el callback de IntersectionObserver', () => {
    const s1 = document.createElement('div');
    s1.id = 'recorrido';
    document.body.appendChild(s1);

    const { result } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    act(() => {
      observerCallback([
        {
          target: s1,
          isIntersecting: false,
        },
      ]);
    });

    expect(result.current.activeSection).toBe('inicio');
  });

  it('desconecta el observador al desmontar el hook', () => {
    const { unmount } = renderHook(() => useHomeNavigation(), {
      wrapper: createWrapper('/'),
    });

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
