import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { SemanticFieldIcon } from './SemanticFieldIcon';

interface SemanticFieldButtonProps {
  field: SemanticFieldSummary;
  index: number;
  onClick: () => void;
  isMobile?: boolean;
}

const AUTO_COLLAPSE_MS = 2500;

export const SemanticFieldButton = ({
  field,
  index,
  onClick,
  isMobile = false,
}: SemanticFieldButtonProps) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isExpanded, setIsExpanded] = useState(isMobile);
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isTouchRef = useRef(false);
  const expandDirection = useRef<'right' | 'left'>(field.position.x < 50 ? 'right' : 'left');

  // Alternancia armónica entre los dos tonos vivos de la bandera Misak (#E52D6D y #0055AA)
  const isBlueAccent = index % 2 === 1;

  useEffect(() => {
    isTouchRef.current = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
    }
  }, [isMobile]);

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
    if (isMobile || isTouchRef.current) return;
    setIsExpanded(true);
    cancelCollapse();
  };

  const handleMouseLeave = () => {
    if (isMobile || isTouchRef.current) return;
    setIsExpanded(false);
    cancelCollapse();
  };

  const handleFocus = () => {
    if (isMobile) return;
    setIsExpanded(true);
    cancelCollapse();
  };

  const handleBlur = () => {
    if (isMobile) return;
    setIsExpanded(false);
    cancelCollapse();
  };

  const handleClick = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile) {
      onClick();
      return;
    }
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

  const drift =
    isMobile || prefersReducedMotion
      ? { x: [0], y: [0] }
      : {
          x: [0, field.drift.amplitudeX, 0, -field.drift.amplitudeX, 0],
          y: [0, -field.drift.amplitudeY, 0, field.drift.amplitudeY, 0],
        };

  const transition =
    isMobile || prefersReducedMotion
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
        isMobile ? 'relative rounded-xl min-h-[44px]' : 'absolute rounded-full',
        'backdrop-blur-md bg-black/75 text-white shadow-lg pointer-events-auto cursor-pointer',
        isBlueAccent
          ? 'border border-[#0055AA]/75 hover:border-[#0055AA] hover:bg-[#0055AA]/35 focus-visible:ring-[#0055AA]'
          : 'border border-[#E52D6D]/65 hover:border-[#E52D6D] hover:bg-[#E52D6D]/25 focus-visible:ring-[#E52D6D]',
        'flex items-center gap-2 font-display whitespace-nowrap',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        'focus:outline-none',
        'transition-[border-color,background-color] duration-200',
        isMobile
          ? 'px-3.5 py-2.5 text-sm flex-row'
          : expandDirection.current === 'right'
            ? 'flex-row'
            : 'flex-row-reverse',
        !isMobile &&
          (isExpanded
            ? 'px-4 py-2 text-xs md:text-sm'
            : 'w-11 h-11 md:w-12 md:h-12 justify-center p-0'),
      )}
      style={
        isMobile
          ? undefined
          : {
              left: `${field.position.x}%`,
              top: `${field.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }
      }
      whileHover={isMobile || isTouchRef.current ? {} : { scale: 1.05 }}
      whileFocus={isMobile ? { scale: 1.02 } : { scale: 1.05 }}
    >
      <SemanticFieldIcon
        iconKey={field.iconKey}
        className={cn('flex-shrink-0', isBlueAccent ? 'text-secondary-light' : 'text-primary')}
      />
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.span
            key="text"
            initial={isMobile ? { opacity: 1, width: 'auto' } : { opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={isMobile ? undefined : { opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="truncate font-semibold"
          >
            {field.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
