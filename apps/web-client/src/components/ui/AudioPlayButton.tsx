/**
 * AudioPlayButton — Phase 5 · Spec 007 (Medios Escalonados)
 *
 * Botón accesible para reproducción de pronunciación en Namtrik (R-009):
 * - Tap target accesible garantizado $\ge 48 \times 48$ px (WCAG 2.5.5).
 * - Integrado con AudioPlayerContext (singleton single-instance, R-010).
 * - Atributos aria-label dinámicos, aria-pressed y feedback accesible.
 * - Iconografía responsiva con estados de carga, reproducción, pausa y error.
 */

import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { cn } from '@/utils/cn';

export interface AudioPlayButtonProps {
  /** Identificador único del audio (UUID o ID de medio) */
  trackId: string;
  /** URL del recurso de audio (ej: /api/media/:uuid/stream) */
  audioUrl: string;
  /** Lema o palabra en Namtrik para contextualizar a tecnologías de asistencia */
  lema: string;
  /** Estilos adicionales para personalizar la apariencia externa */
  className?: string;
  /** Mostrar texto descriptivo opcional junto al icono */
  showLabel?: boolean;
}

export const AudioPlayButton = ({
  trackId,
  audioUrl,
  lema,
  className,
  showLabel = false,
}: AudioPlayButtonProps) => {
  const {
    play,
    isPlaying: checkIsPlaying,
    isLoading: checkIsLoading,
    currentTrackId,
    playbackState,
  } = useAudioPlayer();

  const isCurrent = currentTrackId === trackId;
  const isPlaying = checkIsPlaying(trackId);
  const isLoading = checkIsLoading(trackId);
  const isError = isCurrent && playbackState === 'error';

  const handleClick = async () => {
    await play(trackId, audioUrl);
  };

  // Construir aria-label contextual conforme a R-009
  let ariaLabel = `Reproducir pronunciación en Namtrik de ${lema}`;
  if (isLoading) {
    ariaLabel = `Cargando pronunciación en Namtrik de ${lema}`;
  } else if (isPlaying) {
    ariaLabel = `Pausar pronunciación en Namtrik de ${lema}`;
  } else if (isError) {
    ariaLabel = `Error al reproducir pronunciación de ${lema}. Presione para reintentar`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isPlaying}
      aria-live="polite"
      title={ariaLabel}
      className={cn(
        // Tap target accesible obligatorio >= 48x48px (R-009, WCAG 2.5.5)
        'min-w-[48px] min-h-[48px] inline-flex items-center justify-center gap-2 p-2 rounded-xl text-primary transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        // Efectos hover y activos según estado
        isPlaying
          ? 'bg-primary/20 text-primary-light border border-primary/40 shadow-xs shadow-primary/10'
          : isError
            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
            : 'bg-background-dark/40 hover:bg-primary/10 border border-primary/20 hover:border-primary/40',
        className,
      )}
    >
      {/* Iconos de estado */}
      {isLoading ? (
        <svg
          aria-hidden="true"
          className="w-5 h-5 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : isPlaying ? (
        <svg
          aria-hidden="true"
          className="w-5 h-5 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Icono de pausa / onda activa */}
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : isError ? (
        <svg
          aria-hidden="true"
          className="w-5 h-5 text-rose-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="w-5 h-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Icono de bocina / audio cultural */}
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide select-none">
          {isLoading ? 'Cargando...' : isPlaying ? 'Pausar' : isError ? 'Reintentar' : 'Pronunciar'}
        </span>
      )}
    </button>
  );
};
