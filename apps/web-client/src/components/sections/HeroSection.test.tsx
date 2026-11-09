import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';
import { HeroSection } from './HeroSection';

const renderHero = () =>
  renderWithQueryClient(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>,
  );

describe('HeroSection', () => {
  it('renderiza correctamente', () => {
    renderHero();

    const title = screen.getByText('Diccionario Misak');
    expect(title).toBeInTheDocument();
  });

  it('contiene la imagen del territorio Misak', () => {
    const { container } = renderHero();

    const img = container.querySelector('img[alt="Territorio Misak"]');
    expect(img).toBeInTheDocument();
  });

  it('contiene el indicador de scroll', () => {
    const { container } = renderHero();

    const scrollIcon = container.querySelector('svg path[d*="M19 14l-7 7"]');
    expect(scrollIcon).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas y optimización LCP', () => {
    const { container } = renderHero();

    const section = container.querySelector('section');
    expect(section).toHaveClass('relative', 'snap-start');
    expect(section?.className).toContain('min-h-dvh');

    const heroImg = container.querySelector('img[alt="Territorio Misak"]');
    expect(heroImg).not.toHaveAttribute('loading', 'lazy');
    expect(heroImg).toHaveAttribute('fetchpriority', 'high');
  });

  it('tiene el gradient overlay', () => {
    const { container } = renderHero();

    const overlay = container.querySelector('.bg-gradient-to-t');
    expect(overlay).toBeInTheDocument();
  });

  it('el título tiene animación de framer-motion', () => {
    renderHero();

    const title = screen.getByText('Diccionario Misak');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('text-fluid-hero', 'font-bold');
  });

  it('renderiza el botón estandarizado "Campos Semánticos" sin punto magenta ni flecha', () => {
    const { container } = renderHero();

    const ctaButton = screen.getByRole('link', { name: /campos semánticos/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/campos');
    expect(ctaButton.textContent).toContain('Campos semánticos');
    expect(ctaButton.textContent).not.toContain('Explorar');
    expect(ctaButton.textContent).not.toContain('→');

    // No debe contener el punto magenta previo (antiguo span de 2x2)
    const oldDot = container.querySelector('span.w-2.h-2.rounded-full.bg-\\[\\#E52D6D\\]');
    expect(oldDot).toBeNull();
  });
});
