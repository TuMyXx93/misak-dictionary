import { describe, expect, it } from 'vitest';
import {
  hasVariantNamtrikVowel,
  isCanonicalNamtrikVowel,
  MISAK_BRAND_NAME,
  NAMTRIK_VOWEL_LOWER,
  NAMTRIK_VOWEL_UPPER,
  normalizeNamtrikGraphemes,
} from './namtrikText';

describe('namtrikText — Normalizador Ortográfico y Constantes de Marca (Spec 010)', () => {
  it('MISAK_BRAND_NAME contiene exclusivamente los puntos de código canónicos U+0275', () => {
    expect(MISAK_BRAND_NAME).toBe('Wamtɵrmarɵpik');

    // W = U+0057, a = U+0061, m = U+006D, t = U+0074, ɵ = U+0275
    const codepoints = [...MISAK_BRAND_NAME].map((c) => c.codePointAt(0));
    expect(codepoints[4]).toBe(0x0275);
    expect(codepoints[9]).toBe(0x0275);
    expect(NAMTRIK_VOWEL_LOWER.codePointAt(0)).toBe(0x0275);
    expect(NAMTRIK_VOWEL_UPPER.codePointAt(0)).toBe(0x019f);
  });

  it('normaliza variantes de teclado móvil hacia ɵ (U+0275) y Ɵ (U+019F)', () => {
    // Variantes de entrada típicas
    expect(normalizeNamtrikGraphemes('Wamtørmarøpik')).toBe('Wamtɵrmarɵpik');
    expect(normalizeNamtrikGraphemes('Wamt∅rmar∅pik')).toBe('Wamtɵrmarɵpik');
    expect(normalizeNamtrikGraphemes('Wamtθrmarθpik')).toBe('Wamtɵrmarɵpik');
    expect(normalizeNamtrikGraphemes('Wamtərmarəpik')).toBe('Wamtɵrmarɵpik');
    expect(normalizeNamtrikGraphemes('Wamtөrmarөpik')).toBe('Wamtɵrmarɵpik');
    expect(normalizeNamtrikGraphemes('Øsrɵ')).toBe('Ɵsrɵ');
    expect(normalizeNamtrikGraphemes('Θsrɵ')).toBe('Ɵsrɵ');
  });

  it('preserva palabras en español cuando convertAsciiO es false (por defecto)', () => {
    const input = 'Diccionario de palabras y conceptos';
    expect(normalizeNamtrikGraphemes(input)).toBe(input);
  });

  it('convierte o/O a ɵ/Ɵ cuando convertAsciiO es true (modo lema Namtrik)', () => {
    expect(normalizeNamtrikGraphemes('kosak', { convertAsciiO: true })).toBe('kɵsak');
    expect(normalizeNamtrikGraphemes('Kosak', { convertAsciiO: true })).toBe('Kɵsak');
    expect(normalizeNamtrikGraphemes('Osro', { convertAsciiO: true })).toBe('Ɵsrɵ');
  });

  it('detecta correctamente alógrafas y vocales canónicas', () => {
    expect(isCanonicalNamtrikVowel('ɵ')).toBe(true);
    expect(isCanonicalNamtrikVowel('Ɵ')).toBe(true);
    expect(isCanonicalNamtrikVowel('o')).toBe(false);
    expect(isCanonicalNamtrikVowel('ø')).toBe(false);

    expect(hasVariantNamtrikVowel('Wamtørmarøpik')).toBe(true);
    expect(hasVariantNamtrikVowel('Wamt∅rmar∅pik')).toBe(true);
    expect(hasVariantNamtrikVowel('Wamtɵrmarɵpik')).toBe(false);
    expect(hasVariantNamtrikVowel('Diccionario Misak')).toBe(false);
  });

  it('guarda reglas @font-face y tokens @theme armonizados en src/index.css (R-001, R-002)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssPath = path.resolve(__dirname, '../index.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Regla @font-face con unicode-range de grafemas Namtrik
    expect(css).toContain('unicode-range: U+019F, U+0259, U+0268, U+0275, U+028A');
    expect(css).toContain('size-adjust: 96%');

    // Tokens @theme
    expect(css).toContain("--font-display: 'Spline Sans', 'Noto Sans', sans-serif;");
    expect(css).toContain("--font-body: 'Noto Sans', sans-serif;");
    expect(css).toContain("--font-sans: 'Noto Sans', sans-serif;");

    // Escala fluida completa hasta h3 (Enmienda 0.2.0 R-008)
    expect(css).toContain('--font-size-fluid-h3: clamp(1.125rem, 1.4vw + 0.7rem, 1.5rem);');
    expect(css).toContain('.text-fluid-h3 {');

    // Desactivación de font-synthesis
    expect(css).toContain('font-synthesis: none;');

    // Retiro de divisores redundantes (Opción A')
    expect(css).not.toContain('.misak-selvedge-divider');
  });
});
