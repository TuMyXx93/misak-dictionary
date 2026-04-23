import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { SemanticFieldIcon } from './SemanticFieldIcon';

interface SemanticFieldButtonProps {
  field: SemanticFieldSummary;
  index: number;
  onClick: () => void;
}

const AUTO_COLLAPSE_MS = 2500;

export const SemanticFieldButton = ({ field, index, onClick }: SemanticFieldButtonProps) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isTouchRef = useRef(false);
  const expandDirection = useRef<'right' | 'left'>(field.position.x < 50 ? 'right' : 'left');

  useEffect(() => {
    isTouchRef.current = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setIsExpanded(false), AUTO_COLLAPSE_MS);
  }, []);

  const cancelCollapse = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelCollapse();
  }, [cancelCollapse]);

  const handleMouseEnter = () => {
    if (isTouchRef.current) return;
    setIsExpanded(true);
    cancelCollapse();
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current) return;
    setIsExpanded(false);
    cancelCollapse();
  };

  const handleFocus = () => {
    setIsExpanded(true);
    cancelCollapse();
  };

  const handleBlur = () => {
    setIsExpanded(false);
    cancelCollapse();
  };

  const handleClick = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isTouchRef.current) {
      if (!isExpanded) {
        e.preventDefault();
        setIsExpanded(true);
        scheduleCollapse();
      } else {
        onClick();
        setIsExpanded(false);
        cancelCollapse();
      }
    } else {
      onClick();
    }
  };

  const staggerDelay = 0.2 + index * 0.12;

  const drift = prefersReducedMotion
    ? { x: [0], y: [0] }
    : {
        x: [0, field.drift.amplitudeX, 0, -field.drift.amplitudeX, 0],
        y: [0, -field.drift.amplitudeY, 0, field.drift.amplitudeY, 0],
      };

  const transition = prefersReducedMotion
    ? { duration: 0.5, delay: staggerDelay }
    : {
        opacity: { duration: 0.5, delay: staggerDelay },
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
      layout
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
        'absolute rounded-full backdrop-blur-md bg-background-dark/55',
        'border border-primary/30 text-white shadow-lg pointer-events-auto',
        'flex items-center gap-2 font-display whitespace-nowrap',
        'hover:border-primary hover:bg-background-dark/75',
        'focus-visible:ring-2 focus-visible:ring-primary',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background/50',
        'focus:outline-none',
        'transition-[border-color,background-color] duration-200',
        expandDirection.current === 'right' ? 'flex-row' : 'flex-row-reverse',
        isExpanded
          ? 'px-4 py-2 text-xs md:text-sm'
          : 'w-11 h-11 md:w-12 md:h-12 justify-center p-0',
      )}
      style={{
        left: `${field.position.x}%`,
        top: `${field.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      whileHover={isTouchRef.current ? {} : { scale: 1.04 }}
      whileFocus={{ scale: 1.04 }}
    >
      <SemanticFieldIcon iconKey={field.iconKey} className="text-primary flex-shrink-0" />
      {isExpanded && (
        <span aria-hidden="true" className="truncate">
          {field.name}
        </span>
      )}
    </motion.button>
  );
};
