/**
 * Dictionary Hooks
 * Spec 003 — Integración vertical
 * Capa react-query sobre el cliente de API. Los tests mockean el cliente.
 */

import { useQuery } from '@tanstack/react-query';
import type { SearchResponse, SemanticFieldContent } from '@/services/dictionaryApi';
import {
  fetchSearch,
  fetchSemanticFieldBySlug,
  fetchSemanticFields,
  toSemanticField,
} from '@/services/dictionaryApi';

export const dictionaryKeys = {
  all: ['dictionary'] as const,
  fields: () => [...dictionaryKeys.all, 'fields'] as const,
  field: (slug: string) => [...dictionaryKeys.fields(), slug] as const,
  search: (q: string) => [...dictionaryKeys.all, 'search', q] as const,
};

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

/** Búsqueda de términos (solo con query no vacío) */
export function useSearchTerms(query: string) {
  return useQuery<SearchResponse>({
    queryKey: dictionaryKeys.search(query),
    queryFn: ({ signal }) => fetchSearch(query, signal),
    enabled: query.trim().length >= 2,
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
  const micro: Micro | undefined = microSlug
    ? sub?.microfields.find((m: Micro) => m.id === microSlug)
    : undefined;
  return { subfield: sub, microfield: micro };
}
