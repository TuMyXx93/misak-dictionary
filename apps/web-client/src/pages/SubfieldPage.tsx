/**
 * SubfieldPage — Phase 2 PR #2 / PR #3
 *
 * Landing page for a single subfield (:fieldSlug/:subfieldSlug).
 * Visual polish: gradient header, text-5xl heading, stagger microfield cards.
 * Updated in PR #3 to use FieldHero + FieldLayout for accessibility.
 */

import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { MicrofieldCard } from '@components/features/semantic-fields/MicrofieldCard';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const SubfieldPage = () => {
  const { fieldSlug, subfieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const prefersReducedMotion = useReducedMotion();

  if (!field) {
    return (
      <FieldLayout pageTitle="Campo no encontrado">
        <main className="min-h-dvh bg-background text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Campo no encontrado</h1>
            <Link to="/campos" className="text-primary hover:underline">
              Volver a Campos
            </Link>
          </div>
        </main>
      </FieldLayout>
    );
  }

  const subfield = field.subfields.find((s) => s.id === subfieldSlug);

  if (!subfield) {
    return (
      <FieldLayout pageTitle="Subcampo no encontrado">
        <main className="min-h-dvh bg-background text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Subcampo no encontrado</h1>
            <Link to={`/campos/${field.id}`} className="text-primary hover:underline">
              Volver a {field.name}
            </Link>
          </div>
        </main>
      </FieldLayout>
    );
  }

  return (
    <FieldLayout pageTitle={subfield.name}>
      <div className="relative">
        <FieldHero
          title={subfield.name}
          subtitle={subfield.nameMisak}
          description={subfield.description}
          gradientFrom="secondary/10"
          backLink={{
            label: `Volver a ${field.name}`,
            href: `/campos/${field.id}`,
          }}
        />
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
    </FieldLayout>
  );
};
