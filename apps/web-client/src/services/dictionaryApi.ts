/**
 * Dictionary API Client
 * Spec 003 — Integración vertical
 * Frontera tipada con el backend. Único punto de contacto con la red:
 * los tests y el resto de la app hablan con estas funciones.
 */

import type { SemanticField, Term } from '@/types/semanticField';

/**
 * Contenido de un campo desde la API. La configuración de presentación
 * (iconKey, position, drift) vive en constants y se une por slug (R-009).
 */
export type SemanticFieldContent = Omit<SemanticField, 'iconKey' | 'position' | 'drift'>;

/** Forma cruda de un término devuelto por la API (puente M1 → microcampo) */
export interface ApiTerm {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  slug?: string;
}

export interface ApiMicrofield {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  slug: string;
  palabrasM1?: Array<{ palabra: ApiTerm }>;
}

export interface ApiSubfield {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  slug: string;
  microcampos: ApiMicrofield[];
}

export interface ApiSemanticField {
  id: string;
  namtrikTermino: string;
  espanolTermino: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
  slug: string;
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

/** Convierte un término de la API al tipo del frontend */
export function toTerm(api: ApiTerm): Term {
  return {
    id: api.id,
    misak: api.namtrikTermino,
    spanish: api.espanolTermino,
    exampleSpanish: api.espanolDescripcion ?? undefined,
  };
}

/** Convierte un campo de la API (jerarquía completa) al tipo del frontend */
export function toSemanticField(api: ApiSemanticField): SemanticFieldContent {
  return {
    id: api.slug,
    name: api.namtrikTermino,
    nameSpanish: api.espanolTermino,
    shortDescription: api.espanolDescripcion ?? '',
    longDescription: api.namtrikDescripcion ?? api.espanolDescripcion ?? '',
    status: 'available',
    subfields: api.subcampos.map((sub) => ({
      id: sub.slug,
      name: sub.namtrikTermino,
      nameMisak: sub.namtrikTermino,
      description: sub.espanolDescripcion ?? sub.namtrikDescripcion ?? '',
      microfields: sub.microcampos.map((micro) => ({
        id: micro.slug,
        name: micro.namtrikTermino,
        nameMisak: micro.namtrikTermino,
        description: micro.espanolDescripcion ?? micro.namtrikDescripcion ?? '',
        terms: (micro.palabrasM1 ?? []).map((rel) => toTerm(rel.palabra)),
      })),
    })),
  };
}

/** Resumen para tarjetas/listados (sin jerarquía) */
export function toSummary(api: ApiSemanticField): Omit<SemanticFieldContent, 'subfields'> {
  const { subfields: _subfields, ...summary } = toSemanticField(api);
  return summary;
}
