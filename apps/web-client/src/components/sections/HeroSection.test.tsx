import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renderiza correctamente', () => {
    render(<HeroSection />);

    // Verifica que el título esté presente
    const title = screen.getByText('Diccionario Misak');
    expect(title).toBeInTheDocument();
  });

  it('contiene la imagen del territorio Misak', () => {
    const { container } = render(<HeroSection />);

    const img = container.querySelector('img[alt="Territorio Misak"]');
    expect(img).toBeInTheDocument();
  });

  it('muestra el hotspot interactivo', () => {
    render(<HeroSection />);

    const hotspot = screen.getByRole('link', { name: /Campo semántico 1: Wallikatɵ/i });
    expect(hotspot).toBeInTheDocument();
    expect(hotspot).toHaveAttribute('href', '#recorrido');
  });

  it('muestra el tooltip del hotspot con el texto correcto', () => {
    const { container } = render(<HeroSection />);

    const tooltipText = container.querySelector('.group-hover\\:opacity-100');
    expect(tooltipText).toBeInTheDocument();
  });

  it('contiene el indicador de scroll', () => {
    const { container } = render(<HeroSection />);

    // Verifica que el SVG de la flecha de scroll esté presente
    const scrollIcon = container.querySelector('svg path[d*="M19 14l-7 7"]');
    expect(scrollIcon).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas', () => {
    const { container } = render(<HeroSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('relative', 'h-screen', 'snap-start');
  });

  it('tiene el gradient overlay', () => {
    const { container } = render(<HeroSection />);

    const overlay = container.querySelector('.bg-gradient-to-t');
    expect(overlay).toBeInTheDocument();
  });

  it('el título tiene animación de framer-motion', () => {
    render(<HeroSection />);

    const title = screen.getByText('Diccionario Misak');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('text-4xl', 'md:text-6xl', 'font-bold');
  });
});
