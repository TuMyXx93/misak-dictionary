/**
 * Slug Helper
 * Spec 003 — Integración vertical
 * Deriva slugs estables desde términos Namtrik para rutas públicas.
 * Spec 004 evaluará una columna slug persistida; por ahora es determinista.
 */

/** Normaliza un texto a slug: minúsculas, sin espacios extras, guiones. */
export function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacritics latinos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0250-\u02af]+/g, '-') // no-alnum (IPA ɵʊ permitidos)
    .replace(/^-+|-+$/g, '');
}
