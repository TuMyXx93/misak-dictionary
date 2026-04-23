/**
 * CamposIndex Page — Phase 2 PR #2
 *
 * Grid overview of all 7 semantic fields.
 * Visual polish: stagger entrance animations + enhanced card styling.
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEMANTIC_FIELDS_DATA } from '@/data/semanticFields';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.4,
    },
  },
};

export const CamposIndex = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="min-h-dvh bg-background text-white">
      <div className="container mx-auto px-4 py-12">
        <motion.h1
          className="text-4xl font-bold font-display mb-4 text-primary"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          Campos Semánticos
        </motion.h1>
        <motion.p
          className="text-text-muted mb-12 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          Explora los campos semánticos del diccionario Misak. Cada campo representa un ámbito del
          conocimiento ancestral de nuestra comunidad.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={prefersReducedMotion ? {} : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {SEMANTIC_FIELDS_DATA.map((field) => (
            <motion.div key={field.id} variants={prefersReducedMotion ? {} : cardVariants} layout>
              <Link
                to={field.status === 'available' ? `/campos/${field.id}` : '#'}
                className={`group relative block p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                  field.status === 'available'
                    ? 'bg-background-dark/55 border-primary/30 hover:border-primary hover:bg-background-dark/75 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 cursor-pointer'
                    : 'bg-background-dark/30 border-primary/10 cursor-not-allowed opacity-60'
                }`}
                aria-disabled={field.status === 'coming-soon'}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                    <SemanticFieldIcon iconKey={field.iconKey} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold font-display text-white mb-1 group-hover:text-primary transition-colors duration-300">
                      {field.name}
                    </h2>
                    <p className="text-sm text-primary italic mb-3">{field.nameSpanish}</p>
                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
                      {field.shortDescription}
                    </p>
                    {field.status === 'coming-soon' ? (
                      <span className="inline-block mt-4 text-xs px-3 py-1.5 rounded-full bg-secondary/20 text-text-muted border border-secondary/30">
                        Próximamente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-4 text-xs text-primary group-hover:gap-2 transition-all duration-300">
                        Explorar →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
};
