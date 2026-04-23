/**
 * SubfieldPage — Phase 2
 *
 * Landing page for a single subfield (:fieldSlug/:subfieldSlug).
 */

import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const SubfieldPage = () => {
  const { fieldSlug, subfieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [subfieldSlug]);

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

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="subfield-heading">
      <div className="container mx-auto px-4 py-12">
        <Link
          to={`/campos/${field.id}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-8"
        >
          ← Volver a {field.name}
        </Link>

        <h1
          id="subfield-heading"
          ref={headingRef}
          className="text-4xl font-bold font-display mb-2"
          tabIndex={-1}
        >
          {subfield.name}
        </h1>
        {subfield.nameMisak && (
          <p className="text-lg text-primary italic mb-4">{subfield.nameMisak}</p>
        )}
        <p className="text-text-muted mb-8 max-w-2xl">{subfield.description}</p>

        {subfield.microfields.length > 0 ? (
          <section aria-labelledby="microfields-heading">
            <h2
              id="microfields-heading"
              className="text-2xl font-bold font-display mb-6 text-primary"
            >
              Microcampos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subfield.microfields.map((microfield) => (
                <Link
                  key={microfield.id}
                  to={`/campos/${field.id}/${subfield.id}/${microfield.id}`}
                  className="p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 transition-all"
                >
                  <h3 className="text-lg font-bold font-display mb-1">{microfield.name}</h3>
                  {microfield.nameMisak && (
                    <p className="text-sm text-primary italic mb-2">{microfield.nameMisak}</p>
                  )}
                  <p className="text-sm text-text-muted">{microfield.description}</p>
                  <span className="inline-block mt-3 text-xs text-primary">
                    {microfield.terms.length} término
                    {microfield.terms.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12 text-text-muted">
            <p>Este subcampo aún no tiene microcampos registrados.</p>
          </div>
        )}
      </div>
    </main>
  );
};
