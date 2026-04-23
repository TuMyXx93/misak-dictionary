/**
 * CampoPage — Phase 2 PR #2
 *
 * Landing page for a single semantic field (:fieldSlug).
 * Hero section with full-width header, field name, description and visual styling.
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const CampoPage = () => {
  const { fieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const prefersReducedMotion = useReducedMotion();

  if (!field) {
    return (
      <main className="min-h-dvh bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Campo no encontrado</h1>
          <Link to="/campos" className="text-primary hover:underline">
            Volver a Campos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="campo-heading">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 pt-8 pb-16">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Link
              to="/campos"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-8 transition-colors duration-300"
            >
              <span className="text-lg">←</span>
              <span>Volver a Campos</span>
            </Link>
          </motion.div>

          <motion.header
            className="max-w-3xl"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <SemanticFieldIcon iconKey={field.iconKey} className="text-primary w-10 h-10" />
              </div>
              <div>
                <h1
                  id="campo-heading"
                  className="text-5xl font-bold font-display mb-2 text-white"
                  tabIndex={-1}
                >
                  {field.name}
                </h1>
                <p className="text-xl text-primary italic">{field.nameSpanish}</p>
              </div>
            </div>

            {field.longDescription && (
              <p className="text-text-muted text-lg leading-relaxed max-w-2xl mb-8">
                {field.longDescription}
              </p>
            )}

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-text-muted">
                {field.status === 'available' ? 'Campo disponible' : 'Próximamente'}
              </span>
            </div>
          </motion.header>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {field.subfields.length > 0 ? (
          <section aria-labelledby="subfields-heading" className="mt-8">
            <motion.h2
              id="subfields-heading"
              className="text-2xl font-bold font-display mb-6 text-primary"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Subcampos
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={
                prefersReducedMotion
                  ? {}
                  : {
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                      },
                    }
              }
            >
              {field.subfields.map((subfield) => (
                <motion.div
                  key={subfield.id}
                  variants={
                    prefersReducedMotion
                      ? {}
                      : {
                          hidden: { opacity: 0, y: 16 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.3 },
                          },
                        }
                  }
                  layout
                >
                  <Link
                    to={`/campos/${field.id}/${subfield.id}`}
                    className="group block p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300"
                  >
                    <h3 className="text-lg font-bold font-display mb-1 group-hover:text-primary transition-colors duration-300">
                      {subfield.name}
                    </h3>
                    {subfield.nameMisak && (
                      <p className="text-sm text-primary italic mb-3">{subfield.nameMisak}</p>
                    )}
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {subfield.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted group-hover:text-primary transition-colors duration-300">
                      {subfield.microfields.length} microcampo
                      {subfield.microfields.length !== 1 ? 's' : ''}
                      <span className="ml-1">→</span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <p className="text-lg">Este campo aún no tiene subcampos registrados.</p>
            <p className="text-sm mt-2">Pronto añadiremos más contenido a este campo.</p>
          </div>
        )}
      </div>
    </main>
  );
};
