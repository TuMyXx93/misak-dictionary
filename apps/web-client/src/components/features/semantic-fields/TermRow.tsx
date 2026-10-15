/**
 * TermRow — Phase 2 PR #2
 *
 * Bilingual term row displaying Misak lemma and Spanish translation.
 * Used within a TermList for the microfield term catalogue.
 */

import type { Term } from '@/types/semanticField';

interface TermRowProps {
  term: Term;
}

export const TermRow = ({ term }: TermRowProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300 gap-3 sm:gap-4">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-lg font-display font-bold text-white break-words">{term.misak}</span>
        {term.exampleMisak && (
          <span className="text-xs text-text-muted italic break-words">
            ej. {term.exampleMisak}
          </span>
        )}
      </div>
      <div className="flex flex-col sm:items-end sm:text-right min-w-0">
        <span className="text-text-muted break-words">{term.spanish}</span>
        {term.partOfSpeech && (
          <span className="text-xs text-primary italic mt-0.5">({term.partOfSpeech})</span>
        )}
      </div>
    </div>
  );
};
