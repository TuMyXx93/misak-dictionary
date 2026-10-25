/**
 * SubfieldCard — Tarjeta navegable mobile-first para Subcampos Semánticos
 *
 * - Deduplica automáticamente subtítulos idénticos (p. ej. "Nakchak" / "Nakchak").
 * - Combina estructura en Azul Misak (#0055AA) y acento interactivo en Magenta (#E52D6D).
 * - Altura uniforme en grilla y alineación izquierda de alta legibilidad.
 */

import { Link } from 'react-router-dom';
import { resolveBilingualTitle, type Subfield } from '@/types/semanticField';

interface SubfieldCardProps {
  subfield: Subfield;
  fieldId: string;
}

export const SubfieldCard = ({ subfield, fieldId }: SubfieldCardProps) => {
  const { title, subtitle } = resolveBilingualTitle(
    subfield.name,
    subfield.nameSpanish ?? subfield.nameMisak,
  );

  const countLabel =
    subfield.microfields.length > 0 && subfield.terms && subfield.terms.length > 0
      ? `${subfield.microfields.length} microcampo${subfield.microfields.length !== 1 ? 's' : ''} · ${subfield.terms.length} término${subfield.terms.length !== 1 ? 's' : ''}`
      : subfield.microfields.length > 0
        ? `${subfield.microfields.length} microcampo${subfield.microfields.length !== 1 ? 's' : ''}`
        : `${subfield.terms?.length ?? 0} término${(subfield.terms?.length ?? 0) !== 1 ? 's' : ''}`;

  const hasSectionMedia = Boolean(
    subfield.namtrikAudio ||
      subfield.espanolAudio ||
      subfield.imagen ||
      (subfield.medios && subfield.medios.length > 0),
  );

  return (
    <Link
      to={`/campos/${fieldId}/${subfield.id}`}
      className="group h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-[#0055AA]/40 bg-background-dark/65 hover:bg-background-dark/90 hover:border-[#E52D6D]/75 transition-all duration-250 shadow-md @container"
    >
      <div className="space-y-2.5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white group-hover:text-primary-light transition-colors break-words">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-secondary-light italic mt-0.5 break-words">{subtitle}</p>
            )}
          </div>
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-xl border border-[#0055AA]/45 bg-[#0055AA]/15 text-secondary-light group-hover:border-[#E52D6D] group-hover:bg-[#E52D6D] group-hover:text-white inline-flex items-center justify-center shrink-0 transition-colors"
          >
            →
          </span>
        </div>

        {subfield.descriptionMisak && (
          <p className="text-xs text-white/90 font-serif italic leading-relaxed break-words">
            {subfield.descriptionMisak}
          </p>
        )}
        {subfield.description && (
          <p className="text-sm text-gray-300 leading-relaxed break-words">
            {subfield.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E52D6D]" aria-hidden="true" />
          {countLabel}
        </span>
        {hasSectionMedia && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0055AA]/25 text-secondary-light border border-[#0055AA]/45">
            Multimedia
          </span>
        )}
      </div>
    </Link>
  );
};
