import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renderiza correctamente', () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const title = screen.getByText('Diccionario Misak');
    expect(title).toBeInTheDocument();
  });

  it('contiene la imagen del territorio Misak', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const img = container.querySelector('img[alt="Territorio Misak"]');
    expect(img).toBeInTheDocument();
  });

  it('contiene el indicador de scroll', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const scrollIcon = container.querySelector('svg path[d*="M19 14l-7 7"]');
    expect(scrollIcon).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('relative', 'snap-start');
    expect(section?.className).toContain('min-h-dvh');
    expect(section?.className).toContain('h-screen');
  });

  it('tiene el gradient overlay', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const overlay = container.querySelector('.bg-gradient-to-t');
    expect(overlay).toBeInTheDocument();
  });

  it('el título tiene animación de framer-motion', () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const title = screen.getByText('Diccionario Misak');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('text-fluid-hero', 'font-bold');
  });
});
