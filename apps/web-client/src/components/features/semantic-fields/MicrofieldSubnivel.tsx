/**
 * MicrofieldSubnivel — Spec 004
 *
 * Sección recursiva para un subnivel de microcampo con deduplicación bilingüe
 * y soporte multimedia de subnivel.
 */

import { TermList } from '@components/features/semantic-fields/TermList';
import { SectionMediaShowcase } from '@/components/media/CulturalResourceRegistry';
import { type Microfield, resolveBilingualTitle } from '@/types/semanticField';

export interface MicrofieldSubnivelProps {
  microfield: Microfield;
  /** Nivel de encabezado HTML (3 = h3, …). Se limita a h6. */
  nivel: number;
}

type EncabezadoSubnivel = 'h3' | 'h4' | 'h5' | 'h6';

export const MicrofieldSubnivel = ({ microfield, nivel }: MicrofieldSubnivelProps) => {
  const Encabezado = `h${Math.min(nivel, 6)}` as EncabezadoSubnivel;
  const idTitulo = `subnivel-${microfield.id}-titulo`;
  const subniveles = microfield.subniveles ?? [];
  const { title, subtitle } = resolveBilingualTitle(
    microfield.name,
    microfield.nameSpanish ?? microfield.nameMisak,
  );

  return (
    <section
      id={`subnivel-${microfield.id}`}
      aria-labelledby={idTitulo}
      className="scroll-mt-28 mt-10 pt-6 border-t border-white/10 transition-colors duration-200 rounded-2xl"
    >
      <Encabezado
        id={idTitulo}
        className="text-xl font-bold font-display mb-1 text-primary-light break-words"
      >
        {title}
      </Encabezado>
      {subtitle ? (
        <p className="text-sm text-secondary-light font-sans font-medium mb-2 break-words">
          {subtitle}
        </p>
      ) : null}
      {microfield.description ? (
        <p className="text-gray-300 text-sm mb-4 leading-relaxed break-words">
          {microfield.description}
        </p>
      ) : null}

      <SectionMediaShowcase
        title={title}
        namtrikAudio={microfield.namtrikAudio}
        espanolAudio={microfield.espanolAudio}
        imagen={microfield.imagen}
        medios={microfield.medios}
        className="mb-4 mt-2"
      />

      {microfield.terms.length > 0 ? (
        <TermList terms={microfield.terms} />
      ) : subniveles.length === 0 ? (
        <p className="text-text-muted py-4">Términos en preparación.</p>
      ) : null}

      {subniveles.map((hijo) => (
        <MicrofieldSubnivel key={hijo.id} microfield={hijo} nivel={nivel + 1} />
      ))}
    </section>
  );
};
