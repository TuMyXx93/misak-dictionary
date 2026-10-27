import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { SemanticFieldIcon } from './SemanticFieldIcon';

export type SemanticFieldButtonVariant = 'field-node' | 'global-catalog';
export type SemanticFieldLayoutMode =
  | 'spatial'
  | 'grid-tablet'
  | 'grid-landscape-compact'
  | 'grid-mobile';

export interface SemanticFieldButtonProps {
  /** Variante: 'field-node' (1..7 campos) o 'global-catalog' (8.º botón hacia /campos) */
  variant?: SemanticFieldButtonVariant;
  /** Configuración del campo semántico o del catálogo */
  field: SemanticFieldSummary;
  /** Índice opcional para alternancia cromática Misak */
  index?: number;
  /** Callback al interactuar con el botón */
  onClick?: () => void;
  /** Modo de disposición responsivo */
  layoutMode?: SemanticFieldLayoutMode;
  /** Compatibilidad hacia atrás para prop isMobile */
  isMobile?: boolean;
  /** Ruta destino (usado en variant='global-catalog') */
  to?: string;
  className?: string;
}

const AUTO_COLLAPSE_NODE_MS = 2500;
const AUTO_COLLAPSE_GLOBAL_MS = 3500;

const MotionLink = motion.create(Link);

export const SemanticFieldButton = ({
  variant = 'field-node',
  field,
  index = 0,
  onClick,
  layoutMode,
  isMobile = false,
  to,
  className,
}: SemanticFieldButtonProps) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  // Si no se especifica layoutMode, se deriva de isMobile (por defecto spatial en desktop)
  const resolvedMode: SemanticFieldLayoutMode =
    layoutMode ?? (isMobile ? 'grid-mobile' : 'spatial');
  const isSpatial = resolvedMode === 'spatial';

  // En modo spatial: el botón global inicia expandido (para auto-contraerse a los 3.5s) y los nodos inician contraídos.
  // En grid siempre expandidos.
  const [isExpanded, setIsExpanded] = useState(!isSpatial || variant === 'global-catalog');
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isTouchRef = useRef(false);

  // Safe-area clamping: acotamos las coordenadas porcentuales para evitar cualquier desbordamiento
  const safeX = Math.min(Math.max(field.position?.x ?? 50, 14), 86);
  const safeY = Math.min(Math.max(field.position?.y ?? 50, 14), 84);
  const expandDirection = useRef<'right' | 'left'>(safeX < 50 ? 'right' : 'left');

  // Alternancia armónica entre los colores vivos oficiales de la bandera Misak (#E52D6D y #0055AA)
  const isBlueAccent = index % 2 === 1;

  useEffect(() => {
    isTouchRef.current = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const cancelCollapse = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  const scheduleCollapse = useCallback(() => {
    cancelCollapse();
    const ms = variant === 'global-catalog' ? AUTO_COLLAPSE_GLOBAL_MS : AUTO_COLLAPSE_NODE_MS;
    collapseTimer.current = setTimeout(() => setIsExpanded(false), ms);
  }, [variant, cancelCollapse]);

  useEffect(() => {
    if (!isSpatial) {
      setIsExpanded(true);
      return;
    }

    if (variant === 'global-catalog') {
      setIsExpanded(true);
      scheduleCollapse();
    } else {
      setIsExpanded(false);
    }

    return () => cancelCollapse();
  }, [isSpatial, variant, scheduleCollapse, cancelCollapse]);

  const handleMouseEnter = () => {
    if (!isSpatial || isTouchRef.current) return;
    cancelCollapse();
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!isSpatial || isTouchRef.current) return;
    cancelCollapse();
    setIsExpanded(false);
  };

  const handleFocus = () => {
    if (!isSpatial) return;
    cancelCollapse();
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!isSpatial) return;
    cancelCollapse();
    setIsExpanded(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isSpatial) {
      onClick?.();
      return;
    }
    if (isTouchRef.current) {
      if (!isExpanded) {
        e.preventDefault();
        setIsExpanded(true);
        scheduleCollapse();
      } else {
        onClick?.();
        setIsExpanded(false);
        cancelCollapse();
      }
    } else {
      onClick?.();
    }
  };

  // --------------------------------------------------------------------------
  // VARIANTE: 'global-catalog' (8.º botón hacia /campos con texto "Campos Semánticos")
  // Sin punto magenta, sin flecha de dirección, con icono SVG "cosmos-grid",
  // paleta institucional de alto contraste y comportamiento contraíble homologado.
  // --------------------------------------------------------------------------
  if (variant === 'global-catalog') {
    const globalContent = (
      <>
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 border border-white/30 text-white shrink-0 group-hover:bg-[#E52D6D] group-hover:border-white/60 transition-colors"
          aria-hidden="true"
        >
          <SemanticFieldIcon iconKey={field.iconKey ?? 'cosmos-grid'} className="w-4 h-4" />
        </span>
        <AnimatePresence initial={false}>
          {(isExpanded || !isSpatial) && (
            <motion.span
              key="global-label"
              initial={isSpatial ? { opacity: 0, width: 0 } : { opacity: 1, width: 'auto' }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={isSpatial ? { opacity: 0, width: 0 } : undefined}
              transition={{ duration: 0.2 }}
              className="font-display font-bold text-sm tracking-wide text-white drop-shadow-xs whitespace-nowrap overflow-hidden pr-1"
            >
              {field.name || 'Campos semánticos'}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    );

    const globalClasses = cn(
      'group inline-flex items-center min-h-[48px] rounded-full',
      'bg-gradient-to-r from-[#0055AA] via-[#082245] to-[#2B0818] text-white',
      'border border-white/40 hover:border-white/90 shadow-xl shadow-black/60',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
      'transition-[border-color,background-color,shadow] duration-200 select-none cursor-pointer',
      isSpatial
        ? isExpanded
          ? 'px-5 py-2.5 gap-3'
          : 'w-12 h-12 md:w-13 md:h-13 min-h-[48px] min-w-[48px] justify-center p-0'
        : 'w-full max-w-sm px-5 py-3 rounded-2xl gap-3 justify-center text-center',
      className,
    );

    if (to) {
      return (
        <MotionLink
          to={to}
          layout={!prefersReducedMotion}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={`Acceder a ${field.name || 'Campos semánticos'}: Catálogo general del diccionario`}
          className={globalClasses}
          whileHover={!isSpatial || isTouchRef.current ? {} : { scale: 1.05 }}
          whileFocus={!isSpatial ? { scale: 1.01 } : { scale: 1.05 }}
        >
          {globalContent}
        </MotionLink>
      );
    }

    return (
      <motion.button
        type="button"
        layout={!prefersReducedMotion}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Acceder a ${field.name || 'Campos semánticos'}: Catálogo general del diccionario`}
        className={globalClasses}
        whileHover={!isSpatial || isTouchRef.current ? {} : { scale: 1.05 }}
        whileFocus={!isSpatial ? { scale: 1.01 } : { scale: 1.05 }}
      >
        {globalContent}
      </motion.button>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANTE: 'field-node' (Nodos 1..7 de campos semánticos)
  // --------------------------------------------------------------------------
  const staggerDelay = 0.15 + index * 0.08;

  const drift =
    !isSpatial || prefersReducedMotion
      ? { x: [0], y: [0] }
      : {
          x: [0, field.drift.amplitudeX, 0, -field.drift.amplitudeX, 0],
          y: [0, -field.drift.amplitudeY, 0, field.drift.amplitudeY, 0],
        };

  const transition =
    !isSpatial || prefersReducedMotion
      ? { duration: 0.4, delay: staggerDelay }
      : {
          opacity: { duration: 0.45, delay: staggerDelay },
          x: {
            duration: field.drift.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: staggerDelay + field.drift.delay,
          },
          y: {
            duration: field.drift.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: staggerDelay + field.drift.delay,
          },
        };

  return (
    <motion.button
      type="button"
      layout={!prefersReducedMotion}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, ...drift }}
      transition={transition}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={`Explorar campo ${field.name}: ${field.nameSpanish}`}
      className={cn(
        isSpatial ? 'absolute rounded-full' : 'relative rounded-2xl w-full min-h-[48px]',
        'backdrop-blur-md bg-black/80 text-white shadow-lg pointer-events-auto cursor-pointer',
        isBlueAccent
          ? 'border border-[#0055AA]/75 hover:border-[#0055AA] hover:bg-[#0055AA]/35 focus-visible:ring-[#0055AA]'
          : 'border border-[#E52D6D]/65 hover:border-[#E52D6D] hover:bg-[#E52D6D]/25 focus-visible:ring-[#E52D6D]',
        'flex items-center gap-2.5 font-display select-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        'focus:outline-none',
        'transition-[border-color,background-color,transform] duration-200',
        !isSpatial && 'px-4 py-3 justify-start text-left flex-row',
        isSpatial && (expandDirection.current === 'right' ? 'flex-row' : 'flex-row-reverse'),
        isSpatial &&
          (isExpanded
            ? 'px-4 py-2 min-h-[48px] text-xs md:text-sm'
            : 'w-12 h-12 md:w-13 md:h-13 min-h-[48px] min-w-[48px] justify-center p-0'),
        className,
      )}
      style={
        isSpatial
          ? {
              left: `${safeX}%`,
              top: `${safeY}%`,
              transform: 'translate(-50%, -50%)',
            }
          : undefined
      }
      whileHover={!isSpatial || isTouchRef.current ? {} : { scale: 1.05 }}
      whileFocus={!isSpatial ? { scale: 1.01 } : { scale: 1.05 }}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors',
          isBlueAccent
            ? 'bg-[#0055AA]/25 border-[#0055AA]/60 text-secondary-light'
            : 'bg-[#E52D6D]/25 border-[#E52D6D]/60 text-primary-light',
        )}
      >
        <SemanticFieldIcon iconKey={field.iconKey} className="w-5 h-5" />
      </div>

      <AnimatePresence initial={false}>
        {(isExpanded || !isSpatial) && (
          <motion.div
            key="label-container"
            initial={isSpatial ? { opacity: 0, width: 0 } : { opacity: 1, width: 'auto' }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={isSpatial ? { opacity: 0, width: 0 } : undefined}
            transition={{ duration: 0.18 }}
            className="flex flex-col min-w-0 pr-1 text-left"
          >
            <span className="truncate font-bold text-xs sm:text-sm text-white tracking-wide">
              {field.name}
            </span>
            {field.nameSpanish && (
              <span className="truncate text-[10px] sm:text-[11px] text-text-muted font-normal">
                {field.nameSpanish}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
