/**
 * MicrofieldCard — Phase 2 PR #2
 *
 * Navigable card for a single microfield within a subfield landing page.
 * Displays microfield name, Misak name, description, and term count.
 */

import { Link } from 'react-router-dom';
import type { Microfield } from '@/types/semanticField';

interface MicrofieldCardProps {
  microfield: Microfield;
  fieldId: string;
  subfieldId: string;
}

export const MicrofieldCard = ({ microfield, fieldId, subfieldId }: MicrofieldCardProps) => {
  return (
    <Link
      to={`/campos/${fieldId}/${subfieldId}/${microfield.id}`}
      className="group block p-6 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300"
    >
      <h3 className="text-lg font-bold font-display mb-1 group-hover:text-primary transition-colors duration-300">
        {microfield.name}
      </h3>
      {microfield.nameMisak && (
        <p className="text-sm text-primary italic mb-2">{microfield.nameMisak}</p>
      )}
      <p className="text-sm text-text-muted leading-relaxed mb-4">{microfield.description}</p>
      <span className="inline-flex items-center gap-1 text-xs text-text-muted group-hover:text-primary transition-colors duration-300">
        {microfield.terms.length} término
        {microfield.terms.length !== 1 ? 's' : ''}
        <span className="ml-1">→</span>
      </span>
    </Link>
  );
};
