/**
 * SearchBox
 * Spec 003 — Integración vertical
 * Búsqueda de términos contra la API con debounce. Muestra estados
 * de carga, vacío y error. Enlaza resultados a su microcampo.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchTerms } from '@/hooks/useDictionary';

export const SearchBox = () => {
  const [input, setInput] = useState('');
  const query = useDebounce(input, 350);
  const { data, isLoading, isError, isFetching } = useSearchTerms(query);

  useEffect(() => {
    // Reset visual inmediato al limpiar el input
    if (!input) return;
  }, [input]);

  const showResults = query.trim().length >= 2;

  return (
    <div className="relative mb-10 max-w-xl">
      <label htmlFor="dictionary-search" className="sr-only">
        Buscar términos en el diccionario
      </label>
      <input
        id="dictionary-search"
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Buscar términos (namtrik o español)…"
        className="w-full px-4 py-3 rounded-xl bg-background-dark/55 border border-primary/30 text-white placeholder:text-text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
      />
      {isFetching && showResults && (
        <span className="absolute right-3 top-3.5 text-xs text-text-muted">buscando…</span>
      )}

      {showResults && (
        <div className="absolute z-10 w-full mt-2 rounded-xl border border-primary/20 bg-background-dark/95 backdrop-blur-md shadow-lg max-h-80 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-text-muted">Buscando…</p>}
          {isError && <p className="p-4 text-sm text-primary">Error en la búsqueda.</p>}
          {data && data.data.length === 0 && (
            <p className="p-4 text-sm text-text-muted">Sin resultados para “{query}”.</p>
          )}
          {data?.data.map((word) => {
            const micro = word.microcampos?.[0]?.microcampo;
            const sub = micro?.subcampoSemantico;
            const campo = sub?.campoSemantico;
            const to =
              campo?.slug && sub?.slug && micro?.slug
                ? `/campos/${campo.slug}/${sub.slug}/${micro.slug}`
                : campo?.slug && sub?.slug
                  ? `/campos/${campo.slug}/${sub.slug}`
                  : campo?.slug
                    ? `/campos/${campo.slug}`
                    : '/campos';
            return (
              <Link
                key={word.id}
                to={to}
                className="block px-4 py-3 hover:bg-primary/10 transition-colors border-b border-primary/10 last:border-0"
              >
                <span className="font-display font-bold text-white">{word.namtrikTermino}</span>
                <span className="text-text-muted"> — {word.espanolTermino}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
