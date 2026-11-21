/**
 * Dictionary Hooks
 * Spec 003 — Integración vertical
 * Capa react-query sobre el cliente de API. Los tests mockean el cliente.
 */

import { useQuery } from '@tanstack/react-query';
import type { SearchResponse, SemanticFieldContent } from '@/services/dictionaryApi';
import {
  fetchHomeSlots,
  fetchSearch,
  fetchSemanticFieldBySlug,
  fetchSemanticFields,
  toSemanticField,
} from '@/services/dictionaryApi';

const dictionaryKeys = {
  all: ['dictionary'] as const,
  fields: () => [...dictionaryKeys.all, 'fields'] as const,
  field: (slug: string) => [...dictionaryKeys.fields(), slug] as const,
  homeSlots: () => [...dictionaryKeys.all, 'home-slots'] as const,
  search: (q: string) => [...dictionaryKeys.all, 'search', q] as const,
};

/** Spec 004 R-013: Slots persistidos del Home */
export function useHomeSlots() {
  return useQuery({
    queryKey: dictionaryKeys.homeSlots(),
    queryFn: ({ signal }) => fetchHomeSlots(signal),
  });
}

/** Todos los campos con jerarquía completa (7 campos: payload pequeño) */
export function useSemanticFields() {
  return useQuery({
    queryKey: dictionaryKeys.fields(),
    queryFn: ({ signal }) => fetchSemanticFields(signal),
    select: (data) => data.map(toSemanticField),
  });
}

/** Un campo por slug con jerarquía completa (null si no existe → estado no-encontrado) */
export function useSemanticField(slug: string | undefined) {
  return useQuery({
    queryKey: dictionaryKeys.field(slug ?? ''),
    queryFn: ({ signal }) => fetchSemanticFieldBySlug(slug ?? '', signal),
    select: (data) => (data ? toSemanticField(data) : null),
    enabled: Boolean(slug),
  });
}

/** Búsqueda de términos (habilitada desde 1 carácter para soportar monografemas Namtrik como "ú") */
export function useSearchTerms(query: string) {
  return useQuery<SearchResponse>({
    queryKey: dictionaryKeys.search(query),
    queryFn: ({ signal }) => fetchSearch(query, signal),
    enabled: query.trim().length >= 1,
  });
}

/** Helper: busca un subcampo/microcampo dentro de la jerarquía de un campo */
export function findInField(
  field: SemanticFieldContent | null | undefined,
  subSlug?: string,
  microSlug?: string,
) {
  type Sub = NonNullable<SemanticFieldContent['subfields']>[number];
  type Micro = NonNullable<Sub['microfields']>[number];

  if (!field) return { subfield: undefined, microfield: undefined };
  const sub: Sub | undefined = subSlug
    ? field.subfields.find((s: Sub) => s.id === subSlug)
    : undefined;
  const micro: Micro | undefined =
    microSlug && sub ? buscarMicrocampo(sub.microfields, microSlug) : undefined;
  return { subfield: sub, microfield: micro };
}

/** Busca un microcampo o subnivel por slug, a cualquier profundidad (el slug es único por subcampo) */
function buscarMicrocampo<T extends { id: string; subniveles?: T[] }>(
  lista: readonly T[],
  slug: string,
): T | undefined {
  for (const nodo of lista) {
    if (nodo.id === slug) return nodo;
    const hallado = buscarMicrocampo(nodo.subniveles ?? [], slug);
    if (hallado) return hallado;
  }
  return undefined;
}
