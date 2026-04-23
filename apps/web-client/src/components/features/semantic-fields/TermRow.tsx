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
    <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-background-dark/30 hover:bg-background-dark/55 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300">
      <div className="flex flex-col">
        <span className="text-lg font-display font-bold text-white">{term.misak}</span>
        {term.exampleMisak && (
          <span className="text-xs text-text-muted italic">ej. {term.exampleMisak}</span>
        )}
      </div>
      <div className="text-right">
        <span className="text-text-muted">{term.spanish}</span>
        {term.partOfSpeech && (
          <span className="ml-2 text-xs text-primary italic">({term.partOfSpeech})</span>
        )}
      </div>
    </div>
  );
};
