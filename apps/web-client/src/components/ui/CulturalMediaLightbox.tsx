/**
 * CulturalMediaLightbox — Phase 5 · Spec 007 (Medios Escalonados)
 *
 * Visor modal accesible para ilustraciones culturales (R-011):
 * - Cumplimiento estricto WAI-ARIA: role="dialog", aria-modal="true", aria-label.
 * - Trampa de foco (focus trap) y retorno del foco al disparador al cerrar.
 * - Cierre mediante tecla Escape, clic en backdrop o botón accesible (tap target >= 48px).
 * - Renderizado progresivo con LazyImage.
 * - Exhibición obligatoria de créditos culturales, autoría y licencia colectiva Misak.
 */

import { type RefObject, useEffect, useRef } from 'react';
import { LazyImage } from './LazyImage';

export interface CulturalMediaItem {
  src: string;
  alt: string;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  autor?: string | null;
  variante?: string | null;
  licencia?: string | null;
  anchoPx?: number | null;
  altoPx?: number | null;
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
    setTimeout(() => {
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  const licenciaText = media.licencia ?? 'Propiedad Intelectual Colectiva del Pueblo Misak';
  const ariaLabelText = media.alt
    ? `Ilustración cultural: ${media.alt}`
    : 'Visor de ilustración cultural';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabelText}
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      onClick={(e) => {
        // Cierre al pulsar el backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-background-dark/95 border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Barra superior con botón accesible de cierre (tap target >= 48px) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-background-dark">
          <h2 className="text-sm font-semibold text-primary-light truncate pr-2">{media.alt}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor de imagen cultural"
            className="min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary"
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

        {/* Visualización de la imagen */}
        <div className="flex-1 min-h-[240px] max-h-[60vh] flex items-center justify-center bg-black/50 p-2 overflow-auto">
          <LazyImage
            src={media.src}
            alt={media.alt}
            className="max-h-[58vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Ficha de metadatos culturales y créditos comunitarios (R-011) */}
        <div className="p-4 bg-background-dark/90 border-t border-primary/20 text-xs sm:text-sm text-text-muted space-y-2">
          {media.descripcionNamtrik && (
            <p className="font-display font-medium text-white italic">
              «{media.descripcionNamtrik}»
            </p>
          )}
          {media.descripcionEspanol && (
            <p className="text-text-muted/90">{media.descripcionEspanol}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-primary/10 text-xs">
            {media.autor && (
              <span className="inline-flex items-center gap-1 text-primary-light">
                <span className="font-semibold text-text-muted">Autor/Hablante:</span>
                <span>{media.autor}</span>
              </span>
            )}
            {media.variante && (
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold text-text-muted">Variante:</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary-light border border-primary/20">
                  {media.variante}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-amber-200/80">
              <span className="font-semibold text-text-muted">Licencia:</span>
              <span>{licenciaText}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
