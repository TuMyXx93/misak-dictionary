/**
 * Constantes y Utilidades de Abreviaturas Lingüísticas (Spec 012 v0.2.0 / Abreviaturas.pdf)
 * Utilizado por componentes públicos y administrativos para tooltips, popovers y selectores.
 */

export type DimensionAbreviatura = 'categoria' | 'variante' | 'rasgo' | 'origen' | 'dominio';

export interface AbreviaturaItem {
  id?: string;
  codigo: string;
  etiquetaCompleta: string;
  descripcion?: string | null;
  dimension: DimensionAbreviatura;
  orden?: number;
  activo?: boolean;
}

export const ABREVIATURAS_OFICIALES: readonly AbreviaturaItem[] = [
  // 1. Categorías gramaticales y sintácticas
  {
    codigo: 's.',
    etiquetaCompleta: 'Sustantivo',
    descripcion:
      'Palabra que designa personas, animales, cosas, lugares o conceptos en la cosmovisión Misak.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc. nom.',
    etiquetaCompleta: 'Locución nominal',
    descripcion: 'Grupo de palabras que funciona sintácticamente como un sustantivo.',
    dimension: 'categoria',
  },
  {
    codigo: 'sn.',
    etiquetaCompleta: 'Sintagma Nominal',
    descripcion: 'Estructura sintáctica cuyo núcleo es un sustantivo o pronombre.',
    dimension: 'categoria',
  },
  {
    codigo: 'v.',
    etiquetaCompleta: 'Verbo',
    descripcion: 'Palabra que indica acción, proceso, estado o vivencia.',
    dimension: 'categoria',
  },
  {
    codigo: 'sv.',
    etiquetaCompleta: 'Sintagma verbal',
    descripcion: 'Estructura sintáctica cuyo núcleo es un verbo.',
    dimension: 'categoria',
  },
  {
    codigo: 'v. pos.',
    etiquetaCompleta: 'Verbo posicional',
    descripcion:
      'Verbo que expresa postura corporal, disposición espacial o estado posicional tradicional.',
    dimension: 'categoria',
  },
  {
    codigo: 'adj.',
    etiquetaCompleta: 'Adjetivo',
    descripcion: 'Palabra que describe o delimita al sustantivo.',
    dimension: 'categoria',
  },
  {
    codigo: 'cal.',
    etiquetaCompleta: 'Calificativo',
    descripcion: 'Adjetivo o modificador que atribuye una cualidad específica.',
    dimension: 'categoria',
  },
  {
    codigo: 'adj. cal.',
    etiquetaCompleta: 'Adjetivo calificativo',
    descripcion: 'Adjetivo que denota características físicas, sensoriales o valorativas.',
    dimension: 'categoria',
  },
  {
    codigo: 'adv. c.',
    etiquetaCompleta: 'Adverbio de cantidad',
    descripcion: 'Modificador que especifica grado, intensidad o volumen de la acción.',
    dimension: 'categoria',
  },
  {
    codigo: 'adv. lugar',
    etiquetaCompleta: 'Adverbio de lugar',
    descripcion: 'Modificador que ubica espacial o territorialmente una acción.',
    dimension: 'categoria',
  },
  {
    codigo: 'cuant. nom.',
    etiquetaCompleta: 'Cuantificador nominal',
    descripcion: 'Elemento que especifica cantidad o medida sobre un sustantivo.',
    dimension: 'categoria',
  },
  {
    codigo: 'interj.',
    etiquetaCompleta: 'Interjección',
    descripcion: 'Expresión emotiva o exclamación cultural directa.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc.',
    etiquetaCompleta: 'Locución',
    descripcion: 'Combinación fija de palabras con significado unitario.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc. verb.',
    etiquetaCompleta: 'Locución verbal',
    descripcion: 'Combinación fija de palabras que funciona como un verbo.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc. adv. l.',
    etiquetaCompleta: 'Locución adverbial de lugar',
    descripcion: 'Frase adverbial que sitúa geográficamente o en el territorio una acción.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc. interj.',
    etiquetaCompleta: 'Locución interjectiva',
    descripcion: 'Frase fija empleada como saludo o expresión emotiva comunitaria.',
    dimension: 'categoria',
  },
  {
    codigo: 'loc. conjunt. temp.',
    etiquetaCompleta: 'Locución conjuntiva temporal',
    descripcion: 'Conector gramatical que enlaza acontecimientos en el tiempo.',
    dimension: 'categoria',
  },
  {
    codigo: 'orac. condic.',
    etiquetaCompleta: 'Oración condicional',
    descripcion: 'Estructura oracional que supedita una acción a una condición previa.',
    dimension: 'categoria',
  },
  {
    codigo: 'O.S.Adv. Tiem.',
    etiquetaCompleta: 'Oración subordinada adverbial de tiempo',
    descripcion: 'Oración subordinada que señala la circunstancia temporal de la acción.',
    dimension: 'categoria',
  },
  {
    codigo: 'O. S. E. A. P. I.',
    etiquetaCompleta: 'Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva',
    descripcion: 'Estructura oracional completa activa sin objeto directo.',
    dimension: 'categoria',
  },
  {
    codigo: 'O.E.A.',
    etiquetaCompleta: 'Oración enunciativa afirmativa',
    descripcion: 'Oración que asevera un hecho o estado afirmativo.',
    dimension: 'categoria',
  },

  // 2. Variantes
  {
    codigo: 'V. 1',
    etiquetaCompleta: 'Variante 1',
    descripcion: 'Forma o pronunciación alternativa documentada en la comunidad.',
    dimension: 'variante',
  },
  {
    codigo: 'V. 2',
    etiquetaCompleta: 'Variante 2',
    descripcion: 'Segunda variante o pronunciación dialectal documentada.',
    dimension: 'variante',
  },
  {
    codigo: 'V. 3',
    etiquetaCompleta: 'Variante 3',
    descripcion: 'Tercera variante o pronunciación dialectal documentada.',
    dimension: 'variante',
  },

  // 3. Rasgos morfológicos
  {
    codigo: 'sing.',
    etiquetaCompleta: 'Singular',
    descripcion: 'Número gramatical singular.',
    dimension: 'rasgo',
  },
  {
    codigo: 'pl.',
    etiquetaCompleta: 'Plural',
    descripcion: 'Número gramatical plural.',
    dimension: 'rasgo',
  },
  {
    codigo: 'f.',
    etiquetaCompleta: 'Femenino',
    descripcion: 'Género gramatical femenino o referente femenino.',
    dimension: 'rasgo',
  },
  {
    codigo: 'm.',
    etiquetaCompleta: 'Masculino',
    descripcion: 'Género gramatical masculino o referente masculino.',
    dimension: 'rasgo',
  },
  {
    codigo: 'amb.',
    etiquetaCompleta: 'Ambiguo',
    descripcion: 'Término que admite tanto género femenino como masculino según el contexto.',
    dimension: 'rasgo',
  },

  // 4. Origen léxico y préstamos
  {
    codigo: 'neol.',
    etiquetaCompleta: 'Neologismo',
    descripcion: 'Término de creación reciente o revitalización lingüística en Namtrik.',
    dimension: 'origen',
  },
  {
    codigo: 'plac.',
    etiquetaCompleta: 'Préstamo léxico adaptado del castellano',
    descripcion: 'Voz tomada del castellano y asimilada fonológica y morfológicamente al Namtrik.',
    dimension: 'origen',
  },
  {
    codigo: 'plaq.',
    etiquetaCompleta: 'Préstamo léxico adaptado del quechua',
    descripcion: 'Voz de origen quechua adaptada a la lengua Namtrik.',
    dimension: 'origen',
  },
  {
    codigo: 'plaqui.',
    etiquetaCompleta: 'Préstamo léxico adaptado del quichua',
    descripcion: 'Voz de origen quichua adaptada a la lengua Namtrik.',
    dimension: 'origen',
  },
  {
    codigo: 'plan.',
    etiquetaCompleta: 'Préstamo léxico del Náhuatl',
    descripcion: 'Voz tomada de la lengua náhuatl.',
    dimension: 'origen',
  },

  // 5. Dominios temáticos / científicos
  {
    codigo: 'educ.',
    etiquetaCompleta: 'Educación',
    descripcion: 'Ámbito educativo y pedagógico.',
    dimension: 'dominio',
  },
  {
    codigo: 'gast.',
    etiquetaCompleta: 'Gastronomía',
    descripcion: 'Preparación de alimentos, cocina tradicional y prácticas culinarias Misak.',
    dimension: 'dominio',
  },
  {
    codigo: 'bot.',
    etiquetaCompleta: 'Botánica',
    descripcion: 'Términos relacionados con plantas, cultivos y flora territorial.',
    dimension: 'dominio',
  },
  {
    codigo: 'Zool.',
    etiquetaCompleta: 'Zoología',
    descripcion: 'Términos relacionados con animales y fauna silvestre o doméstica.',
    dimension: 'dominio',
  },
  {
    codigo: 'símb.',
    etiquetaCompleta: 'Símbolo',
    descripcion: 'Signo o representación cultural ancestral del pueblo Misak.',
    dimension: 'dominio',
  },
  {
    codigo: 'ren.',
    etiquetaCompleta: 'Riñón humano',
    descripcion: 'Anatomía y medicina tradicional: riñón humano.',
    dimension: 'dominio',
  },
  {
    codigo: 'VB.',
    etiquetaCompleta: 'Vesícula Biliar',
    descripcion: 'Anatomía y medicina tradicional: vesícula biliar.',
    dimension: 'dominio',
  },
  {
    codigo: 'mamíf.',
    etiquetaCompleta: 'Mamífero',
    descripcion: 'Clasificación de mamíferos en el campo de animales originarios.',
    dimension: 'dominio',
  },
];

const normalizarCodigo = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

const MAPA_ABREVIATURAS = new Map<string, AbreviaturaItem>(
  ABREVIATURAS_OFICIALES.map((item) => [normalizarCodigo(item.codigo), item]),
);

/**
 * Resuelve una abreviatura individual contra el catálogo (estático o dinámico).
 */
export function getAbreviaturaInfo(
  codigoRaw?: string | null,
  customCatalog?: readonly AbreviaturaItem[],
): AbreviaturaItem | null {
  if (!codigoRaw) return null;
  const clean = normalizarCodigo(codigoRaw);

  if (customCatalog) {
    const found = customCatalog.find((it) => normalizarCodigo(it.codigo) === clean);
    if (found) return found;
  }

  return MAPA_ABREVIATURAS.get(clean) ?? null;
}

/**
 * Desglosa una abreviatura que pueda ser compuesta (ej. "loc. nom., adj." o "s., simb.")
 * devolviendo la lista de componentes reconocidos con su etiqueta y descripción.
 */
export function parseComposedAbreviatura(
  raw?: string | null,
  customCatalog?: readonly AbreviaturaItem[],
): AbreviaturaItem[] {
  if (!raw || !raw.trim()) return [];
  const clean = raw.trim();

  // 1. Si coincide exacto completo
  const exact = getAbreviaturaInfo(clean, customCatalog);
  if (exact) return [exact];

  // 2. Si contiene comas o barras, dividir
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
        dimension: 'categoria',
      });
    }
  }

  return items.length > 0
    ? items
    : [
        {
          codigo: clean,
          etiquetaCompleta: clean,
          dimension: 'categoria',
        },
      ];
}
