import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CampoNamtrik } from './CampoNamtrik';

describe('CampoNamtrik (R-022, C1.1, C1.3)', () => {
  it('renderiza con atributos lingüísticos y de accesibilidad requeridos', () => {
    render(<CampoNamtrik label="Lema Namtrik" value="Yúsrɵ" />);

    const input = screen.getByLabelText('Lema Namtrik');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('lang', 'gum');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('autocorrect', 'off');
  });

  it('normaliza a Unicode NFC en onChange sin perder caracteres', () => {
    const handleChange = vi.fn();
    render(<CampoNamtrik label="Entrada" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Entrada');
    // 'e' + combining acute accent (NFD)
    const nfdText = 'e\u0301';
    fireEvent.change(input, { target: { value: nfdText } });

    expect(handleChange).toHaveBeenCalledWith('é');
    expect(handleChange.mock.calls[0]?.[0].isWellFormed?.()).not.toBe(false);
  });

  it('preserva el caracter ɵ y diacríticos específicos de Namtrik', () => {
    const handleChange = vi.fn();
    render(<CampoNamtrik label="Lema" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Lema');
    fireEvent.change(input, { target: { value: 'shɵka' } });

    expect(handleChange).toHaveBeenCalledWith('shɵka');
  });

  it('el botón de inserción rápida de ɵ inserta el fonema en la posición del cursor', () => {
    const handleChange = vi.fn();
    render(<CampoNamtrik label="Lema" value="shka" onChange={handleChange} />);

    const buttonO = screen.getByRole('button', { name: 'Insertar letra minúscula ɵ' });
    expect(buttonO).toBeInTheDocument();

    fireEvent.click(buttonO);

    expect(handleChange).toHaveBeenCalledWith('shkaɵ');
  });

  it('el botón de inserción rápida de Ɵ inserta el fonema en mayúscula', () => {
    const handleChange = vi.fn();
    render(<CampoNamtrik label="Lema" value="ik" onChange={handleChange} />);

    const buttonMayus = screen.getByRole('button', { name: 'Insertar letra mayúscula Ɵ' });
    expect(buttonMayus).toBeInTheDocument();

    fireEvent.click(buttonMayus);

    expect(handleChange).toHaveBeenCalledWith('ikƟ');
  });

  it('los botones de inserción rápida cumplen con el tamaño táctil accesible mínimo', () => {
    render(<CampoNamtrik label="Lema" value="" />);

    const buttonMin = screen.getByRole('button', { name: 'Insertar letra minúscula ɵ' });
    const buttonMayus = screen.getByRole('button', { name: 'Insertar letra mayúscula Ɵ' });

    expect(buttonMin.className).toContain('min-w-[44px]');
    expect(buttonMin.className).toContain('min-h-[44px]');
    expect(buttonMayus.className).toContain('min-w-[44px]');
    expect(buttonMayus.className).toContain('min-h-[44px]');
  });

  it('soporta modo multilínea con textarea', () => {
    render(<CampoNamtrik label="Contexto" multiline rows={4} value="Línea 1" />);

    const textarea = screen.getByLabelText('Contexto');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('lang', 'gum');
  });
});
