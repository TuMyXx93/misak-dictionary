/**
 * AudioPlayButton.test.tsx — Spec 007
 *
 * Tests unitarios con React Testing Library para AudioPlayButton (R-009):
 * - Cumplimiento del tamaño accesible (tap target >= 48px).
 * - Correctos aria-labels y aria-pressed según estado.
 * - Disparo del evento play al interactuar.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioPlayerContextValue } from '@/contexts/AudioPlayerContext';
import { AudioPlayButton } from './AudioPlayButton';

// Mock del hook useAudioPlayer
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
let mockIsPlaying = vi.fn((_id: string) => false);
let mockIsLoading = vi.fn((_id: string) => false);
let mockCurrentTrackId: string | null = null;
let mockPlaybackState: AudioPlayerContextValue['playbackState'] = 'idle';
let mockErrorMessage: string | null = null;

vi.mock('@/contexts/AudioPlayerContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/AudioPlayerContext')>();
  return {
    ...actual,
    useAudioPlayer: () => ({
      currentTrackId: mockCurrentTrackId,
      playbackState: mockPlaybackState,
      errorMessage: mockErrorMessage,
      play: mockPlay,
      pause: mockPause,
      stop: mockStop,
      isPlaying: mockIsPlaying,
      isLoading: mockIsLoading,
    }),
  };
});

describe('AudioPlayButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentTrackId = null;
    mockPlaybackState = 'idle';
    mockErrorMessage = null;
    mockIsPlaying = vi.fn((_id: string) => false);
    mockIsLoading = vi.fn((_id: string) => false);
  });

  it('garantiza el tamaño accesible mínimo de 48x48 px (R-009, WCAG 2.5.5)', () => {
    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('min-w-[48px]');
    expect(button.className).toContain('min-h-[48px]');
  });

  it('muestra el aria-label adecuado en estado reposo (idle)', () => {
    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button', {
      name: 'Reproducir pronunciación en Namtrik de m+y',
    });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('llama a play(trackId, audioUrl) al hacer clic', () => {
    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith('audio-123', '/api/media/audio-123/stream');
  });

  it('muestra estado visual y aria-label de reproducción cuando está activo', () => {
    mockCurrentTrackId = 'audio-123';
    mockPlaybackState = 'playing';
    mockIsPlaying = vi.fn((id: string) => id === 'audio-123');

    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button', {
      name: 'Pausar pronunciación en Namtrik de m+y',
    });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('muestra estado visual y aria-label de carga cuando está cargando', () => {
    mockCurrentTrackId = 'audio-123';
    mockPlaybackState = 'loading';
    mockIsLoading = vi.fn((id: string) => id === 'audio-123');

    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button', {
      name: 'Cargando pronunciación en Namtrik de m+y',
    });
    expect(button).toBeDefined();
  });

  it('muestra estado de error cuando la reproducción falla', () => {
    mockCurrentTrackId = 'audio-123';
    mockPlaybackState = 'error';
    mockErrorMessage = 'Error de red';

    render(
      <AudioPlayButton trackId="audio-123" audioUrl="/api/media/audio-123/stream" lema="m+y" />,
    );

    const button = screen.getByRole('button', {
      name: 'Error al reproducir pronunciación de m+y. Presione para reintentar',
    });
    expect(button).toBeDefined();
    expect(button.className).toContain('bg-rose-500/10');
  });

  it('renderiza la etiqueta de texto opcional cuando showLabel=true', () => {
    render(
      <AudioPlayButton
        trackId="audio-123"
        audioUrl="/api/media/audio-123/stream"
        lema="m+y"
        showLabel
      />,
    );

    expect(screen.getByText('Pronunciar')).toBeDefined();
  });
});
