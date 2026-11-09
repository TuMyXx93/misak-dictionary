/**
 * AbbreviationBadge.test.tsx
 * Tests para la insignia accesible de abreviaturas lingüísticas y gramaticales (Spec 012 / R-012, R-017)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ABREVIATURAS_OFICIALES } from '@/constants/abreviaturas';
import { AbbreviationBadge } from './AbbreviationBadge';

describe('AbbreviationBadge', () => {
  it('contiene exactamente las 41 abreviaturas oficiales de Abreviaturas.pdf sin adj. cal. ni mamíf.', () => {
    expect(ABREVIATURAS_OFICIALES).toHaveLength(41);
    const codigos = ABREVIATURAS_OFICIALES.map((a) => a.codigo);
    expect(codigos).not.toContain('adj. cal.');
    expect(codigos).not.toContain('mamíf.');
    expect(codigos).toContain('cal.');
    expect(codigos).toContain('s.');
    expect(codigos).toContain('Zool.');
  });

  it('renderiza el código de la abreviatura oficial', () => {
    render(<AbbreviationBadge value="s." />);
    expect(screen.getByRole('button', { name: /s\.: Sustantivo/i })).toBeInTheDocument();
    expect(screen.getByText('s.')).toBeInTheDocument();
  });

  it('desglosa abreviaturas compuestas como "loc. nom., adj."', () => {
    render(<AbbreviationBadge value="loc. nom., adj." />);
    expect(screen.getByText('loc. nom.')).toBeInTheDocument();
    expect(screen.getByText('adj.')).toBeInTheDocument();
  });

  it('abre el popover interactivo al hacer clic mostrando únicamente codigo y etiquetaCompleta', () => {
    render(<AbbreviationBadge value="v." />);
    const btn = screen.getByRole('button', { name: /v\.: Verbo/i });
    fireEvent.click(btn);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(screen.getByText('Verbo')).toBeInTheDocument();
    expect(tooltip.textContent).not.toMatch(/Categoría gramatical/i);
  });

  it('sincroniza la paleta de colores con el panel administrativo en modo claro y modo oscuro / público', () => {
    document.documentElement.setAttribute('data-admin-resolved', 'light');
    const { unmount } = render(<AbbreviationBadge value="s." />);
    const lightBtn = screen.getByRole('button', { name: /s\.: Sustantivo/i });
    expect(lightBtn.className).toContain('bg-indigo-50');
    expect(lightBtn.className).toContain('text-indigo-700');
    unmount();

    document.documentElement.setAttribute('data-admin-resolved', 'dark');
    render(
      <div className="misak-public-scope">
        <AbbreviationBadge value="s." />
      </div>,
    );
    const darkBtn = screen.getByRole('button', { name: /s\.: Sustantivo/i });
    expect(darkBtn.className).toContain('bg-indigo-950/60');
    expect(darkBtn.className).toContain('text-indigo-300');
    document.documentElement.removeAttribute('data-admin-resolved');
  });

  it('cierra el popover al presionar Escape', () => {
    render(<AbbreviationBadge value="adj." />);
    const btn = screen.getByRole('button', { name: /adj\.: Adjetivo/i });
    fireEvent.click(btn);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('no renderiza nada si el valor es nulo o vacío', () => {
    const { container } = render(<AbbreviationBadge value={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('adapta su posición (clamping horizontal) en pantallas móviles estrechas (360px) sin desbordar por la izquierda ni derecha', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<AbbreviationBadge value="s." />);
    const btn = screen.getByRole('button', { name: /s\.: Sustantivo/i });

    // Simular botón muy cerca del borde izquierdo (x = 40px, como en "Wasrɵ s." móvil)
    btn.getBoundingClientRect = () =>
      ({
        left: 40,
        right: 64,
        top: 400,
        bottom: 422,
        width: 24,
        height: 22,
        x: 40,
        y: 400,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.click(btn);
    const tooltip = screen.getByRole('tooltip');
    const leftPx = Number.parseFloat(tooltip.style.left);
    const widthPx = Number.parseFloat(tooltip.style.width);

    // Nunca debe quedar con left negativo ni salirse de los 360px de pantalla
    expect(leftPx).toBeGreaterThanOrEqual(12);
    expect(leftPx + widthPx).toBeLessThanOrEqual(360 - 12);
  });

  it('invierte la posición hacia abajo cuando la abreviatura está cerca del borde superior del viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<AbbreviationBadge value="sn." />);
    const btn = screen.getByRole('button', { name: /sn\.: Sintagma Nominal/i });

    btn.getBoundingClientRect = () =>
      ({
        left: 140,
        right: 170,
        top: 24,
        bottom: 46,
        width: 30,
        height: 22,
        x: 140,
        y: 24,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.click(btn);
    const tooltip = screen.getByRole('tooltip');
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(46);
  });

  it('renderiza un <abbr> estático en lugar de <button> cuando disabled es true para preservar HTML5 válido dentro de enlaces', () => {
    render(<AbbreviationBadge value="s." disabled />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const pill = screen.getByTitle(/s\.: Sustantivo/i);
    expect(pill.tagName).toBe('ABBR');
    expect(screen.getByText('s.')).toBeInTheDocument();
  });
});
