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
import { AbbreviationBadge } from '@/components/ui/AbbreviationBadge';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import type { CulturalMediaSummary, FormaNamtrik, Term } from '@/types/semanticField';

interface TermRowProps {
  term: Term;
}

interface AudioTrackItem {
  trackId: string;
  audioUrl: string;
  lema: string;
}

const CONTEXT_SENTENCE_PROPOSITO = 'contexto_oracion';
const PREGUNTA_DIALOGO_PROPOSITO = 'pregunta_dialogo';
const RESPUESTA_DIALOGO_PROPOSITO = 'respuesta_dialogo';

const toAudioTrack = (media: CulturalMediaSummary, fallbackLema: string): AudioTrackItem => ({
  trackId: media.uuid,
  audioUrl: media.streamUrl ?? `/api/media/${media.uuid}/stream`,
  lema: media.descripcionEspanol || fallbackLema,
});

const dedupeMediosByUuid = (list: CulturalMediaSummary[]): CulturalMediaSummary[] => {
  const seen = new Set<string>();
  const out: CulturalMediaSummary[] = [];
  for (const item of list) {
    if (!seen.has(item.uuid)) {
      seen.add(item.uuid);
      out.push(item);
    }
  }
  return out;
};

const partitionTermMedia = (
  term: Term,
  formas: FormaNamtrik[],
  isDialogico: boolean,
  hasContextualSentence: boolean,
) => {
  const allMedios = dedupeMediosByUuid([
    ...(term.medios ?? []),
    ...formas.flatMap((f) => f.medios ?? []),
  ]);

  const audioMedios = allMedios.filter((m) => m.tipo === 'audio');
  const visualMedios = allMedios.filter((m) => m.tipo !== 'audio');

  const assignedUuids = new Set<string>();

  const rawSentenceAudios = audioMedios.filter((m) => m.proposito === CONTEXT_SENTENCE_PROPOSITO);
  const sentenceAudios = hasContextualSentence ? rawSentenceAudios : [];
  for (const m of sentenceAudios) assignedUuids.add(m.uuid);

  const preguntaAudios = isDialogico
    ? audioMedios.filter((m) => m.proposito === PREGUNTA_DIALOGO_PROPOSITO)
    : [];
  for (const m of preguntaAudios) assignedUuids.add(m.uuid);

  const respuestaAudios = isDialogico
    ? audioMedios.filter((m) => m.proposito === RESPUESTA_DIALOGO_PROPOSITO)
    : [];
  for (const m of respuestaAudios) assignedUuids.add(m.uuid);

  const formaTracksMap = new Map<string, AudioTrackItem[]>();
  for (const forma of formas) {
    if (!forma.id) continue;
    const matched = dedupeMediosByUuid([
      ...(forma.medios ?? []).filter((m) => m.tipo === 'audio'),
      ...audioMedios.filter((m) => m.formaId === forma.id),
    ]).filter((m) => !assignedUuids.has(m.uuid));

    if (matched.length > 0) {
      for (const m of matched) assignedUuids.add(m.uuid);
      formaTracksMap.set(
        forma.id,
        matched.map((m) => toAudioTrack(m, forma.lema)),
      );
    }
  }

  const remainingAudios = audioMedios.filter((m) => !assignedUuids.has(m.uuid));
  const lemaTracks: AudioTrackItem[] = remainingAudios.map((m) => toAudioTrack(m, term.misak));

  if (term.audioUrl) {
    const allCoveredUrls = new Set([
      ...lemaTracks.map((t) => t.audioUrl),
      ...Array.from(formaTracksMap.values())
        .flat()
        .map((t) => t.audioUrl),
      ...preguntaAudios.map((m) => m.streamUrl ?? `/api/media/${m.uuid}/stream`),
    ]);
    if (!allCoveredUrls.has(term.audioUrl)) {
      const legacyTrack: AudioTrackItem = {
        trackId: `audio-term-${term.id}`,
        audioUrl: term.audioUrl,
        lema: term.misak,
      };
      lemaTracks.push(legacyTrack);
    }
  }

  const preguntaTracks: AudioTrackItem[] = isDialogico
    ? [...preguntaAudios.map((m) => toAudioTrack(m, term.misak)), ...lemaTracks]
    : [];

  const respuestaTracks: AudioTrackItem[] = respuestaAudios.map((m) =>
    toAudioTrack(m, term.dialogo?.respuestaNamtrik ?? term.misak),
  );

  const sentenceTracks: AudioTrackItem[] = sentenceAudios.map((m) =>
    toAudioTrack(m, term.descriptionMisak ?? term.exampleMisak ?? term.misak),
  );

  const imageMedios = visualMedios.filter((m) => m.tipo === 'imagen');
  const videoMedios = visualMedios.filter((m) => m.tipo === 'video');
  const extraMedios = visualMedios.filter((m) => m.tipo !== 'imagen' && m.tipo !== 'video');

  return {
    preguntaTracks,
    respuestaTracks,
    sentenceTracks,
    formaTracksMap,
    lemaTracks: isDialogico ? [] : lemaTracks,
    imageMedios,
    videoMedios,
    extraMedios,
  };
};

const splitSpanishAndScientific = (
  spanish: string,
  scientificName?: string | null,
): { spanishText: string; scientificText: string | null; trailingPunctuation: string } => {
  const rawSci =
    scientificName
      ?.trim()
      .replace(/^\(|\)$/g, '')
      .trim() || null;
  let cleanSpanish = spanish.trim();
  let trailingPunctuation = '';

  if (rawSci) {
    const escapedSci = rawSci.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicateRegex = new RegExp(`\\s*\\(${escapedSci}\\)([.;,]?)$`, 'i');
    const match = cleanSpanish.match(duplicateRegex);
    if (match) {
      cleanSpanish = cleanSpanish.replace(duplicateRegex, '').trim();
      trailingPunctuation = match[1] ?? '';
    } else if (cleanSpanish.endsWith('.')) {
      cleanSpanish = cleanSpanish.slice(0, -1).trim();
      trailingPunctuation = '.';
    }
  }

  return {
    spanishText: cleanSpanish,
    scientificText: rawSci,
    trailingPunctuation,
  };
};

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

  const isDialogico = term.tipo === 'dialogico' || Boolean(term.dialogo);
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

  const hasContextualSentence = Boolean(term.descriptionMisak || term.exampleMisak);
  const {
    preguntaTracks,
    respuestaTracks,
    sentenceTracks,
    formaTracksMap,
    lemaTracks,
    imageMedios,
    videoMedios,
    extraMedios,
  } = partitionTermMedia(term, formas, isDialogico, hasContextualSentence);

  const renderAudioTracks = (tracks: AudioTrackItem[]) =>
    tracks.map((track) => (
      <AudioPlayButton
        key={track.trackId}
        trackId={track.trackId}
        audioUrl={track.audioUrl}
        lema={track.lema}
      />
    ));

  const renderMediaControls = () => {
    if (imageMedios.length === 0 && videoMedios.length === 0 && extraMedios.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {imageMedios.map((img, idx) => (
          <button
            key={img.uuid}
            type="button"
            onClick={(e) => {
              mediaTriggerRef.current = e.currentTarget;
              setActiveMedia(toLightboxMediaItem(img, term.misak));
            }}
            aria-label={
              imageMedios.length === 1
                ? `Abrir ilustración cultural de ${term.misak}`
                : `Abrir ilustración cultural ${idx + 1} de ${term.misak}${img.descripcionEspanol ? `: ${img.descripcionEspanol}` : ''}`
            }
            className="relative shrink-0 aspect-square w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black/55 border border-[#0055AA]/50 hover:border-[#E52D6D] transition-all shadow-md group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <LazyImage
              src={img.streamUrl ?? `/api/media/${img.uuid}/stream`}
              alt={img.descripcionEspanol ?? `Miniatura ${idx + 1} de ${term.misak}`}
              width={img.anchoPx ?? undefined}
              height={img.altoPx ?? undefined}
              fit="contain"
              className="w-full h-full"
              imgClassName="object-contain"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"
            />
          </button>
        ))}

        {videoMedios.map((vid, idx) => (
          <button
            key={vid.uuid}
            type="button"
            onClick={(e) => {
              mediaTriggerRef.current = e.currentTarget;
              setActiveMedia(toLightboxMediaItem(vid, term.misak));
            }}
            aria-label={
              videoMedios.length === 1
                ? `Abrir video cultural de ${term.misak}`
                : `Abrir video cultural ${idx + 1} de ${term.misak}${vid.descripcionEspanol ? `: ${vid.descripcionEspanol}` : ''}`
            }
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
            <span>{videoMedios.length === 1 ? 'Ver video' : `Ver video ${idx + 1}`}</span>
          </button>
        ))}

        {extraMedios.map((extra) => {
          const adapter = getCulturalResourceAdapter(extra.tipo);
          return (
            <button
              key={extra.uuid}
              type="button"
              onClick={(e) => {
                mediaTriggerRef.current = e.currentTarget;
                setActiveMedia(toLightboxMediaItem(extra, term.misak));
              }}
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
      <article
        id={`term-${term.id}`}
        className="@container scroll-mt-28 p-4 sm:p-5 rounded-2xl border border-[#0055AA]/35 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/60 transition-colors duration-200 space-y-4"
      >
        {/* Pregunta / Saludo inicial */}
        <div className="grid grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 @[640px]:gap-6 items-start border-b border-white/10 pb-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs tracking-wider font-bold text-primary-light">
                Pregunta / saludo
              </span>
              {term.estado === 'borrador' && <InsigniaEnRevision />}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg sm:text-xl font-display font-bold text-white break-words">
                {term.misak}
              </span>
              {renderAudioTracks(preguntaTracks)}
            </div>
            {term.descriptionMisak && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-gray-200 font-sans leading-relaxed break-words">
                  {term.descriptionMisak.replace(/^ej\.\s*/i, '')}
                </p>
                {renderAudioTracks(sentenceTracks)}
              </div>
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
            <span className="text-xs tracking-wider font-bold text-secondary-light">Respuesta</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-base sm:text-lg font-display font-bold text-white break-words">
                {term.dialogo.respuestaNamtrik}
              </p>
              {renderAudioTracks(respuestaTracks)}
            </div>
            {term.dialogo.respuestaNamtrikContexto && (
              <p className="text-xs text-gray-200 font-sans leading-relaxed break-words">
                {term.dialogo.respuestaNamtrikContexto.replace(/^ej\.\s*/i, '')}
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

  const { spanishText, scientificText, trailingPunctuation } = splitSpanishAndScientific(
    term.spanish,
    term.scientificName,
  );

  return (
    <article
      id={`term-${term.id}`}
      className="@container scroll-mt-28 p-4 sm:p-5 rounded-2xl border border-[#0055AA]/35 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/60 transition-colors duration-200"
    >
      <div className="grid grid-cols-1 @[640px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3.5 @[640px]:gap-6 items-start">
        {/* Columna Primaria: Lema(s) Namtrik, Categoría, Audio e Insignia contenida */}
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {formas.map((forma, idx) => {
              const formaTracks = forma.id ? (formaTracksMap.get(forma.id) ?? []) : [];
              return (
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
                    <AbbreviationBadge value={forma.categoriaGramatical} size="xs" />
                  )}
                  {forma.variante && <AbbreviationBadge value={forma.variante} size="xs" />}
                  {forma.esNeologismo && <AbbreviationBadge value="neol." size="xs" />}
                  {renderAudioTracks(formaTracks)}
                  {idx < formas.length - 1 && (
                    <span className="text-white/40 mr-0.5" aria-hidden="true">
                      /
                    </span>
                  )}
                </span>
              );
            })}

            {renderAudioTracks(lemaTracks)}

            {term.estado === 'borrador' && <InsigniaEnRevision />}
          </div>

          {(term.descriptionMisak || term.exampleMisak) && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed break-words">
                {(term.descriptionMisak ?? term.exampleMisak ?? '').replace(/^ej\.\s*/i, '')}
              </p>
              {renderAudioTracks(sentenceTracks)}
            </div>
          )}
        </div>

        {/* Columna Secundaria: Glosa (con término científico entre paréntesis blancos) y Explicación en Español + Multimedia */}
        <div className="min-w-0 text-left flex flex-col gap-1.5 @[640px]:border-l @[640px]:border-white/10 @[640px]:pl-5">
          <p className="text-base sm:text-lg font-semibold text-white/95 leading-snug break-words">
            <span>{spanishText}</span>
            {scientificText && (
              <span className="text-white/95 font-semibold">
                {' ('}
                <span className="text-emerald-300 font-sans font-normal">{scientificText}</span>
                {')'}
                {trailingPunctuation}
              </span>
            )}
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
