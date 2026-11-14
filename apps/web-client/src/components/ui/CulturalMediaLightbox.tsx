/**
 * CulturalMediaLightbox — Spec 007 + Expansión Multimodal (Imagen, Video, Audio y Futuros Recursos)
 *
 * Visor modal accesible para recursos culturales (R-011):
 * - Cumplimiento estricto WAI-ARIA: role="dialog", aria-modal="true", aria-label.
 * - Trampa de foco (focus trap) y retorno del foco al disparador al cerrar.
 * - Cierre mediante tecla Escape, clic en backdrop o botón accesible (tap target >= 48px).
 * - Renderizado multimodal extensible (LazyImage, CulturalVideoPlayer, Audio y adaptadores futuros).
 * - Exhibición obligatoria de créditos culturales, autoría y licencia colectiva Misak.
 */

import { type RefObject, useEffect, useRef } from 'react';
import { CulturalVideoPlayer } from '@/components/media/CulturalVideoPlayer';
import { MisakBandStripe } from '@/components/ui/MisakBandStripe';
import type { CulturalMediaType } from '@/types/semanticField';
import { AudioPlayButton } from './AudioPlayButton';
import { LazyImage } from './LazyImage';

export interface CulturalMediaItem {
  uuid?: string;
  tipo?: CulturalMediaType;
  src: string;
  alt: string;
  mimetype?: string;
  posterUrl?: string | null;
  duracionSegundos?: number | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  autor?: string | null;
  variante?: string | null;
  licencia?: string | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface CulturalMediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: CulturalMediaItem | null;
  triggerRef?: RefObject<HTMLElement | null>;
}

export const CulturalMediaLightbox = ({
  isOpen,
  onClose,
  media,
  triggerRef,
}: CulturalMediaLightboxProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar el elemento previamente enfocado para restaurar el foco al cerrar (R-011)
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // Bloquear scroll de la página
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Enfocar botón de cierre inicial
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trampa de foco accesible (Focus Trap)
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, video, audio, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement && lastElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement && firstElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restaurar foco al disparador o al elemento previo
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !media) {
    return null;
  }

  const resolvedTipo = media.tipo ?? 'imagen';
  const licenciaText = media.licencia ?? 'Propiedad Intelectual Colectiva del Pueblo Misak';

  const ariaLabelText =
    resolvedTipo === 'imagen'
      ? media.alt
        ? `Ilustración cultural: ${media.alt}`
        : 'Visor de ilustración cultural'
      : resolvedTipo === 'video'
        ? `Video cultural: ${media.alt}`
        : `Recurso cultural: ${media.alt}`;

  const closeAriaLabel =
    resolvedTipo === 'imagen'
      ? 'Cerrar visor de imagen cultural'
      : 'Cerrar visor multimedia cultural';

  const captionsUrl =
    typeof media.metadata?.captionsUrl === 'string' ? media.metadata.captionsUrl : null;
  const hasDescriptions = Boolean(media.descripcionNamtrik || media.descripcionEspanol);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabelText}
      ref={dialogRef}
      className="misak-lightbox-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-has-descriptions={hasDescriptions ? 'true' : 'false'}
        className="misak-lightbox-panel relative max-w-4xl w-full flex flex-col bg-background-dark/95 border border-[#0055AA]/50 rounded-2xl shadow-2xl overflow-hidden"
      >
        <MisakBandStripe className="h-1 shrink-0" />

        {/* Barra superior fija con botón accesible de cierre (tap target >= 48px) */}
        <div className="misak-lightbox-header shrink-0 flex items-center justify-between gap-2 border-b border-white/10 bg-black/90">
          <div className="min-w-0 pr-2 flex items-center gap-2">
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0055AA]/30 text-secondary-light border border-[#0055AA]/50 shrink-0">
              {resolvedTipo === 'imagen'
                ? 'Imagen'
                : resolvedTipo === 'video'
                  ? 'Video'
                  : resolvedTipo === 'audio'
                    ? 'Audio'
                    : String(resolvedTipo)}
            </span>
            <h2 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
              {media.alt}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={closeAriaLabel}
            className="min-w-[48px] min-h-[48px] shrink-0 inline-flex items-center justify-center rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Contenedor elástico multimodal sin recortes ni scroll interno */}
        <div className="misak-lightbox-stage relative flex-1 min-h-0 flex items-center justify-center bg-black/70 overflow-hidden">
          {resolvedTipo === 'imagen' ? (
            <LazyImage
              src={media.src}
              alt={media.alt}
              width={media.anchoPx ?? undefined}
              height={media.altoPx ?? undefined}
              fit="contain"
              className="max-w-full max-h-full"
              imgClassName="misak-lightbox-img rounded-lg shadow-lg"
            />
          ) : resolvedTipo === 'video' ? (
            <div className="misak-lightbox-video mx-auto">
              <CulturalVideoPlayer
                src={media.src}
                title={media.alt}
                posterUrl={media.posterUrl}
                mimetype={media.mimetype}
                width={media.anchoPx}
                height={media.altoPx}
                captionsUrl={captionsUrl}
              />
            </div>
          ) : resolvedTipo === 'audio' ? (
            <div className="w-full max-w-md p-5 rounded-2xl border border-[#E52D6D]/40 bg-black/80 flex flex-col items-center gap-3 text-center">
              <AudioPlayButton
                trackId={media.uuid ?? media.src}
                audioUrl={media.src}
                lema={media.alt}
                showLabel
              />
              {media.duracionSegundos ? (
                <span className="text-xs text-gray-300">
                  Duración: {Math.round(media.duracionSegundos)} s
                </span>
              ) : null}
            </div>
          ) : (
            <div className="w-full max-w-lg p-5 rounded-2xl border border-[#0055AA]/40 bg-black/80 text-center space-y-4">
              <p className="text-base font-display font-bold text-white">{media.alt}</p>
              <a
                href={media.src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl bg-[#0055AA] hover:bg-[#004488] text-white text-sm font-semibold transition-colors"
              >
                Abrir recurso cultural ↗
              </a>
            </div>
          )}
        </div>

        {/* Ficha fija de metadatos culturales y créditos comunitarios (R-011) */}
        <div className="misak-lightbox-footer shrink-0 bg-black/90 border-t border-white/10 text-xs sm:text-sm text-text-muted">
          {media.descripcionNamtrik && (
            <p className="font-sans font-medium text-white">«{media.descripcionNamtrik}»</p>
          )}
          {media.descripcionEspanol && (
            <p className="text-text-muted/95">{media.descripcionEspanol}</p>
          )}

          <div
            className={`misak-lightbox-footer-meta flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${
              hasDescriptions ? 'pt-2 border-t border-white/10' : ''
            }`}
          >
            {media.autor && (
              <span className="inline-flex items-center gap-1 text-primary-light">
                <span className="font-semibold text-text-muted">Autor/Hablante:</span>
                <span>{media.autor}</span>
              </span>
            )}
            {media.variante && (
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold text-text-muted">Variante:</span>
                <span className="px-1.5 py-0.5 rounded bg-[#0055AA]/20 text-secondary-light border border-[#0055AA]/40">
                  {media.variante}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-amber-200/90">
              <span className="font-semibold text-text-muted">Licencia:</span>
              <span>{licenciaText}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
