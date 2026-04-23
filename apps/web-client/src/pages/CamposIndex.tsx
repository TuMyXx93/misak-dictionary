/**
 * CamposIndex Page — Phase 2
 *
 * Grid overview of all 7 semantic fields.
 */

import { SemanticFieldIcon } from '@components/features/semantic-fields/SemanticFieldIcon';
import { Link } from 'react-router-dom';
import { SEMANTIC_FIELDS_DATA } from '@/data/semanticFields';

export const CamposIndex = () => {
  return (
    <main className="min-h-dvh bg-background text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold font-display mb-4 text-primary">Campos Semánticos</h1>
        <p className="text-text-muted mb-8 max-w-2xl">
          Explora los campos semánticos del diccionario Misak. Cada campo representa un ámbito del
          conocimiento ancestral.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SEMANTIC_FIELDS_DATA.map((field) => (
            <Link
              key={field.id}
              to={field.status === 'available' ? `/campos/${field.id}` : '#'}
              className={`relative p-6 rounded-2xl border backdrop-blur-md transition-all ${
                field.status === 'available'
                  ? 'bg-background-dark/55 border-primary/30 hover:border-primary hover:bg-background-dark/75 cursor-pointer'
                  : 'bg-background-dark/30 border-primary/10 cursor-not-allowed opacity-60'
              }`}
              aria-disabled={field.status === 'coming-soon'}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <SemanticFieldIcon iconKey={field.iconKey} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white mb-1">{field.name}</h2>
                  <p className="text-sm text-primary italic mb-2">{field.nameSpanish}</p>
                  <p className="text-sm text-text-muted">{field.shortDescription}</p>
                  {field.status === 'coming-soon' && (
                    <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-secondary/30 text-text-muted border border-secondary/30">
                      Próximamente
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};
