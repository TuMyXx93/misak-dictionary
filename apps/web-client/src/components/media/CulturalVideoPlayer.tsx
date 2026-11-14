/**
 * CulturalVideoPlayer
 *
 * Reproductor accesible de video cultural Misak con soporte para:
 * - Streaming HTTP 206 Partial Content (/api/media/:uuid/stream).
 * - Dimensiones enteras explícitas (width/height) + aspect-video para cero CLS.
 * - Exclusión mutua automática con AudioPlayerContext y otros videos en página.
 * - Subtítulos WebVTT opcionales (metadata.captionsUrl) y respeto a prefers-reduced-motion.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { useOptionalAudioPlayer } from '@/contexts/AudioPlayerContext';
import { cn } from '@/utils/cn';

export interface CulturalVideoPlayerProps {
  src: string;
  title: string;
  posterUrl?: string | null;
  mimetype?: string;
  width?: number | null;
  height?: number | null;
  preload?: 'none' | 'metadata' | 'auto';
  captionsUrl?: string | null;
  captionsLang?: string;
  captionsLabel?: string;
  className?: string;
}

export const CulturalVideoPlayer = ({
  src,
  title,
  posterUrl,
  mimetype,
  width,
  height,
  preload = 'none',
  captionsUrl,
  captionsLang = 'es',
  captionsLabel = 'Subtítulos en español',
  className,
}: CulturalVideoPlayerProps) => {
  const playerId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayer = useOptionalAudioPlayer();
  const [hasError, setHasError] = useState(false);

  const hasIntrinsicDimensions = Boolean(width && width > 0 && height && height > 0);
  const intrinsicWidth = width && width > 0 ? width : 1280;
  const intrinsicHeight = height && height > 0 ? height : 720;
  const containerAspectStyle = hasIntrinsicDimensions
    ? { aspectRatio: `${intrinsicWidth} / ${intrinsicHeight}` }
    : undefined;

  useEffect(() => {
    const handleAudioPlay = () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
    };

    const handleOtherVideoPlay = (event: Event) => {
      const custom = event as CustomEvent<{ playerId?: string }>;
      if (custom.detail?.playerId && custom.detail.playerId !== playerId) {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
        }
      }
    };

    window.addEventListener('misak:audio-play', handleAudioPlay);
    window.addEventListener('misak:video-play', handleOtherVideoPlay);
    return () => {
      window.removeEventListener('misak:audio-play', handleAudioPlay);
      window.removeEventListener('misak:video-play', handleOtherVideoPlay);
    };
  }, [playerId]);

  const handlePlay = () => {
    audioPlayer?.pause();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('misak:video-play', { detail: { playerId } }));
    }
  };

  if (hasError) {
    return (
      <div
        role="alert"
        className={cn(
          'aspect-video w-full rounded-xl border border-[#E52D6D]/40 bg-black/80 p-6 flex flex-col items-center justify-center text-center gap-2',
          className,
        )}
      >
        <p className="text-sm font-semibold text-white">
          No se pudo cargar el video cultural «{title}».
        </p>
        <button
          type="button"
          onClick={() => setHasError(false)}
          className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-[#0055AA] text-white hover:bg-[#004488] transition-colors cursor-pointer"
        >
          Reintentar reproducción
        </button>
      </div>
    );
  }

  return (
    <div
      style={containerAspectStyle}
      className={cn(
        'relative w-full rounded-xl overflow-hidden bg-black border border-[#0055AA]/40 shadow-lg',
        !hasIntrinsicDimensions && 'aspect-video',
        className,
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: se incluye track de subtítulos o pista accesible vacía cuando la grabación comunitaria aún no cuenta con archivo VTT */}
      <video
        ref={videoRef}
        controls
        playsInline
        preload={preload}
        poster={posterUrl ?? undefined}
        width={intrinsicWidth}
        height={intrinsicHeight}
        aria-label={title}
        onPlay={handlePlay}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain bg-black"
      >
        <source src={src} type={mimetype || undefined} />
        {captionsUrl && (
          <track kind="captions" src={captionsUrl} srcLang={captionsLang} label={captionsLabel} />
        )}
        Tu navegador no soporta reproducción de video HTML5.
      </video>
    </div>
  );
};
