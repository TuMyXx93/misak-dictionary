import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldModal } from './SemanticFieldModal';

describe('SemanticFieldModal', () => {
  const mockField: SemanticFieldSummary = {
    id: 'ya',
    name: 'Ya',
    nameSpanish: 'La Casa',
    shortDescription: 'El hogar y el fogón central de la vida Misak.',
    iconKey: 'house',
    position: { x: 20, y: 60 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  it('renderiza el nombre Misak y nameSpanish cuando está abierto', () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    expect(screen.getByText('Ya')).toBeInTheDocument();
    expect(screen.getByText('La Casa')).toBeInTheDocument();
    expect(screen.getByText('El hogar y el fogón central de la vida Misak.')).toBeInTheDocument();
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

  it('focus inicial cae en botón Cerrar (no en CTA disabled)', async () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    const closeButton = screen.getByText('Cerrar');
    expect(closeButton).toHaveFocus();
  });

  it('botón CTA está deshabilitado', () => {
    render(<SemanticFieldModal field={mockField} onClose={vi.fn()} />);
    const button = screen.getByText('Explorar este campo — próximamente');
    expect(button).toBeDisabled();
  });
});
