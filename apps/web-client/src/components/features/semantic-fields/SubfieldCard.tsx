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
      className="group block p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300"
    >
      <h3 className="text-lg font-bold font-display mb-1 group-hover:text-primary transition-colors duration-300">
        {subfield.name}
      </h3>
      {subfield.nameMisak && (
        <p className="text-sm text-primary italic mb-3">{subfield.nameMisak}</p>
      )}
      <p className="text-sm text-text-muted leading-relaxed mb-4">{subfield.description}</p>
      <span className="inline-flex items-center gap-1 text-xs text-text-muted group-hover:text-primary transition-colors duration-300">
        {subfield.microfields.length} microcampo
        {subfield.microfields.length !== 1 ? 's' : ''}
        <span className="ml-1">→</span>
      </span>
    </Link>
  );
};
