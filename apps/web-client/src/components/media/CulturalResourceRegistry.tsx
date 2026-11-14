/**
 * CulturalResourceRegistry
 *
 * Registro extensible de recursos culturales por `tipo`.
 * Soporta nativamente 'audio', 'imagen' y 'video', y deja preparado el contrato
 * enchufable para futuros formatos del diccionario (documentos PDF, mapas
 * territoriales, modelos 3D, espectrogramas fonéticos, etc.) sin modificar las
 * vistas consumidoras.
 */

import { type ReactNode, useRef, useState } from 'react';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import type { CulturalMediaSummary, CulturalMediaType } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { CulturalVideoPlayer } from './CulturalVideoPlayer';

export interface CulturalResourceAdapter {
  tipo: string;
  label: string;
  badgeColorClass: string;
  renderViewer: (item: CulturalMediaItem) => ReactNode;
}

const DEFAULT_ADAPTERS = new Map<string, CulturalResourceAdapter>();

// biome-ignore lint/style/useComponentExportOnlyModules: API del registro extensible exportada junto a su componente visor
export function registerCulturalResourceAdapter(adapter: CulturalResourceAdapter): void {
  DEFAULT_ADAPTERS.set(adapter.tipo.toLowerCase(), adapter);
}

// biome-ignore lint/style/useComponentExportOnlyModules: API del registro extensible exportada junto a su componente visor
export function getCulturalResourceAdapter(tipo: CulturalMediaType): CulturalResourceAdapter {
  const key = String(tipo || 'recurso').toLowerCase();
  const found = DEFAULT_ADAPTERS.get(key);
  if (found) return found;

  const formattedLabel = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    tipo: key,
    label: formattedLabel,
    badgeColorClass: 'bg-[#0055AA]/20 text-secondary-light border-[#0055AA]/40',
    renderViewer: (item) => (
      <div className="w-full max-w-xl mx-auto p-6 rounded-2xl border border-[#0055AA]/40 bg-black/80 text-center space-y-4">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0055AA]/25 text-secondary-light border border-[#0055AA]/50">
          {formattedLabel}
        </span>
        <p className="text-base font-display font-bold text-white">{item.alt}</p>
        {item.descripcionEspanol && (
          <p className="text-sm text-gray-300">{item.descripcionEspanol}</p>
        )}
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl bg-[#0055AA] hover:bg-[#004488] text-white text-sm font-semibold transition-colors"
        >
          Abrir recurso cultural ↗
        </a>
      </div>
    ),
  };
}

// Registro base: Imagen
registerCulturalResourceAdapter({
  tipo: 'imagen',
  label: 'Ilustración',
  badgeColorClass: 'bg-[#E52D6D]/20 text-primary-light border-[#E52D6D]/40',
  renderViewer: (item) => (
    <LazyImage
      src={item.src}
      alt={item.alt}
      width={item.anchoPx ?? undefined}
      height={item.altoPx ?? undefined}
      fit="contain"
      className="max-w-full max-h-full"
      imgClassName="misak-lightbox-img rounded-lg shadow-lg"
    />
  ),
});

// Registro base: Video
registerCulturalResourceAdapter({
  tipo: 'video',
  label: 'Video cultural',
  badgeColorClass: 'bg-[#0055AA]/25 text-secondary-light border-[#0055AA]/50',
  renderViewer: (item) => {
    const captionsUrl =
      typeof item.metadata?.captionsUrl === 'string' ? item.metadata.captionsUrl : null;
    return (
      <div className="w-full max-w-3xl mx-auto">
        <CulturalVideoPlayer
          src={item.src}
          title={item.alt}
          posterUrl={item.posterUrl}
          mimetype={item.mimetype}
          width={item.anchoPx}
          height={item.altoPx}
          captionsUrl={captionsUrl}
        />
      </div>
    );
  },
});

// Registro base: Audio
registerCulturalResourceAdapter({
  tipo: 'audio',
  label: 'Pronunciación / Audio',
  badgeColorClass: 'bg-[#E52D6D]/20 text-primary-light border-[#E52D6D]/40',
  renderViewer: (item) => (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl border border-[#E52D6D]/35 bg-black/75 flex flex-col items-center text-center gap-4">
      <AudioPlayButton
        trackId={item.uuid ?? item.src}
        audioUrl={item.src}
        lema={item.alt}
        showLabel
      />
      {item.duracionSegundos ? (
        <span className="text-xs text-gray-300">
          Duración aprox.: {Math.round(item.duracionSegundos)} s
        </span>
      ) : null}
    </div>
  ),
});

// biome-ignore lint/style/useComponentExportOnlyModules: adaptador de resumen multimedia a lightbox exportado junto al visor
export function toLightboxMediaItem(
  media: CulturalMediaSummary,
  fallbackTitle: string,
): CulturalMediaItem {
  const src = media.streamUrl ?? `/api/media/${media.uuid}/stream`;
  const posterUrl =
    media.posterUrl ?? (media.posterUuid ? `/api/media/${media.posterUuid}/stream` : null);
  const defaultPrefix =
    media.tipo === 'video'
      ? `Video cultural de ${fallbackTitle}`
      : media.tipo === 'imagen'
        ? `Ilustración cultural de ${fallbackTitle}`
        : `Recurso cultural de ${fallbackTitle}`;

  return {
    uuid: media.uuid,
    tipo: media.tipo,
    src,
    alt: media.descripcionEspanol ?? defaultPrefix,
    mimetype: media.mimetype,
    posterUrl,
    duracionSegundos: media.duracionSegundos,
    descripcionEspanol: media.descripcionEspanol,
    descripcionNamtrik: media.descripcionNamtrik,
    autor: media.hablanteAutor,
    variante: media.varianteDialectal,
    licencia: media.licenciaComunitaria,
    anchoPx: media.anchoPx,
    altoPx: media.altoPx,
    metadata: media.metadata ?? null,
  };
}

export interface SectionMediaShowcaseProps {
  title: string;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  imagen?: string | null;
  medios?: CulturalMediaSummary[];
  className?: string;
}

/**
 * Franja multimedia para cabeceras de Campo, Subcampo y Microcampo.
 * Muestra controles de audio contextual y miniaturas/disparadores de imagen, video o futuros recursos.
 */
export const SectionMediaShowcase = ({
  title,
  namtrikAudio,
  espanolAudio,
  imagen,
  medios = [],
  className,
}: SectionMediaShowcaseProps) => {
  const [selectedItem, setSelectedItem] = useState<CulturalMediaItem | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const audioMedios = medios.filter((m) => m.tipo === 'audio');
  const visualOrOtherMedios = medios.filter((m) => m.tipo !== 'audio');

  const primaryNamtrikAudio =
    namtrikAudio ??
    (audioMedios[0]
      ? (audioMedios[0].streamUrl ?? `/api/media/${audioMedios[0].uuid}/stream`)
      : null);

  const hasAnyMedia =
    Boolean(primaryNamtrikAudio) ||
    Boolean(espanolAudio) ||
    Boolean(imagen) ||
    visualOrOtherMedios.length > 0;

  if (!hasAnyMedia) return null;

  return (
    <div className={cn('mt-6 flex flex-wrap items-center gap-3', className)}>
      {primaryNamtrikAudio && (
        <AudioPlayButton
          trackId={audioMedios[0]?.uuid ?? `section-namtrik-${title}`}
          audioUrl={primaryNamtrikAudio}
          lema={title}
          showLabel
        />
      )}

      {espanolAudio && (
        <AudioPlayButton
          trackId={`section-es-${title}`}
          audioUrl={espanolAudio}
          lema={`${title} (español)`}
          showLabel
          className="border-[#0055AA]/40 text-secondary-light hover:bg-[#0055AA]/15"
        />
      )}

      {imagen && visualOrOtherMedios.every((m) => m.tipo !== 'imagen') && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() =>
            setSelectedItem({
              tipo: 'imagen',
              src: imagen,
              alt: `Ilustración de la sección ${title}`,
            })
          }
          className="inline-flex items-center gap-2 min-h-[48px] px-3.5 py-2 rounded-xl border border-[#0055AA]/45 bg-background-dark/70 hover:border-[#E52D6D] text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <span>Ver ilustración de sección</span>
        </button>
      )}

      {visualOrOtherMedios.map((media) => {
        const adapter = getCulturalResourceAdapter(media.tipo);
        const item = toLightboxMediaItem(media, title);
        return (
          <button
            key={media.uuid}
            type="button"
            onClick={() => setSelectedItem(item)}
            aria-label={`Abrir ${adapter.label.toLowerCase()} de ${title}`}
            className={cn(
              'inline-flex items-center gap-2.5 min-h-[48px] px-3.5 py-2 rounded-xl border bg-background-dark/80 hover:border-[#E52D6D] text-xs font-semibold text-white transition-all cursor-pointer',
              adapter.badgeColorClass,
            )}
          >
            {media.tipo === 'video' ? (
              <svg
                aria-hidden="true"
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
            <span>{adapter.label}</span>
          </button>
        );
      })}

      <CulturalMediaLightbox
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        media={selectedItem}
        triggerRef={triggerRef}
      />
    </div>
  );
};
