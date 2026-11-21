import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('retorna el estado inicial de matchMedia y se actualiza ante eventos change', () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;
    const addEventListener = vi.fn(
      (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event === 'change' && typeof listener === 'function') {
          changeHandler = listener as (e: MediaQueryListEvent) => void;
        }
      },
    );
    const removeEventListener = vi.fn();

    const mediaQueryList = {
      matches: true,
      media: '(min-width: 768px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    act(() => {
      mediaQueryList.matches = false;
      changeHandler?.({ matches: false } as MediaQueryListEvent);
    });
    expect(result.current).toBe(false);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('sincroniza el estado si media.matches cambia entre render inicial y efecto', () => {
    let callCount = 0;
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      callCount += 1;
      return {
        matches: callCount > 1,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));
    expect(result.current).toBe(true);
  });
});
