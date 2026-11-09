/**
 * AbbreviationBadge
 * Insignia accesible y responsiva de abreviaturas gramaticales (WCAG 2.2 SC 1.4.13).
 * - Renderiza el tooltip en `document.body` (`position: fixed`) acotado a los bordes del viewport
 *   para evitar recortes en contenedores con `overflow` o pantallas móviles desde 320px.
 * - Cuando `disabled={true}`, emite un `<abbr>` estático en lugar de `<button>` para cumplir la
 *   especificación HTML5 cuando se anida dentro de enlaces interactivos (`<Link role="option">`).
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  type AbreviaturaItem,
  ensureDynamicAbreviaturasLoaded,
  getDynamicAbreviaturasCatalog,
  parseComposedAbreviatura,
  subscribeAbreviaturasCatalog,
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

const SAFE_VIEWPORT_MARGIN = 12;
const MAX_TOOLTIP_WIDTH = 260;

interface TooltipPosition {
  left: number;
  width: number;
  arrowLeft: number;
  placement: 'top' | 'bottom';
  top?: number;
  bottom?: number;
}

interface AbbreviationPillProps {
  item: AbreviaturaItem;
  sizeClasses: string;
  disabled: boolean;
}

const AbbreviationPill = ({ item, sizeClasses, disabled }: AbbreviationPillProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<TooltipPosition | null>(null);
  const [isDarkScope, setIsDarkScope] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    const resolved = document.documentElement.dataset.adminResolved;
    if (resolved === 'light') return false;
    if (resolved === 'dark') return true;
    return !window.location.pathname.startsWith('/admin');
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isTouchRef = useRef(false);
  const tooltipId = useId();

  const detectThemeScope = useCallback(() => {
    if (typeof document === 'undefined') return true;
    const triggerEl = buttonRef.current ?? spanRef.current;
    if (triggerEl?.closest('.misak-public-scope')) return true;
    if (triggerEl?.closest('[data-admin-resolved="dark"]')) return true;
    if (triggerEl?.closest('[data-admin-resolved="light"]')) return false;
    const resolved = document.documentElement.dataset.adminResolved;
    if (resolved === 'light') return false;
    if (resolved === 'dark') return true;
    return !triggerEl?.closest('.misak-admin-scope');
  }, []);

  useEffect(() => {
    setIsDarkScope(detectThemeScope());
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkScope(detectThemeScope());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-admin-resolved', 'data-admin-theme'],
    });
    return () => observer.disconnect();
  }, [detectThemeScope]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 110);
  }, [clearCloseTimer]);

  const computePosition = useCallback(() => {
    const triggerEl = buttonRef.current;
    if (!triggerEl || typeof window === 'undefined') return;

    setIsDarkScope(detectThemeScope());

    const rect = triggerEl.getBoundingClientRect();
    const vw = Math.max(window.innerWidth || 360, 240);
    const vh = Math.max(window.innerHeight || 640, 320);

    const width = Math.min(MAX_TOOLTIP_WIDTH, vw - SAFE_VIEWPORT_MARGIN * 2);
    const triggerCenterX = rect.left + rect.width / 2;
    const idealLeft = triggerCenterX - width / 2;
    const clampedLeft = Math.max(
      SAFE_VIEWPORT_MARGIN,
      Math.min(idealLeft, vw - width - SAFE_VIEWPORT_MARGIN),
    );
    const arrowLeft = Math.max(16, Math.min(triggerCenterX - clampedLeft, width - 16));

    const spaceAbove = rect.top - SAFE_VIEWPORT_MARGIN;
    const spaceBelow = vh - rect.bottom - SAFE_VIEWPORT_MARGIN;
    const placement: 'top' | 'bottom' =
      spaceAbove >= 110 || spaceAbove >= spaceBelow ? 'top' : 'bottom';

    if (placement === 'top') {
      setCoords({
        left: clampedLeft,
        width,
        arrowLeft,
        placement: 'top',
        bottom: Math.max(SAFE_VIEWPORT_MARGIN, vh - rect.top + 8),
      });
    } else {
      setCoords({
        left: clampedLeft,
        width,
        arrowLeft,
        placement: 'bottom',
        top: Math.max(SAFE_VIEWPORT_MARGIN, rect.bottom + 8),
      });
    }
  }, [detectThemeScope]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computePosition();

    const handleViewportChange = () => {
      computePosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, computePosition]);

  // Cerrar al hacer clic/toque fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (target && !buttonRef.current?.contains(target) && !tooltipRef.current?.contains(target)) {
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

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    clearCloseTimer();
    setIsOpen((prev) => !prev);
  };

  const badgeToneClasses = isDarkScope
    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';

  const pillToneClasses = isDarkScope
    ? 'bg-indigo-900/60 text-indigo-200'
    : 'bg-indigo-100 text-indigo-800';

  const tooltipSurfaceClasses = isDarkScope
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const arrowSurfaceClasses = isDarkScope
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';

  const tooltipNode =
    isOpen && coords ? (
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        data-admin-resolved={isDarkScope ? 'dark' : 'light'}
        onMouseEnter={() => {
          if (!isTouchRef.current) clearCloseTimer();
        }}
        onMouseLeave={() => {
          if (!isTouchRef.current) scheduleClose();
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        style={{
          position: 'fixed',
          left: `${coords.left}px`,
          width: `${coords.width}px`,
          ...(coords.placement === 'top'
            ? { bottom: `${coords.bottom}px`, top: 'auto' }
            : { top: `${coords.top}px`, bottom: 'auto' }),
        }}
        className={cn(
          'z-[100] p-3 rounded-xl shadow-2xl text-left whitespace-normal break-words font-sans border',
          tooltipSurfaceClasses,
          'animate-in fade-in zoom-in-95 duration-150',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0',
              pillToneClasses,
            )}
          >
            {item.codigo}
          </span>
        </div>
        <h4
          className={cn(
            'text-sm font-semibold leading-snug break-words',
            isDarkScope ? 'text-slate-100' : 'text-slate-900',
          )}
        >
          {item.etiquetaCompleta}
        </h4>
        {/* Flecha indicadora anclada dinámicamente al centro del botón */}
        <div
          aria-hidden="true"
          style={{ left: `${coords.arrowLeft}px` }}
          className={cn(
            'absolute -translate-x-1/2 w-2.5 h-2.5 rotate-45',
            arrowSurfaceClasses,
            coords.placement === 'top'
              ? 'top-full -mt-1.5 border-r border-b'
              : 'bottom-full -mb-1.5 border-l border-t',
          )}
        />
      </div>
    ) : null;

  if (disabled) {
    return (
      <abbr
        ref={spanRef}
        title={`${item.codigo}: ${item.etiquetaCompleta}`}
        className={cn(
          'no-underline inline-flex items-center gap-1 font-mono font-medium rounded-md border cursor-default',
          sizeClasses,
          badgeToneClasses,
        )}
      >
        <span>{item.codigo}</span>
        <span className="sr-only">: {item.etiquetaCompleta}</span>
      </abbr>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-describedby={isOpen ? tooltipId : undefined}
        onPointerDown={(e) => {
          isTouchRef.current = e.pointerType === 'touch';
        }}
        onClick={handleClick}
        onMouseEnter={() => {
          if (isTouchRef.current) return;
          clearCloseTimer();
          setIsOpen(true);
        }}
        onMouseLeave={() => {
          if (isTouchRef.current) return;
          scheduleClose();
        }}
        onFocus={() => {
          if (isTouchRef.current) return;
          clearCloseTimer();
          setIsOpen(true);
        }}
        onBlur={scheduleClose}
        className={cn(
          'inline-flex items-center gap-1 font-mono font-medium rounded-md border transition-all duration-150 cursor-pointer',
          'hover:ring-2 hover:ring-current/25 focus:outline-none focus:ring-2 focus:ring-offset-1',
          sizeClasses,
          badgeToneClasses,
        )}
        aria-label={`${item.codigo}: ${item.etiquetaCompleta}`}
      >
        <span>{item.codigo}</span>
      </button>

      {tooltipNode &&
        (typeof document !== 'undefined' ? createPortal(tooltipNode, document.body) : tooltipNode)}
    </div>
  );
};

export const AbbreviationBadge = ({
  value,
  customCatalog,
  className,
  size = 'sm',
  disabled = false,
}: AbbreviationBadgeProps) => {
  const [dynamicCatalog, setDynamicCatalog] = useState<readonly AbreviaturaItem[]>(() =>
    getDynamicAbreviaturasCatalog(),
  );

  useEffect(() => {
    ensureDynamicAbreviaturasLoaded();
    return subscribeAbreviaturasCatalog(() => {
      setDynamicCatalog(getDynamicAbreviaturasCatalog());
    });
  }, []);

  const effectiveCatalog = customCatalog ?? dynamicCatalog;
  const items = parseComposedAbreviatura(value, effectiveCatalog);

  if (!value || items.length === 0) return null;

  const seenCounts = new Map<string, number>();
  const keyedItems = items.map((item) => {
    const count = (seenCounts.get(item.codigo) ?? 0) + 1;
    seenCounts.set(item.codigo, count);
    return { item, pillKey: count === 1 ? item.codigo : `${item.codigo}#${count}` };
  });

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }[size];

  return (
    <div className={cn('relative inline-flex items-center gap-1 select-none', className)}>
      {keyedItems.map(({ item, pillKey }) => (
        <AbbreviationPill key={pillKey} item={item} sizeClasses={sizeClasses} disabled={disabled} />
      ))}
    </div>
  );
};
