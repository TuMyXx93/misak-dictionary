/**
 * MicrofieldPage — Phase 2
 *
 * Page that lists all terms in a microfield (:fieldSlug/:subfieldSlug/:microfieldSlug).
 */

import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFieldBySlug } from '@/data/semanticFields';

export const MicrofieldPage = () => {
  const { fieldSlug, subfieldSlug, microfieldSlug } = useParams();
  const field = getFieldBySlug(fieldSlug ?? '');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [microfieldSlug]);

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

  const microfield = subfield.microfields.find((m) => m.id === microfieldSlug);

  if (!microfield) {
    return (
      <main className="min-h-dvh bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Microcampo no encontrado</h1>
          <Link to={`/campos/${field.id}/${subfield.id}`} className="text-primary hover:underline">
            Volver a {subfield.name}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-white" aria-labelledby="microfield-heading">
      <div className="container mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            to={`/campos/${field.id}`}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary"
          >
            ← {field.name}
          </Link>
          <span className="mx-2 text-text-muted">/</span>
          <Link
            to={`/campos/${field.id}/${subfield.id}`}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary"
          >
            {subfield.name}
          </Link>
        </nav>

        <h1
          id="microfield-heading"
          ref={headingRef}
          className="text-4xl font-bold font-display mb-2"
          tabIndex={-1}
        >
          {microfield.name}
        </h1>
        {microfield.nameMisak && (
          <p className="text-lg text-primary italic mb-4">{microfield.nameMisak}</p>
        )}
        <p className="text-text-muted mb-8 max-w-2xl">{microfield.description}</p>

        <section aria-labelledby="terms-heading">
          <h2 id="terms-heading" className="text-2xl font-bold font-display mb-6 text-primary">
            Términos ({microfield.terms.length})
          </h2>
          <div className="space-y-3">
            {microfield.terms.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-lg font-display font-bold text-white">{term.misak}</span>
                  {term.exampleMisak && (
                    <span className="text-xs text-text-muted italic">ej. {term.exampleMisak}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-text-muted">{term.spanish}</span>
                  {term.partOfSpeech && (
                    <span className="ml-2 text-xs text-primary italic">({term.partOfSpeech})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
