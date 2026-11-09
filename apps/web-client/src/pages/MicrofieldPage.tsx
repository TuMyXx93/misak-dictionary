/**
 * MicrofieldPage — Spec 003 · Spec 004: términos y subniveles recursivos
 *
 * Unifica la miga de pan superior (eliminando el doble enlace de retorno),
 * deduplica títulos bilingües y soporta multimedia de microcampo.
 */

import { FieldBreadcrumb } from '@components/features/semantic-fields/FieldBreadcrumb';
import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { MicrofieldSubnivel } from '@components/features/semantic-fields/MicrofieldSubnivel';
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
  const subniveles = microfield?.subniveles ?? [];

  if (isLoading) {
    return (
      <FieldLayout pageTitle="Cargando…">
        <div className="min-h-[60dvh] bg-background text-white">
          <DataLoading label="Cargando microcampo…" />
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

  if (!microfield) {
    return (
      <FieldLayout pageTitle="Microcampo no encontrado">
        <div className="min-h-[60dvh] bg-background text-white flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-display mb-4">Microcampo no encontrado</h1>
            <Link
              to={`/campos/${field.id}/${subfield.id}`}
              className="text-primary-light hover:underline"
            >
              Volver a {subfield.name}
            </Link>
          </div>
        </div>
      </FieldLayout>
    );
  }

  return (
    <FieldLayout pageTitle={microfield.name}>
      <FieldHero
        title={microfield.name}
        subtitle={microfield.nameSpanish ?? microfield.nameMisak}
        description={microfield.description}
        descriptionMisak={microfield.descriptionMisak}
        namtrikAudio={microfield.namtrikAudio}
        espanolAudio={microfield.espanolAudio}
        imagen={microfield.imagen}
        medios={microfield.medios}
      >
        <FieldBreadcrumb field={field} subfield={subfield} microfieldName={microfield.name} />
      </FieldHero>

      <div className="container mx-auto px-4 pb-16">
        {microfield.terms.length > 0 || subniveles.length === 0 ? (
          <section aria-labelledby="terms-heading" className="mt-8">
            <motion.h2
              id="terms-heading"
              className="text-2xl font-bold font-display mb-5 text-white flex items-center gap-2.5"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className="w-2 h-6 rounded-full bg-[#E52D6D]" aria-hidden="true" />
              Términos ({microfield.terms.length})
            </motion.h2>
            {microfield.terms.length > 0 ? (
              <TermList terms={microfield.terms} />
            ) : (
              <div className="text-center py-12 text-text-muted">
                <p>Términos en preparación.</p>
              </div>
            )}
          </section>
        ) : null}

        {subniveles.map((subnivel) => (
          <MicrofieldSubnivel key={subnivel.id} microfield={subnivel} nivel={3} />
        ))}
      </div>
    </FieldLayout>
  );
};
