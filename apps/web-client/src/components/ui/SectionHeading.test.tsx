import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cn } from '@/utils/cn';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading — Componente Canónico de Encabezados de Sección (Spec 010 Enmienda 0.2.0)', () => {
  it('renderiza por defecto un h2 en color blanco con escala fluida text-fluid-h2 (R-009, R-010)', () => {
    render(<SectionHeading>Título de prueba</SectionHeading>);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Título de prueba');

    // Clases canónicas por contrato
    expect(heading).toHaveClass('text-fluid-h2');
    expect(heading).toHaveClass('font-display');
    expect(heading).toHaveClass('font-bold');
    expect(heading).toHaveClass('text-white');
    expect(heading).toHaveClass('text-center');
    expect(heading).toHaveClass('tracking-tight');
    expect(heading).toHaveClass('text-balance');

    // Prohibición estricta de color de interacción en encabezados estáticos
    expect(heading).not.toHaveClass('text-primary');
    expect(heading).not.toHaveClass('text-primary-light');
  });

  it('aplica fontSynthesis: none y fontKerning: normal para proteger grafemas Namtrik (R-009)', () => {
    render(<SectionHeading>Wamtɵrmarɵpik</SectionHeading>);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.style.fontSynthesis).toBe('none');
    expect(heading.style.fontKerning).toBe('normal');
  });

  it('soporta polimorfismo semántico con escala fluida correspondiente (as="h1", as="h3") (R-008, R-009)', () => {
    const { rerender } = render(<SectionHeading as="h1">Encabezado H1</SectionHeading>);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveClass('text-fluid-h1');
    expect(h1).toHaveClass('text-white');

    rerender(<SectionHeading as="h3">Subsección H3</SectionHeading>);
    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h3).toHaveClass('text-fluid-h3');
    expect(h3).toHaveClass('text-white');
  });

  it('permite desacoplar escala visual de la jerarquía semántica (scale="h1" con as="h2") (R-009)', () => {
    render(
      <SectionHeading as="h2" scale="h1">
        H2 con escala H1
      </SectionHeading>,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-fluid-h1');
    expect(heading).not.toHaveClass('text-fluid-h2');
  });

  it('permite alineación al inicio mediante align="start" (R-009)', () => {
    render(<SectionHeading align="start">Alineado al inicio</SectionHeading>);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-start');
    expect(heading).not.toHaveClass('text-center');
  });

  it('Opción A\': accent="none" por defecto no renderiza cintas decorativas bajo el título (R-009)', () => {
    const { container } = render(<SectionHeading id="seccion-test">Título Limpio</SectionHeading>);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.id).toBe('seccion-test');

    // No debe contener franja cuatricolor decorativa bajo el título
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renderiza acento cuatricolor únicamente cuando se especifica accent="band" de forma explícita (R-009)', () => {
    const { container } = render(
      <SectionHeading accent="band" id="con-banda">
        Título con Banda
      </SectionHeading>,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();

    const band = container.querySelector('[aria-hidden="true"]');
    expect(band).not.toBeNull();
  });

  it('twMerge conserva text-fluid-h3 al combinarse con text-white sin colisiones (R-008)', () => {
    const resolved = cn('text-fluid-h3', 'text-white', 'font-display');
    expect(resolved).toContain('text-fluid-h3');
    expect(resolved).toContain('text-white');
    expect(resolved).toContain('font-display');
  });
});
