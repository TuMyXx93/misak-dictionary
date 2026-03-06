import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home } from './Home';

describe('Home', () => {
  it('renderiza correctamente', () => {
    const { container } = render(<Home />);
    expect(container).toBeInTheDocument();
  });

  it('usa el MainLayout', () => {
    const { container } = render(<Home />);

    // MainLayout debe tener las clases de snap scroll
    const layout = container.querySelector('.snap-y.snap-mandatory');
    expect(layout).toBeInTheDocument();
  });

  it('renderiza HeroSection', () => {
    render(<Home />);

    // Verifica que el título del hero esté presente
    const heroTitle = screen.getByText('Diccionario Misak');
    expect(heroTitle).toBeInTheDocument();
  });

  it('renderiza VideoSection', () => {
    const { container } = render(<Home />);

    // VideoSection debe tener un iframe
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('renderiza InfoSection', () => {
    render(<Home />);

    const infoTitle = screen.getByText('El Territorio como Metáfora');
    expect(infoTitle).toBeInTheDocument();
  });

  it('renderiza GallerySection', () => {
    render(<Home />);

    // Verifica uno de los títulos de la galería
    const galleryTitle = screen.getByText('Logo bandera de Guambia');
    expect(galleryTitle).toBeInTheDocument();
  });

  it('renderiza CreditsSection', () => {
    render(<Home />);

    const creditsTitle = screen.getByText('Créditos');
    expect(creditsTitle).toBeInTheDocument();
  });

  it('todas las secciones están en el orden correcto', () => {
    const { container } = render(<Home />);

    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(5); // Hero, Video, Info, Gallery, Credits
  });

  it('cada sección tiene snap-start para scroll', () => {
    const { container } = render(<Home />);

    const sections = container.querySelectorAll('section.snap-start');
    expect(sections.length).toBe(5);
  });

  it('todas las secciones tienen altura completa', () => {
    const { container } = render(<Home />);

    const fullHeightSections = container.querySelectorAll('section.h-screen');
    expect(fullHeightSections.length).toBe(5);
  });
});
