import { motion, useReducedMotion } from 'framer-motion';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { cn } from '@/utils/cn';
import { SemanticFieldIcon } from './SemanticFieldIcon';

interface SemanticFieldButtonProps {
  field: SemanticFieldSummary;
  onClick: () => void;
}

export const SemanticFieldButton = ({ field, onClick }: SemanticFieldButtonProps) => {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 + field.drift.delay }}
      onClick={onClick}
      aria-label={`Explorar campo semántico: ${field.name}`}
      className={cn(
        'absolute rounded-full px-4 py-2 backdrop-blur-md pointer-events-auto',
        'bg-background-dark/50 border border-primary/30',
        'hover:border-primary hover:bg-background-dark/70',
        'text-white shadow-lg',
        'focus-visible:ring-2 focus-visible:ring-primary focus:outline-none',
        'min-w-[48px] min-h-[48px]',
        'flex items-center gap-2 text-sm font-medium',
      )}
      style={{
        left: `${field.position.x}%`,
        top: `${field.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      {...(prefersReducedMotion
        ? {}
        : {
            animate: {
              x: [0, field.drift.amplitudeX, 0, -field.drift.amplitudeX, 0],
              y: [0, -field.drift.amplitudeY, 0, field.drift.amplitudeY, 0],
            },
            transition: {
              duration: field.drift.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: field.drift.delay,
            },
          })}
      whileHover={{ scale: 1.05 }}
      whileFocus={{ scale: 1.05 }}
    >
      <SemanticFieldIcon iconKey={field.iconKey} className="text-primary flex-shrink-0" />
      <span>{field.name}</span>
    </motion.button>
  );
};
