/**
 * FieldBreadcrumb — Phase 2 PR #2
 *
 * Accessible breadcrumb navigation for semantic field hierarchy.
 * Supports 2-level (campo > subfield) and 3-level (campo > subfield > microfield) paths.
 */

import { Link } from 'react-router-dom';
import type { SemanticField, Subfield } from '@/types/semanticField';

interface FieldBreadcrumbProps {
  field: SemanticField;
  subfield?: Subfield;
  microfieldName?: string;
}

export const FieldBreadcrumb = ({ field, subfield, microfieldName }: FieldBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <Link
        to={`/campos/${field.id}`}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-300"
      >
        <span className="text-lg">←</span>
        <span>{field.name}</span>
      </Link>
      {subfield && (
        <>
          <span className="mx-2 text-text-muted">/</span>
          <Link
            to={`/campos/${field.id}/${subfield.id}`}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors duration-300"
          >
            {subfield.name}
          </Link>
        </>
      )}
      {microfieldName && (
        <>
          <span className="mx-2 text-text-muted">/</span>
          <span className="inline-flex items-center gap-2 text-sm text-text-muted">
            {microfieldName}
          </span>
        </>
      )}
    </nav>
  );
};
