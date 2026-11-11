/**
 * AudioPlayerContext — Spec 007 (Medios Escalonados)
 *
 * Contexto global de reproducción de audio con arquitectura single-instance (R-010):
 * - Una única instancia nativa de HTMLAudioElement para toda la aplicación (R-013).
 * - Detención inmediata de cualquier audio previo al iniciar una nueva reproducción.
 * - Estados de reproducción controlados: 'idle' | 'loading' | 'playing' | 'paused' | 'error'.
 * - Preservación estricta de rendimiento (cero dependencias externas pesadas).
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioPlayerContextValue {
  /** ID o UUID del audio actualmente cargado o reproduciéndose */
  currentTrackId: string | null;
  /** Estado de reproducción actual */
  playbackState: AudioPlaybackState;
  /** Mensaje de error descriptivo en caso de fallo */
  errorMessage: string | null;
  /**
   * Reproduce el audio indicado o alterna su reproducción si ya es el activo.
   * Si ya hay otro audio activo, lo detiene inmediatamente (R-010).
   */
  play: (trackId: string, srcUrl: string) => Promise<void>;
  /** Pausa la reproducción actual */
  pause: () => void;
  /** Detiene y resetea la reproducción actual */
  stop: () => void;
  /** Comprueba si el track indicado se está reproduciendo actualmente */
  isPlaying: (trackId: string) => boolean;
  /** Comprueba si el track indicado se está cargando actualmente */
  isLoading: (trackId: string) => boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider = ({ children }: AudioPlayerProviderProps) => {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instancia única nativa persistente (R-010, R-013)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializar singleton nativo de audio
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handlePlaying = () => {
      setPlaybackState('playing');
      setErrorMessage(null);
    };

    const handleWaiting = () => {
      setPlaybackState('loading');
    };

    const handlePause = () => {
      // Si el audio terminó, el evento 'ended' se encarga de transicionar a idle
      if (!audio.ended) {
        setPlaybackState('paused');
      }
    };

    const handleEnded = () => {
      setPlaybackState('idle');
      setCurrentTrackId(null);
    };

    const handleError = () => {
      setPlaybackState('error');
      setErrorMessage('No se pudo reproducir el archivo de audio comunitario.');
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaybackState('idle');
    setCurrentTrackId(null);
    setErrorMessage(null);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setPlaybackState('paused');
    }
  }, []);

  const play = useCallback(
    async (trackId: string, srcUrl: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Si se pulsa sobre el mismo track activo
      if (currentTrackId === trackId) {
        if (playbackState === 'playing') {
          audio.pause();
          setPlaybackState('paused');
          return;
        }

        if (playbackState === 'paused') {
          try {
            setPlaybackState('loading');
            await audio.play();
            setPlaybackState('playing');
          } catch (err) {
            setPlaybackState('error');
            setErrorMessage(
              err instanceof Error ? err.message : 'Error al reanudar la reproducción',
            );
          }
          return;
        }

        if (playbackState === 'error') {
          // Reintentar desde la misma URL
          audio.src = srcUrl;
          audio.load();
          try {
            setPlaybackState('loading');
            await audio.play();
            setPlaybackState('playing');
          } catch (err) {
            setPlaybackState('error');
            setErrorMessage(
              err instanceof Error ? err.message : 'Error al reproducir el archivo de audio',
            );
          }
          return;
        }
      }

      // Si es un track diferente o el reproductor estaba idle (R-010 Single-Instance)
      // Detener de inmediato cualquier reproducción previa
      audio.pause();
      audio.currentTime = 0;

      // Notificar a reproductores de video culturales para exclusión mutua audiovisual
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('misak:audio-play', { detail: { trackId } }));
      }

      setCurrentTrackId(trackId);
      setPlaybackState('loading');
      setErrorMessage(null);

      audio.src = srcUrl;
      audio.load();

      try {
        await audio.play();
        setPlaybackState('playing');
      } catch (err) {
        // Puede fallar por bloqueo de autoplay o error de red
        setPlaybackState('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Error al iniciar la reproducción del audio comunitario',
        );
      }
    },
    [currentTrackId, playbackState],
  );

  const isPlaying = useCallback(
    (trackId: string) => {
      return currentTrackId === trackId && playbackState === 'playing';
    },
    [currentTrackId, playbackState],
  );

  const isLoading = useCallback(
    (trackId: string) => {
      return currentTrackId === trackId && playbackState === 'loading';
    },
    [currentTrackId, playbackState],
  );

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      currentTrackId,
      playbackState,
      errorMessage,
      play,
      pause,
      stop,
      isPlaying,
      isLoading,
    }),
    [currentTrackId, playbackState, errorMessage, play, pause, stop, isPlaying, isLoading],
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
};

// biome-ignore lint/style/useComponentExportOnlyModules: hook exportado junto a su provider para cohesión del contexto
export const useAudioPlayer = (): AudioPlayerContextValue => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer debe ser utilizado dentro de un AudioPlayerProvider');
  }
  return context;
};

// biome-ignore lint/style/useComponentExportOnlyModules: hook opcional para coordinar video y audio sin acoplar árboles de test aislados
export const useOptionalAudioPlayer = (): AudioPlayerContextValue | null =>
  useContext(AudioPlayerContext);
