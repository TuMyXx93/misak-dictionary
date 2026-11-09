/**
 * CampoPage — Spec 003: datos reales desde la API
 *
 * Landing page mobile-first para un Campo Semántico (:fieldSlug) con soporte
 * multimedia de sección (audio, ilustración, video).
 */

import { FieldBreadcrumb } from '@components/features/semantic-fields/FieldBreadcrumb';
import { FieldHero } from '@components/features/semantic-fields/FieldHero';
import { SubfieldCard } from '@components/features/semantic-fields/SubfieldCard';
import { TermList } from '@components/features/semantic-fields/TermList';
import { FieldLayout } from '@components/layouts/FieldLayout';
import { DataError, DataLoading } from '@components/ui/QueryBoundary';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { getSemanticFieldConfig } from '@/constants/semanticFields';
import { useSemanticField } from '@/hooks/useDictionary';

export const CampoPage = () => {
  const { fieldSlug } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const { data: field, isLoading, isError, refetch } = useSemanticField(fieldSlug);

  if (isLoading) {
    return (
      <FieldLayout pageTitle="Cargando campo…">
        <div className="min-h-[60dvh] bg-background text-white">
          <DataLoading label="Cargando campo semántico…" />
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

  const config = getSemanticFieldConfig(field.id);
  const hasContent = field.subfields.length > 0 || Boolean(field.terms && field.terms.length > 0);

  return (
    <FieldLayout pageTitle={field.name}>
      <FieldHero
        title={field.name}
        subtitle={field.nameSpanish}
        description={field.longDescription}
        descriptionMisak={field.descriptionMisak}
        iconKey={config?.iconKey ?? 'house'}
        namtrikAudio={field.namtrikAudio}
        espanolAudio={field.espanolAudio}
        imagen={field.imagen}
        medios={field.medios}
        badge={{
          text: hasContent ? 'Campo disponible' : 'Próximamente',
          variant: hasContent ? 'available' : 'coming-soon',
        }}
      >
        <FieldBreadcrumb field={field} />
      </FieldHero>

      <div className="container mx-auto px-4 pb-16">
        {field.subfields.length > 0 && (
          <section aria-labelledby="subfields-heading" className="mt-8">
            <motion.h2
              id="subfields-heading"
              className="text-2xl font-bold font-display mb-5 text-white flex items-center gap-2.5"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className="w-2 h-6 rounded-full bg-[#E52D6D]" aria-hidden="true" />
              Subcampos
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {field.subfields.map((subfield) => (
                <SubfieldCard key={subfield.id} subfield={subfield} fieldId={field.id} />
              ))}
            </div>
          </section>
        )}

        {field.terms && field.terms.length > 0 && (
          <section aria-labelledby="field-terms-heading" className="mt-12">
            <motion.h2
              id="field-terms-heading"
              className="text-2xl font-bold font-display mb-5 text-white flex items-center gap-2.5"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className="w-2 h-6 rounded-full bg-[#0055AA]" aria-hidden="true" />
              Términos del campo ({field.terms.length})
            </motion.h2>
            <TermList terms={field.terms} />
          </section>
        )}

        {!hasContent && (
          <div className="text-center py-16 text-text-muted">
            <p className="text-lg">Este campo aún no tiene subcampos registrados.</p>
            <p className="text-sm mt-2">Pronto añadiremos más contenido a este campo.</p>
          </div>
        )}
      </div>
    </FieldLayout>
  );
};
