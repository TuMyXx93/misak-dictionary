/**
 * Catálogo Canónico de Abreviaturas Lingüísticas (Spec 012 v0.2.0 / Abreviaturas.pdf)
 * Fuente única de las 41 abreviaturas oficiales entregadas por el equipo lingüístico Misak.
 * Incluye exclusivamente `codigo` y `etiquetaCompleta` conforme al documento fuente.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export interface AbreviaturaDefinition {
  codigo: string;
  etiquetaCompleta: string;
  orden: number;
}

export const ABREVIATURAS_CATALOGO_BASE: readonly AbreviaturaDefinition[] = [
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

/**
 * Resuelve la ruta canónica hacia data/lexicon/v1/abreviaturas.yaml.
 */
export function getDefaultAbreviaturasYamlPath(): string {
  const metaUrl = import.meta.url;
  const currentFilePath = fileURLToPath(metaUrl);
  const possiblePaths = [
    fileURLToPath(new URL('../../../../../data/lexicon/v1/abreviaturas.yaml', metaUrl)),
    fileURLToPath(new URL('../../../../data/lexicon/v1/abreviaturas.yaml', metaUrl)),
    fileURLToPath(new URL('../../../data/lexicon/v1/abreviaturas.yaml', metaUrl)),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  return possiblePaths[0] ?? currentFilePath;
}

/**
 * Carga las abreviaturas desde el archivo YAML con fallback al catálogo base estático.
 */
export function loadAbreviaturasFromYaml(yamlPath?: string): AbreviaturaDefinition[] {
  const targetPath = yamlPath ?? getDefaultAbreviaturasYamlPath();
  try {
    if (existsSync(targetPath)) {
      const raw = readFileSync(targetPath, 'utf8');
      const parsed = YAML.parse(raw) as { abreviaturas?: AbreviaturaDefinition[] };
      if (Array.isArray(parsed?.abreviaturas) && parsed.abreviaturas.length > 0) {
        return parsed.abreviaturas;
      }
    }
  } catch {
    // Fallback silencioso al catálogo base
  }
  return [...ABREVIATURAS_CATALOGO_BASE];
}
