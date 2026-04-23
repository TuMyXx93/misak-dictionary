/**
 * CampoPage — Phase 2
 *
 * Landing page for a single semantic field (:fieldSlug).
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const CampoPage = () => {
  const { fieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [fieldSlug]);

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

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="campo-heading">
      <div className="container mx-auto px-4 py-12">
        <Link
          to="/campos"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-8"
        >
          ← Volver a Campos
        </Link>

        <div className="flex items-start gap-6 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <SemanticFieldIcon iconKey={field.iconKey} className="text-primary w-8 h-8" />
          </div>
          <div>
            <h1
              id="campo-heading"
              ref={headingRef}
              className="text-4xl font-bold font-display mb-2"
              tabIndex={-1}
            >
              {field.name}
            </h1>
            <p className="text-lg text-primary italic mb-4">{field.nameSpanish}</p>
          </div>
        </div>

        {field.longDescription && (
          <p className="text-text-muted mb-8 max-w-2xl leading-relaxed">{field.longDescription}</p>
        )}

        {field.subfields.length > 0 ? (
          <section aria-labelledby="subfields-heading">
            <h2
              id="subfields-heading"
              className="text-2xl font-bold font-display mb-6 text-primary"
            >
              Subcampos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field.subfields.map((subfield) => (
                <Link
                  key={subfield.id}
                  to={`/campos/${field.id}/${subfield.id}`}
                  className="p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 transition-all"
                >
                  <h3 className="text-lg font-bold font-display mb-1">{subfield.name}</h3>
                  {subfield.nameMisak && (
                    <p className="text-sm text-primary italic mb-2">{subfield.nameMisak}</p>
                  )}
                  <p className="text-sm text-text-muted">{subfield.description}</p>
                  <span className="inline-block mt-3 text-xs text-primary">
                    {subfield.microfields.length} microcampo
                    {subfield.microfields.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12 text-text-muted">
            <p>Este campo aún no tiene subcampos registrados.</p>
          </div>
        )}
      </div>
    </main>
  );
};
