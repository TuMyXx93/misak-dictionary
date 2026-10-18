/**
 * TermRow — Phase 2 PR #2 · Spec 005 (Modelo «Sentido + Formas») · Phase 5 (Medios Escalonados)
 *
 * Fila léxica bilingüe con soporte para:
 * - Múltiples formas namtrik (variantes, acepciones, neologismos, categoría gramatical)
 * - Nombres científicos en cursiva
 * - Explicaciones contextuales en namtrik y español
 * - Pares dialógicos de Saludos (pregunta ↔ respuesta bilingüe)
 * - Reproducción accesible de audio con single-instance (R-009, R-010)
 * - Miniatura con LazyImage y visor modal CulturalMediaLightbox (R-011)
 */

import { useRef, useState } from 'react';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import type { FormaNamtrik, Term } from '@/types/semanticField';

interface TermRowProps {
  term: Term;
}

const InsigniaEnRevision = () => (
  // biome-ignore lint/a11y/useSemanticElements: role=status es el patrón estándar para insignias de estado sin semántica de formulario
  <span
    role="status"
    aria-label="Término en revisión editorial"
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-200 border border-amber-500/50 shadow-xs"
  >
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5 text-amber-400 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>En revisión</span>
  </span>
);

export const TermRow = ({ term }: TermRowProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageTriggerRef = useRef<HTMLButtonElement>(null);

  // Extracción de medios culturales (R-009, R-011)
  const audioMedia = term.medios?.find((m) => m.tipo === 'audio');
  const audioUrl =
    term.audioUrl ??
    (audioMedia ? (audioMedia.streamUrl ?? `/api/media/${audioMedia.uuid}/stream`) : undefined);
  const audioTrackId = audioMedia?.uuid ?? (term.audioUrl ? `audio-term-${term.id}` : undefined);

  const imageMedia = term.medios?.find((m) => m.tipo === 'imagen');
  const lightboxMedia: CulturalMediaItem | null = imageMedia
    ? {
        src: imageMedia.streamUrl ?? `/api/media/${imageMedia.uuid}/stream`,
        alt: imageMedia.descripcionEspanol ?? `Ilustración cultural de ${term.misak}`,
        descripcionEspanol: imageMedia.descripcionEspanol,
        descripcionNamtrik: imageMedia.descripcionNamtrik,
        autor: imageMedia.hablanteAutor,
        variante: imageMedia.varianteDialectal,
        licencia: imageMedia.licenciaComunitaria,
      }
    : null;

  const isDialogico = term.tipo === 'dialogico' || Boolean(term.dialogo);

  if (isDialogico && term.dialogo) {
    return (
      <div className="flex flex-col p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.005] transition-all duration-300 gap-4">
        {/* Pregunta / Saludo inicial */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-primary/10 pb-3">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary/80">
                Pregunta / Saludo
              </span>
              {term.estado === 'borrador' && <InsigniaEnRevision />}
              {audioUrl && audioTrackId && (
                <AudioPlayButton
                  trackId={audioTrackId}
                  audioUrl={audioUrl}
                  lema={term.misak}
                  className="scale-90 origin-left"
                />
              )}
            </div>
            <span className="text-lg font-display font-bold text-white break-words mt-1">
              {term.misak}
            </span>
            {term.descriptionMisak && (
              <span className="text-xs text-text-muted italic break-words mt-0.5">
                {term.descriptionMisak}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:items-end sm:text-right min-w-0">
            <span className="text-text-muted break-words font-medium">{term.spanish}</span>
            {term.descriptionSpanish && (
              <span className="text-xs text-text-muted/80 break-words mt-0.5">
                {term.descriptionSpanish}
              </span>
            )}
          </div>
        </div>

        {/* Respuesta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pt-1">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-secondary-light">
                Respuesta
              </span>
            </div>
            <span className="text-base font-display font-bold text-white/95 break-words mt-1">
              {term.dialogo.respuestaNamtrik}
            </span>
            {term.dialogo.respuestaNamtrikContexto && (
              <span className="text-xs text-text-muted italic break-words mt-0.5">
                {term.dialogo.respuestaNamtrikContexto}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:items-end sm:text-right min-w-0">
            <span className="text-text-muted break-words">
              {term.dialogo.respuestaEspanolGlosa}
            </span>
            {term.dialogo.respuestaEspanolExplicacion && (
              <span className="text-xs text-text-muted/80 break-words mt-0.5">
                {term.dialogo.respuestaEspanolExplicacion}
              </span>
            )}
          </div>
        </div>

        {/* Modal de medios culturales */}
        <CulturalMediaLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          media={lightboxMedia}
          triggerRef={imageTriggerRef}
        />
      </div>
    );
  }

  const formas: FormaNamtrik[] =
    term.formas && term.formas.length > 0
      ? term.formas
      : [
          {
            orden: 1,
            lema: term.misak,
            categoriaGramatical: term.partOfSpeech ?? null,
            esNeologismo: false,
            rasgosGramaticales: [],
          },
        ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.005] transition-all duration-300 gap-3 sm:gap-4">
      {/* Columna Namtrik (primaria) */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {formas.map((forma, idx) => (
            <span
              key={forma.id ?? `${forma.lema}-${idx}`}
              className="inline-flex items-baseline gap-1.5 flex-wrap"
            >
              <span className="text-lg font-display font-bold text-white break-words">
                {forma.lema}
              </span>
              {forma.acepcionHomonima !== null && forma.acepcionHomonima !== undefined && (
                <sup className="text-xs text-primary font-bold">{forma.acepcionHomonima}</sup>
              )}
              {forma.categoriaGramatical && (
                <span className="text-xs text-primary italic">({forma.categoriaGramatical})</span>
              )}
              {forma.variante && (
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-primary/10 text-primary-light border border-primary/20">
                  {forma.variante}
                </span>
              )}
              {forma.esNeologismo && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  neol.
                </span>
              )}
              {idx < formas.length - 1 && <span className="text-text-muted/50 mr-1">/</span>}
            </span>
          ))}

          {/* Botón accesible de audio (R-009, R-010) */}
          {audioUrl && audioTrackId && (
            <AudioPlayButton
              trackId={audioTrackId}
              audioUrl={audioUrl}
              lema={term.misak}
              className="scale-90 origin-left"
            />
          )}

          {term.estado === 'borrador' && <InsigniaEnRevision />}
        </div>

        {/* Explicación / Contexto en Namtrik */}
        {(term.descriptionMisak || term.exampleMisak) && (
          <span className="text-xs text-text-muted italic break-words mt-1">
            {term.exampleMisak ? `ej. ${term.exampleMisak}` : term.descriptionMisak}
          </span>
        )}

        {/* Nombre científico en cursiva */}
        {term.scientificName && (
          <span className="text-xs text-emerald-400/90 font-serif italic mt-0.5">
            {term.scientificName}
          </span>
        )}
      </div>

      {/* Columna Español y Miniatura de Imagen */}
      <div className="flex items-start gap-3 sm:items-end sm:text-right min-w-0">
        <div className="flex flex-col flex-1 sm:items-end">
          <span className="text-text-muted break-words font-medium">{term.spanish}</span>
          {(term.descriptionSpanish || term.exampleSpanish) && (
            <span className="text-xs text-text-muted/80 break-words mt-0.5">
              {term.descriptionSpanish ?? term.exampleSpanish}
            </span>
          )}
        </div>

        {/* Miniatura accesible con LazyImage (R-011) */}
        {imageMedia && (
          <button
            ref={imageTriggerRef}
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label={`Abrir ilustración cultural de ${term.misak}`}
            className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 hover:scale-105 transition-all shadow-md group focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <LazyImage
              src={imageMedia.streamUrl ?? `/api/media/${imageMedia.uuid}/stream`}
              alt={imageMedia.descripcionEspanol ?? `Miniatura de ${term.misak}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </button>
        )}
      </div>

      {/* Modal de medios culturales */}
      <CulturalMediaLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        media={lightboxMedia}
        triggerRef={imageTriggerRef}
      />
    </div>
  );
};
