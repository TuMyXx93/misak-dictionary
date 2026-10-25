/**
 * FieldBreadcrumb — Navegación jerárquica accesible Misak
 *
 * Soporta rutas de 2 niveles (Campos > Campo > Subcampo) y 3 niveles (+ Microcampo)
 * evitando duplicar enlaces de retorno en las páginas internas.
 */

import { Link } from 'react-router-dom';
import type { SemanticField, Subfield } from '@/types/semanticField';

interface FieldBreadcrumbProps {
  field: Pick<SemanticField, 'id' | 'name'>;
  subfield?: Pick<Subfield, 'id' | 'name'>;
  microfieldName?: string;
}

export const FieldBreadcrumb = ({ field, subfield, microfieldName }: FieldBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-y-1.5 text-sm text-text-muted">
        <li className="flex items-center">
          <Link
            to="/campos"
            className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg border border-[#0055AA]/35 bg-black/50 text-secondary-light hover:text-white hover:border-[#E52D6D] transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>Campos</span>
          </Link>
        </li>
        <li className="flex items-center">
          <span className="mx-2 text-white/35 select-none" aria-hidden="true">
            /
          </span>
          {subfield || microfieldName ? (
            <Link
              to={`/campos/${field.id}`}
              className="hover:text-primary-light transition-colors max-w-[160px] sm:max-w-none truncate font-medium text-gray-200"
            >
              {field.name}
            </Link>
          ) : (
            <span
              className="max-w-[180px] sm:max-w-none truncate font-semibold text-white"
              aria-current="page"
            >
              {field.name}
            </span>
          )}
        </li>
        {subfield && (
          <li className="flex items-center">
            <span className="mx-2 text-white/35 select-none" aria-hidden="true">
              /
            </span>
            {microfieldName ? (
              <Link
                to={`/campos/${field.id}/${subfield.id}`}
                className="hover:text-primary-light transition-colors max-w-[160px] sm:max-w-none truncate font-medium text-gray-200"
              >
                {subfield.name}
              </Link>
            ) : (
              <span
                className="max-w-[180px] sm:max-w-none truncate font-semibold text-white"
                aria-current="page"
              >
                {subfield.name}
              </span>
            )}
          </li>
        )}
        {microfieldName && (
          <li className="flex items-center">
            <span className="mx-2 text-white/35 select-none" aria-hidden="true">
              /
            </span>
            <span
              className="max-w-[180px] sm:max-w-none truncate font-semibold text-primary-light"
              aria-current="page"
            >
              {microfieldName}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};
