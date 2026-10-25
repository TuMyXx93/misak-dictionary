/**
 * TermRow — Fila Léxica Bilingüe Mobile-First & Multimodal (Spec 005 · Spec 007)
 *
 * Soluciona de raíz:
 * 1. El aplastamiento vertical de 1 carácter en la columna Namtrik frente a definiciones largas,
 *    sustituyendo el flex asimétrico por un @container CSS Grid equilibrado
 *    (`grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`).
 * 2. El solapamiento de `InsigniaEnRevision` sobre el texto español, encapsulándola en su flujo.
 * 3. La alineación derecha cansada en párrafos largos: ambas columnas usan `text-left` legible.
 * 4. Soporte multimodal extensible: Audio (pronunciación), Imagen (miniatura + lightbox),
 *    Video cultural (streaming HTTP 206 en visor) y futuros recursos registrados.
 */

import { useRef, useState } from 'react';
import {
  getCulturalResourceAdapter,
  toLightboxMediaItem,
} from '@/components/media/CulturalResourceRegistry';
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
    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/85 text-amber-200 border border-amber-500/50 shadow-xs shrink-0"
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
  const [activeMedia, setActiveMedia] = useState<CulturalMediaItem | null>(null);
  const mediaTriggerRef = useRef<HTMLButtonElement>(null);

  // Extracción multimodal de medios culturales (audio, imagen, video y futuros tipos)
  const audioMedia = term.medios?.find((m) => m.tipo === 'audio');
  const audioUrl =
    term.audioUrl ??
    (audioMedia ? (audioMedia.streamUrl ?? `/api/media/${audioMedia.uuid}/stream`) : undefined);
  const audioTrackId = audioMedia?.uuid ?? (term.audioUrl ? `audio-term-${term.id}` : undefined);

  const imageMedia = term.medios?.find((m) => m.tipo === 'imagen');
  const videoMedia = term.medios?.find((m) => m.tipo === 'video');
  const extraMedios =
    term.medios?.filter(
      (m) => m.tipo !== 'audio' && m.uuid !== imageMedia?.uuid && m.uuid !== videoMedia?.uuid,
    ) ?? [];

  const openImageLightbox = () => {
    if (!imageMedia) return;
    setActiveMedia(toLightboxMediaItem(imageMedia, term.misak));
  };

  const openVideoLightbox = () => {
    if (!videoMedia) return;
    setActiveMedia(toLightboxMediaItem(videoMedia, term.misak));
  };

  const isDialogico = term.tipo === 'dialogico' || Boolean(term.dialogo);

  const renderMediaControls = () => {
    if (!imageMedia && !videoMedia && extraMedios.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {imageMedia && (
          <button
            ref={mediaTriggerRef}
            type="button"
            onClick={openImageLightbox}
            aria-label={`Abrir ilustración cultural de ${term.misak}`}
            className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#0055AA]/50 hover:border-[#E52D6D] transition-all shadow-md group focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <LazyImage
              src={imageMedia.streamUrl ?? `/api/media/${imageMedia.uuid}/stream`}
              alt={imageMedia.descripcionEspanol ?? `Miniatura de ${term.misak}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
          </button>
        )}

        {videoMedia && (
          <button
            type="button"
            onClick={openVideoLightbox}
            aria-label={`Abrir video cultural de ${term.misak}`}
            className="inline-flex items-center gap-2 min-h-[48px] px-3.5 py-2 rounded-xl border border-[#0055AA]/55 bg-[#0055AA]/20 hover:bg-[#0055AA]/35 hover:border-[#E52D6D] text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-primary-light shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
            </svg>
            <span>Ver video</span>
          </button>
        )}

        {extraMedios.map((extra) => {
          const adapter = getCulturalResourceAdapter(extra.tipo);
          return (
            <button
              key={extra.uuid}
              type="button"
              onClick={() => setActiveMedia(toLightboxMediaItem(extra, term.misak))}
              aria-label={`Abrir ${adapter.label.toLowerCase()} de ${term.misak}`}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl border border-[#0055AA]/45 bg-black/60 hover:border-[#E52D6D] text-xs font-semibold text-secondary-light hover:text-white transition-colors cursor-pointer"
            >
              <span>{adapter.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (isDialogico && term.dialogo) {
    return (
      <article className="@container p-4 sm:p-5 rounded-2xl border border-[#0055AA]/35 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/60 transition-colors duration-200 space-y-4">
        {/* Pregunta / Saludo inicial */}
        <div className="grid grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 @[640px]:gap-6 items-start border-b border-white/10 pb-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-bold text-primary-light">
                Pregunta / Saludo
              </span>
              {term.estado === 'borrador' && <InsigniaEnRevision />}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg sm:text-xl font-display font-bold text-white break-words">
                {term.misak}
              </span>
              {audioUrl && audioTrackId && (
                <AudioPlayButton trackId={audioTrackId} audioUrl={audioUrl} lema={term.misak} />
              )}
            </div>
            {term.descriptionMisak && (
              <p className="text-xs text-gray-300 italic break-words">{term.descriptionMisak}</p>
            )}
          </div>

          <div className="min-w-0 text-left space-y-1 @[640px]:border-l @[640px]:border-white/10 @[640px]:pl-5">
            <p className="text-base text-white/95 font-medium break-words">{term.spanish}</p>
            {term.descriptionSpanish && (
              <p className="text-sm text-gray-300 leading-relaxed break-words">
                {term.descriptionSpanish}
              </p>
            )}
          </div>
        </div>

        {/* Respuesta */}
        <div className="grid grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 @[640px]:gap-6 items-start">
          <div className="min-w-0 space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-secondary-light">
              Respuesta
            </span>
            <p className="text-base sm:text-lg font-display font-bold text-white break-words">
              {term.dialogo.respuestaNamtrik}
            </p>
            {term.dialogo.respuestaNamtrikContexto && (
              <p className="text-xs text-gray-300 italic break-words">
                {term.dialogo.respuestaNamtrikContexto}
              </p>
            )}
          </div>

          <div className="min-w-0 text-left space-y-1 @[640px]:border-l @[640px]:border-white/10 @[640px]:pl-5">
            <p className="text-base text-white/90 font-medium break-words">
              {term.dialogo.respuestaEspanolGlosa}
            </p>
            {term.dialogo.respuestaEspanolExplicacion && (
              <p className="text-sm text-gray-300 leading-relaxed break-words">
                {term.dialogo.respuestaEspanolExplicacion}
              </p>
            )}
            {renderMediaControls()}
          </div>
        </div>

        <CulturalMediaLightbox
          isOpen={Boolean(activeMedia)}
          onClose={() => setActiveMedia(null)}
          media={activeMedia}
          triggerRef={mediaTriggerRef}
        />
      </article>
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
    <article className="@container p-4 sm:p-5 rounded-2xl border border-[#0055AA]/35 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/60 transition-colors duration-200">
      <div className="grid grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3.5 @[640px]:gap-6 items-start">
        {/* Columna Primaria: Lema(s) Namtrik, Categoría, Audio e Insignia contenida */}
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {formas.map((forma, idx) => (
              <span
                key={forma.id ?? `${forma.lema}-${idx}`}
                className="inline-flex items-baseline gap-1.5 flex-wrap min-w-0"
              >
                <span className="text-lg sm:text-xl font-display font-bold text-white break-words">
                  {forma.lema}
                </span>
                {forma.acepcionHomonima !== null && forma.acepcionHomonima !== undefined && (
                  <sup className="text-xs text-primary-light font-bold">
                    {forma.acepcionHomonima}
                  </sup>
                )}
                {forma.categoriaGramatical && (
                  <span className="text-xs text-secondary-light italic">
                    ({forma.categoriaGramatical})
                  </span>
                )}
                {forma.variante && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#0055AA]/20 text-secondary-light border border-[#0055AA]/40">
                    {forma.variante}
                  </span>
                )}
                {forma.esNeologismo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-500/40">
                    neol.
                  </span>
                )}
                {idx < formas.length - 1 && (
                  <span className="text-white/40 mr-0.5" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            ))}

            {audioUrl && audioTrackId && (
              <AudioPlayButton trackId={audioTrackId} audioUrl={audioUrl} lema={term.misak} />
            )}

            {term.estado === 'borrador' && <InsigniaEnRevision />}
          </div>

          {(term.descriptionMisak || term.exampleMisak) && (
            <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed break-words">
              {term.exampleMisak ? `ej. ${term.exampleMisak}` : term.descriptionMisak}
            </p>
          )}

          {term.scientificName && (
            <p className="text-xs text-emerald-300 font-serif italic break-words">
              {term.scientificName}
            </p>
          )}
        </div>

        {/* Columna Secundaria: Glosa y Explicación en Español (alineada a la izquierda) + Multimedia */}
        <div className="min-w-0 text-left flex flex-col gap-1.5 @[640px]:border-l @[640px]:border-white/10 @[640px]:pl-5">
          <p className="text-base sm:text-lg font-semibold text-white/95 leading-snug break-words">
            {term.spanish}
          </p>

          {(term.descriptionSpanish || term.exampleSpanish) && (
            <p className="text-sm text-gray-300 leading-relaxed break-words">
              {term.descriptionSpanish ?? term.exampleSpanish}
            </p>
          )}

          {renderMediaControls()}
        </div>
      </div>

      <CulturalMediaLightbox
        isOpen={Boolean(activeMedia)}
        onClose={() => setActiveMedia(null)}
        media={activeMedia}
        triggerRef={mediaTriggerRef}
      />
    </article>
  );
};
