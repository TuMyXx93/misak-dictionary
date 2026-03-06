import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  describe('Variantes de forma', () => {
    it('renderiza variante rectangular por defecto', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).not.toHaveClass('rounded-full');
    });

    it('renderiza variante circular', () => {
      render(<Skeleton variant="circular" width={40} height={40} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).not.toHaveClass('rounded-md');
    });

    it('renderiza variante texto', () => {
      render(<Skeleton variant="text" width="100%" />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('rounded-sm');
      expect(skeleton).toHaveClass('h-[1em]');
    });
  });

  describe('Dimensiones', () => {
    it('aplica width y height como números (px)', () => {
      render(<Skeleton width={200} height={50} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveStyle({
        width: '200px',
        height: '50px',
      });
    });

    it('aplica width y height como strings CSS', () => {
      render(<Skeleton width="100%" height="5rem" />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveStyle({
        width: '100%',
        height: '5rem',
      });
    });

    it('maneja dimensiones undefined sin errores', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Animaciones', () => {
    it('aplica animación pulse por defecto', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).not.toHaveClass('animate-wave');
    });

    it('aplica animación wave cuando se especifica', () => {
      render(<Skeleton animation="wave" width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('relative');
      expect(skeleton).toHaveClass('overflow-hidden');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('no aplica animación cuando animation="none"', () => {
      render(<Skeleton animation="none" width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });

  describe('Accesibilidad', () => {
    it('uses semantic <output> element with implicit status role', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton.tagName).toBe('OUTPUT');
    });

    it('tiene aria-label descriptivo', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveAttribute('aria-label', 'Cargando...');
    });
  });

  describe('Clase CSS personalizada', () => {
    it('aplica className adicional', () => {
      render(<Skeleton className="custom-class" width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('bg-gray-200'); // Mantiene clases base
    });

    it('permite override de clases con className', () => {
      render(<Skeleton className="bg-blue-200" width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('bg-blue-200');
    });
  });

  describe('Estilos y theming', () => {
    it('aplica colores de background correctos para light mode', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('bg-gray-200');
    });

    it('incluye soporte para dark mode', () => {
      render(<Skeleton width={100} height={20} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('dark:bg-gray-700');
    });
  });

  describe('Casos de uso comunes', () => {
    it('skeleton de avatar circular', () => {
      render(<Skeleton variant="circular" width={48} height={48} />);
      const skeleton = screen.getByRole('status');

      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({
        width: '48px',
        height: '48px',
      });
    });

    it('skeleton de párrafo con múltiples líneas', () => {
      const { container } = render(
        <div>
          <Skeleton variant="text" width="100%" className="mb-2" />
          <Skeleton variant="text" width="100%" className="mb-2" />
          <Skeleton variant="text" width="60%" />
        </div>,
      );

      const skeletons = container.querySelectorAll('output');
      expect(skeletons).toHaveLength(3);
    });

    it('skeleton de card completo', () => {
      const { container } = render(
        <div className="p-4">
          <Skeleton width="100%" height={200} className="mb-4" />
          <Skeleton variant="text" width="80%" className="mb-2" />
          <Skeleton variant="text" width="100%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>,
      );

      const skeletons = container.querySelectorAll('output');
      expect(skeletons).toHaveLength(4);
    });
  });

  describe('Display name', () => {
    it('tiene displayName configurado', () => {
      expect(Skeleton.displayName).toBe('Skeleton');
    });
  });
});
