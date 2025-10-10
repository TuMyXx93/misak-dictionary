import { motion } from 'framer-motion';

/**
 * ScrollIndicator - Indicador de scroll animado
 *
 * Flecha animada con efecto bounce para indicar al usuario que puede hacer scroll
 */

interface ScrollIndicatorProps {
  /** Clases CSS adicionales para el SVG */
  className?: string;
}

export const ScrollIndicator = ({ className = 'w-8 h-8 text-white' }: ScrollIndicatorProps) => {
  return (
    <motion.div
      className="absolute bottom-8"
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      aria-label="Scroll para continuar"
    >
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </motion.div>
  );
};
