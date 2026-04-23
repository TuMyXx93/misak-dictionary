import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Term } from '@/types/semanticField';
import { TermRow } from './TermRow';

const baseTerm: Term = {
  id: 'test-term',
  misak: 'Shɵka',
  spanish: 'Totuma',
};

describe('TermRow', () => {
  it('renders misak and spanish terms', () => {
    render(<TermRow term={baseTerm} />);
    expect(screen.getByText('Shɵka')).toBeInTheDocument();
    expect(screen.getByText('Totuma')).toBeInTheDocument();
  });

  it('renders with part of speech', () => {
    const termWithPos: Term = { ...baseTerm, partOfSpeech: 'sustantivo' };
    render(<TermRow term={termWithPos} />);
    expect(screen.getByText(/sustantivo/)).toBeInTheDocument();
  });

  it('renders with example in Misak', () => {
    const termWithExample: Term = { ...baseTerm, exampleMisak: 'ashi shɵka' };
    render(<TermRow term={termWithExample} />);
    expect(screen.getByText(/ej. ashi shɵka/)).toBeInTheDocument();
  });
});
