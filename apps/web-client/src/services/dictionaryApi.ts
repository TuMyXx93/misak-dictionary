/**
 * Dictionary API Client
 * Spec 003 — Integración vertical · Multimedia & Taxonomía Extensible
 * Frontera tipada con el backend. Único punto de contacto con la red:
 * los tests y el resto de la app hablan con estas funciones.
 */

import type {
  CulturalMediaSummary,
  CulturalMediaType,
  EstadoSentido,
  Microfield,
  SemanticField,
  Term,
} from '@/types/semanticField';

/**
 * Contenido de un campo desde la API. La configuración de presentación
 * (iconKey, position, drift) vive en constants y se une por slug (R-009).
 */
export type SemanticFieldContent = Omit<SemanticField, 'iconKey' | 'position' | 'drift'>;

/** Resumen público de medio cultural devuelto por el backend */
export interface ApiCulturalMedia {
  id?: string;
  uuid: string;
  tipo: CulturalMediaType;
  proposito: string;
  mimetype?: string;
  streamUrl?: string;
  posterUuid?: string | null;
  posterUrl?: string | null;
  duracionSegundos?: number | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  tamanoBytes?: number | null;
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria?: string;
  metadata?: Record<string, unknown> | null;
}

/** Forma cruda de un término devuelto por la API (puente M1 → microcampo) */
export interface ApiTerm {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  slug?: string;
}

/** Forma de un sentido léxico devuelto por la API (Spec 005, Spec 006 R-026) */
export interface ApiSentido {
  id: string;
  codigo?: string;
  posicion: number;
  tipo?: 'estandar' | 'dialogico';
  estado?: EstadoSentido;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikContexto?: string | null;
  espanolGlosa?: string | null;
  espanolExplicacion?: string | null;
  nombreCientifico?: string | null;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  medios?: ApiCulturalMedia[];
  formas?: Array<{
    id?: string;
    orden: number;
    lema: string;
    acepcionHomonima?: number | null;
    categoriaGramatical?: string | null;
    variante?: string | null;
    esNeologismo: boolean;
    rasgosGramaticales: string[];
    etiquetaOriginal?: string | null;
    medios?: ApiCulturalMedia[];
  }>;
  dialogo?: {
    respuestaNamtrik: string | null;
    respuestaNamtrikContexto: string | null;
    respuestaEspanolGlosa: string | null;
    respuestaEspanolExplicacion: string | null;
  } | null;
}

export interface ApiMicrofield {
  id: string;
  codigo?: string;
  /** null en subniveles sin término namtrik propio (spec 004) */
  namtrikTermino: string | null;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: ApiCulturalMedia[];
  slug: string;
  profundidad?: number;
  sentidos?: ApiSentido[];
  palabrasM1?: Array<{ palabra: ApiTerm }>;
  subniveles?: ApiMicrofield[];
}

export interface ApiSubfield {
  id: string;
  codigo?: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: ApiCulturalMedia[];
  slug: string;
  sentidos?: ApiSentido[];
  microcampos: ApiMicrofield[];
}

export interface ApiSemanticField {
  id: string;
  codigo?: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: ApiCulturalMedia[];
  slug: string;
  sentidos?: ApiSentido[];
  subcampos: ApiSubfield[];
}

export interface SearchResultWord {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion?: string | null;
  espanolDescripcion?: string | null;
  microcampos?: Array<{
    microcampo: {
      id: string;
      slug?: string;
      namtrikTermino: string;
      subcampoSemantico?: {
        id: string;
        slug?: string;
        namtrikTermino: string;
        campoSemantico?: { id: string; slug?: string; namtrikTermino: string };
      };
    };
  }>;
}

export interface SearchResponse {
  data: SearchResultWord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiHomeSlot {
  id: string;
  clave: string;
  etiqueta: string;
  posicion: number;
  campo: {
    id: string;
    codigo: string;
    slug: string;
    namtrikTermino: string;
    espanolTermino: string;
    espanolDescripcion: string | null;
  } | null;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchSemanticFields(signal?: AbortSignal): Promise<ApiSemanticField[]> {
  return getJson<ApiSemanticField[]>('/api/dictionary/semantic-fields', signal);
}

export function fetchHomeSlots(signal?: AbortSignal): Promise<ApiHomeSlot[]> {
  return getJson<ApiHomeSlot[]>('/api/dictionary/home-slots', signal);
}

export function fetchSemanticFieldBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ApiSemanticField> {
  return getJson<ApiSemanticField>(
    `/api/dictionary/semantic-fields/slug/${encodeURIComponent(slug)}`,
    signal,
  );
}

export function fetchSearch(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  return getJson<SearchResponse>(
    `/api/dictionary/words/search?q=${encodeURIComponent(query)}`,
    signal,
  );
}

export function toCulturalMediaSummary(api: ApiCulturalMedia): CulturalMediaSummary {
  const streamUrl = api.streamUrl ?? `/api/media/${api.uuid}/stream`;
  const posterUrl =
    api.posterUrl ?? (api.posterUuid ? `/api/media/${api.posterUuid}/stream` : null);
  return {
    id: api.id,
    uuid: api.uuid,
    tipo: api.tipo,
    proposito: api.proposito,
    mimetype: api.mimetype,
    streamUrl,
    posterUuid: api.posterUuid ?? null,
    posterUrl,
    duracionSegundos: api.duracionSegundos ?? null,
    anchoPx: api.anchoPx ?? null,
    altoPx: api.altoPx ?? null,
    tamanoBytes: api.tamanoBytes ?? null,
    hablanteAutor: api.hablanteAutor ?? null,
    varianteDialectal: api.varianteDialectal ?? null,
    descripcionEspanol: api.descripcionEspanol ?? null,
    descripcionNamtrik: api.descripcionNamtrik ?? null,
    licenciaComunitaria: api.licenciaComunitaria,
    metadata: api.metadata ?? null,
  };
}

/** Convierte un término o sentido de la API al tipo del frontend */
export function toTerm(api: ApiTerm | ApiSentido): Term {
  if (
    'formas' in api ||
    'codigo' in api ||
    'espanolGlosa' in api ||
    'estado' in api ||
    'medios' in api
  ) {
    const s = api as ApiSentido;
    const misak =
      s.formas && s.formas.length > 0 ? s.formas.map((f) => f.lema).join(', ') : s.namtrikTermino;
    const sentidoMedios = (s.medios ?? []).map(toCulturalMediaSummary);
    const formasMedios = (s.formas ?? []).flatMap((f) =>
      (f.medios ?? []).map(toCulturalMediaSummary),
    );
    // Combinar medios del sentido + formas sin duplicar UUID
    const seenUuids = new Set<string>();
    const allMedios: CulturalMediaSummary[] = [];
    for (const m of [...sentidoMedios, ...formasMedios]) {
      if (!seenUuids.has(m.uuid)) {
        seenUuids.add(m.uuid);
        allMedios.push(m);
      }
    }

    return {
      id: s.id,
      codigo: s.codigo,
      tipo: s.tipo ?? 'estandar',
      estado: s.estado,
      misak,
      spanish: s.espanolGlosa ?? s.espanolTermino,
      partOfSpeech: s.formas?.[0]?.categoriaGramatical ?? undefined,
      descriptionMisak: s.namtrikContexto ?? s.namtrikDescripcion ?? undefined,
      descriptionSpanish: s.espanolExplicacion ?? s.espanolDescripcion ?? undefined,
      scientificName: s.nombreCientifico ?? undefined,
      exampleMisak: s.namtrikContexto ?? undefined,
      exampleSpanish: s.espanolExplicacion ?? s.espanolDescripcion ?? undefined,
      formas: s.formas?.map((f) => ({
        ...f,
        medios: f.medios ? f.medios.map(toCulturalMediaSummary) : undefined,
      })),
      dialogo: s.dialogo,
      medios: allMedios.length > 0 ? allMedios : undefined,
    };
  }

  const t = api as ApiTerm;
  return {
    id: t.id,
    misak: t.namtrikTermino,
    spanish: t.espanolTermino,
    exampleSpanish: t.espanolDescripcion ?? undefined,
    descriptionSpanish: t.espanolDescripcion ?? undefined,
    descriptionMisak: t.namtrikDescripcion ?? undefined,
  };
}

/** Convierte un microcampo o subnivel de la API (recursivo) al tipo del frontend */
export function toMicrofield(api: ApiMicrofield): Microfield {
  const subniveles = (api.subniveles ?? []).map(toMicrofield);
  const termsFromSentidos = (api.sentidos ?? []).map(toTerm);
  const termsFromPalabras = (api.palabrasM1 ?? []).map((rel) => toTerm(rel.palabra));
  const terms = termsFromSentidos.length > 0 ? termsFromSentidos : termsFromPalabras;
  const medios = api.medios ? api.medios.map(toCulturalMediaSummary) : undefined;

  return {
    id: api.slug,
    name: api.namtrikTermino ?? api.espanolTermino,
    nameMisak: api.namtrikTermino ?? undefined,
    nameSpanish: api.espanolTermino,
    description: api.espanolDescripcion ?? api.namtrikDescripcion ?? '',
    descriptionMisak: api.namtrikDescripcion ?? undefined,
    imagen: api.imagen ?? null,
    namtrikAudio: api.namtrikAudio ?? null,
    espanolAudio: api.espanolAudio ?? null,
    medios: medios && medios.length > 0 ? medios : undefined,
    terms,
    subniveles,
  };
}

/** Convierte un campo de la API (jerarquía completa) al tipo del frontend */
export function toSemanticField(api: ApiSemanticField): SemanticFieldContent {
  const fieldTerms = (api.sentidos ?? []).map(toTerm);
  const fieldMedios = api.medios ? api.medios.map(toCulturalMediaSummary) : undefined;

  return {
    id: api.slug,
    name: api.namtrikTermino,
    nameSpanish: api.espanolTermino,
    shortDescription: api.espanolDescripcion ?? '',
    longDescription: api.espanolDescripcion ?? api.namtrikDescripcion ?? '',
    descriptionMisak: api.namtrikDescripcion ?? undefined,
    imagen: api.imagen ?? null,
    namtrikAudio: api.namtrikAudio ?? null,
    espanolAudio: api.espanolAudio ?? null,
    medios: fieldMedios && fieldMedios.length > 0 ? fieldMedios : undefined,
    status: 'available',
    terms: fieldTerms.length > 0 ? fieldTerms : undefined,
    subfields: api.subcampos.map((sub) => {
      const subTerms = (sub.sentidos ?? []).map(toTerm);
      const subMedios = sub.medios ? sub.medios.map(toCulturalMediaSummary) : undefined;
      return {
        id: sub.slug,
        name: sub.namtrikTermino,
        nameMisak: sub.namtrikTermino,
        nameSpanish: sub.espanolTermino,
        description: sub.espanolDescripcion ?? sub.namtrikDescripcion ?? '',
        descriptionMisak: sub.namtrikDescripcion ?? undefined,
        imagen: sub.imagen ?? null,
        namtrikAudio: sub.namtrikAudio ?? null,
        espanolAudio: sub.espanolAudio ?? null,
        medios: subMedios && subMedios.length > 0 ? subMedios : undefined,
        terms: subTerms.length > 0 ? subTerms : undefined,
        microfields: sub.microcampos.map(toMicrofield),
      };
    }),
  };
}

/** Resumen para tarjetas/listados (sin jerarquía) */
export function toSummary(api: ApiSemanticField): Omit<SemanticFieldContent, 'subfields'> {
  const { subfields: _subfields, ...summary } = toSemanticField(api);
  return summary;
}
