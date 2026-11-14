/**
 * CulturalVideoPlayer.test.tsx
 * Pruebas unitarias completas para el reproductor de video cultural Misak
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CulturalVideoPlayer } from './CulturalVideoPlayer';

const mockAudioPause = vi.fn();

vi.mock('@/contexts/AudioPlayerContext', () => ({
  useOptionalAudioPlayer: () => ({
    pause: mockAudioPause,
  }),
}));

describe('CulturalVideoPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el elemento video con atributos accesibles y fuente', () => {
    render(
      <CulturalVideoPlayer
        src="/api/media/test-video.mp4"
        title="Danza tradicional Misak"
        posterUrl="/api/media/poster.webp"
        mimetype="video/mp4"
        width={1920}
        height={1080}
      />,
    );

    const video = screen.getByLabelText('Danza tradicional Misak');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('poster', '/api/media/poster.webp');
    expect(video).toHaveAttribute('width', '1920');
    expect(video).toHaveAttribute('height', '1080');

    const source = video.querySelector('source');
    expect(source).toHaveAttribute('src', '/api/media/test-video.mp4');
    expect(source).toHaveAttribute('type', 'video/mp4');
  });

  it('asigna dimensiones intrínsecas por defecto cuando width y height son nulos o menores a cero', () => {
    render(
      <CulturalVideoPlayer
        src="/api/media/default-video.mp4"
        title="Video por defecto"
        width={0}
        height={-1}
      />,
    );

    const video = screen.getByLabelText('Video por defecto');
    expect(video).toHaveAttribute('width', '1280');
    expect(video).toHaveAttribute('height', '720');
  });

  it('renderiza la pista de subtítulos cuando captionsUrl está presente', () => {
    render(
      <CulturalVideoPlayer
        src="/api/media/subtitled.mp4"
        title="Relato de mayores"
        captionsUrl="/api/media/subtitles.vtt"
        captionsLang="gum"
        captionsLabel="Namtrik"
      />,
    );

    const video = screen.getByLabelText('Relato de mayores');
    const track = video.querySelector('track');
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute('src', '/api/media/subtitles.vtt');
    expect(track).toHaveAttribute('srclang', 'gum');
    expect(track).toHaveAttribute('label', 'Namtrik');
  });

  it('muestra el estado de error accesible y permite reintentar la reproducción', () => {
    render(<CulturalVideoPlayer src="/api/media/error-video.mp4" title="Video corrupto" />);

    const video = screen.getByLabelText('Video corrupto');
    fireEvent.error(video);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(
      screen.getByText(/No se pudo cargar el video cultural «Video corrupto»/i),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Reintentar reproducción/i });
    fireEvent.click(retryBtn);

    expect(screen.getByLabelText('Video corrupto')).toBeInTheDocument();
  });

  it('pausa el reproductor de audio al reproducir video y emite evento misak:video-play', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<CulturalVideoPlayer src="/api/media/play-event.mp4" title="Video de prueba evento" />);

    const video = screen.getByLabelText('Video de prueba evento');
    fireEvent.play(video);

    expect(mockAudioPause).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'misak:video-play' }));
  });

  it('pausa el video si se dispara misak:audio-play o misak:video-play de otro reproductor', () => {
    render(<CulturalVideoPlayer src="/api/media/concurrent.mp4" title="Video concurrente" />);

    const video = screen.getByLabelText('Video concurrente') as HTMLVideoElement;
    const pauseSpy = vi.spyOn(video, 'pause').mockImplementation(() => {});

    Object.defineProperty(video, 'paused', { value: false, configurable: true });

    window.dispatchEvent(new Event('misak:audio-play'));
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(
      new CustomEvent('misak:video-play', { detail: { playerId: 'different-player' } }),
    );
    expect(pauseSpy).toHaveBeenCalledTimes(2);
  });

  it('usa preload="none" por defecto y aplica aspectRatio dinámico en videos verticales', () => {
    const { container } = render(
      <CulturalVideoPlayer
        src="/api/media/vertical.mp4"
        title="Video vertical cultural"
        width={1080}
        height={1920}
      />,
    );

    const video = screen.getByLabelText('Video vertical cultural');
    expect(video).toHaveAttribute('preload', 'none');

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('1080 / 1920');
    expect(wrapper.className).not.toContain('aspect-video');
  });
});
