import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MisakWordmark } from './MisakWordmark';

describe('MisakWordmark — Componente Canónico de Marca (Spec 010)', () => {
  it('renderiza por defecto la marca canónica Wamtɵrmarɵpik con U+0275', () => {
    render(<MisakWordmark />);
    const el = screen.getByText('Wamtɵrmarɵpik');
    expect(el).toBeInTheDocument();
    expect(el.tagName.toLowerCase()).toBe('span');

    const codepoints = [...(el.textContent || '')].map((c) => c.codePointAt(0));
    expect(codepoints[4]).toBe(0x0275);
    expect(codepoints[9]).toBe(0x0275);
  });

  it('renderiza la variante hero como h1 con text-fluid-hero y sombra', () => {
    render(<MisakWordmark variant="hero" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Wamtɵrmarɵpik');
    expect(heading.className).toContain('text-fluid-hero');
    expect(heading.className).toContain('font-bold');
    expect(heading.style.textShadow).toBe('0 4px 18px rgba(0, 0, 0, 0.82)');
  });

  it('renderiza la variante login con font-bold (700) eliminando font-extrabold', () => {
    render(<MisakWordmark variant="login" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Wamtɵrmarɵpik');
    expect(heading.className).toContain('text-2xl sm:text-3xl');
    expect(heading.className).toContain('font-bold');
    expect(heading.className).not.toContain('font-extrabold');
  });

  it('renderiza la variante header con font-bold y tracking-wide', () => {
    render(<MisakWordmark variant="header" />);
    const el = screen.getByText('Wamtɵrmarɵpik');
    expect(el.className).toContain('font-display');
    expect(el.className).toContain('font-bold');
    expect(el.className).toContain('tracking-wide');
  });

  it('permite sobrescribir el elemento HTML mediante prop "as"', () => {
    render(<MisakWordmark variant="header" as="h2" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('aplica fontSynthesis: none y fontKerning: normal para proteger el glifo ɵ', () => {
    render(<MisakWordmark variant="header" />);
    const el = screen.getByText('Wamtɵrmarɵpik');
    expect(el.style.fontSynthesis).toBe('none');
    expect(el.style.fontKerning).toBe('normal');
  });
});
