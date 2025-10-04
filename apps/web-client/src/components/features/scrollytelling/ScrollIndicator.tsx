import { motion } from 'framer-motion';

/**
 * ScrollIndicator - Indicador de scroll animado
 *
 * Flecha animada con efecto bounce para indicar al usuario que puede hacer scroll
 */

interface ScrollIndicatorProps {
  /** Color del indicador (default: white) */
  color?: string;
  /** Clases CSS adicionales */
  className?: string;
}

export const ScrollIndicator = ({ color = 'white', className = '' }: ScrollIndicatorProps) => {
  return (
    <motion.div
      className={`absolute bottom-8 ${className}`}
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      aria-label="Scroll para continuar"
    >
      <svg
        className={`w-8 h-8 text-${color}`}
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
