/**
 * AbbreviationBadge
 * Spec 012 (R-012, R-017) — Componente accesible de insignias lingüísticas y gramaticales
 * - Muestra la abreviatura oficial con tooltip en escritorio (hover/focus)
 *   y popover interactivo en móvil (tap táctil con stopPropagation).
 * - Desglosa abreviaturas compuestas ("s., loc. nom.").
 * - Colores semánticos diferenciados por dimensión (categoría, variante, rasgo, origen, dominio).
 */

import { useEffect, useRef, useState } from 'react';
import {
  type AbreviaturaItem,
  type DimensionAbreviatura,
  parseComposedAbreviatura,
} from '@/constants/abreviaturas';
import { cn } from '@/utils/cn';

export interface AbbreviationBadgeProps {
  /** Código o texto crudo de la abreviatura (ej. "s.", "v.", "loc. nom.") */
  value?: string | null;
  /** Catálogo opcional dinámico descargado de BD */
  customCatalog?: readonly AbreviaturaItem[];
  /** Clases CSS adicionales para el contenedor de la insignia */
  className?: string;
  /** Tamaño de la insignia */
  size?: 'xs' | 'sm' | 'md';
  /** Si es true, desactiva el popover interactivo (solo visual) */
  disabled?: boolean;
}

const DIMENSION_STYLES: Record<DimensionAbreviatura, { badge: string; pill: string }> = {
  categoria: {
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    pill: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
  },
  variante: {
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  },
  rasgo: {
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  origen: {
    badge:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  },
  dominio: {
    badge:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
  },
};

export const AbbreviationBadge = ({
  value,
  customCatalog,
  className,
  size = 'sm',
  disabled = false,
}: AbbreviationBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = parseComposedAbreviatura(value, customCatalog);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!value || items.length === 0) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }[size];

  const togglePopover = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center gap-1 select-none', className)}
    >
      {items.map((item) => {
        const style = DIMENSION_STYLES[item.dimension] ?? DIMENSION_STYLES.categoria;
        return (
          <div key={`${item.codigo}-${item.dimension}`} className="relative group inline-flex">
            <button
              type="button"
              onClick={togglePopover}
              onMouseEnter={() => !disabled && setIsOpen(true)}
              onMouseLeave={() => !disabled && setIsOpen(false)}
              className={cn(
                'inline-flex items-center gap-1 font-mono font-medium rounded-md border transition-all duration-150',
                'hover:ring-2 hover:ring-current/20 focus:outline-none focus:ring-2 focus:ring-offset-1',
                sizeClasses,
                style.badge,
                disabled && 'cursor-default pointer-events-none',
              )}
              title={`${item.etiquetaCompleta}${item.descripcion ? `: ${item.descripcion}` : ''}`}
              aria-label={`${item.codigo}: ${item.etiquetaCompleta}`}
            >
              <span>{item.codigo}</span>
            </button>

            {/* Popover / Tooltip */}
            {isOpen && (
              <div
                role="tooltip"
                className={cn(
                  'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[85vw]',
                  'p-3 rounded-lg shadow-xl text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
                  'animate-in fade-in zoom-in-95 duration-150',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span
                    className={cn(
                      'text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded',
                      style.pill,
                    )}
                  >
                    {item.codigo}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-400">
                    {item.dimension}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {item.etiquetaCompleta}
                </h4>
                {item.descripcion && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.descripcion}
                  </p>
                )}
                {/* Flecha indicadora */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 rotate-45" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
