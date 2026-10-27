/**
 * Utilidades Ortográficas y Tipográficas Canónicas para Namtrik
 * Spec 010 — Estandarización Tipográfica, Armonización Métrica del Grafema ɵ y Marca Wamtɵrmarɵpik
 */

/**
 * Marca y lema institucional canónico del proyecto (con U+0275).
 */
export const MISAK_BRAND_NAME = 'Wamtɵrmarɵpik';

/**
 * Vocal central canónica minúscula en el alfabeto oficial Misak (U+0275: Latin Small Letter Barred O).
 */
export const NAMTRIK_VOWEL_LOWER = 'ɵ';

/**
 * Vocal central canónica mayúscula en el alfabeto oficial Misak (U+019F: Latin Capital Letter O with Middle Tilde).
 */
export const NAMTRIK_VOWEL_UPPER = 'Ɵ';

/**
 * Mapa de alógrafas y variantes de teclado hacia los puntos de código canónicos Misak.
 */
const GRAPHEME_VARIANTS_MAP: Readonly<Record<string, string>> = {
  // Minúsculas alógrafas comunes (teclados nórdicos, matemáticos, griegos, IPA y cirílicos)
  ø: NAMTRIK_VOWEL_LOWER, // U+00F8 (latin small letter o with stroke)
  '∅': NAMTRIK_VOWEL_LOWER, // U+2205 (empty set)
  θ: NAMTRIK_VOWEL_LOWER, // U+03B8 (greek small letter theta)
  ə: NAMTRIK_VOWEL_LOWER, // U+0259 (latin small letter schwa)
  ө: NAMTRIK_VOWEL_LOWER, // U+04E9 (cyrillic small letter barred o)
  ɔ: NAMTRIK_VOWEL_LOWER, // U+0254 (latin small letter open o)

  // Mayúsculas alógrafas
  Ø: NAMTRIK_VOWEL_UPPER, // U+00D8 (latin capital letter o with stroke)
  Θ: NAMTRIK_VOWEL_UPPER, // U+0398 (greek capital letter theta)
  ϴ: NAMTRIK_VOWEL_UPPER, // U+03F4 (greek capital theta symbol)
  Ə: NAMTRIK_VOWEL_UPPER, // U+018F (latin capital letter schwa)
  Ө: NAMTRIK_VOWEL_UPPER, // U+04E8 (cyrillic capital letter barred o)
  Ɔ: NAMTRIK_VOWEL_UPPER, // U+0186 (latin capital letter open o)
};

export interface NormalizeNamtrikOptions {
  /**
   * Si es true, también normaliza 'o' -> 'ɵ' y 'O' -> 'Ɵ' (solo para campos de lema puro Namtrik).
   * Por defecto es false para no alterar palabras en español en contextos bilingües.
   */
  convertAsciiO?: boolean;
}

/**
 * Normaliza cualquier variante de teclado o alógrafa al punto de código canónico Misak (ɵ / Ɵ).
 */
export function normalizeNamtrikGraphemes(
  text: string,
  options: NormalizeNamtrikOptions = {},
): string {
  if (!text) return '';

  let normalized = text.replace(
    /[øØ∅θΘϴəƏөӨɔƆ]/g,
    (match) => GRAPHEME_VARIANTS_MAP[match] ?? match,
  );

  if (options.convertAsciiO) {
    normalized = normalized.replace(/[oO]/g, (match) =>
      match === 'o' ? NAMTRIK_VOWEL_LOWER : NAMTRIK_VOWEL_UPPER,
    );
  }

  return normalized;
}

/**
 * Determina si un carácter corresponde a la vocal central canónica Misak.
 */
export function isCanonicalNamtrikVowel(char: string): boolean {
  return char === NAMTRIK_VOWEL_LOWER || char === NAMTRIK_VOWEL_UPPER;
}

/**
 * Detecta si un texto contiene alógrafas no canónicas que requieran normalización.
 */
export function hasVariantNamtrikVowel(text: string): boolean {
  if (!text) return false;
  return /[øØ∅θΘϴəƏөӨɔƆ]/.test(text);
}
