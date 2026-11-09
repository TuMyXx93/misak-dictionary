import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VIDEOS } from '@/constants/assets';
import { VideoSection } from './VideoSection';

describe('VideoSection', () => {
  it('renderiza correctamente', () => {
    const { container } = render(<VideoSection />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('tiene el id "recorrido" y aria-labelledby para navegación y accesibilidad', () => {
    const { container } = render(<VideoSection />);

    const section = container.querySelector('section#recorrido');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'recorrido-heading');

    const heading = container.querySelector('#recorrido-heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-fluid-h2', 'text-white', 'font-display', 'font-bold');
    expect(heading).not.toHaveClass('text-primary');
  });

  it('contiene un iframe de YouTube', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('usa el ID de video correcto de las constantes', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain(VIDEOS.RECORRIDO.ID);
  });

  it('configura el tiempo de inicio correcto', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain(`start=${VIDEOS.RECORRIDO.START_TIME}`);
  });

  it('tiene los parámetros de YouTube configurados', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    const src = iframe?.getAttribute('src') || '';

    expect(src).toContain('autoplay=0');
    expect(src).toContain('controls=1');
    expect(src).toContain('modestbranding=1');
    expect(src).toContain('rel=0');
  });

  it('tiene el atributo allowFullScreen', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveAttribute('allowFullScreen');
  });

  it('tiene el título correcto para accesibilidad', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveAttribute('title', 'Recorrido del territorio Misak');
  });

  it('aplica las clases de estilo correctas', () => {
    const { container } = render(<VideoSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('min-h-dvh', 'snap-start', 'bg-background');
  });

  it('el iframe tiene aspect ratio de video', () => {
    const { container } = render(<VideoSection />);

    const videoContainer = container.querySelector('.aspect-video');
    expect(videoContainer).toBeInTheDocument();
  });

  it('tiene estilos de borde redondeado y sombra', () => {
    const { container } = render(<VideoSection />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveClass('rounded-lg', 'shadow-2xl');
  });

  it('tiene animación de framer-motion configurada', () => {
    const { container } = render(<VideoSection />);

    const motionDiv = container.querySelector('.max-w-4xl');
    expect(motionDiv).toBeInTheDocument();
  });
});
