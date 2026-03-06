import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollIndicator } from './ScrollIndicator';

describe('ScrollIndicator', () => {
  it('renderiza correctamente por defecto', () => {
    const { container } = render(<ScrollIndicator />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-8', 'h-8', 'text-white');
  });

  it('aplica clases CSS personalizadas', () => {
    const { container } = render(<ScrollIndicator className="text-blue-500 w-12 h-12" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('text-blue-500', 'w-12', 'h-12');
  });

  it('contiene el path del ícono de flecha', () => {
    const { container } = render(<ScrollIndicator />);
    const path = container.querySelector('path');

    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M19 14l-7 7m0 0l-7-7m7 7V3');
  });

  it('está envuelto en un motion.div para animación', () => {
    const { container } = render(<ScrollIndicator />);
    const wrapper = container.firstChild;

    expect(wrapper).toHaveClass('absolute', 'bottom-8');
  });
});
