/**
 * SubfieldPage — Spec 003: datos reales desde la API
 *
 * Landing page mobile-first para un Subcampo Semántico (:fieldSlug/:subfieldSlug).
 */

import { FieldBreadcrumb } from '@components/features/semantic-fields/FieldBreadcrumb';
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
        <div className="min-h-[60dvh] bg-background text-white">
          <DataLoading label="Cargando subcampo…" />
        </div>
      </FieldLayout>
    );
  }

  if (isError) {
    return (
      <FieldLayout pageTitle="Error">
        <div className="min-h-[60dvh] bg-background text-white">
          <DataError onRetry={() => refetch()} />
        </div>
      </FieldLayout>
    );
  }

  if (!field) {
    return (
      <FieldLayout pageTitle="Campo no encontrado">
        <div className="min-h-[60dvh] bg-background text-white flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Campo no encontrado</h1>
            <Link to="/campos" className="text-primary-light hover:underline">
              Volver a Campos
            </Link>
          </div>
        </div>
      </FieldLayout>
    );
  }

  if (!subfield) {
    return (
      <FieldLayout pageTitle="Subcampo no encontrado">
        <div className="min-h-[60dvh] bg-background text-white flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Subcampo no encontrado</h1>
            <Link to={`/campos/${field.id}`} className="text-primary-light hover:underline">
              Volver a {field.name}
            </Link>
          </div>
        </div>
      </FieldLayout>
    );
  }

  const hasContent =
    subfield.microfields.length > 0 || Boolean(subfield.terms && subfield.terms.length > 0);

  return (
    <FieldLayout pageTitle={subfield.name}>
      <FieldHero
        title={subfield.name}
        subtitle={subfield.nameSpanish ?? subfield.nameMisak}
        description={subfield.description}
        descriptionMisak={subfield.descriptionMisak}
        namtrikAudio={subfield.namtrikAudio}
        espanolAudio={subfield.espanolAudio}
        imagen={subfield.imagen}
        medios={subfield.medios}
      >
        <FieldBreadcrumb field={field} subfield={subfield} />
      </FieldHero>

      <div className="container mx-auto px-4 pb-16">
        {subfield.microfields.length > 0 && (
          <section aria-labelledby="microfields-heading" className="mt-8">
            <motion.h2
              id="microfields-heading"
              className="text-2xl font-bold font-display mb-5 text-white flex items-center gap-2.5"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className="w-2 h-6 rounded-full bg-[#0055AA]" aria-hidden="true" />
              Microcampos
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {subfield.microfields.map((microfield) => (
                <MicrofieldCard
                  key={microfield.id}
                  microfield={microfield}
                  fieldId={field.id}
                  subfieldId={subfield.id}
                />
              ))}
            </div>
          </section>
        )}

        {subfield.terms && subfield.terms.length > 0 && (
          <section
            aria-labelledby="subfield-terms-heading"
            className={subfield.microfields.length > 0 ? 'mt-12 mb-8' : 'mt-8 mb-8'}
          >
            <motion.h2
              id="subfield-terms-heading"
              className="text-2xl font-bold font-display mb-5 text-white flex items-center gap-2.5"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className="w-2 h-6 rounded-full bg-[#E52D6D]" aria-hidden="true" />
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
