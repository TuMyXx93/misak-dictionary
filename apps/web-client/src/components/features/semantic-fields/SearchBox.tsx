/**
 * SearchBox
 * Spec 003 — Búsqueda bilingüe mobile-first con acentos #0055AA / #E52D6D
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
    if (!input) return;
  }, [input]);

  const showResults = query.trim().length >= 2;

  return (
    <div className="relative mb-10 max-w-2xl">
      <label htmlFor="dictionary-search" className="sr-only">
        Buscar términos en el diccionario
      </label>
      <div className="relative flex items-center">
        <svg
          aria-hidden="true"
          className="w-5 h-5 text-secondary-light absolute left-4 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="dictionary-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buscar términos (namtrik o español)…"
          className="w-full min-h-[48px] pl-11 pr-24 py-3 rounded-2xl bg-black/80 border border-[#0055AA]/55 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E52D6D] focus:ring-2 focus:ring-[#E52D6D]/45 transition-colors"
        />
        {isFetching && showResults && (
          <span className="absolute right-4 text-xs text-secondary-light">buscando…</span>
        )}
      </div>

      {showResults && (
        <div className="absolute z-20 w-full mt-2 rounded-2xl border border-[#0055AA]/50 bg-background-dark/95 backdrop-blur-md shadow-2xl max-h-80 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-gray-300">Buscando…</p>}
          {isError && <p className="p-4 text-sm text-primary-light">Error en la búsqueda.</p>}
          {data && data.data.length === 0 && (
            <p className="p-4 text-sm text-gray-300">Sin resultados para “{query}”.</p>
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
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-4 py-3.5 hover:bg-[#0055AA]/20 transition-colors border-b border-white/10 last:border-0"
              >
                <span className="font-display font-bold text-white break-words">
                  {word.namtrikTermino}
                </span>
                <span className="text-sm text-gray-300 break-words"> — {word.espanolTermino}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
