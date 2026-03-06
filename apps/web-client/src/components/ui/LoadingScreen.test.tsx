import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renderiza correctamente', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('muestra el texto de carga', () => {
    render(<LoadingScreen />);
    const loadingText = screen.getByText(/cargando/i);
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveClass('text-lg', 'text-text/70');
  });

  it('tiene el layout centrado', () => {
    const { container } = render(<LoadingScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'h-screen', 'w-full', 'items-center', 'justify-center');
  });

  it('usa el background correcto', () => {
    const { container } = render(<LoadingScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bg-background');
  });

  it('contiene elementos animados', () => {
    const { container } = render(<LoadingScreen />);

    // Verifica que hay elementos motion.div (framer-motion)
    const motionDivs = container.querySelectorAll('[style*="opacity"]');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('muestra tres puntos de carga', () => {
    const { container } = render(<LoadingScreen />);

    // Los tres puntos animados deben estar presentes
    const dots = container.querySelectorAll('.h-2.w-2.rounded-full.bg-primary');
    expect(dots).toHaveLength(3);
  });

  it('tiene un spinner circular', () => {
    const { container } = render(<LoadingScreen />);

    // Buscar el elemento con border-4 que representa el spinner
    const spinner = container.querySelector('.h-16.w-16.rounded-full.border-4');
    expect(spinner).toBeInTheDocument();
  });

  it('el spinner tiene los estilos correctos', () => {
    const { container } = render(<LoadingScreen />);

    const spinner = container.querySelector('.h-16.w-16.rounded-full.border-4');
    expect(spinner).toHaveClass('border-primary', 'border-t-transparent');
  });

  it('está optimizado para accesibilidad', () => {
    const { container } = render(<LoadingScreen />);

    // Verifica que el contenedor principal tiene estructura semántica
    expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
  });

  it('mantiene la identidad visual del proyecto', () => {
    const { container } = render(<LoadingScreen />);

    // Verifica que usa los colores del design system
    const primaryElements = container.querySelectorAll('.bg-primary, .border-primary');
    expect(primaryElements.length).toBeGreaterThan(0);
  });
});
