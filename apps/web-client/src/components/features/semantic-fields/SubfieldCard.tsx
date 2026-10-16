/**
 * SubfieldCard — Phase 2 PR #2
 *
 * Navigable card for a single subfield within a semantic field landing page.
 * Displays subfield name, Misak name, description, and microfield count.
 */

import { Link } from 'react-router-dom';
import type { Subfield } from '@/types/semanticField';

interface SubfieldCardProps {
  subfield: Subfield;
  fieldId: string;
}

export const SubfieldCard = ({ subfield, fieldId }: SubfieldCardProps) => {
  return (
    <Link
      to={`/campos/${fieldId}/${subfield.id}`}
      className="group block p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300 @container"
    >
      <div className="flex flex-col @md:flex-row @md:items-start @md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold font-display mb-1 group-hover:text-primary transition-colors duration-300">
            {subfield.name}
          </h3>
          {subfield.nameMisak && (
            <p className="text-sm text-primary italic mb-2 @md:mb-0">{subfield.nameMisak}</p>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col @md:items-end">
          {subfield.descriptionMisak && (
            <p className="text-xs text-white/90 font-serif italic mb-1 @md:text-right">
              {subfield.descriptionMisak}
            </p>
          )}
          <p className="text-sm text-text-muted leading-relaxed mb-3 @md:text-right">
            {subfield.description}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-text-muted group-hover:text-primary transition-colors duration-300">
            {subfield.microfields.length > 0 && subfield.terms && subfield.terms.length > 0
              ? `${subfield.microfields.length} microcampo${subfield.microfields.length !== 1 ? 's' : ''} · ${subfield.terms.length} término${subfield.terms.length !== 1 ? 's' : ''}`
              : subfield.microfields.length > 0
                ? `${subfield.microfields.length} microcampo${subfield.microfields.length !== 1 ? 's' : ''}`
                : `${subfield.terms?.length ?? 0} término${(subfield.terms?.length ?? 0) !== 1 ? 's' : ''}`}
            <span className="ml-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};
