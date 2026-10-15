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
      <ol className="flex flex-wrap items-center text-sm text-text-muted">
        <li className="flex items-center">
          <Link
            to={`/campos/${field.id}`}
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors duration-300 max-w-[120px] sm:max-w-none truncate"
          >
            <span className="text-lg">←</span>
            <span>{field.name}</span>
          </Link>
        </li>
        {subfield && (
          <li className="flex items-center">
            <span className="mx-2 select-none">/</span>
            <Link
              to={`/campos/${field.id}/${subfield.id}`}
              className="hover:text-primary transition-colors duration-300 max-w-[120px] sm:max-w-none truncate"
            >
              {subfield.name}
            </Link>
          </li>
        )}
        {microfieldName && (
          <li className="flex items-center">
            <span className="mx-2 select-none">/</span>
            <span className="max-w-[120px] sm:max-w-none truncate" aria-current="page">
              {microfieldName}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};
