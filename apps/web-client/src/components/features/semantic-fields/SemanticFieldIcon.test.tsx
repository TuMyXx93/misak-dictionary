import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SemanticFieldIconKey } from '@/types/semanticField';
import { SemanticFieldIcon } from './SemanticFieldIcon';

describe('SemanticFieldIcon', () => {
  const allIconKeys: SemanticFieldIconKey[] = [
    'house',
    'garden',
    'mountain-farm',
    'wildlife',
    'cosmos-grid',
    'flora',
    'territory',
    'cosmos',
    'neologism',
  ];

  it.each(
    allIconKeys,
  )('renderiza el SVG con escalado fluido 100%% del contenedor para la clave "%s"', (iconKey) => {
    const { container } = render(<SemanticFieldIcon iconKey={iconKey} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    expect(svg).toHaveClass('w-full', 'h-full');
  });

  it('permite sobrescribir dinámicamente las dimensiones del contenedor con tailwind-merge', () => {
    const { container } = render(
      <SemanticFieldIcon iconKey="house" className="w-[70%] h-[70%] custom-icon-class" />,
    );
    const span = container.querySelector('span');

    expect(span).toBeInTheDocument();
    expect(span).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(span).toHaveClass('w-[70%]', 'h-[70%]', 'custom-icon-class');
    expect(span).not.toHaveClass('w-5', 'h-5');
  });

  it('activa data-animated="true" por defecto y permite desactivarlo con animated={false}', () => {
    const { container: animatedContainer } = render(<SemanticFieldIcon iconKey="house" />);
    expect(animatedContainer.querySelector('span')).toHaveAttribute('data-animated', 'true');

    const { container: staticContainer } = render(
      <SemanticFieldIcon iconKey="house" animated={false} />,
    );
    expect(staticContainer.querySelector('span')).toHaveAttribute('data-animated', 'false');
  });

  it('los 4 primeros iconos de campos semánticos (C1 a C4) contienen capas duotono y hooks de animación', () => {
    // C1: house (Ya)
    const { container: c1 } = render(<SemanticFieldIcon iconKey="house" />);
    expect(c1.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThanOrEqual(1);
    expect(c1.querySelector('.misak-svg-flame')).toBeInTheDocument();
    expect(c1.querySelector('.misak-svg-ember-1')).toBeInTheDocument();

    // C2: garden (Ya tul)
    const { container: c2 } = render(<SemanticFieldIcon iconKey="garden" />);
    expect(c2.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThanOrEqual(1);
    expect(c2.querySelector('.misak-svg-leaf-l')).toBeInTheDocument();
    expect(c2.querySelector('.misak-svg-pollen-1')).toBeInTheDocument();

    // C3: mountain-farm (Tra tul)
    const { container: c3 } = render(<SemanticFieldIcon iconKey="mountain-farm" />);
    expect(c3.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThanOrEqual(1);
    expect(c3.querySelector('.misak-svg-sun')).toBeInTheDocument();
    expect(c3.querySelector('.misak-svg-furrow-1')).toBeInTheDocument();

    // C4: wildlife (Kau ushamera)
    const { container: c4 } = render(<SemanticFieldIcon iconKey="wildlife" />);
    expect(c4.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThanOrEqual(1);
    expect(c4.querySelector('.misak-svg-bird')).toBeInTheDocument();
    expect(c4.querySelector('.misak-svg-water')).toBeInTheDocument();
  });
});
