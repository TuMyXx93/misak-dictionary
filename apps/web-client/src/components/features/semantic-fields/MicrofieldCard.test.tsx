import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Microfield } from '@/types/semanticField';
import { MicrofieldCard } from './MicrofieldCard';

const mockMicrofield: Microfield = {
  id: 'utensilios',
  name: 'Utensilios del fogón',
  nameMisak: 'Kawe',
  description: 'Instrumentos tradicionales',
  terms: [
    { id: 't1', misak: 'Sruik', spanish: 'Olla' },
    { id: 't2', misak: 'Pɵta', spanish: 'Plato' },
  ],
};

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('MicrofieldCard', () => {
  it('renders microfield name and description', () => {
    renderWithRouter(
      <MicrofieldCard microfield={mockMicrofield} fieldId="ya" subfieldId="fogon" />,
    );
    expect(screen.getByText('Utensilios del fogón')).toBeInTheDocument();
    expect(screen.getByText('Instrumentos tradicionales')).toBeInTheDocument();
  });

  it('renders Misak name when present', () => {
    renderWithRouter(
      <MicrofieldCard microfield={mockMicrofield} fieldId="ya" subfieldId="fogon" />,
    );
    expect(screen.getByText('Kawe')).toBeInTheDocument();
  });

  it('renders term count', () => {
    renderWithRouter(
      <MicrofieldCard microfield={mockMicrofield} fieldId="ya" subfieldId="fogon" />,
    );
    expect(screen.getByText(/2 términos/)).toBeInTheDocument();
  });

  it('renders singular term count', () => {
    const singleTerm = {
      ...mockMicrofield,
      terms: [{ id: 't1', misak: 'Sruik', spanish: 'Olla' }],
    };
    renderWithRouter(<MicrofieldCard microfield={singleTerm} fieldId="ya" subfieldId="fogon" />);
    expect(screen.getByText(/1 término$/)).toBeInTheDocument();
  });
});
