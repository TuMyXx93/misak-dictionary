/**
 * SearchBox
 * Spec 009 — Buscador Bilingüe Accesible de Alto Rendimiento (WAI-ARIA Combobox)
 * - Cobertura bilingüe fluida en Namtrik y Español.
 * - Soporte WAI-ARIA Combobox completo (ArrowDown, ArrowUp, Enter, Escape).
 * - Renderizado bilingüe enriquecido: Lema Namtrik en posición primaria (C1.3),
 *   categoría gramatical, glosa en español y ruta jerárquica canónica.
 * - Botón de limpieza rápida e inserción asistida de grafemas Namtrik (ɵ, ɨ).
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchTerms } from '@/hooks/useDictionary';
import type { SearchResultWord } from '@/services/dictionaryApi';
import { cn } from '@/utils/cn';

export const SearchBox = () => {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const navigate = useNavigate();

  const query = useDebounce(input, 280);
  const { data, isLoading, isError, isFetching } = useSearchTerms(query);

  const showResults = isOpen && query.trim().length >= 2;
  const results = data?.data ?? [];

  // Reset selectedIndex al cambiar la consulta
  useEffect(() => {
    setSelectedIndex(-1);
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [query]);

  // Resolver la ruta destino para un resultado (usa ubicación enriquecida o jerarquía microcampos)
  const resolveTargetRoute = (word: SearchResultWord): string => {
    if (word.ubicacion?.ruta) {
      return word.ubicacion.ruta;
    }
    const micro = word.microcampos?.[0]?.microcampo;
    const sub = micro?.subcampoSemantico;
    const campo = sub?.campoSemantico;
    if (campo?.slug && sub?.slug && micro?.slug) {
      return `/campos/${campo.slug}/${sub.slug}/${micro.slug}`;
    }
    if (campo?.slug && sub?.slug) {
      return `/campos/${campo.slug}/${sub.slug}`;
    }
    if (campo?.slug) {
      return `/campos/${campo.slug}`;
    }
    return '/campos';
  };

  // Manejo de teclado WAI-ARIA Combobox
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') {
        setInput('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          const target = results[selectedIndex];
          if (target) {
            setIsOpen(false);
            navigate(resolveTargetRoute(target));
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setInput('');
    setSelectedIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInsertChar = (char: string) => {
    setInput((prev) => `${prev}${char}`);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative mb-10 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="dictionary-search" className="text-xs font-semibold text-text-muted">
          Buscador bilingüe Namtrik · Español
        </label>
        {/* Atajos rápidos para grafías Namtrik */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-light">
          <span className="text-[11px] text-text-disabled">Insertar grafema:</span>
          <button
            type="button"
            onClick={() => handleInsertChar('ɵ')}
            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-[#0055AA]/40 text-white font-mono font-bold transition-colors"
            title="Insertar vocal central ɵ"
          >
            ɵ
          </button>
          <button
            type="button"
            onClick={() => handleInsertChar('ɨ')}
            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-[#0055AA]/40 text-white font-mono font-bold transition-colors"
            title="Insertar vocal alta ɨ"
          >
            ɨ
          </button>
        </div>
      </div>

      <div className="relative flex items-center">
        {/* Icono de Lupa */}
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
          ref={inputRef}
          id="dictionary-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (input.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar términos (namtrik o español)…"
          className="w-full min-h-[48px] pl-11 pr-24 py-3 rounded-2xl bg-black/85 border border-[#0055AA]/60 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E52D6D] focus:ring-2 focus:ring-[#E52D6D]/45 transition-colors shadow-lg"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {input && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 transition-colors"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {isFetching && showResults && (
            <span className="text-xs text-secondary-light font-medium animate-pulse">
              buscando…
            </span>
          )}
        </div>
      </div>

      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute z-30 w-full mt-2 rounded-2xl border border-[#0055AA]/65 bg-[#07090d]/98 backdrop-blur-xl shadow-2xl max-h-96 overflow-y-auto divide-y divide-white/10"
        >
          {isLoading && <p className="p-4 text-sm text-gray-300">Buscando…</p>}
          {isError && <p className="p-4 text-sm text-primary-light">Error en la búsqueda.</p>}
          {!isLoading && results.length === 0 && (
            <p className="p-4 text-sm text-gray-300">Sin resultados para “{query}”.</p>
          )}

          {results.map((word, index) => {
            const isSelected = selectedIndex === index;
            const targetRoute = resolveTargetRoute(word);
            const ub = word.ubicacion;
            const breadcrumb = [
              ub?.campoNombre || ub?.campoSlug,
              ub?.subcampoNombre || ub?.subcampoSlug,
              ub?.microcampoNombre || ub?.microcampoSlug,
            ]
              .filter(Boolean)
              .join(' › ');

            return (
              <Link
                key={word.id}
                id={`search-item-${index}`}
                role="option"
                aria-selected={isSelected}
                to={targetRoute}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3.5 transition-colors text-left',
                  isSelected ? 'bg-[#0055AA]/35 border-l-4 border-l-[#E52D6D]' : 'hover:bg-white/8',
                )}
              >
                {/* Lema Namtrik primario + glosa español */}
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-white text-base tracking-wide">
                      {word.namtrikTermino || word.codigo || 'Término'}
                    </span>
                    {word.categoriaGramatical && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-secondary-light uppercase tracking-wider">
                        {word.categoriaGramatical}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-300 mt-0.5">
                    — {word.espanolTermino || 'Sin glosa disponible'}
                  </span>
                </div>

                {/* Ruta taxonómica */}
                {breadcrumb && (
                  <span className="shrink-0 text-[11px] font-medium text-secondary-light/90 bg-[#0055AA]/20 border border-[#0055AA]/40 px-2.5 py-1 rounded-lg">
                    {breadcrumb}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
