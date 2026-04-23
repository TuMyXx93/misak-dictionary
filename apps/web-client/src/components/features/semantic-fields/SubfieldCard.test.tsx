import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Subfield } from '@/types/semanticField';
import { SubfieldCard } from './SubfieldCard';

const mockSubfield: Subfield = {
  id: 'fogon',
  name: 'Fogon',
  nameMisak: 'Namui',
  description: 'El fogón central',
  microfields: [{ id: 'm1', name: 'Utensilios', description: 'Test', terms: [] }],
};

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('SubfieldCard', () => {
  it('renders subfield name and description', () => {
    renderWithRouter(<SubfieldCard subfield={mockSubfield} fieldId="ya" />);
    expect(screen.getByText('Fogon')).toBeInTheDocument();
    expect(screen.getByText('El fogón central')).toBeInTheDocument();
  });

  it('renders Misak name when present', () => {
    renderWithRouter(<SubfieldCard subfield={mockSubfield} fieldId="ya" />);
    expect(screen.getByText('Namui')).toBeInTheDocument();
  });

  it('renders microfield count', () => {
    renderWithRouter(<SubfieldCard subfield={mockSubfield} fieldId="ya" />);
    expect(screen.getByText(/1 microcampo/)).toBeInTheDocument();
  });

  it('renders plural microfield count', () => {
    const multiMicrofield = {
      ...mockSubfield,
      microfields: [
        { id: 'm1', name: 'U1', description: 'T', terms: [] },
        { id: 'm2', name: 'U2', description: 'T', terms: [] },
      ],
    };
    renderWithRouter(<SubfieldCard subfield={multiMicrofield} fieldId="ya" />);
    expect(screen.getByText(/2 microcampos/)).toBeInTheDocument();
  });
});
