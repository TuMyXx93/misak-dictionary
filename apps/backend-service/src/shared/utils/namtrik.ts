/**
 * Ortografía namtrik (decisión del equipo lingüístico, 2026-10-15):
 * la vocal "o" no existe en namtrik; su grafía es "ɵ".
 * Se normalizan a ɵ las variantes ASCII y fonéticas que aparecen en fuentes
 * de trabajo (o, ə, ɔ). Solo se aplica a campos namtrik, nunca al español.
 */

const NORMALIZACION: Readonly<Record<string, string>> = {
  o: 'ɵ',
  O: 'Ɵ',
  ə: 'ɵ',
  Ə: 'Ɵ',
  ɔ: 'ɵ',
  Ɔ: 'Ɵ',
};

export interface ResultadoNormalizacion {
  valor: string;
  cambios: number;
}

export function normalizarNamtrik(texto: string): ResultadoNormalizacion {
  let cambios = 0;
  const valor = texto.replace(/[oOəƏɔƆ]/g, (caracter) => {
    cambios += 1;
    return NORMALIZACION[caracter] ?? caracter;
  });
  return { valor, cambios };
}
