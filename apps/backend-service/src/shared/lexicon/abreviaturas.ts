/**
 * Catálogo Canónico de Abreviaturas Lingüísticas (Spec 012 v0.2.0 / Abreviaturas.pdf)
 * Fuente única de tipos y metadatos para las 35 abreviaturas oficiales del pueblo Misak.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export type DimensionAbreviatura = 'categoria' | 'variante' | 'rasgo' | 'origen' | 'dominio';

export interface AbreviaturaDefinition {
  codigo: string;
  etiquetaCompleta: string;
  descripcion: string;
  dimension: DimensionAbreviatura;
  orden: number;
}

export const ABREVIATURAS_CATALOGO_BASE: readonly AbreviaturaDefinition[] = [
  // 1. Categorías gramaticales y construcciones
  {
    codigo: 's.',
    etiquetaCompleta: 'Sustantivo',
    descripcion:
      'Palabra que designa personas, animales, cosas, lugares o conceptos en la cosmovisión Misak.',
    dimension: 'categoria',
    orden: 1,
  },
  {
    codigo: 'loc. nom.',
    etiquetaCompleta: 'Locución nominal',
    descripcion: 'Grupo de palabras que funciona sintácticamente como un sustantivo.',
    dimension: 'categoria',
    orden: 2,
  },
  {
    codigo: 'sn.',
    etiquetaCompleta: 'Sintagma Nominal',
    descripcion: 'Estructura sintáctica cuyo núcleo es un sustantivo o pronombre.',
    dimension: 'categoria',
    orden: 3,
  },
  {
    codigo: 'v.',
    etiquetaCompleta: 'Verbo',
    descripcion: 'Palabra que indica acción, proceso, estado o vivencia.',
    dimension: 'categoria',
    orden: 4,
  },
  {
    codigo: 'sv.',
    etiquetaCompleta: 'Sintagma verbal',
    descripcion: 'Estructura sintáctica cuyo núcleo es un verbo.',
    dimension: 'categoria',
    orden: 5,
  },
  {
    codigo: 'v. pos.',
    etiquetaCompleta: 'Verbo posicional',
    descripcion:
      'Verbo que expresa postura corporal, disposición espacial o estado posicional tradicional.',
    dimension: 'categoria',
    orden: 6,
  },
  {
    codigo: 'adj.',
    etiquetaCompleta: 'Adjetivo',
    descripcion: 'Palabra que describe o delimita al sustantivo.',
    dimension: 'categoria',
    orden: 7,
  },
  {
    codigo: 'cal.',
    etiquetaCompleta: 'Calificativo',
    descripcion: 'Adjetivo o modificador que atribuye una cualidad específica.',
    dimension: 'categoria',
    orden: 8,
  },
  {
    codigo: 'adj. cal.',
    etiquetaCompleta: 'Adjetivo calificativo',
    descripcion: 'Adjetivo que denota características físicas, sensoriales o valorativas.',
    dimension: 'categoria',
    orden: 9,
  },
  {
    codigo: 'adv. c.',
    etiquetaCompleta: 'Adverbio de cantidad',
    descripcion: 'Modificador que especifica grado, intensidad o volumen de la acción.',
    dimension: 'categoria',
    orden: 10,
  },
  {
    codigo: 'adv. lugar',
    etiquetaCompleta: 'Adverbio de lugar',
    descripcion: 'Modificador que ubica espacial o territorialmente una acción.',
    dimension: 'categoria',
    orden: 11,
  },
  {
    codigo: 'cuant. nom.',
    etiquetaCompleta: 'Cuantificador nominal',
    descripcion: 'Elemento que especifica cantidad o medida sobre un sustantivo.',
    dimension: 'categoria',
    orden: 12,
  },
  {
    codigo: 'interj.',
    etiquetaCompleta: 'Interjección',
    descripcion: 'Expresión emotiva o exclamación cultural directa.',
    dimension: 'categoria',
    orden: 13,
  },
  {
    codigo: 'loc.',
    etiquetaCompleta: 'Locución',
    descripcion: 'Combinación fija de palabras con significado unitario.',
    dimension: 'categoria',
    orden: 14,
  },
  {
    codigo: 'loc. verb.',
    etiquetaCompleta: 'Locución verbal',
    descripcion: 'Combinación fija de palabras que funciona como un verbo.',
    dimension: 'categoria',
    orden: 15,
  },
  {
    codigo: 'loc. adv. l.',
    etiquetaCompleta: 'Locución adverbial de lugar',
    descripcion: 'Frase adverbial que sitúa geográficamente o en el territorio una acción.',
    dimension: 'categoria',
    orden: 16,
  },
  {
    codigo: 'loc. interj.',
    etiquetaCompleta: 'Locución interjectiva',
    descripcion: 'Frase fija empleada como saludo o expresión emotiva comunitaria.',
    dimension: 'categoria',
    orden: 17,
  },
  {
    codigo: 'loc. conjunt. temp.',
    etiquetaCompleta: 'Locución conjuntiva temporal',
    descripcion: 'Conector gramatical que enlaza acontecimientos en el tiempo.',
    dimension: 'categoria',
    orden: 18,
  },
  {
    codigo: 'orac. condic.',
    etiquetaCompleta: 'Oración condicional',
    descripcion: 'Estructura oracional que supedita una acción a una condición previa.',
    dimension: 'categoria',
    orden: 19,
  },
  {
    codigo: 'O.S.Adv. Tiem.',
    etiquetaCompleta: 'Oración subordinada adverbial de tiempo',
    descripcion: 'Oración subordinada que señala la circunstancia temporal de la acción.',
    dimension: 'categoria',
    orden: 20,
  },
  {
    codigo: 'O. S. E. A. P. I.',
    etiquetaCompleta: 'Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva',
    descripcion: 'Estructura oracional completa activa sin objeto directo.',
    dimension: 'categoria',
    orden: 21,
  },
  {
    codigo: 'O.E.A.',
    etiquetaCompleta: 'Oración enunciativa afirmativa',
    descripcion: 'Oración que asevera un hecho o estado afirmativo.',
    dimension: 'categoria',
    orden: 22,
  },

  // 2. Variantes
  {
    codigo: 'V. 1',
    etiquetaCompleta: 'Variante 1',
    descripcion: 'Forma o pronunciación alternativa documentada en la comunidad.',
    dimension: 'variante',
    orden: 23,
  },
  {
    codigo: 'V. 2',
    etiquetaCompleta: 'Variante 2',
    descripcion: 'Segunda variante o pronunciación dialectal documentada.',
    dimension: 'variante',
    orden: 24,
  },
  {
    codigo: 'V. 3',
    etiquetaCompleta: 'Variante 3',
    descripcion: 'Tercera variante o pronunciación dialectal documentada.',
    dimension: 'variante',
    orden: 25,
  },

  // 3. Rasgos morfológicos
  {
    codigo: 'sing.',
    etiquetaCompleta: 'Singular',
    descripcion: 'Número gramatical singular.',
    dimension: 'rasgo',
    orden: 26,
  },
  {
    codigo: 'pl.',
    etiquetaCompleta: 'Plural',
    descripcion: 'Número gramatical plural.',
    dimension: 'rasgo',
    orden: 27,
  },
  {
    codigo: 'f.',
    etiquetaCompleta: 'Femenino',
    descripcion: 'Género gramatical femenino o referente femenino.',
    dimension: 'rasgo',
    orden: 28,
  },
  {
    codigo: 'm.',
    etiquetaCompleta: 'Masculino',
    descripcion: 'Género gramatical masculino o referente masculino.',
    dimension: 'rasgo',
    orden: 29,
  },
  {
    codigo: 'amb.',
    etiquetaCompleta: 'Ambiguo',
    descripcion: 'Término que admite tanto género femenino como masculino según el contexto.',
    dimension: 'rasgo',
    orden: 30,
  },

  // 4. Origen léxico y préstamos
  {
    codigo: 'neol.',
    etiquetaCompleta: 'Neologismo',
    descripcion: 'Término de creación reciente o revitalización lingüística en Namtrik.',
    dimension: 'origen',
    orden: 31,
  },
  {
    codigo: 'plac.',
    etiquetaCompleta: 'Préstamo léxico adaptado del castellano',
    descripcion: 'Voz tomada del castellano y asimilada fonológica y morfológicamente al Namtrik.',
    dimension: 'origen',
    orden: 32,
  },
  {
    codigo: 'plaq.',
    etiquetaCompleta: 'Préstamo léxico adaptado del quechua',
    descripcion: 'Voz de origen quechua adaptada a la lengua Namtrik.',
    dimension: 'origen',
    orden: 33,
  },
  {
    codigo: 'plaqui.',
    etiquetaCompleta: 'Préstamo léxico adaptado del quichua',
    descripcion: 'Voz de origen quichua adaptada a la lengua Namtrik.',
    dimension: 'origen',
    orden: 34,
  },
  {
    codigo: 'plan.',
    etiquetaCompleta: 'Préstamo léxico del Náhuatl',
    descripcion: 'Voz tomada de la lengua náhuatl.',
    dimension: 'origen',
    orden: 35,
  },

  // 5. Dominios temáticos / científicos
  {
    codigo: 'educ.',
    etiquetaCompleta: 'Educación',
    descripcion: 'Ámbito educativo y pedagógico.',
    dimension: 'dominio',
    orden: 36,
  },
  {
    codigo: 'gast.',
    etiquetaCompleta: 'Gastronomía',
    descripcion: 'Preparación de alimentos, cocina tradicional y prácticas culinarias Misak.',
    dimension: 'dominio',
    orden: 37,
  },
  {
    codigo: 'bot.',
    etiquetaCompleta: 'Botánica',
    descripcion: 'Términos relacionados con plantas, cultivos y flora territorial.',
    dimension: 'dominio',
    orden: 38,
  },
  {
    codigo: 'Zool.',
    etiquetaCompleta: 'Zoología',
    descripcion: 'Términos relacionados con animales y fauna silvestre o doméstica.',
    dimension: 'dominio',
    orden: 39,
  },
  {
    codigo: 'símb.',
    etiquetaCompleta: 'Símbolo',
    descripcion: 'Signo o representación cultural ancestral del pueblo Misak.',
    dimension: 'dominio',
    orden: 40,
  },
  {
    codigo: 'ren.',
    etiquetaCompleta: 'Riñón humano',
    descripcion: 'Anatomía y medicina tradicional: riñón humano.',
    dimension: 'dominio',
    orden: 41,
  },
  {
    codigo: 'VB.',
    etiquetaCompleta: 'Vesícula Biliar',
    descripcion: 'Anatomía y medicina tradicional: vesícula biliar.',
    dimension: 'dominio',
    orden: 42,
  },
  {
    codigo: 'mamíf.',
    etiquetaCompleta: 'Mamífero',
    descripcion: 'Clasificación de mamíferos en el campo de animales originarios.',
    dimension: 'dominio',
    orden: 43,
  },
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
