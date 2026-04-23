import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';

describe('SemanticFieldButton', () => {
  const mockField: SemanticFieldSummary = {
    id: 'territorio',
    name: 'Territorio',
    shortDescription: 'La tierra, los ríos, los caminos.',
    iconKey: 'territory',
    position: { x: 18, y: 68 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  it('renderiza el nombre del campo', () => {
    render(<SemanticFieldButton field={mockField} onClick={vi.fn()} />);
    expect(screen.getByText('Territorio')).toBeInTheDocument();
  });

  it('tiene aria-label correcto', () => {
    render(<SemanticFieldButton field={mockField} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Explorar campo semántico: Territorio',
    );
  });

  it('dispara callback al hacer click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SemanticFieldButton field={mockField} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
