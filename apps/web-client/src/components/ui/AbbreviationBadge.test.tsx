/**
 * AbbreviationBadge.test.tsx
 * Tests para la insignia accesible de abreviaturas lingüísticas y gramaticales (Spec 012 / R-012, R-017)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AbbreviationBadge } from './AbbreviationBadge';

describe('AbbreviationBadge', () => {
  it('renderiza el código de la abreviatura oficial', () => {
    render(<AbbreviationBadge value="s." />);
    expect(screen.getByRole('button', { name: /s\.: Sustantivo/i })).toBeInTheDocument();
    expect(screen.getByText('s.')).toBeInTheDocument();
  });

  it('desglosa abreviaturas compuestas como "loc. nom., adj."', () => {
    render(<AbbreviationBadge value="loc. nom., adj." />);
    expect(screen.getByText('loc. nom.')).toBeInTheDocument();
    expect(screen.getByText('adj.')).toBeInTheDocument();
  });

  it('abre el popover interactivo al hacer clic o tap', () => {
    render(<AbbreviationBadge value="v." />);
    const btn = screen.getByRole('button', { name: /v\.: Verbo/i });
    fireEvent.click(btn);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(screen.getByText('Verbo')).toBeInTheDocument();
    expect(screen.getByText(/Palabra que indica acción, proceso, estado/i)).toBeInTheDocument();
  });

  it('cierra el popover al presionar Escape', () => {
    render(<AbbreviationBadge value="adj." />);
    const btn = screen.getByRole('button', { name: /adj\.: Adjetivo/i });
    fireEvent.click(btn);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('no renderiza nada si el valor es nulo o vacío', () => {
    const { container } = render(<AbbreviationBadge value={null} />);
    expect(container.firstChild).toBeNull();
  });
});
