import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerProvider, useAudioPlayer } from './AudioPlayerContext';

interface MockAudioInstance {
  src: string;
  preload: string;
  currentTime: number;
  paused: boolean;
  ended: boolean;
  error: MediaError | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  trigger: (eventName: string) => void;
}

describe('AudioPlayerContext mobile resilience & race guards', () => {
  let audioInstance: MockAudioInstance;
  let listeners: Record<string, Array<() => void>>;
  const OriginalAudio = globalThis.Audio;

  beforeEach(() => {
    listeners = {};
    audioInstance = {
      src: '',
      preload: 'auto',
      currentTime: 0,
      paused: true,
      ended: false,
      error: null,
      play: vi.fn().mockImplementation(async () => {
        audioInstance.paused = false;
      }),
      pause: vi.fn().mockImplementation(() => {
        audioInstance.paused = true;
      }),
      load: vi.fn(),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] ??= [];
        listeners[event].push(cb);
      }),
      removeEventListener: vi.fn(),
      removeAttribute: vi.fn((attr: string) => {
        if (attr === 'src') {
          audioInstance.src = '';
        }
      }),
      trigger: (eventName: string) => {
        for (const cb of listeners[eventName] ?? []) {
          cb();
        }
      },
    };

    function MockAudioConstructor() {
      return audioInstance;
    }

    globalThis.Audio = MockAudioConstructor as unknown as typeof Audio;
  });

  afterEach(() => {
    globalThis.Audio = OriginalAudio;
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AudioPlayerProvider>{children}</AudioPlayerProvider>
  );

  it('ignora doble toque mientras el mismo track está en estado loading (evita AbortError)', async () => {
    let resolveFirstPlay: (() => void) | undefined;
    audioInstance.play.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstPlay = () => {
            audioInstance.paused = false;
            resolve();
          };
        }),
    );

    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    let firstAttempt: Promise<void> | undefined;
    await act(async () => {
      firstAttempt = result.current.play('track-1', '/api/media/uuid-1/stream');
    });

    expect(result.current.playbackState).toBe('loading');
    expect(result.current.currentTrackId).toBe('track-1');

    // Segundo toque rápido sobre el mismo botón mientras carga
    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });

    expect(audioInstance.play).toHaveBeenCalledTimes(1);
    expect(audioInstance.load).not.toHaveBeenCalled();

    await act(async () => {
      resolveFirstPlay?.();
      await firstAttempt;
    });

    expect(result.current.playbackState).toBe('playing');
  });

  it('ignora AbortError obsoleto cuando se cambia de pista mientras la anterior sigue cargando', async () => {
    let rejectFirstPlay: ((err: unknown) => void) | undefined;
    audioInstance.play
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectFirstPlay = reject;
          }),
      )
      .mockImplementationOnce(async () => {
        audioInstance.paused = false;
      });

    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    let firstPromise: Promise<void> | undefined;
    await act(async () => {
      firstPromise = result.current.play('track-a', '/api/media/uuid-a/stream');
    });

    // Cambiar rápidamente a track-b antes de resolver track-a
    await act(async () => {
      await result.current.play('track-b', '/api/media/uuid-b/stream');
    });

    expect(result.current.currentTrackId).toBe('track-b');
    expect(result.current.playbackState).toBe('playing');

    // Ahora llega AbortError tardío del primer play()
    await act(async () => {
      const abortErr = new Error('The play() request was interrupted by a new load request.');
      abortErr.name = 'AbortError';
      rejectFirstPlay?.(abortErr);
      await firstPromise;
    });

    // El track B activo debe seguir reproduciendo intacto sin pasar a 'error'
    expect(result.current.currentTrackId).toBe('track-b');
    expect(result.current.playbackState).toBe('playing');
    expect(result.current.errorMessage).toBeNull();
  });

  it('evita que un evento pause rezagado sobrescriba el cambio a una pista nueva', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-a', '/api/media/uuid-a/stream');
    });
    expect(result.current.playbackState).toBe('playing');

    let resolveSecondPlay: (() => void) | undefined;
    audioInstance.play.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSecondPlay = () => {
            audioInstance.paused = false;
            resolve();
          };
        }),
    );

    await act(async () => {
      void result.current.play('track-b', '/api/media/uuid-b/stream');
      // El navegador encola evento pause de track-a mientras track-b está loading
      audioInstance.trigger('pause');
    });

    expect(result.current.playbackState).toBe('loading');
    expect(result.current.currentTrackId).toBe('track-b');

    await act(async () => {
      resolveSecondPlay?.();
    });
    expect(result.current.playbackState).toBe('playing');
  });

  it('reporta mensaje descriptivo según MediaError.code (p. ej. code=4 formato/fuente no soportada)', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-err', '/api/media/uuid-err/stream');
    });

    await act(async () => {
      audioInstance.error = { code: 4 } as MediaError;
      audioInstance.trigger('error');
    });

    expect(result.current.playbackState).toBe('error');
    expect(result.current.errorMessage).toContain('no compatible');
  });
});
