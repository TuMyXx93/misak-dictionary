import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldModal } from './SemanticFieldModal';

describe('SemanticFieldModal', () => {
  const mockField: SemanticFieldSummary = {
    id: 'territorio',
    name: 'Territorio',
    shortDescription: 'La tierra, los ríos, los caminos.',
    iconKey: 'territory',
    position: { x: 18, y: 68 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  it('renderiza el campo cuando está abierto', () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    expect(screen.getByText('Territorio')).toBeInTheDocument();
    expect(screen.getByText('La tierra, los ríos, los caminos.')).toBeInTheDocument();
  });

  it('no renderiza cuando field es null', () => {
    const { container } = render(<SemanticFieldModal field={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('cierra con ESC', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SemanticFieldModal field={mockField} onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tiene los atributos de accesibilidad correctos', () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('botón de CTA está deshabilitado', () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    const button = screen.getByText('Explorar este campo — próximamente');
    expect(button).toBeDisabled();
  });
});
