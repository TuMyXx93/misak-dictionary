/**
 * CampoPage — Phase 2 PR #2 / PR #3
 *
 * Landing page for a single semantic field (:fieldSlug).
 * Hero section with full-width header, field name, description and visual styling.
 * Updated in PR #3 to use FieldHero + FieldLayout for accessibility.
 */

import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { SubfieldCard } from '@components/features/semantic-fields/SubfieldCard';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const CampoPage = () => {
  const { fieldSlug } = useParams();
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

  return (
    <FieldLayout pageTitle={field.name}>
      <div className="relative">
        <FieldHero
          title={field.name}
          subtitle={field.nameSpanish}
          description={field.longDescription}
          gradientFrom="primary/5"
          iconKey={field.iconKey}
          backLink={{ label: 'Volver a Campos', href: '/campos' }}
          badge={{
            text: field.status === 'available' ? 'Campo disponible' : 'Próximamente',
            variant: field.status,
          }}
        />
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
                  <SubfieldCard subfield={subfield} fieldId={field.id} />
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
    </FieldLayout>
  );
};
