/**
 * MicrofieldPage — Phase 2 PR #2 / PR #3
 *
 * Page that lists all terms in a microfield (:fieldSlug/:subfieldSlug/:microfieldSlug).
 * Visual polish: gradient header, text-5xl heading, TermList stagger.
 * Updated in PR #3 to use FieldHero + FieldLayout for accessibility.
 */

import { FieldBreadcrumb } from '@components/features/semantic-fields/FieldBreadcrumb';
import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { TermList } from '@components/features/semantic-fields/TermList';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const MicrofieldPage = () => {
  const { fieldSlug, subfieldSlug, microfieldSlug } = useParams();
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

  const microfield = subfield.microfields.find((m) => m.id === microfieldSlug);

  if (!microfield) {
    return (
      <FieldLayout pageTitle="Microcampo no encontrado">
        <main className="min-h-dvh bg-background text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Microcampo no encontrado</h1>
            <Link
              to={`/campos/${field.id}/${subfield.id}`}
              className="text-primary hover:underline"
            >
              Volver a {subfield.name}
            </Link>
          </div>
        </main>
      </FieldLayout>
    );
  }

  return (
    <FieldLayout pageTitle={microfield.name}>
      <div className="relative">
        <FieldHero
          title={microfield.name}
          subtitle={microfield.nameMisak}
          description={microfield.description}
          gradientFrom="primary/5"
          backLink={{
            label: `Volver a ${subfield.name}`,
            href: `/campos/${field.id}/${subfield.id}`,
          }}
        >
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <FieldBreadcrumb field={field} subfield={subfield} microfieldName={microfield.name} />
          </motion.div>
        </FieldHero>
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
          <TermList terms={microfield.terms} />
        </section>
      </div>
    </FieldLayout>
  );
};
