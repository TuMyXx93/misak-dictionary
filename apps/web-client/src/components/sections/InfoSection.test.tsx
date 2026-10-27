import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEXTS } from '@/constants/assets';
import { InfoSection } from './InfoSection';

describe('InfoSection', () => {
  it('renderiza correctamente', () => {
    render(<InfoSection />);

    const title = screen.getByText(TEXTS.INFO.TITLE);
    expect(title).toBeInTheDocument();
  });

  it('muestra el título correcto', () => {
    render(<InfoSection />);

    const title = screen.getByText('El Territorio como metáfora');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });

  it('muestra el contenido descriptivo completo', () => {
    render(<InfoSection />);

    const content = screen.getByText(/El Diccionario Misak no es solo una colección de palabras/i);
    expect(content).toBeInTheDocument();
  });

  it('usa las constantes de texto correctamente', () => {
    render(<InfoSection />);

    // Verifica que ambos textos de las constantes estén presentes
    expect(screen.getByText(TEXTS.INFO.TITLE)).toBeInTheDocument();
    expect(screen.getByText(TEXTS.INFO.CONTENT)).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas a la sección', () => {
    const { container } = render(<InfoSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('min-h-dvh', 'snap-start', 'bg-background');
  });

  it('aplica estilos de tipografía adecuados', () => {
    render(<InfoSection />);

    const title = screen.getByText(TEXTS.INFO.TITLE);
    expect(title).toHaveClass('text-3xl', 'md:text-4xl', 'font-bold', 'text-primary');

    const content = screen.getByText(TEXTS.INFO.CONTENT);
    expect(content).toHaveClass('text-lg', 'md:text-xl', 'text-gray-200');
  });

  it('tiene animación de framer-motion configurada', () => {
    const { container } = render(<InfoSection />);

    // El contenedor con motion.div debería existir
    const motionDiv = container.querySelector('.max-w-4xl');
    expect(motionDiv).toBeInTheDocument();
  });

  it('está centrado en la pantalla', () => {
    const { container } = render(<InfoSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
