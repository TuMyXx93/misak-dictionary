import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Term } from '@/types/semanticField';
import { TermList } from './TermList';

const mockTerms: Term[] = [
  { id: 't1', misak: 'Sruik', spanish: 'Olla de barro' },
  { id: 't2', misak: 'Pɵta', spanish: 'Plato hondo' },
];

describe('TermList', () => {
  it('renders all terms', () => {
    render(<TermList terms={mockTerms} />);
    expect(screen.getByText('Sruik')).toBeInTheDocument();
    expect(screen.getByText('Plato hondo')).toBeInTheDocument();
  });

  it('renders multiple terms', () => {
    render(<TermList terms={mockTerms} />);
    expect(screen.getAllByText('Sruik')).toHaveLength(1);
    expect(screen.getByText('Pɵta')).toBeInTheDocument();
  });

  it('renders empty list without crashing', () => {
    render(<TermList terms={[]} />);
    expect(screen.queryByText('Sruik')).not.toBeInTheDocument();
  });
});
