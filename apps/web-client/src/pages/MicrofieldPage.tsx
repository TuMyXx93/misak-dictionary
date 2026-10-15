/**
 * MicrofieldPage — Spec 003: datos reales desde la API
 *
 * Page that lists all terms in a microfield (:fieldSlug/:subfieldSlug/:microfieldSlug).
 */

import { FieldBreadcrumb } from '@components/features/semantic-fields/FieldBreadcrumb';
import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { TermList } from '@components/features/semantic-fields/TermList';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { DataError, DataLoading } from '@components/ui/QueryBoundary';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { findInField, useSemanticField } from '@/hooks/useDictionary';

export const MicrofieldPage = () => {
  const { fieldSlug, subfieldSlug, microfieldSlug } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const { data: field, isLoading, isError, refetch } = useSemanticField(fieldSlug);
  const { subfield, microfield } = findInField(field, subfieldSlug, microfieldSlug);

  if (isLoading) {
    return (
      <FieldLayout pageTitle="Cargando…">
        <main className="min-h-dvh bg-background text-white">
          <DataLoading label="Cargando microcampo…" />
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
          {microfield.terms.length > 0 ? (
            <TermList terms={microfield.terms} />
          ) : (
            <div className="text-center py-12 text-text-muted">
              <p>Este microcampo aún no tiene términos registrados.</p>
            </div>
          )}
        </section>
      </div>
    </FieldLayout>
  );
};
