/**
 * Slugs ASCII estables para rutas públicas.
 * Transliteración del alfabeto namtrik: ɵ/Ɵ → o, ə/Ə → e, ʊ → u, ɔ/Ɔ → o.
 * La migración 0006 aplica la misma regla (translate + unaccent) al backfill.
 */

const TRANSLITERACION: Readonly<Record<string, string>> = {
  ɵ: 'o',
  Ɵ: 'o',
  ə: 'e',
  Ə: 'e',
  ʊ: 'u',
  ɔ: 'o',
  Ɔ: 'o',
};

export function toSlug(texto: string): string {
  return texto
    .replace(/[ɵƟəƏʊɔƆ]/g, (caracter) => TRANSLITERACION[caracter] ?? caracter)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
