/**
 * SubfieldPage — Spec 003: datos reales desde la API
 *
 * Landing page for a single subfield (:fieldSlug/:subfieldSlug).
 */

import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { MicrofieldCard } from '@components/features/semantic-fields/MicrofieldCard';
import { TermList } from '@components/features/semantic-fields/TermList';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { DataError, DataLoading } from '@components/ui/QueryBoundary';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { findInField, useSemanticField } from '@/hooks/useDictionary';

export const SubfieldPage = () => {
  const { fieldSlug, subfieldSlug } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const { data: field, isLoading, isError, refetch } = useSemanticField(fieldSlug);
  const { subfield } = findInField(field, subfieldSlug);

  if (isLoading) {
    return (
      <FieldLayout pageTitle="Cargando…">
        <main className="min-h-dvh bg-background text-white">
          <DataLoading label="Cargando subcampo…" />
        </main>
      </FieldLayout>
    );
  }

  if (isError) {
    return (
      <FieldLayout pageTitle="Error">
        <main className="min-h-dvh bg-background text-white">
          <DataError onRetry={() => refetch()} />
        </main>
      </FieldLayout>
    );
  }

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

  const hasContent =
    subfield.microfields.length > 0 || Boolean(subfield.terms && subfield.terms.length > 0);

  return (
    <FieldLayout pageTitle={subfield.name}>
      <div className="relative">
        <FieldHero
          title={subfield.name}
          subtitle={subfield.nameMisak}
          description={subfield.description}
          descriptionMisak={subfield.descriptionMisak}
          gradientFrom="secondary/10"
          backLink={{
            label: `Volver a ${field.name}`,
            href: `/campos/${field.id}`,
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        {subfield.microfields.length > 0 && (
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
        )}

        {subfield.terms && subfield.terms.length > 0 && (
          <section
            aria-labelledby="subfield-terms-heading"
            className={subfield.microfields.length > 0 ? 'mt-12 mb-8' : 'mt-4 mb-8'}
          >
            <motion.h2
              id="subfield-terms-heading"
              className="text-2xl font-bold font-display mb-6 text-primary"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Términos ({subfield.terms.length})
            </motion.h2>
            <TermList terms={subfield.terms} />
          </section>
        )}

        {!hasContent && (
          <div className="text-center py-16 text-text-muted">
            <p>Este subcampo aún no tiene microcampos registrados.</p>
          </div>
        )}
      </div>
    </FieldLayout>
  );
};
