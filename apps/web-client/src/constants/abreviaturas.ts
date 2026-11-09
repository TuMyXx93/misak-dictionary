/**
 * Catálogo base y resolución de abreviaturas lingüísticas (Abreviaturas.pdf).
 * Provee respuesta en 0ms antes de que resuelva `/api/dictionary/abreviaturas` o en modo offline PWA,
 * y sincroniza reactivamente los cambios realizados desde el panel administrativo.
 */

export interface AbreviaturaItem {
  id?: string;
  codigo: string;
  etiquetaCompleta: string;
  orden?: number;
  activo?: boolean;
}

export const ABREVIATURAS_OFICIALES: readonly AbreviaturaItem[] = [
  { codigo: 'adj.', etiquetaCompleta: 'Adjetivo', orden: 1 },
  { codigo: 'adv. lugar', etiquetaCompleta: 'Adverbio de lugar', orden: 2 },
  { codigo: 'adv. c.', etiquetaCompleta: 'Adverbio de cantidad', orden: 3 },
  { codigo: 'amb.', etiquetaCompleta: 'Ambiguo', orden: 4 },
  { codigo: 'bot.', etiquetaCompleta: 'Botánica', orden: 5 },
  { codigo: 'cal.', etiquetaCompleta: 'Calificativo', orden: 6 },
  { codigo: 'cuant. nom.', etiquetaCompleta: 'Cuantificador nominal', orden: 7 },
  { codigo: 'educ.', etiquetaCompleta: 'Educación', orden: 8 },
  { codigo: 'f.', etiquetaCompleta: 'Femenino', orden: 9 },
  { codigo: 'gast.', etiquetaCompleta: 'Gastronomía', orden: 10 },
  { codigo: 'interj.', etiquetaCompleta: 'Interjección', orden: 11 },
  { codigo: 'loc. adv. l.', etiquetaCompleta: 'Locución adverbial de lugar', orden: 12 },
  { codigo: 'loc. conjunt. temp.', etiquetaCompleta: 'Locución conjuntiva temporal', orden: 13 },
  { codigo: 'loc. nom.', etiquetaCompleta: 'Locución nominal', orden: 14 },
  { codigo: 'loc. verb.', etiquetaCompleta: 'Locución verbal', orden: 15 },
  { codigo: 'loc.', etiquetaCompleta: 'Locución', orden: 16 },
  { codigo: 'loc. interj.', etiquetaCompleta: 'Locución interjectiva', orden: 17 },
  { codigo: 'm.', etiquetaCompleta: 'Masculino', orden: 18 },
  { codigo: 'neol.', etiquetaCompleta: 'Neologismo', orden: 19 },
  {
    codigo: 'O. S. E. A. P. I.',
    etiquetaCompleta: 'Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva.',
    orden: 20,
  },
  { codigo: 'O.E.A.', etiquetaCompleta: 'Oración enunciativa afirmativa', orden: 21 },
  {
    codigo: 'O.S.Adv. Tiem.',
    etiquetaCompleta: 'Oración subordinada adverbial de tiempo',
    orden: 22,
  },
  { codigo: 'orac. condic.', etiquetaCompleta: 'Oración condicional', orden: 23 },
  { codigo: 'pl.', etiquetaCompleta: 'Plural', orden: 24 },
  { codigo: 'plac.', etiquetaCompleta: 'Préstamo léxico adaptado del castellano', orden: 25 },
  { codigo: 'plan.', etiquetaCompleta: 'Préstamo léxico del Nahualt', orden: 26 },
  { codigo: 'plaq.', etiquetaCompleta: 'Préstamo léxico adaptado del quechua', orden: 27 },
  { codigo: 'plaqui.', etiquetaCompleta: 'Préstamo léxico adaptado del quichua', orden: 28 },
  { codigo: 'ren.', etiquetaCompleta: 'Riñón humano', orden: 29 },
  { codigo: 's.', etiquetaCompleta: 'Sustantivo', orden: 30 },
  { codigo: 'símb.', etiquetaCompleta: 'Símbolo', orden: 31 },
  { codigo: 'sing.', etiquetaCompleta: 'Singular', orden: 32 },
  { codigo: 'sn.', etiquetaCompleta: 'Sintagma Nominal', orden: 33 },
  { codigo: 'sv.', etiquetaCompleta: 'Sintagma verbal', orden: 34 },
  { codigo: 'V. 1', etiquetaCompleta: 'Variante 1', orden: 35 },
  { codigo: 'V. 2', etiquetaCompleta: 'Variante 2', orden: 36 },
  { codigo: 'V. 3', etiquetaCompleta: 'Variante 3', orden: 37 },
  { codigo: 'v. pos.', etiquetaCompleta: 'Verbo posicional', orden: 38 },
  { codigo: 'v.', etiquetaCompleta: 'Verbo', orden: 39 },
  { codigo: 'VB.', etiquetaCompleta: 'Vesícula Biliar', orden: 40 },
  { codigo: 'Zool.', etiquetaCompleta: 'Zoología', orden: 41 },
];

const normalizarCodigo = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');

const ALIAS_ABREVIATURA: Record<string, string> = {
  simb: 'simb.',
  'simb.': 'simb.',
  edu: 'educ.',
  'edu.': 'educ.',
  gast: 'gast.',
  ren: 'ren.',
  'loc. adv.': 'loc. adv. l.',
  'v.pos.': 'v. pos.',
  'v.posic.': 'v. pos.',
  'loc.nom.': 'loc. nom.',
  'loc.interj.': 'loc. interj.',
  'adv.c.': 'adv. c.',
  'v.1': 'v. 1',
  'v.2': 'v. 2',
  'v.2.': 'v. 2',
  'v.3': 'v. 3',
  sustantivo: 's.',
  verbo: 'v.',
  adjetivo: 'adj.',
  interjeccion: 'interj.',
};

const MAPA_ABREVIATURAS = new Map<string, AbreviaturaItem>(
  ABREVIATURAS_OFICIALES.map((item) => [normalizarCodigo(item.codigo), item]),
);

let dynamicCatalogState: readonly AbreviaturaItem[] = ABREVIATURAS_OFICIALES;
let hasFetchedPublicCatalog = false;
const catalogListeners = new Set<() => void>();

export function getDynamicAbreviaturasCatalog(): readonly AbreviaturaItem[] {
  return dynamicCatalogState;
}

export function setDynamicAbreviaturasCatalog(items: readonly AbreviaturaItem[]): void {
  if (!Array.isArray(items) || items.length === 0) return;
  dynamicCatalogState = items;
  hasFetchedPublicCatalog = true;
  for (const listener of catalogListeners) {
    listener();
  }
}

export function subscribeAbreviaturasCatalog(listener: () => void): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

export function ensureDynamicAbreviaturasLoaded(): void {
  if (hasFetchedPublicCatalog || typeof window === 'undefined' || typeof fetch !== 'function') {
    return;
  }
  hasFetchedPublicCatalog = true;
  fetch('/api/dictionary/abreviaturas')
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      const list = Array.isArray(payload) ? payload : payload?.data;
      if (Array.isArray(list) && list.length > 0) {
        setDynamicAbreviaturasCatalog(list);
      }
    })
    .catch(() => {
      // Fallback silencioso a ABREVIATURAS_OFICIALES
    });
}

/**
 * Resuelve una abreviatura individual contra el catálogo (estático o dinámico).
 */
export function getAbreviaturaInfo(
  codigoRaw?: string | null,
  customCatalog?: readonly AbreviaturaItem[],
): AbreviaturaItem | null {
  if (!codigoRaw) return null;
  const rawClean = normalizarCodigo(codigoRaw);
  const clean = ALIAS_ABREVIATURA[rawClean] ?? rawClean;

  const catalogToSearch =
    customCatalog && customCatalog.length > 0 ? customCatalog : dynamicCatalogState;

  if (catalogToSearch && catalogToSearch.length > 0) {
    const found = catalogToSearch.find(
      (it) => normalizarCodigo(it.codigo) === clean || normalizarCodigo(it.codigo) === rawClean,
    );
    if (found) return found;
  }

  return MAPA_ABREVIATURAS.get(clean) ?? MAPA_ABREVIATURAS.get(rawClean) ?? null;
}

/**
 * Desglosa abreviaturas compuestas (ej. "loc. nom., adj." o "s., símb.")
 * preservando intactas las abreviaturas oracionales que incluyen comas internas ("O. S. E. A. P. I.").
 */
export function parseComposedAbreviatura(
  raw?: string | null,
  customCatalog?: readonly AbreviaturaItem[],
): AbreviaturaItem[] {
  if (!raw || !raw.trim()) return [];
  const clean = raw.trim();

  const exact = getAbreviaturaInfo(clean, customCatalog);
  if (exact) return [exact];

  const parts = clean
    .split(/[,/]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const items: AbreviaturaItem[] = [];

  for (const part of parts) {
    const info = getAbreviaturaInfo(part, customCatalog);
    if (info) {
      items.push(info);
    } else {
      items.push({
        codigo: part,
        etiquetaCompleta: part,
      });
    }
  }

  return items.length > 0
    ? items
    : [
        {
          codigo: clean,
          etiquetaCompleta: clean,
        },
      ];
}
