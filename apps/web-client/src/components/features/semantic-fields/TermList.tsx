/**
 * TermList — Phase 2 PR #2
 *
 * Staggered list of TermRow components for a microfield.
 * Wraps with motion.div for entrance animation.
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { Term } from '@/types/semanticField';
import { TermRow } from './TermRow';

interface TermListProps {
  terms: Term[];
}

const containerVariants = {
  hidden: {},
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export const TermList = ({ terms }: TermListProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="space-y-3">
        {terms.map((term) => (
          <TermRow key={term.id} term={term} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {terms.map((term) => (
        <motion.div key={term.id} variants={rowVariants}>
          <TermRow term={term} />
        </motion.div>
      ))}
    </motion.div>
  );
};
