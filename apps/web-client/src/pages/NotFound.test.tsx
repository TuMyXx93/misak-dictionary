import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  describe('Renderizado de contenido', () => {
    it('renderiza correctamente', () => {
      render(<NotFound />);

      // Verificar que el componente se renderiza
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    });

    it('muestra el número 404 grande', () => {
      render(<NotFound />);

      const heading = screen.getByText('404');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-9xl');
      expect(heading).toHaveClass('text-primary');
    });

    it('muestra el título descriptivo', () => {
      render(<NotFound />);

      const title = screen.getByText('Página no encontrada');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H2');
    });

    it('muestra el mensaje descriptivo completo', () => {
      render(<NotFound />);

      const message = screen.getByText(/Lo sentimos, la página que buscas no existe/i);
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass('text-text-muted');
    });

    it('muestra el mensaje adicional en la parte inferior', () => {
      render(<NotFound />);

      const additionalMessage = screen.getByText('Esta página no está disponible');
      expect(additionalMessage).toBeInTheDocument();
      expect(additionalMessage).toHaveAttribute('lang', 'es');
    });
  });

  describe('Botón de navegación', () => {
    it('renderiza el botón "Volver al inicio"', () => {
      render(<NotFound />);

      const button = screen.getByText('Volver al inicio');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('A');
    });

    it('el botón tiene el href correcto', () => {
      render(<NotFound />);

      const button = screen.getByText('Volver al inicio');
      expect(button).toHaveAttribute('href', '/');
    });

    it('el botón tiene estilos de primary button', () => {
      render(<NotFound />);

      const button = screen.getByText('Volver al inicio');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-background');
      expect(button).toHaveClass('hover:bg-primary-light');
    });

    it('el botón incluye un icono de casa', () => {
      const { container } = render(<NotFound />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accesibilidad', () => {
    it('el h1 tiene aria-label descriptivo', () => {
      render(<NotFound />);

      const heading = screen.getByText('404');
      expect(heading).toHaveAttribute('aria-label', 'Error 404');
    });

    it('el botón tiene aria-label descriptivo', () => {
      render(<NotFound />);

      const button = screen.getByText('Volver al inicio');
      expect(button).toHaveAttribute('aria-label', 'Volver a la página de inicio');
    });

    it('el icono está marcado como aria-hidden', () => {
      const { container } = render(<NotFound />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('usa estructura de headings correcta (h1 > h2)', () => {
      render(<NotFound />);

      const h1 = screen.getByText('404');
      const h2 = screen.getByText('Página no encontrada');

      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
    });
  });

  describe('Layout y estructura', () => {
    it('se renderiza dentro de MainLayout', () => {
      const { container } = render(<NotFound />);

      // MainLayout debería agregar elementos estructurales
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });

    it('tiene clase min-h-screen para ocupar toda la pantalla', () => {
      const { container } = render(<NotFound />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('centra el contenido verticalmente', () => {
      const { container } = render(<NotFound />);

      const mainContainer = container.querySelector('.items-center');
      expect(mainContainer).toBeInTheDocument();
    });

    it('centra el contenido horizontalmente', () => {
      const { container } = render(<NotFound />);

      const mainContainer = container.querySelector('.justify-center');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Estilos y theming', () => {
    it('usa colores del tema Misak', () => {
      render(<NotFound />);

      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-primary');

      const button = screen.getByText('Volver al inicio');
      expect(button).toHaveClass('bg-primary');
    });

    it('aplica background color correcto', () => {
      const { container } = render(<NotFound />);

      const mainContainer = container.querySelector('.bg-background');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('aplica padding responsivo', () => {
      const { container } = render(<NotFound />);

      const mainContainer = container.querySelector('.px-4');
      expect(mainContainer).toBeInTheDocument();
    });

    it('el título es responsive (text-3xl md:text-4xl)', () => {
      render(<NotFound />);

      const title = screen.getByText('Página no encontrada');
      expect(title).toHaveClass('text-3xl');
      expect(title).toHaveClass('md:text-4xl');
    });

    it('el mensaje tiene max-width para mejor legibilidad', () => {
      render(<NotFound />);

      const message = screen.getByText(/Lo sentimos, la página que buscas no existe/i);
      expect(message).toHaveClass('max-w-md');
    });
  });

  describe('Display name', () => {
    it('tiene displayName configurado', () => {
      expect(NotFound.displayName).toBe('NotFound');
    });
  });
});
