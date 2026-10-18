/**
 * AudioPlayerContext.test.tsx — Phase 5 · Spec 007
 *
 * Tests unitarios para el contexto global de audio (R-010):
 * - Singleton nativo y parada automática de audios previos (single-instance).
 * - Transición de estados de reproducción (idle, loading, playing, paused, error).
 * - Manejo de errores sin fugas de memoria.
 */

import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerProvider, useAudioPlayer } from './AudioPlayerContext';

class MockAudio {
  src = '';
  preload = '';
  currentTime = 0;
  ended = false;
  paused = true;

  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(event: string, cb: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(cb);
  }

  removeEventListener(event: string, cb: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb);
    }
  }

  dispatchEvent(event: string) {
    for (const cb of this.listeners[event] ?? []) {
      cb();
    }
  }

  load = vi.fn();
  play = vi.fn().mockImplementation(() => {
    this.paused = false;
    this.dispatchEvent('playing');
    return Promise.resolve();
  });
  pause = vi.fn().mockImplementation(() => {
    this.paused = true;
    this.dispatchEvent('pause');
  });
}

describe('AudioPlayerContext', () => {
  let originalAudio: typeof window.Audio;
  let mockAudioInstance: MockAudio;

  beforeEach(() => {
    originalAudio = window.Audio;
    mockAudioInstance = new MockAudio();
    window.Audio = vi.fn().mockImplementation(function (this: unknown) {
      return mockAudioInstance;
    });
  });

  afterEach(() => {
    window.Audio = originalAudio;
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AudioPlayerProvider>{children}</AudioPlayerProvider>
  );

  it('lanza un error si se invoca useAudioPlayer fuera del proveedor', () => {
    expect(() => renderHook(() => useAudioPlayer())).toThrow(
      'useAudioPlayer debe ser utilizado dentro de un AudioPlayerProvider',
    );
  });

  it('inicia en estado idle sin pista activa', () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    expect(result.current.currentTrackId).toBeNull();
    expect(result.current.playbackState).toBe('idle');
    expect(result.current.isPlaying('track-1')).toBe(false);
    expect(result.current.isLoading('track-1')).toBe(false);
  });

  it('inicia la reproducción de una pista correctamente', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });

    expect(mockAudioInstance.src).toBe('/api/media/uuid-1/stream');
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(1);
    expect(result.current.currentTrackId).toBe('track-1');
    expect(result.current.playbackState).toBe('playing');
    expect(result.current.isPlaying('track-1')).toBe(true);
  });

  it('cumple el principio single-instance: detiene el audio previo al iniciar uno nuevo (R-010)', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    // Reproducir track-1
    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });
    expect(result.current.currentTrackId).toBe('track-1');
    expect(result.current.isPlaying('track-1')).toBe(true);

    // Reproducir track-2
    await act(async () => {
      await result.current.play('track-2', '/api/media/uuid-2/stream');
    });

    // Debe haberse pausado y reseteado la posición a 0
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(mockAudioInstance.currentTime).toBe(0);
    expect(mockAudioInstance.src).toBe('/api/media/uuid-2/stream');
    expect(result.current.currentTrackId).toBe('track-2');
    expect(result.current.isPlaying('track-1')).toBe(false);
    expect(result.current.isPlaying('track-2')).toBe(true);
  });

  it('pausa y reanuda al hacer toggle sobre la misma pista', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    // Reproducir
    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });
    expect(result.current.playbackState).toBe('playing');

    // Pausar
    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(result.current.playbackState).toBe('paused');

    // Reanudar
    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(2);
    expect(result.current.playbackState).toBe('playing');
  });

  it('detiene completamente la reproducción con stop()', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });

    act(() => {
      result.current.stop();
    });

    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(mockAudioInstance.currentTime).toBe(0);
    expect(result.current.currentTrackId).toBeNull();
    expect(result.current.playbackState).toBe('idle');
  });

  it('transiciona a idle cuando el audio emite el evento ended', async () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });
    expect(result.current.playbackState).toBe('playing');

    act(() => {
      mockAudioInstance.ended = true;
      mockAudioInstance.dispatchEvent('ended');
    });

    expect(result.current.playbackState).toBe('idle');
    expect(result.current.currentTrackId).toBeNull();
  });

  it('maneja errores de reproducción y actualiza el estado a error', async () => {
    mockAudioInstance.play = vi.fn().mockRejectedValue(new Error('Autoplay blocked'));
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    await act(async () => {
      await result.current.play('track-1', '/api/media/uuid-1/stream');
    });

    expect(result.current.playbackState).toBe('error');
    expect(result.current.errorMessage).toContain('Autoplay blocked');
  });
});
