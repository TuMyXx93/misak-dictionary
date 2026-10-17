/**
 * TermRow — Phase 2 PR #2 · Spec 005 (Modelo «Sentido + Formas»)
 *
 * Fila léxica bilingüe con soporte para:
 * - Múltiples formas namtrik (variantes, acepciones, neologismos, categoría gramatical)
 * - Nombres científicos en cursiva
 * - Explicaciones contextuales en namtrik y español
 * - Pares dialógicos de Saludos (pregunta ↔ respuesta bilingüe)
 */

import type { FormaNamtrik, Term } from '@/types/semanticField';

interface TermRowProps {
  term: Term;
}

const InsigniaEnRevision = () => (
  // biome-ignore lint/a11y/useSemanticElements: role=status es el patrón estándar para insignias de estado sin semántica de formulario
  <span
    role="status"
    aria-label="Término en revisión editorial"
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-200 border border-amber-500/50 shadow-xs"
  >
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5 text-amber-400 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>En revisión</span>
  </span>
);

export const TermRow = ({ term }: TermRowProps) => {
  const isDialogico = term.tipo === 'dialogico' || Boolean(term.dialogo);

  if (isDialogico && term.dialogo) {
    return (
      <div className="flex flex-col p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.005] transition-all duration-300 gap-4">
        {/* Pregunta / Saludo inicial */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-primary/10 pb-3">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary/80">
                Pregunta / Saludo
              </span>
              {term.estado === 'borrador' && <InsigniaEnRevision />}
            </div>
            <span className="text-lg font-display font-bold text-white break-words mt-1">
              {term.misak}
            </span>
            {term.descriptionMisak && (
              <span className="text-xs text-text-muted italic break-words mt-0.5">
                {term.descriptionMisak}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:items-end sm:text-right min-w-0">
            <span className="text-text-muted break-words font-medium">{term.spanish}</span>
            {term.descriptionSpanish && (
              <span className="text-xs text-text-muted/80 break-words mt-0.5">
                {term.descriptionSpanish}
              </span>
            )}
          </div>
        </div>

        {/* Respuesta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pt-1">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-secondary-light">
                Respuesta
              </span>
            </div>
            <span className="text-base font-display font-bold text-white/95 break-words mt-1">
              {term.dialogo.respuestaNamtrik}
            </span>
            {term.dialogo.respuestaNamtrikContexto && (
              <span className="text-xs text-text-muted italic break-words mt-0.5">
                {term.dialogo.respuestaNamtrikContexto}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:items-end sm:text-right min-w-0">
            <span className="text-text-muted break-words">
              {term.dialogo.respuestaEspanolGlosa}
            </span>
            {term.dialogo.respuestaEspanolExplicacion && (
              <span className="text-xs text-text-muted/80 break-words mt-0.5">
                {term.dialogo.respuestaEspanolExplicacion}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formas: FormaNamtrik[] =
    term.formas && term.formas.length > 0
      ? term.formas
      : [
          {
            orden: 1,
            lema: term.misak,
            categoriaGramatical: term.partOfSpeech ?? null,
            esNeologismo: false,
            rasgosGramaticales: [],
          },
        ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.005] transition-all duration-300 gap-3 sm:gap-4">
      {/* Columna Namtrik (primaria) */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {formas.map((forma, idx) => (
            <span
              key={forma.id ?? `${forma.lema}-${idx}`}
              className="inline-flex items-baseline gap-1.5 flex-wrap"
            >
              <span className="text-lg font-display font-bold text-white break-words">
                {forma.lema}
              </span>
              {forma.acepcionHomonima !== null && forma.acepcionHomonima !== undefined && (
                <sup className="text-xs text-primary font-bold">{forma.acepcionHomonima}</sup>
              )}
              {forma.categoriaGramatical && (
                <span className="text-xs text-primary italic">({forma.categoriaGramatical})</span>
              )}
              {forma.variante && (
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-primary/10 text-primary-light border border-primary/20">
                  {forma.variante}
                </span>
              )}
              {forma.esNeologismo && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  neol.
                </span>
              )}
              {idx < formas.length - 1 && <span className="text-text-muted/50 mr-1">/</span>}
            </span>
          ))}
          {term.estado === 'borrador' && <InsigniaEnRevision />}
        </div>

        {/* Explicación / Contexto en Namtrik */}
        {(term.descriptionMisak || term.exampleMisak) && (
          <span className="text-xs text-text-muted italic break-words mt-1">
            {term.exampleMisak ? `ej. ${term.exampleMisak}` : term.descriptionMisak}
          </span>
        )}

        {/* Nombre científico en cursiva */}
        {term.scientificName && (
          <span className="text-xs text-emerald-400/90 font-serif italic mt-0.5">
            {term.scientificName}
          </span>
        )}
      </div>

      {/* Columna Español */}
      <div className="flex flex-col sm:items-end sm:text-right min-w-0">
        <span className="text-text-muted break-words font-medium">{term.spanish}</span>
        {(term.descriptionSpanish || term.exampleSpanish) && (
          <span className="text-xs text-text-muted/80 break-words mt-0.5">
            {term.descriptionSpanish ?? term.exampleSpanish}
          </span>
        )}
      </div>
    </div>
  );
};
