/**
 * MicrofieldCard — Tarjeta navegable mobile-first para Microcampos Semánticos
 *
 * - Deduplica automáticamente subtítulos idénticos (p. ej. "Wammera" / "Wammera").
 * - Combina Azul Misak (#0055AA) y Magenta Misak (#E52D6D) con alturas uniformes.
 */

import { Link } from 'react-router-dom';
import { type Microfield, resolveBilingualTitle } from '@/types/semanticField';

interface MicrofieldCardProps {
  microfield: Microfield;
  fieldId: string;
  subfieldId: string;
}

export const MicrofieldCard = ({ microfield, fieldId, subfieldId }: MicrofieldCardProps) => {
  const { title, subtitle } = resolveBilingualTitle(
    microfield.name,
    microfield.nameSpanish ?? microfield.nameMisak,
  );

  const subnivelCount = microfield.subniveles?.length ?? 0;

  return (
    <Link
      to={`/campos/${fieldId}/${subfieldId}/${microfield.id}`}
      className="group h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-[#0055AA]/40 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/75 transition-all duration-250 shadow-md @container"
    >
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white group-hover:text-primary-light transition-colors break-words">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-secondary-light font-sans font-medium mt-0.5 break-words">
                {subtitle}
              </p>
            )}
          </div>
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-xl border border-[#0055AA]/45 bg-[#0055AA]/15 text-secondary-light group-hover:border-[#E52D6D] group-hover:bg-[#E52D6D] group-hover:text-white inline-flex items-center justify-center shrink-0 transition-colors"
          >
            →
          </span>
        </div>

        {microfield.descriptionMisak && (
          <p className="text-xs sm:text-sm text-white/95 font-sans font-medium leading-relaxed break-words">
            {microfield.descriptionMisak}
          </p>
        )}
        {microfield.description && (
          <p className="text-sm text-gray-300 leading-relaxed break-words">
            {microfield.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0055AA]" aria-hidden="true" />
          {microfield.terms.length} término{microfield.terms.length !== 1 ? 's' : ''}
          {subnivelCount > 0
            ? ` · ${subnivelCount} subnivel${subnivelCount !== 1 ? 'es' : ''}`
            : ''}
        </span>
      </div>
    </Link>
  );
};
