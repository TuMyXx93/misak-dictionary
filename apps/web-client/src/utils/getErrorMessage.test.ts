import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('retorna el mensaje cuando recibe una instancia de Error no vacía', () => {
    expect(getErrorMessage(new Error('Fallo de conexión'), 'Respaldo')).toBe('Fallo de conexión');
  });

  it('retorna el respaldo cuando recibe un Error con mensaje vacío', () => {
    expect(getErrorMessage(new Error(''), 'Respaldo')).toBe('Respaldo');
  });

  it('retorna la propiedad message cuando recibe un objeto con message string no vacío', () => {
    expect(getErrorMessage({ message: 'Error de red' }, 'Respaldo')).toBe('Error de red');
  });

  it('retorna el respaldo cuando el objeto tiene message vacío, no string o ausente', () => {
    expect(getErrorMessage({ message: '' }, 'Respaldo')).toBe('Respaldo');
    expect(getErrorMessage({ message: 404 }, 'Respaldo')).toBe('Respaldo');
    expect(getErrorMessage({ code: 'ERR' }, 'Respaldo')).toBe('Respaldo');
  });

  it('retorna el respaldo para valores primitivos, null o undefined', () => {
    expect(getErrorMessage(null, 'Respaldo')).toBe('Respaldo');
    expect(getErrorMessage(undefined, 'Respaldo')).toBe('Respaldo');
    expect(getErrorMessage('texto', 'Respaldo')).toBe('Respaldo');
    expect(getErrorMessage(500, 'Respaldo')).toBe('Respaldo');
  });
});
