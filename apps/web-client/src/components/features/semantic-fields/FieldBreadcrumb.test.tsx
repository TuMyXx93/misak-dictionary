import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { SemanticField } from '@/types/semanticField';
import { FieldBreadcrumb } from './FieldBreadcrumb';

const mockField: SemanticField = {
  id: 'ya',
  name: 'Ya',
  nameSpanish: 'La Casa',
  shortDescription: 'El hogar',
  iconKey: 'house',
  status: 'available',
  position: { x: 20, y: 60 },
  drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  subfields: [],
};

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('FieldBreadcrumb', () => {
  it('renders field link', () => {
    renderWithRouter(<FieldBreadcrumb field={mockField} />);
    expect(screen.getByText('Ya')).toBeInTheDocument();
  });

  it('renders subfield link when provided', () => {
    const subfield = {
      id: 'fogon',
      name: 'Fogon',
      description: 'El fogón',
      microfields: [],
    };
    renderWithRouter(<FieldBreadcrumb field={mockField} subfield={subfield} />);
    expect(screen.getByText('Fogon')).toBeInTheDocument();
  });

  it('renders microfield name when provided', () => {
    const subfield = {
      id: 'fogon',
      name: 'Fogon',
      description: 'El fogón',
      microfields: [],
    };
    renderWithRouter(
      <FieldBreadcrumb field={mockField} subfield={subfield} microfieldName="Utensilios" />,
    );
    expect(screen.getByText('Utensilios')).toBeInTheDocument();
  });
});
