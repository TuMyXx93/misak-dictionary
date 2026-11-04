/**
 * SearchBox
 * Spec 009 — Buscador Bilingüe Accesible de Alto Rendimiento (WAI-ARIA Combobox)
 * - Cobertura bilingüe fluida en Namtrik y Español.
 * - Soporte WAI-ARIA Combobox completo (ArrowDown, ArrowUp, Enter, Escape).
 * - Lupa funcional de disparo inmediato y formulario semántico role="search".
 * - Erradicación de doble 'x' mediante type="text" con inputMode="search".
 * - Soporte de grafema oficial Namtrik ɵ (compatibilidad con variantes de teclado ø y ∅).
 * - Renderizado bilingüe enriquecido: Lema Namtrik en posición primaria (C1.3),
 *   categoría gramatical, badge de tipo de coincidencia, glosa en español y ruta taxonómica.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchTerms } from '@/hooks/useDictionary';
import type { SearchResultWord } from '@/services/dictionaryApi';
import { cn } from '@/utils/cn';
import { NAMTRIK_VOWEL_LOWER } from '@/utils/namtrikText';

export const SearchBox = () => {
  const [input, setInput] = useState('');
  const [immediateQuery, setImmediateQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const navigate = useNavigate();

  const debouncedInput = useDebounce(input, 280);
  const activeQuery = immediateQuery || debouncedInput;
  const { data, isLoading, isError, isFetching } = useSearchTerms(activeQuery);

  const showResults = isOpen && activeQuery.trim().length >= 2;
  const results = data?.data ?? [];

  // Reset selectedIndex al cambiar la consulta
  useEffect(() => {
    setSelectedIndex(-1);
    if (activeQuery.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [activeQuery]);

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

  // Disparo inmediato de búsqueda desde la lupa o formulario
  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length >= 2) {
      setImmediateQuery(trimmed);
      setIsOpen(true);
    }
  };

  // Manejo de teclado WAI-ARIA Combobox
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') {
        setInput('');
        setImmediateQuery('');
      } else if (e.key === 'Enter') {
        handleFormSubmit(e);
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
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const target = results[selectedIndex];
          if (target) {
            setIsOpen(false);
            navigate(resolveTargetRoute(target));
          }
        } else if (results.length > 0) {
          const first = results[0];
          if (first) {
            setIsOpen(false);
            navigate(resolveTargetRoute(first));
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
    setImmediateQuery('');
    setSelectedIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInsertChar = (char: string) => {
    setInput((prev) => `${prev}${char}`);
    setImmediateQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative mb-10 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="dictionary-search" className="text-xs font-semibold text-text-muted">
          Buscador bilingüe Namtrik · Castellano
        </label>
        {/* Atajo rápido para grafía Namtrik ɵ (suprimido ɨ por no usarse en Namtrik) */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-light">
          <span className="text-[11px] text-text-disabled">Insertar grafema:</span>
          <button
            type="button"
            onClick={() => handleInsertChar(NAMTRIK_VOWEL_LOWER)}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#0055AA]/40 text-white font-display font-bold text-sm transition-colors cursor-pointer"
            style={{ fontKerning: 'normal', fontSynthesis: 'none' }}
            title="Insertar vocal central ɵ (también se aceptan variantes de teclado ø y ∅)"
            aria-label="ɵ"
          >
            {NAMTRIK_VOWEL_LOWER}
          </button>
        </div>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: Elemento <search> genera warning en JSDOM/React 19 */}
      <form onSubmit={handleFormSubmit} role="search" className="relative flex items-center w-full">
        {/* Botón interactivo de Lupa para búsqueda inmediata */}
        <button
          type="submit"
          aria-label="Buscar inmediatamente"
          className="absolute left-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center text-secondary-light hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
          </svg>
        </button>

        {/* Input tipo text para erradicar la X nativa del navegador WebKit/Chromium */}
        <input
          ref={inputRef}
          id="dictionary-search"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setImmediateQuery('');
            setIsOpen(true);
          }}
          onFocus={() => {
            if (input.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digita un término"
          className="w-full min-h-[48px] pl-12 pr-24 py-3 rounded-2xl bg-black/85 border border-[#0055AA]/60 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E52D6D] focus:ring-2 focus:ring-[#E52D6D]/45 transition-colors shadow-lg [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />

        {/* Controles de estado derecho (única 'X' y estado buscando) */}
        <div className="absolute right-3 z-10 flex items-center gap-2">
          {input && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 focus:outline-none focus-visible:ring-1 focus-visible:ring-white transition-colors cursor-pointer"
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
      </form>

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
            <p className="p-4 text-sm text-gray-300">Sin resultados para “{activeQuery}”.</p>
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
                {/* Lema Namtrik primario + glosa español + badges */}
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
                    {word.coincidencia === 'exacta' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#E52D6D]/25 text-pink-200 border border-[#E52D6D]/50 uppercase tracking-wider">
                        Exacta
                      </span>
                    )}
                    {word.coincidencia === 'prefijo' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#0055AA]/25 text-blue-200 border border-[#0055AA]/50 uppercase tracking-wider">
                        Prefijo
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
