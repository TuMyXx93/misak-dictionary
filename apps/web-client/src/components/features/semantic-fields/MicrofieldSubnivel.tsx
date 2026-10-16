/**
 * MicrofieldSubnivel — Spec 004
 *
 * Sección recursiva para un subnivel de microcampo. Un subnivel puede contener
 * términos y más subniveles, a cualquier profundidad: el componente se llama a sí
 * mismo para cada hijo. El encabezado sube de nivel hasta h6 y luego se mantiene.
 */

import { TermList } from '@components/features/semantic-fields/TermList';
import type { Microfield } from '@/types/semanticField';

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

  return (
    <section aria-labelledby={idTitulo} className="mt-8">
      <Encabezado id={idTitulo} className="text-xl font-bold font-display mb-2 text-primary">
        {microfield.name}
      </Encabezado>
      {microfield.nameSpanish && microfield.nameMisak ? (
        <p className="text-text-muted mb-2">{microfield.nameSpanish}</p>
      ) : null}
      {microfield.description ? (
        <p className="text-text-muted mb-4">{microfield.description}</p>
      ) : null}

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
