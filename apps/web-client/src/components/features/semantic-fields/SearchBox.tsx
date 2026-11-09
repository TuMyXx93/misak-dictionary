/**
 * SearchBox
 * Spec 009 · Spec 012 (v0.3.0: R-019, R-020, R-021) — Buscador Bilingüe Accesible
 * - Cobertura bilingüe fluida en Namtrik y Español con ranking multinivel semaforizado.
 * - WAI-ARIA Combobox completo + Auto-Scroll determinista acotado al listbox (container.scrollTop).
 * - Navegación "Keyboard Geek" tipo Command Palette:
 *   - ArrowDown / ArrowUp (con wrap-around exacto desde -1 a N-1)
 *   - Ctrl+N / Ctrl+P (home-row next/prev)
 *   - PageDown / PageUp (salto rápido ±5)
 *   - Ctrl+Home / Ctrl+End (inicio/fin sin secuestrar Home/End nativos del cursor de texto)
 *   - Ctrl+Enter / ⌘+Enter (abrir resultado en nueva pestaña noopener,noreferrer)
 *   - Alt+O (insertar grafema Namtrik ɵ en la posición exacta del cursor selectionStart..selectionEnd)
 *   - Ctrl+U (limpiar consulta manteniendo el foco)
 * - Bloqueo anti "ghost hover" entre teclado y puntero (navModeRef).
 * - Guardia de composición IME / dead-keys (isComposing / keyCode 229 / composición reciente < 50ms).
 * - Variantes 'inline' (/campos) y 'modal' (GlobalSearchModal en flujo flex adaptable a visualViewport).
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AbbreviationBadge } from '@/components/ui/AbbreviationBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchTerms } from '@/hooks/useDictionary';
import type { SearchResultWord } from '@/services/dictionaryApi';
import { cn } from '@/utils/cn';
import { NAMTRIK_VOWEL_LOWER, NAMTRIK_VOWEL_UPPER } from '@/utils/namtrikText';

const SCROLL_PADDING = 6;
const PAGE_JUMP_STEP = 5;

export interface SearchBoxProps {
  /** Modo de presentación: 'inline' en /campos o 'modal' dentro de GlobalSearchModal */
  variant?: 'inline' | 'modal';
  /** Enfoca automáticamente el input al montar */
  autoFocus?: boolean;
  /** ID explícito del campo de entrada */
  inputId?: string;
  /** Callback tras seleccionar un resultado */
  onNavigate?: () => void;
}

export const SearchBox = ({
  variant = 'inline',
  autoFocus = false,
  inputId = 'dictionary-search',
  onNavigate,
}: SearchBoxProps = {}) => {
  const [input, setInput] = useState('');
  const [immediateQuery, setImmediateQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const navModeRef = useRef<'keyboard' | 'pointer'>('pointer');
  const lastCompositionEndRef = useRef<number>(Number.NEGATIVE_INFINITY);

  const listboxId = useId();
  const navigate = useNavigate();

  const debouncedInput = useDebounce(input, 280);
  const activeQuery = immediateQuery || debouncedInput;
  const { data, isLoading, isError, isFetching } = useSearchTerms(activeQuery);

  const showResults = isOpen && activeQuery.trim().length >= 1;
  const results = data?.data ?? [];

  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

  // Auto-foco determinista cuando se monta dentro del modal global
  useLayoutEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.setAttribute('autofocus', '');
    inputRef.current?.focus({ preventScroll: true });
    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [autoFocus]);

  // Reset selectedIndex al cambiar la consulta
  useEffect(() => {
    setSelectedIndex(-1);
    if (activeQuery.trim().length >= 1) {
      setIsOpen(true);
    }
  }, [activeQuery]);

  // Cierre automático al hacer clic/toque fuera o al salir el foco por Tab en modo inline (/campos)
  useEffect(() => {
    if (variant !== 'inline' || !isOpen) return;
    const containerEl = containerRef.current;

    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const nextFocused = e.relatedTarget as Node | null;
      if (!nextFocused || containerRef.current?.contains(nextFocused)) {
        return;
      }
      setIsOpen(false);
      setSelectedIndex(-1);
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    containerEl?.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      containerEl?.removeEventListener('focusout', handleFocusOut);
    };
  }, [variant, isOpen]);

  // Auto-scroll determinista acotado exclusivamente al contenedor listbox (sin desplazar window/ancestros)
  useLayoutEffect(() => {
    if (!showResults || selectedIndex < 0) return;
    const container = listboxRef.current;
    if (!container) return;

    const activeItem = container.querySelector<HTMLElement>(
      `[data-option-index="${selectedIndex}"]`,
    );
    if (!activeItem) return;

    // Fallback para entornos de test sin motor de geometría (clientHeight === 0)
    if (container.clientHeight <= 0) {
      activeItem.scrollIntoView?.({ block: 'nearest' });
      return;
    }

    if (selectedIndex === 0) {
      container.scrollTop = 0;
      return;
    }

    if (selectedIndex === results.length - 1) {
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      return;
    }

    const itemTop = activeItem.offsetTop;
    const itemBottom = itemTop + activeItem.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (itemTop - SCROLL_PADDING < viewTop) {
      container.scrollTop = Math.max(0, itemTop - SCROLL_PADDING);
    } else if (itemBottom + SCROLL_PADDING > viewBottom) {
      container.scrollTop = itemBottom + SCROLL_PADDING - container.clientHeight;
    }
  }, [selectedIndex, showResults, results.length]);

  // Anuncio accesible con debounce para no saturar lectores de pantalla mientras se teclea
  const rawAnnouncement =
    !showResults || isLoading
      ? ''
      : isError
        ? 'Fallo al consultar el diccionario.'
        : results.length === 0
          ? 'Cero coincidencias encontradas.'
          : results.length === 1
            ? '1 resultado disponible.'
            : `${results.length} resultados disponibles.`;
  const debouncedAnnouncement = useDebounce(rawAnnouncement, 350);

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
    if (trimmed.length >= 1) {
      setImmediateQuery(trimmed);
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setInput('');
    setImmediateQuery('');
    setSelectedIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus({ preventScroll: true });
  };

  // Inserción de grafema Namtrik respetando posición exacta del cursor / selección activa
  const handleInsertChar = (char: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    const nextValue = `${input.slice(0, start)}${char}${input.slice(end)}`;
    const nextCaret = start + char.length;

    setInput(nextValue);
    setImmediateQuery('');
    setIsOpen(true);

    if (el) {
      el.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        try {
          el.setSelectionRange(nextCaret, nextCaret);
        } catch {
          // Ignorar si el input no admite rango de selección
        }
      });
    }
  };

  const handleSelectWord = (word: SearchResultWord, openInNewTab: boolean) => {
    const route = resolveTargetRoute(word);
    if (openInNewTab) {
      window.open(route, '_blank', 'noopener,noreferrer');
      return;
    }
    setIsOpen(false);
    onNavigate?.();
    navigate(route);
  };

  // Manejo de teclado WAI-ARIA Combobox + Suite Command-Palette ("Keyboard Geek")
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Guardia IME / teclas muertas: nunca confirmar selección mientras se compone un carácter
    const isComposing =
      e.nativeEvent.isComposing ||
      e.keyCode === 229 ||
      Math.abs(e.timeStamp - lastCompositionEndRef.current) < 50;
    if (isComposing) {
      return;
    }

    // Atajo Alt+O: insertar vocal Namtrik ɵ / Ɵ en el cursor sin mover las manos al ratón
    if (
      e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      (e.code === 'KeyO' || e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'ø')
    ) {
      e.preventDefault();
      handleInsertChar(e.shiftKey ? NAMTRIK_VOWEL_UPPER : NAMTRIK_VOWEL_LOWER);
      return;
    }

    // Atajo Ctrl+U (estilo terminal/CLI): limpiar entrada de inmediato manteniendo el foco
    if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      handleClear();
      return;
    }

    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') {
        if (variant === 'inline') {
          if (showResults) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
            setSelectedIndex(-1);
          } else if (input.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setInput('');
            setImmediateQuery('');
          }
        }
      } else if (e.key === 'Enter') {
        handleFormSubmit(e);
      } else if (e.key === 'ArrowDown' && input.trim().length >= 1 && !isOpen) {
        e.preventDefault();
        navModeRef.current = 'keyboard';
        setIsOpen(true);
      }
      return;
    }

    // Ctrl+N / Ctrl+P: navegación home-row sin soltar la fila central del teclado
    if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      navModeRef.current = 'keyboard';
      setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % results.length));
      return;
    }

    if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      navModeRef.current = 'keyboard';
      setSelectedIndex((prev) =>
        prev < 0 ? results.length - 1 : (prev - 1 + results.length) % results.length,
      );
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navModeRef.current = 'keyboard';
        setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % results.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        navModeRef.current = 'keyboard';
        setSelectedIndex((prev) =>
          prev < 0 ? results.length - 1 : (prev - 1 + results.length) % results.length,
        );
        break;
      case 'PageDown':
        e.preventDefault();
        navModeRef.current = 'keyboard';
        setSelectedIndex((prev) =>
          prev < 0
            ? Math.min(PAGE_JUMP_STEP - 1, results.length - 1)
            : Math.min(results.length - 1, prev + PAGE_JUMP_STEP),
        );
        break;
      case 'PageUp':
        e.preventDefault();
        navModeRef.current = 'keyboard';
        setSelectedIndex((prev) => (prev < 0 ? 0 : Math.max(0, prev - PAGE_JUMP_STEP)));
        break;
      case 'Home':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          navModeRef.current = 'keyboard';
          setSelectedIndex(0);
        }
        break;
      case 'End':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          navModeRef.current = 'keyboard';
          setSelectedIndex(results.length - 1);
        }
        break;
      case 'Enter': {
        e.preventDefault();
        const target =
          selectedIndex >= 0 && selectedIndex < results.length
            ? results[selectedIndex]
            : results[0];
        if (target) {
          handleSelectWord(target, e.ctrlKey || e.metaKey);
        }
        break;
      }
      case 'Escape':
        if (variant === 'inline') {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;
    }
  };

  const isModal = variant === 'modal';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full',
        isModal ? 'flex flex-1 min-h-0 flex-col' : 'mb-10 max-w-2xl',
      )}
    >
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {debouncedAnnouncement}
      </output>

      <div className="flex shrink-0 items-center justify-between mb-2 gap-2">
        <label htmlFor={inputId} className="text-xs font-semibold text-text-muted">
          Buscador bilingüe Namtrik · Castellano
        </label>
        {/* Atajo rápido para grafía Namtrik ɵ (suprimido ɨ por no usarse en Namtrik) */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-light">
          <span className="text-[11px] text-text-disabled hidden xs:inline">Insertar grafema:</span>
          <button
            type="button"
            onClick={() => handleInsertChar(NAMTRIK_VOWEL_LOWER)}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#0055AA]/40 text-white font-display font-bold text-sm transition-colors cursor-pointer"
            style={{ fontKerning: 'normal', fontSynthesis: 'none' }}
            title="Insertar vocal central ɵ (Alt+O · también se aceptan variantes ø y ∅)"
            aria-label="ɵ"
          >
            {NAMTRIK_VOWEL_LOWER}
          </button>
        </div>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: Elemento <search> genera warning en JSDOM/React 19 */}
      <form
        onSubmit={handleFormSubmit}
        role="search"
        className="relative flex shrink-0 items-center w-full"
      >
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
          id={inputId}
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
          aria-activedescendant={
            showResults && selectedIndex >= 0 && selectedIndex < results.length
              ? getOptionId(selectedIndex)
              : undefined
          }
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setImmediateQuery('');
            setIsOpen(true);
          }}
          onCompositionEnd={(e) => {
            lastCompositionEndRef.current = e.timeStamp;
          }}
          onFocus={() => {
            if (input.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digita un término"
          className="w-full min-h-[48px] pl-12 pr-24 py-3 rounded-2xl bg-black/85 border border-[#0055AA]/60 text-white text-base placeholder:text-gray-400 focus:outline-none focus:border-[#E52D6D] focus:ring-2 focus:ring-[#E52D6D]/45 transition-colors shadow-lg [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
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
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className={cn(
            'w-full rounded-2xl border border-[#0055AA]/65 bg-[#07090d]/98 backdrop-blur-xl shadow-2xl overflow-y-auto overscroll-contain divide-y divide-white/10',
            isModal
              ? 'relative mt-3 flex-1 min-h-0 max-h-[min(26rem,55dvh)]'
              : 'absolute z-30 mt-2 max-h-96',
          )}
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
                id={getOptionId(index)}
                data-option-index={index}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                to={targetRoute}
                onPointerMove={(e) => {
                  if (e.pointerType !== 'mouse') return;
                  const native = e.nativeEvent;
                  if (
                    navModeRef.current === 'keyboard' &&
                    (native.movementX ?? 0) === 0 &&
                    (native.movementY ?? 0) === 0
                  ) {
                    return;
                  }
                  navModeRef.current = 'pointer';
                  if (selectedIndex !== index) {
                    setSelectedIndex(index);
                  }
                }}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    return;
                  }
                  setIsOpen(false);
                  onNavigate?.();
                }}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3.5 transition-colors text-left',
                  isSelected
                    ? 'bg-[#0055AA]/35 border-l-4 border-l-[#E52D6D]'
                    : 'border-l-4 border-l-transparent',
                )}
              >
                {/* Lema Namtrik primario + glosa español + badges */}
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-white text-base tracking-wide">
                      {word.namtrikTermino || word.codigo || 'Término'}
                    </span>
                    {/* Semaforización por nivel jerárquico */}
                    {word.tipoResultado === 'campo' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E52D6D]/20 text-pink-300 border border-[#E52D6D]/50 uppercase tracking-wider">
                        <span>🏛️ CAMPO · NIVEL 1</span>
                        {typeof word.totalTerminos === 'number' && (
                          <span className="opacity-80 font-mono">({word.totalTerminos})</span>
                        )}
                      </span>
                    )}
                    {word.tipoResultado === 'subcampo' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0055AA]/30 text-sky-300 border border-[#0055AA]/60 uppercase tracking-wider">
                        <span>📁 SUBCAMPO · NIVEL 2</span>
                        {typeof word.totalTerminos === 'number' && (
                          <span className="opacity-80 font-mono">({word.totalTerminos})</span>
                        )}
                      </span>
                    )}
                    {word.tipoResultado === 'microcampo' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 uppercase tracking-wider">
                        <span>🌿 MICROCAMPO · NIVEL 3</span>
                        {typeof word.totalTerminos === 'number' && (
                          <span className="opacity-80 font-mono">
                            ({word.totalTerminos} términos)
                          </span>
                        )}
                      </span>
                    )}
                    {word.tipoResultado === 'subnivel' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase tracking-wider">
                        <span>🔖 SUBNIVEL · NIVEL 4</span>
                        {typeof word.totalTerminos === 'number' && (
                          <span className="opacity-80 font-mono">
                            ({word.totalTerminos} términos)
                          </span>
                        )}
                      </span>
                    )}
                    {(!word.tipoResultado || word.tipoResultado === 'termino') && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/40 uppercase tracking-wider">
                        Término
                      </span>
                    )}

                    {/* Categoría gramatical estática (HTML5 válido sin <button> anidado en <Link>) */}
                    {word.categoriaGramatical && (
                      <AbbreviationBadge value={word.categoriaGramatical} size="xs" disabled />
                    )}

                    {/* Badges de fuente de coincidencia */}
                    {word.campoCoincidencia === 'cientifico' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-500/25 text-teal-200 border border-teal-500/50 uppercase tracking-wider">
                        Científico
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
                    {word.campoCoincidencia === 'equivalencia' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#0055AA]/30 text-sky-200 border border-[#0055AA]/60 uppercase tracking-wider">
                        {word.terminoEquivalente
                          ? `Equivalencia: ${word.terminoEquivalente}`
                          : 'Equivalencia'}
                      </span>
                    )}
                    {word.campoCoincidencia === 'explicacion' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 uppercase tracking-wider">
                        En descripción
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-sm text-gray-300 mt-0.5">
                    {(() => {
                      const rawGlosa = word.espanolTermino || 'Sin glosa disponible';
                      const rawSci =
                        word.nombreCientifico
                          ?.trim()
                          .replace(/^\(|\)$/g, '')
                          .trim() || null;
                      let cleanGlosa = rawGlosa.trim();
                      if (rawSci) {
                        const escapedSci = rawSci.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        cleanGlosa = cleanGlosa
                          .replace(new RegExp(`\\s*\\(${escapedSci}\\)[.;,]?$`, 'i'), '')
                          .trim();
                      }
                      return (
                        <span>
                          — {cleanGlosa}
                          {rawSci && (
                            <span className="text-white/95 font-medium">
                              {' ('}
                              <span className="text-emerald-300 font-sans font-normal">
                                {rawSci}
                              </span>
                              {')'}
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                  {word.campoCoincidencia === 'explicacion' && word.extractoCoincidencia && (
                    <span className="text-xs text-gray-300 font-sans mt-1 line-clamp-2">
                      “{word.extractoCoincidencia}”
                    </span>
                  )}
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
