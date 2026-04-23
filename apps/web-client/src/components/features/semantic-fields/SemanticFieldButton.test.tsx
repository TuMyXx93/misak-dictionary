import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';

describe('SemanticFieldButton', () => {
  const mockFieldLeft: SemanticFieldSummary = {
    id: 'ya',
    name: 'Ya',
    nameSpanish: 'La Casa',
    shortDescription: 'El hogar y el fogón central de la vida Misak.',
    iconKey: 'house',
    position: { x: 20, y: 60 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  const mockFieldRight: SemanticFieldSummary = {
    id: 'namui-nu-piro',
    name: 'Namui Nu Pirɵ',
    nameSpanish: 'Nuestro Territorio',
    shortDescription: 'El territorio como un todo.',
    iconKey: 'territory',
    position: { x: 82, y: 66 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  it('tiene aria-label bilingüe correcto', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Explorar campo Ya: La Casa');
  });

  it('muestra el icono pero no el label en reposo (icon-only)', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.textContent).not.toContain('Ya');
  });

  it('expande y muestra label al recibir focus', async () => {
    const user = userEvent.setup();
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    await user.tab();
    expect(button.textContent).toContain('Ya');
  });

  it('dispara callback al hacer click en desktop', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('auto-flip: botón izquierdo usa flex-row', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    const classes = button.className.split(/\s+/);
    expect(classes).toContain('flex-row');
    expect(classes).not.toContain('flex-row-reverse');
  });

  it('auto-flip: botón derecho usa flex-row-reverse', () => {
    render(<SemanticFieldButton field={mockFieldRight} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    const classes = button.className.split(/\s+/);
    expect(classes).toContain('flex-row-reverse');
    expect(classes).not.toContain('flex-row');
  });
});
