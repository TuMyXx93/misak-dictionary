import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { SemanticFieldSummary } from '@/types/semanticField';
import { SemanticFieldButton } from './SemanticFieldButton';

describe('SemanticFieldButton', () => {
  const mockFieldLeft: SemanticFieldSummary = {
    id: 'ya',
    name: 'Ya',
    nameSpanish: 'La Casa',
    shortDescription: 'El hogar y el fogón central de la vida Misak.',
    iconKey: 'house',
    position: { x: 20, y: 60 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  const mockFieldRight: SemanticFieldSummary = {
    id: 'namui-nu-piro',
    name: 'Namui Nu Pirɵ',
    nameSpanish: 'Nuestro Territorio',
    shortDescription: 'El territorio como un todo.',
    iconKey: 'territory',
    position: { x: 82, y: 66 },
    drift: { amplitudeX: 6, amplitudeY: 8, duration: 10, delay: 0 },
  };

  it('tiene aria-label bilingüe correcto', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Explorar campo Ya: La Casa');
  });

  it('muestra el icono pero no el label en reposo (icon-only)', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.textContent).not.toContain('Ya');
  });

  it('expande y muestra label al recibir focus', async () => {
    const user = userEvent.setup();
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    await user.tab();
    expect(button.textContent).toContain('Ya');
  });

  it('dispara callback al hacer click en desktop', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('auto-flip: botón izquierdo usa flex-row', () => {
    render(<SemanticFieldButton field={mockFieldLeft} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    const classes = button.className.split(/\s+/);
    expect(classes).toContain('flex-row');
    expect(classes).not.toContain('flex-row-reverse');
  });

  it('auto-flip: botón derecho usa flex-row-reverse', () => {
    render(<SemanticFieldButton field={mockFieldRight} index={0} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    const classes = button.className.split(/\s+/);
    expect(classes).toContain('flex-row-reverse');
    expect(classes).not.toContain('flex-row');
  });

  describe('variant="global-catalog" (8.º botón hacia /campos)', () => {
    const catalogField: SemanticFieldSummary = {
      id: 'global-catalog',
      name: 'Campos semánticos',
      nameSpanish: 'Catálogo de Campos Semánticos',
      shortDescription: 'Explora la totalidad de los campos semánticos de la cultura Misak.',
      iconKey: 'cosmos-grid',
      position: { x: 50, y: 50 },
      drift: { amplitudeX: 0, amplitudeY: 0, duration: 0, delay: 0 },
    };

    it('renderiza como enlace accesible hacia /campos con icono cosmos-grid', () => {
      render(
        <MemoryRouter>
          <SemanticFieldButton
            variant="global-catalog"
            field={catalogField}
            to="/campos"
            onClick={vi.fn()}
          />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /campos semánticos/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/campos');
      expect(link.textContent).toContain('Campos semánticos');
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('dispara onClick al hacer click en el enlace global-catalog', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <MemoryRouter>
          <SemanticFieldButton
            variant="global-catalog"
            field={catalogField}
            to="/campos"
            onClick={handleClick}
          />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /campos semánticos/i });
      await user.click(link);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('en modo spatial inicia expandido, se auto-contrae a los 3.5s y se expande en hover/focus', () => {
      vi.useFakeTimers();

      // Simular puntero desktop (hover: hover y pointer: fine)
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('hover') || query.includes('pointer'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <MemoryRouter>
          <SemanticFieldButton
            variant="global-catalog"
            field={catalogField}
            layoutMode="spatial"
            to="/campos"
          />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /campos semánticos/i });
      // 1. Inicia expandido en spatial mostrando padding horizontal
      expect(link.className).toContain('px-5');
      expect(link.className).not.toContain('w-12');

      // 2. Transcurren los 3500ms de auto-colapso a icon-only (w-12 / 48px)
      act(() => {
        vi.advanceTimersByTime(3500);
      });
      expect(link.className).toContain('w-12');
      expect(link.className).not.toContain('px-5');

      // 3. Hover en desktop lo re-expande
      act(() => {
        fireEvent.mouseEnter(link);
      });
      expect(link.className).toContain('px-5');
      expect(link.className).not.toContain('w-12');

      // 4. Mouse leave lo vuelve a contraer
      act(() => {
        fireEvent.mouseLeave(link);
      });
      expect(link.className).toContain('w-12');
      expect(link.className).not.toContain('px-5');

      vi.useRealTimers();
    });
  });

  describe('modos de layout responsivos', () => {
    it('soporta layoutMode="grid-mobile" con expansión predeterminada', () => {
      render(
        <SemanticFieldButton
          field={mockFieldLeft}
          index={1}
          layoutMode="grid-mobile"
          onClick={vi.fn()}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Ya');
    });

    it('soporta layoutMode="grid-tablet"', () => {
      render(
        <SemanticFieldButton
          field={mockFieldLeft}
          index={2}
          layoutMode="grid-tablet"
          onClick={vi.fn()}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Ya');
    });

    it('soporta layoutMode="grid-landscape-compact"', () => {
      render(
        <SemanticFieldButton
          field={mockFieldLeft}
          index={0}
          layoutMode="grid-landscape-compact"
          onClick={vi.fn()}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Ya');
    });
  });

  describe('safe-area clamping y anclaje interior', () => {
    it('aplica safe-area clamping a coordenadas extremas y anclaje interior sin sobrescribir transform', () => {
      const extremeField: SemanticFieldSummary = {
        ...mockFieldLeft,
        position: { x: 99, y: 1 },
      };

      const { container } = render(
        <SemanticFieldButton field={extremeField} index={0} onClick={vi.fn()} />,
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toBeInTheDocument();
      // left debe estar clamped a un máximo de 86% y top a un mínimo de 14%
      expect(element.style.left).toBe('86%');
      expect(element.style.top).toBe('14%');
      // Nodo en mitad derecha (safeX >= 50) ancla su borde derecho para expandir hacia el centro
      expect(element.className).toContain('translate-x-[calc(-100%+24px)]');
      expect(element.className).toContain('-translate-y-1/2');
    });

    it('colapsa automáticamente cuando recibe forceCollapsed=true tras expandirse', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SemanticFieldButton
          field={mockFieldLeft}
          index={0}
          onClick={vi.fn()}
          forceCollapsed={false}
        />,
      );

      const button = screen.getByRole('button');
      await user.tab();
      expect(button.className).toContain('px-3.5');
      expect(button.textContent).toContain('Ya');

      rerender(
        <SemanticFieldButton
          field={mockFieldLeft}
          index={0}
          onClick={vi.fn()}
          forceCollapsed={true}
        />,
      );
      expect(button.className).toContain('w-12');
      expect(button.className).not.toContain('px-3.5');
    });
  });
});
