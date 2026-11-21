/**
 * Utilidades compartidas del catálogo multimedia cultural (Spec 007 + Spec 014).
 */

import type { CulturalMediaItem } from '@/components/ui/CulturalMediaLightbox';
import type { AdminMediaItem, AdminMediaTaxonomyNode, AdminMediaTipo } from '@/hooks/useAdmin';

export const PROPOSITOS_AUDIO = [
  { value: 'pronunciacion_lema', label: 'Pronunciación estándar del lema' },
  { value: 'contexto_oracion', label: 'Pronunciación en oración / contexto' },
  { value: 'pregunta_dialogo', label: 'Audio de la pregunta (diálogo)' },
  { value: 'respuesta_dialogo', label: 'Audio de la respuesta (diálogo)' },
] as const;

export const PROPOSITOS_IMAGEN = [
  { value: 'ilustracion_cultural', label: 'Ilustración cultural tradicional' },
  { value: 'fotografia_territorio', label: 'Fotografía del territorio o práctica cultural' },
] as const;

export const PROPOSITOS_VIDEO = [
  { value: 'registro_practica_cultural', label: 'Registro de práctica cultural' },
  { value: 'relato_oral_video', label: 'Relato oral audiovisual' },
  { value: 'demostracion_uso', label: 'Demostración de uso tradicional' },
  { value: 'recorrido_territorial', label: 'Recorrido territorial Misak' },
] as const;

export const ALL_PROPOSITOS = [...PROPOSITOS_AUDIO, ...PROPOSITOS_IMAGEN, ...PROPOSITOS_VIDEO];

const PROPOSITO_LABEL_MAP = new Map<string, string>(ALL_PROPOSITOS.map((p) => [p.value, p.label]));

export function getPropositosByTipo(tipo: AdminMediaTipo) {
  if (tipo === 'audio') return PROPOSITOS_AUDIO;
  if (tipo === 'imagen') return PROPOSITOS_IMAGEN;
  return PROPOSITOS_VIDEO;
}

export function getPropositoLabel(proposito: string): string {
  return PROPOSITO_LABEL_MAP.get(proposito) ?? proposito;
}

export const ACCEPT_BY_TIPO: Record<AdminMediaTipo, string> = {
  audio: 'audio/mpeg,audio/ogg,audio/wav,audio/webm,.mp3,.ogg,.wav,.webm',
  imagen: 'image/webp,image/jpeg,image/png,image/svg+xml,.webp,.jpg,.jpeg,.png,.svg',
  video: 'video/mp4,video/webm,video/ogg,.mp4,.webm,.ogv',
};

export function formatSelectedFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} kB`;
}

export interface FlattenedTaxonomyOption {
  id: string;
  codigo: string;
  espanolTermino: string;
  namtrikTermino: string;
  parentCampoId?: string;
  parentSubcampoId?: string;
  depth: number;
}

export interface FlattenedTaxonomyCatalog {
  campos: FlattenedTaxonomyOption[];
  subcampos: FlattenedTaxonomyOption[];
  microcampos: FlattenedTaxonomyOption[];
}

function collectMicrocampos(
  nodes: AdminMediaTaxonomyNode[],
  campoId: string,
  subcampoId: string,
  depth: number,
  out: FlattenedTaxonomyOption[],
): void {
  for (const node of nodes) {
    out.push({
      id: node.id,
      codigo: node.codigo,
      espanolTermino: node.espanolTermino,
      namtrikTermino: node.namtrikTermino,
      parentCampoId: campoId,
      parentSubcampoId: subcampoId,
      depth,
    });
    if (node.hijos && node.hijos.length > 0) {
      collectMicrocampos(node.hijos, campoId, subcampoId, depth + 1, out);
    }
  }
}

export function flattenTaxonomyCatalog(tree: AdminMediaTaxonomyNode[]): FlattenedTaxonomyCatalog {
  const campos: FlattenedTaxonomyOption[] = [];
  const subcampos: FlattenedTaxonomyOption[] = [];
  const microcampos: FlattenedTaxonomyOption[] = [];

  for (const campo of tree) {
    campos.push({
      id: campo.id,
      codigo: campo.codigo,
      espanolTermino: campo.espanolTermino,
      namtrikTermino: campo.namtrikTermino,
      depth: 0,
    });

    for (const sub of campo.hijos ?? []) {
      subcampos.push({
        id: sub.id,
        codigo: sub.codigo,
        espanolTermino: sub.espanolTermino,
        namtrikTermino: sub.namtrikTermino,
        parentCampoId: campo.id,
        depth: 0,
      });

      if (sub.hijos && sub.hijos.length > 0) {
        collectMicrocampos(sub.hijos, campo.id, sub.id, 0, microcampos);
      }
    }
  }

  return { campos, subcampos, microcampos };
}

export interface VinculacionResumen {
  primary: string;
  secondary?: string;
  taxonomyPath?: string;
}

export function formatMediaVinculacionSummary(item: AdminMediaItem): VinculacionResumen {
  const breadcrumbParts: string[] = [];
  if (item.campoSemantico) {
    breadcrumbParts.push(
      `${item.campoSemantico.codigo} · ${item.campoSemantico.espanolTermino || item.campoSemantico.namtrikTermino}`,
    );
  }
  if (item.subcampoSemantico) {
    breadcrumbParts.push(
      `${item.subcampoSemantico.codigo} · ${item.subcampoSemantico.espanolTermino || item.subcampoSemantico.namtrikTermino}`,
    );
  }
  if (item.microcampo) {
    breadcrumbParts.push(
      `${item.microcampo.codigo} · ${item.microcampo.espanolTermino || item.microcampo.namtrikTermino}`,
    );
  }

  const taxonomyPath = breadcrumbParts.length > 0 ? breadcrumbParts.join(' › ') : undefined;

  if (item.sentido) {
    const lema = item.forma?.lema ?? item.sentido.formas?.[0]?.lema ?? item.sentido.codigo;
    const ubFallback = item.sentido.ubicaciones?.[0];
    const ubLabel =
      taxonomyPath ??
      (ubFallback?.microcampo
        ? `${ubFallback.microcampo.codigo} · ${ubFallback.microcampo.espanolTermino}`
        : ubFallback?.subcampo
          ? `${ubFallback.subcampo.codigo} · ${ubFallback.subcampo.espanolTermino}`
          : ubFallback?.campo
            ? `${ubFallback.campo.codigo} · ${ubFallback.campo.espanolTermino}`
            : undefined);

    return {
      primary: `${item.sentido.codigo} · ${lema}`,
      secondary: item.sentido.espanolGlosa,
      taxonomyPath: ubLabel,
    };
  }

  if (item.forma) {
    return {
      primary: item.forma.lema,
      secondary: 'Forma léxica',
      taxonomyPath,
    };
  }

  if (taxonomyPath) {
    return {
      primary: taxonomyPath,
      secondary: 'Recurso taxonómico',
    };
  }

  return {
    primary: 'Sin vincular',
  };
}

export type AdminLightboxMediaItem = CulturalMediaItem & {
  tipo?: 'imagen' | 'video';
  duracionSegundos?: number | null;
  posterSrc?: string | null;
};

export function formatMediaBytes(sizeBytes: string | number, forceMb = false): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return forceMb ? '0.0 MB' : '0.0 kB';
  const kb = bytes / 1024;
  if (forceMb || kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} kB`;
}

export function formatMediaDuration(seconds?: number | null): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function toAdminLightboxMediaItem(
  item: AdminMediaItem,
  tipo: 'imagen' | 'video',
): AdminLightboxMediaItem {
  return {
    src: `/api/media/${item.uuid}/stream`,
    alt: item.descripcionEspanol ?? item.filename,
    tipo,
    descripcionEspanol: item.descripcionEspanol,
    descripcionNamtrik: item.descripcionNamtrik,
    autor: item.hablanteAutor,
    variante: item.varianteDialectal,
    licencia: item.licenciaComunitaria,
    anchoPx: item.anchoPx,
    altoPx: item.altoPx,
    ...(tipo === 'video'
      ? {
          duracionSegundos: item.duracionSegundos,
          posterSrc: item.posterUuid ? `/api/media/${item.posterUuid}/stream` : null,
        }
      : {}),
  };
}
