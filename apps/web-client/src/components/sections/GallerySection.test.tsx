import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEXTS } from '@/constants/assets';
import { GallerySection } from './GallerySection';

describe('GallerySection', () => {
  it('renderiza correctamente', () => {
    const { container } = render(<GallerySection />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('muestra las 3 imágenes de la galería', () => {
    const { container } = render(<GallerySection />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
  });

  it('muestra los títulos correctos de las imágenes', () => {
    render(<GallerySection />);

    TEXTS.GALLERY.IMAGES.forEach((image) => {
      const title = screen.getByText(image.title);
      expect(title).toBeInTheDocument();
    });
  });

  it('verifica los textos alternativos de las imágenes', () => {
    const { container } = render(<GallerySection />);

    const images = container.querySelectorAll('img');
    images.forEach((img, index) => {
      expect(img).toHaveAttribute('alt', TEXTS.GALLERY.IMAGES[index].alt);
    });
  });

  it('usa un grid responsive', () => {
    const { container } = render(<GallerySection />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
  });

  it('cada imagen tiene aspect ratio cuadrado', () => {
    const { container } = render(<GallerySection />);

    const imageContainers = container.querySelectorAll('.aspect-square');
    expect(imageContainers).toHaveLength(3);
  });

  it('las imágenes tienen bordes redondeados y sombra', () => {
    const { container } = render(<GallerySection />);

    const imageContainers = container.querySelectorAll('.rounded-lg.shadow-lg');
    expect(imageContainers.length).toBeGreaterThan(0);
  });

  it('cada imagen tiene un overlay con título', () => {
    const { container } = render(<GallerySection />);

    const overlays = container.querySelectorAll('.bg-black.bg-opacity-40');
    expect(overlays).toHaveLength(3);
  });

  it('aplica las clases de estilo correctas a la sección', () => {
    const { container } = render(<GallerySection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('h-screen', 'snap-start', 'bg-background');
  });

  it('los títulos tienen el estilo correcto', () => {
    render(<GallerySection />);

    TEXTS.GALLERY.IMAGES.forEach((image) => {
      const title = screen.getByText(image.title);
      expect(title).toHaveClass('text-white', 'text-xl', 'font-bold');
    });
  });

  it('tiene animación de framer-motion para cada imagen', () => {
    const { container } = render(<GallerySection />);

    // Debe haber múltiples motion divs (uno por cada imagen)
    const motionDivs = container.querySelectorAll('.group');
    expect(motionDivs).toHaveLength(3);
  });

  it('está centrado en la pantalla', () => {
    const { container } = render(<GallerySection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
