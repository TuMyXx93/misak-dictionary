/**
 * SubfieldPage — Phase 2 PR #2
 *
 * Landing page for a single subfield (:fieldSlug/:subfieldSlug).
 * Visual polish: gradient header, text-5xl heading, stagger microfield cards.
 */

import { MicrofieldCard } from '@components/features/semantic-fields/MicrofieldCard';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const SubfieldPage = () => {
  const { fieldSlug, subfieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

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

  const subfield = field.subfields.find((s) => s.id === subfieldSlug);

  if (!subfield) {
    return (
      <main className="min-h-dvh bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Subcampo no encontrado</h1>
          <Link to={`/campos/${field.id}`} className="text-primary hover:underline">
            Volver a {field.name}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="subfield-heading">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 pt-8 pb-16">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Link
              to={`/campos/${field.id}`}
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-8 transition-colors duration-300"
            >
              <span className="text-lg">←</span>
              <span>Volver a {field.name}</span>
            </Link>
          </motion.div>

          <motion.header
            className="max-w-3xl"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <h1
              id="subfield-heading"
              ref={headingRef}
              className="text-5xl font-bold font-display mb-2 text-white"
              tabIndex={-1}
            >
              {subfield.name}
            </h1>
            {subfield.nameMisak && (
              <p className="text-xl text-primary italic mb-4">{subfield.nameMisak}</p>
            )}
            <p className="text-text-muted text-lg leading-relaxed max-w-2xl">
              {subfield.description}
            </p>
          </motion.header>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {subfield.microfields.length > 0 ? (
          <section aria-labelledby="microfields-heading">
            <motion.h2
              id="microfields-heading"
              className="text-2xl font-bold font-display mb-6 text-primary"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Microcampos
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
              {subfield.microfields.map((microfield) => (
                <motion.div
                  key={microfield.id}
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
                  <MicrofieldCard
                    microfield={microfield}
                    fieldId={field.id}
                    subfieldId={subfield.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <p>Este subcampo aún no tiene microcampos registrados.</p>
          </div>
        )}
      </div>
    </main>
  );
};
