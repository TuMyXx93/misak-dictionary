/**
 * Parser determinista del corpus léxico Misak (diccionario-campo-namtrik-castellano.xlsm).
 *
 * Funciones puras para:
 *  1. Desglosar la Columna A en 1..N FormasNamtrik (lema con ɵ, homónimo, categoría,
 *     variante V.1..V.n, neologismo y rasgos morfosintácticos).
 *  2. Desglosar la Columna C en glosa principal, explicación cultural y nombre científico.
 *  3. Procesar las hojas del archivo .xlsm asociando cada sentido y descripción a su
 *     código de nodo taxonómico (Campo, Subcampo, Microcampo o Subnivel).
 */

import { normalizarNamtrik } from '../../shared/utils/namtrik.js';
import type {
  DescripcionNodoArchivo,
  DialogoSaludoArchivo,
  FormaNamtrikArchivo,
  LexicoArchivo,
  SentidoLexicoArchivo,
} from './lexiconSchema.js';

const RASGOS_CONOCIDOS = new Set(['sing.', 'pl.', 'f.', 'm.', 'plac.', 'Zool.', 'entom.']);

const MAPA_RASGOS_EQUIVALENTES: Readonly<Record<string, string>> = {
  sing: 'sing.',
  'sing.': 'sing.',
  pl: 'pl.',
  'pl.': 'pl.',
  f: 'f.',
  'f.': 'f.',
  m: 'm.',
  'm.': 'm.',
  plac: 'plac.',
  'plac.': 'plac.',
  plaq: 'plac.',
  'plaq.': 'plac.',
  plaqui: 'plac.',
  'plaqui.': 'plac.',
  plan: 'plac.',
  'plan.': 'plac.',
  zool: 'Zool.',
  'zool.': 'Zool.',
  'Zool.': 'Zool.',
  entom: 'entom.',
  'entom.': 'entom.',
};

export interface EtiquetaParseada {
  categoriaGramatical?: string | undefined;
  variante?: string | undefined;
  esNeologismo: boolean;
  rasgosGramaticales: string[];
  etiquetaOriginal: string;
}

/**
 * Analiza el contenido entre paréntesis de una forma namtrik, p. ej.:
 * "adj., V.1", "v., neol., V.2", "loc. nom., m., plac., V.2", "sn.V.1.", "v.posic.pl."
 */
export function parsearEtiquetaParentesis(cruda: string): EtiquetaParseada {
  const etiquetaOriginal = cruda
    .trim()
    .replace(/^[()]+|[()]+$/g, '')
    .trim();
  let trabajo = etiquetaOriginal;

  // 1) Detectar marca de neologismo (neol. / neol)
  let esNeologismo = false;
  trabajo = trabajo.replace(/\bneol\.?\b\s*,?/gi, () => {
    esNeologismo = true;
    return '';
  });

  // 2) Detectar variante (V.1, V.2, V2, Var.1, V.1.)
  let variante: string | undefined;
  trabajo = trabajo.replace(/(?:^|[\s,.])(?:Var\.?|V\.?)\s*(\d+)\.?/gi, (_match, num: string) => {
    variante = `V.${num}`;
    return ',';
  });

  // 3) Separar sufijos pegados comunes como "v.posic.pl."
  trabajo = trabajo.replace(/\b(v\.pos(?:ic)?\.)\s*(pl\.|sing\.)/gi, '$1, $2');

  // 4) Dividir por coma y clasificar cada fragmento en rasgo o categoría gramatical
  const fragmentos = trabajo
    .split(',')
    .map((f) =>
      f
        .trim()
        .replace(/^[,.\s]+|[,s]+$/g, '')
        .trim(),
    )
    .filter((f) => f.length > 0);

  const rasgosGramaticales: string[] = [];
  const partesCategoria: string[] = [];

  for (const frag of fragmentos) {
    const claveMinuscula = frag.toLowerCase();
    const rasgoNormalizado =
      MAPA_RASGOS_EQUIVALENTES[frag] ?? MAPA_RASGOS_EQUIVALENTES[claveMinuscula];
    if (rasgoNormalizado && RASGOS_CONOCIDOS.has(rasgoNormalizado)) {
      if (!rasgosGramaticales.includes(rasgoNormalizado)) {
        rasgosGramaticales.push(rasgoNormalizado);
      }
    } else {
      partesCategoria.push(frag);
    }
  }

  const categoriaUnida = partesCategoria.join(', ').trim();
  const categoriaGramatical =
    categoriaUnida.length > 0
      ? categoriaUnida.replace(/\s+/g, ' ').replace(/^loc\.nom\./i, 'loc. nom.')
      : undefined;

  return {
    categoriaGramatical,
    variante,
    esNeologismo,
    rasgosGramaticales,
    etiquetaOriginal,
  };
}

/**
 * Desglosa la celda de Columna A en 1..N FormasNamtrik ordenadas y normalizadas con ɵ.
 */
export function parsearFormasNamtrik(celdaA: string): {
  formas: FormaNamtrikArchivo[];
  cambiosOrtograficos: number;
} {
  // Saneamiento de errores tipográficos conocidos de paréntesis anidados/dobles en el .xlsm
  const limpia = celdaA
    .replace(/\u00a0/g, ' ')
    .replace(/\(loc\.interj\.\),\s*sing\.\)/gi, '(loc.interj., sing.)')
    .replace(/\)+/g, ')')
    .replace(/\(+/g, '(')
    .trim();

  const regexPar = /([^()]+?)\s*\(([^()]+)\)/g;
  const coincidencias = [...limpia.matchAll(regexPar)];

  let cambiosOrtograficos = 0;
  const formas: FormaNamtrikArchivo[] = [];

  if (coincidencias.length === 0) {
    const { valor, cambios } = normalizarNamtrik(limpia.replace(/\.$/, '').trim());
    cambiosOrtograficos += cambios;
    return {
      formas: [
        {
          orden: 1,
          lema: valor,
          esNeologismo: false,
          rasgosGramaticales: [],
        },
      ],
      cambiosOrtograficos,
    };
  }

  for (const [idx, match] of coincidencias.entries()) {
    const lemaCrudo = (match[1] ?? '').replace(/^[\s.,;]+|[\s.,;]+$/g, '').trim();
    const etiquetaCruda = match[2] ?? '';

    // Detectar homónimo numerado al final del lema (ej. "Sruutra 1", "Lallip 1")
    let textoLema = lemaCrudo;
    let acepcionHomonima: number | undefined;
    const matchHomonimo = /^(.+?)\s+(\d+)$/.exec(lemaCrudo);
    if (matchHomonimo?.[1] && matchHomonimo[2]) {
      textoLema = matchHomonimo[1].trim();
      acepcionHomonima = Number(matchHomonimo[2]);
    }

    const { valor: lemaNormalizado, cambios } = normalizarNamtrik(textoLema);
    cambiosOrtograficos += cambios;

    const infoEtiqueta = parsearEtiquetaParentesis(etiquetaCruda);

    const forma: FormaNamtrikArchivo = {
      orden: idx + 1,
      lema: lemaNormalizado,
      esNeologismo: infoEtiqueta.esNeologismo,
      rasgosGramaticales: infoEtiqueta.rasgosGramaticales,
    };

    if (acepcionHomonima !== undefined) {
      forma.acepcionHomonima = acepcionHomonima;
    }
    if (infoEtiqueta.categoriaGramatical) {
      forma.categoriaGramatical = infoEtiqueta.categoriaGramatical;
    }
    if (infoEtiqueta.variante) {
      forma.variante = infoEtiqueta.variante;
    }
    if (infoEtiqueta.etiquetaOriginal) {
      forma.etiquetaOriginal = infoEtiqueta.etiquetaOriginal;
    }

    formas.push(forma);
  }

  return { formas, cambiosOrtograficos };
}

export interface ContenidoEspanolParseado {
  espanolGlosa: string;
  espanolExplicacion?: string | undefined;
  nombreCientifico?: string | undefined;
}

/**
 * Desglosa la Columna C en glosa principal, explicación cultural y nombre científico opcional.
 */
export function parsearContenidoEspanol(
  celdaC: string,
  permitirCientifico = true,
): ContenidoEspanolParseado {
  let texto = celdaC
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
  let nombreCientifico: string | undefined;

  // 1) Extraer nombre científico entre paréntesis al final si corresponde a nomenclatura binomial
  if (permitirCientifico) {
    const regexCientificoFinal =
      /^([\s\S]+?)\s*\(\s*([A-Z][a-z]+(?:\s+[a-z]{2,}|\s+sp\.|\s+spp\.)(?:\s+[a-z]{2,})?)\s*\)\.?\s*$/;
    const matchCient = regexCientificoFinal.exec(texto);
    if (matchCient?.[1] && matchCient[2]) {
      texto = matchCient[1].trim().replace(/\.$/, '').trim();
      nombreCientifico = matchCient[2].trim();
    }
  }

  // 2) Caso de acepciones numeradas al inicio: "1. Glosa: definición... 2. Segunda acepción..."
  const matchAcepcionNumerada = /^1\.?\s+([^:\n]{2,80}):\s*([\s\S]+)$/.exec(texto);
  if (matchAcepcionNumerada?.[1] && matchAcepcionNumerada[2]) {
    return {
      espanolGlosa: matchAcepcionNumerada[1].trim(),
      espanolExplicacion: texto,
      nombreCientifico,
    };
  }

  // 3) Caso estándar "Glosa principal: explicación extensa"
  const indiceDosPuntos = texto.indexOf(':');
  if (indiceDosPuntos > 0 && indiceDosPuntos <= 90) {
    const posibleGlosa = texto.slice(0, indiceDosPuntos).trim();
    const posibleExplicacion = texto.slice(indiceDosPuntos + 1).trim();
    if (!posibleGlosa.includes('\n') && posibleExplicacion.length > 0) {
      return {
        espanolGlosa: posibleGlosa,
        espanolExplicacion: posibleExplicacion,
        nombreCientifico,
      };
    }
  }

  // 4) Caso de múltiples líneas donde la primera línea es la glosa corta y las siguientes son nota
  if (texto.includes('\n')) {
    const lineas = texto
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const primera = lineas[0] ?? texto;
    if (lineas.length > 1 && primera.length <= 90 && !primera.startsWith('1')) {
      return {
        espanolGlosa: primera.replace(/\.$/, '').trim(),
        espanolExplicacion: lineas.slice(1).join('\n'),
        nombreCientifico,
      };
    }
  }

  // 5) Glosa directa sin dos puntos o texto único
  const glosaLimpia =
    texto.length <= 75 && !texto.includes('\n') ? texto.replace(/\.$/, '').trim() : texto;

  return {
    espanolGlosa: glosaLimpia,
    nombreCientifico,
  };
}

export interface FilaHojaCruda {
  numeroFila: number;
  columnas: Record<string, string>;
  resaltadoAmarillo?: boolean | undefined;
  comentarioExcel?: string | undefined;
}

export interface HojaCruda {
  nombre: string;
  filas: FilaHojaCruda[];
}

/**
 * Extrae el objeto LexicoArchivo completo a partir de las 5 hojas del .xlsm.
 */
export function extraerLexicoDeHojas(hojas: HojaCruda[]): {
  lexico: LexicoArchivo;
  cambiosOrtograficos: number;
} {
  const descripcionesMap = new Map<string, DescripcionNodoArchivo>();
  const sentidos: SentidoLexicoArchivo[] = [];
  const contadoresPorNodo = new Map<string, number>();
  let duplicadosColapsados = 0;
  let cambiosOrtograficos = 0;

  const registrarDescripcion = (
    nodoCodigo: string,
    namtrikDesc?: string,
    espanolDesc?: string,
  ): void => {
    const existente = descripcionesMap.get(nodoCodigo) ?? { nodoCodigo };
    if (namtrikDesc?.trim()) {
      const { valor, cambios } = normalizarNamtrik(namtrikDesc.trim());
      cambiosOrtograficos += cambios;
      existente.namtrikDescripcion = existente.namtrikDescripcion
        ? `${existente.namtrikDescripcion}\n\n${valor}`
        : valor;
    }
    if (espanolDesc?.trim()) {
      const limpio = espanolDesc.trim();
      existente.espanolDescripcion = existente.espanolDescripcion
        ? `${existente.espanolDescripcion}\n\n${limpio}`
        : limpio;
    }
    descripcionesMap.set(nodoCodigo, existente);
  };

  for (const hoja of hojas) {
    const nombreHoja = hoja.nombre.trim().toUpperCase();
    const esSaludos = nombreHoja === 'SALUDOS';

    let campoNum = 1;
    let subcampoNum: number | null = null;
    let microcampoNum: number | null = null;
    let subnivelNum: number | null = null;

    if (esSaludos) {
      campoNum = 1;
      subcampoNum = 1;
      microcampoNum = 21;
    } else if (nombreHoja.startsWith('2')) {
      campoNum = 2;
    } else if (nombreHoja.startsWith('3')) {
      campoNum = 3;
    } else if (nombreHoja.startsWith('4')) {
      campoNum = 4;
    }

    const obtenerNodoActual = (): string => {
      let codigo = `C${campoNum}`;
      if (subcampoNum !== null) {
        codigo += `.S${subcampoNum}`;
        if (microcampoNum !== null) {
          codigo += `.M${microcampoNum}`;
          if (subnivelNum !== null) {
            codigo += `.${subnivelNum}`;
          }
        }
      }
      return codigo;
    };

    let firmaFilaAnterior = '';
    let nodoFilaAnterior = '';

    for (const fila of hoja.filas) {
      const colA = (fila.columnas['A'] ?? '').trim();
      const colB = (fila.columnas['B'] ?? '').trim();
      const colC = (fila.columnas['C'] ?? '').trim();
      const colD = (fila.columnas['D'] ?? '').trim();
      const colE = (fila.columnas['E'] ?? '').trim();
      const colF = (fila.columnas['F'] ?? '').trim();

      if (!colA && !colB && !colC && !colD) {
        continue;
      }

      // 1) Detectar encabezados estructurales de Campo, Subcampo, Microcampo y Subnivel
      const matchCampo = /^Campo\s+sem[aá]ntico\s+(\d+)/i.exec(colA);
      if (matchCampo?.[1] && !colB && !colC) {
        campoNum = Number(matchCampo[1]);
        subcampoNum = null;
        microcampoNum = null;
        subnivelNum = null;
        continue;
      }

      const matchSubcampo = /^Subcampo\s+sem[aá]ntico\s+(\d+)/i.exec(colA);
      if (matchSubcampo?.[1] && !colB && !colC) {
        subcampoNum = Number(matchSubcampo[1]);
        microcampoNum = null;
        subnivelNum = null;
        continue;
      }

      const matchMicrocampo = /^Micro\s*campo\s+sem[aá]ntico\s+(\d+)/i.exec(colA);
      if (matchMicrocampo?.[1] && !colB && !colC && !colD) {
        microcampoNum = Number(matchMicrocampo[1]);
        subnivelNum = null;
        continue;
      }

      const matchSubnivel = /^([1-9])\.\s+[A-ZÁÉÍÓÚÑ]/i.exec(colA);
      if (matchSubnivel?.[1] && !colB && !colC && microcampoNum === 19) {
        subnivelNum = Number(matchSubnivel[1]);
        continue;
      }

      // 2) Ignorar cabeceras de tabla ("NAMTRIKMAI WAM", "Pregunta de saludo", "Misak ya", "Chitɵ marɵp putraiknuk")
      if (
        colA.startsWith('NAMTRIKMAI') ||
        colA.startsWith('Pregunta de saludo') ||
        (colA === 'Misak ya' && colC === 'Casa Misak') ||
        (colA === 'Chitɵ marɵp putraiknuk' && colC === 'Descripción')
      ) {
        continue;
      }

      const nodoActual = obtenerNodoActual();

      // 3) Detectar filas de descripción o nota lingüística del nodo taxonómico
      if (esSaludos && fila.numeroFila === 2 && colD && !colB && !colC) {
        registrarDescripcion(nodoActual, colA, colD);
        continue;
      }

      if (!colB && !colC && !colD && colA.length > 40) {
        // Notas lingüísticas en español de una sola celda combinada (filas 256, 365, 565, 616 de 1 NAKCHAK)
        registrarDescripcion(nodoActual, undefined, colA);
        continue;
      }

      if (!colB && colA && colC && !colA.includes('(') && colA.length > 35) {
        // Párrafos descriptivos bilingües de Campo/Subcampo/Microcampo (filas 3, 349, 698, 761, 791 de 1 NAKCHAK; fila 2 de YATUL/TRATUL/USHAMERA; filas 43, 65 de YATUL; fila 4 de USHAMERA)
        registrarDescripcion(nodoActual, colA, colC);
        continue;
      }

      // 4) Colapsar filas consecutivas 100 % idénticas dentro del mismo nodo (ej. Srutrap tsatsɵ x5)
      const firmaActual = `${colA}||${colB}||${colC}||${colD}||${colE}||${colF}`;
      if (firmaActual === firmaFilaAnterior && nodoActual === nodoFilaAnterior) {
        duplicadosColapsados += 1;
        continue;
      }
      firmaFilaAnterior = firmaActual;
      nodoFilaAnterior = nodoActual;

      // 5) Construir SentidoLexicoArchivo
      const posicion = (contadoresPorNodo.get(nodoActual) ?? 0) + 1;
      contadoresPorNodo.set(nodoActual, posicion);

      const prefijoTipo = esSaludos ? 'D' : 'E';
      const codigoSentido = `${nodoActual}.${prefijoTipo}${String(posicion).padStart(3, '0')}`;

      const { formas, cambiosOrtograficos: cambiosFormas } = parsearFormasNamtrik(colA);
      cambiosOrtograficos += cambiosFormas;

      const observaciones: string[] = [];
      if (fila.resaltadoAmarillo) {
        observaciones.push('resaltado_amarillo');
      }
      if (fila.comentarioExcel) {
        observaciones.push(`comentario_excel: ${fila.comentarioExcel}`);
      }

      if (esSaludos) {
        const preguntaEsp = parsearContenidoEspanol(colC, false);
        const respuestaEsp = parsearContenidoEspanol(colF || colE || '-', false);
        const { valor: respNamtrik, cambios: cResp } = normalizarNamtrik(colD || colE || '-');
        cambiosOrtograficos += cResp;

        const dialogo: DialogoSaludoArchivo = {
          respuestaNamtrik: respNamtrik,
          respuestaEspanolGlosa: respuestaEsp.espanolGlosa,
        };

        if (colD && colE) {
          const { valor: ctxResp, cambios: cCtxResp } = normalizarNamtrik(colE);
          cambiosOrtograficos += cCtxResp;
          dialogo.respuestaNamtrikContexto = ctxResp;
        }
        if (respuestaEsp.espanolExplicacion) {
          dialogo.respuestaEspanolExplicacion = respuestaEsp.espanolExplicacion;
        }

        const sentidoSaludo: SentidoLexicoArchivo = {
          codigo: codigoSentido,
          nodoCodigo: nodoActual,
          posicion,
          tipo: 'dialogico',
          formas,
          espanolGlosa: preguntaEsp.espanolGlosa,
          dialogo,
        };

        if (colB) {
          const { valor: ctxPreg, cambios: cCtxPreg } = normalizarNamtrik(colB);
          cambiosOrtograficos += cCtxPreg;
          sentidoSaludo.namtrikContexto = ctxPreg;
        }
        if (preguntaEsp.espanolExplicacion) {
          sentidoSaludo.espanolExplicacion = preguntaEsp.espanolExplicacion;
        }
        if (observaciones.length > 0) {
          sentidoSaludo.observacionEditorial = observaciones.join(' | ');
        }

        sentidos.push(sentidoSaludo);
        continue;
      }

      // Entrada estándar (Modelo 1: Sentido + Formas)
      const contenidoEsp = parsearContenidoEspanol(colC, true);
      const sentido: SentidoLexicoArchivo = {
        codigo: codigoSentido,
        nodoCodigo: nodoActual,
        posicion,
        tipo: 'estandar',
        formas,
        espanolGlosa: contenidoEsp.espanolGlosa,
      };

      if (colB) {
        const { valor: ctxNamtrik, cambios: cCtx } = normalizarNamtrik(colB);
        cambiosOrtograficos += cCtx;
        sentido.namtrikContexto = ctxNamtrik;
      }
      if (contenidoEsp.espanolExplicacion) {
        sentido.espanolExplicacion = contenidoEsp.espanolExplicacion;
      }
      if (contenidoEsp.nombreCientifico) {
        sentido.nombreCientifico = contenidoEsp.nombreCientifico;
      }
      if (observaciones.length > 0) {
        sentido.observacionEditorial = observaciones.join(' | ');
      }

      sentidos.push(sentido);
    }
  }

  return {
    lexico: {
      version: 1,
      fuente: {
        documento: 'diccionario-campo-namtrik-castellano.xlsm',
        revisor: 'Equipo lingüístico Misak',
        duplicadosColapsados,
        nota: 'Corpus léxico v1 de los campos C1..C4 extraído deterministamente con modelo Sentido + Formas.',
      },
      descripcionesNodos: [...descripcionesMap.values()],
      sentidos,
    },
    cambiosOrtograficos,
  };
}
