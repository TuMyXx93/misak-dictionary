/**
 * MicrofieldPage — Phase 2 PR #2
 *
 * Page that lists all terms in a microfield (:fieldSlug/:subfieldSlug/:microfieldSlug).
 * Visual polish: gradient header, text-5xl heading, stagger on term rows.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const MicrofieldPage = () => {
  const { fieldSlug, subfieldSlug, microfieldSlug } = useParams();
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

  const microfield = subfield.microfields.find((m) => m.id === microfieldSlug);

  if (!microfield) {
    return (
      <main className="min-h-dvh bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Microcampo no encontrado</h1>
          <Link to={`/campos/${field.id}/${subfield.id}`} className="text-primary hover:underline">
            Volver a {subfield.name}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="microfield-heading">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 pt-8 pb-16">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <nav aria-label="Breadcrumb" className="mb-6">
              <Link
                to={`/campos/${field.id}`}
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-300"
              >
                <span className="text-lg">←</span>
                <span>{field.name}</span>
              </Link>
              <span className="mx-2 text-text-muted">/</span>
              <Link
                to={`/campos/${field.id}/${subfield.id}`}
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-300"
              >
                {subfield.name}
              </Link>
            </nav>
          </motion.div>

          <motion.header
            className="max-w-3xl"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <h1
              id="microfield-heading"
              ref={headingRef}
              className="text-5xl font-bold font-display mb-2 text-white"
              tabIndex={-1}
            >
              {microfield.name}
            </h1>
            {microfield.nameMisak && (
              <p className="text-xl text-primary italic mb-4">{microfield.nameMisak}</p>
            )}
            <p className="text-text-muted text-lg leading-relaxed max-w-2xl">
              {microfield.description}
            </p>
          </motion.header>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <section aria-labelledby="terms-heading">
          <motion.h2
            id="terms-heading"
            className="text-2xl font-bold font-display mb-6 text-primary"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Términos ({microfield.terms.length})
          </motion.h2>
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={
              prefersReducedMotion
                ? {}
                : {
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.07 },
                    },
                  }
            }
          >
            {microfield.terms.map((term) => (
              <motion.div
                key={term.id}
                variants={
                  prefersReducedMotion
                    ? {}
                    : {
                        hidden: { opacity: 0, x: -12 },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.3 },
                        },
                      }
                }
              >
                <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300">
                  <div className="flex flex-col">
                    <span className="text-lg font-display font-bold text-white">{term.misak}</span>
                    {term.exampleMisak && (
                      <span className="text-xs text-text-muted italic">
                        ej. {term.exampleMisak}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted">{term.spanish}</span>
                    {term.partOfSpeech && (
                      <span className="ml-2 text-xs text-primary italic">
                        ({term.partOfSpeech})
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </main>
  );
};
