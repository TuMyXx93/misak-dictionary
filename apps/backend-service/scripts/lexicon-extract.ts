/**
 * CLI: extracción determinista del corpus léxico desde un archivo .xlsm/.xlsx
 * hacia el artefacto canónico versionado `data/lexicon/v1/lexico.yaml`.
 *
 *   pnpm --filter @misak/backend-service lexicon:extract -- --input <ruta.xlsm>
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { stringify } from 'yaml';
import {
  extraerLexicoDeHojas,
  type FilaHojaCruda,
  type HojaCruda,
} from '../src/application/lexicon/lexiconParser.js';
import { lexicoSchema } from '../src/application/lexicon/lexiconSchema.js';

/**
 * Extrae archivos XML de un contenedor ZIP (.xlsm / .xlsx) usando solo node:zlib.
 */
function leerEntradasZip(buffer: Buffer): Map<string, string> {
  const entradas = new Map<string, string>();

  // Localizar End of Central Directory (EOCD: 0x06054b50)
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Archivo ZIP/XLSM inválido: no se encontró el directorio central');
  }

  const totalEntradas = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let ptr = cdOffset;
  for (let i = 0; i < totalEntradas; i++) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) {
      break;
    }
    const metodo = buffer.readUInt16LE(ptr + 10);
    const tamComprimido = buffer.readUInt32LE(ptr + 20);
    const lenNombre = buffer.readUInt16LE(ptr + 28);
    const lenExtra = buffer.readUInt16LE(ptr + 30);
    const lenComentario = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);

    const nombre = buffer.subarray(ptr + 46, ptr + 46 + lenNombre).toString('utf8');
    ptr += 46 + lenNombre + lenExtra + lenComentario;

    if (!nombre.endsWith('.xml')) {
      continue;
    }

    const localLenNombre = buffer.readUInt16LE(localHeaderOffset + 26);
    const localLenExtra = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localLenNombre + localLenExtra;
    const rawSlice = buffer.subarray(dataStart, dataStart + tamComprimido);

    const descomprimido = metodo === 0 ? rawSlice : inflateRawSync(rawSlice);
    entradas.set(nombre, descomprimido.toString('utf8'));
  }

  return entradas;
}

function decodificarEntidadesXml(texto: string): string {
  return texto
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parsearSharedStrings(xml: string): string[] {
  const resultado: string[] = [];
  const regexSi = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  for (const matchSi of xml.matchAll(regexSi)) {
    const bloqueSi = matchSi[1] ?? '';
    const partes: string[] = [];
    for (const matchT of bloqueSi.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
      partes.push(decodificarEntidadesXml(matchT[1] ?? ''));
    }
    resultado.push(partes.join(''));
  }
  return resultado;
}

function detectarEstilosAmarillos(stylesXml: string): Set<string> {
  const fillIdsAmarillos = new Set<string>();
  const bloqueFills = /<fills\b[^>]*>([\s\S]*?)<\/fills>/.exec(stylesXml)?.[1] ?? '';
  let fillIdx = 0;
  for (const matchFill of bloqueFills.matchAll(/<fill\b[^>]*>([\s\S]*?)<\/fill>/g)) {
    const contenidoFill = matchFill[1] ?? '';
    if (/rgb="[0-9A-F]{2}FFFF00"/i.test(contenidoFill)) {
      fillIdsAmarillos.add(String(fillIdx));
    }
    fillIdx += 1;
  }

  const styleIdsAmarillos = new Set<string>();
  const bloqueCellXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? '';
  let xfIdx = 0;
  for (const matchXf of bloqueCellXfs.matchAll(/<xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/xf>)/g)) {
    const attrs = matchXf[1] ?? '';
    const fillId = /fillId="(\d+)"/.exec(attrs)?.[1];
    if (fillId && fillIdsAmarillos.has(fillId)) {
      styleIdsAmarillos.add(String(xfIdx));
    }
    xfIdx += 1;
  }

  return styleIdsAmarillos;
}

function extraerComentariosHoja1(
  threadedXml: string | undefined,
  commentsXml: string | undefined,
): Map<number, string> {
  const mapa = new Map<number, string>();
  if (threadedXml) {
    for (const m of threadedXml.matchAll(
      /<threadedComment\b[^>]*\bref="[A-Z]+(\d+)"[^>]*>[\s\S]*?<text>([\s\S]*?)<\/text>/g,
    )) {
      const fila = Number(m[1]);
      const texto = decodificarEntidadesXml(m[2] ?? '').trim();
      if (fila && texto) {
        mapa.set(fila, texto);
      }
    }
  } else if (commentsXml) {
    for (const m of commentsXml.matchAll(
      /<comment\b[^>]*\bref="[A-Z]+(\d+)"[^>]*>[\s\S]*?<text>([\s\S]*?)<\/text>/g,
    )) {
      const fila = Number(m[1]);
      const texto = decodificarEntidadesXml((m[2] ?? '').replace(/<[^>]+>/g, '')).trim();
      if (fila && texto) {
        mapa.set(fila, texto);
      }
    }
  }
  return mapa;
}

function parsearHojasDesdeZip(entradas: Map<string, string>): HojaCruda[] {
  const sharedStrings = parsearSharedStrings(entradas.get('xl/sharedStrings.xml') ?? '');
  const estilosAmarillos = detectarEstilosAmarillos(entradas.get('xl/styles.xml') ?? '');
  const comentariosHoja1 = extraerComentariosHoja1(
    entradas.get('xl/threadedComments/threadedComment1.xml'),
    entradas.get('xl/comments1.xml'),
  );

  const workbookXml = entradas.get('xl/workbook.xml') ?? '';
  const nombresHojas: string[] = [];
  for (const m of workbookXml.matchAll(/<sheet\b[^>]*\bname="([^"]+)"/g)) {
    nombresHojas.push(decodificarEntidadesXml(m[1] ?? ''));
  }

  const hojas: HojaCruda[] = [];

  for (const [idx, nombre] of nombresHojas.entries()) {
    const numHoja = idx + 1;
    const sheetXml = entradas.get(`xl/worksheets/sheet${numHoja}.xml`) ?? '';
    const filas: FilaHojaCruda[] = [];

    for (const matchRow of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const rowAttrs = matchRow[1] ?? '';
      const rowBody = matchRow[2] ?? '';
      const numeroFila = Number(/\br="(\d+)"/.exec(rowAttrs)?.[1] ?? '0');
      const columnas: Record<string, string> = {};
      let resaltadoAmarillo = false;

      for (const matchCell of rowBody.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const cellAttrs = matchCell[1] ?? '';
        const cellBody = matchCell[2] ?? '';
        const ref = /\br="([A-Z]+)\d+"/.exec(cellAttrs)?.[1];
        if (!ref) continue;

        const styleId = /\bs="(\d+)"/.exec(cellAttrs)?.[1];
        if (styleId && estilosAmarillos.has(styleId)) {
          resaltadoAmarillo = true;
        }

        const cellType = /\bt="([^"]+)"/.exec(cellAttrs)?.[1];
        const rawV = /<v>([\s\S]*?)<\/v>/.exec(cellBody)?.[1] ?? '';
        let valor = '';
        if (cellType === 's' && rawV !== '') {
          valor = sharedStrings[Number(rawV)] ?? '';
        } else if (cellType === 'inlineStr') {
          valor = decodificarEntidadesXml(
            /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(cellBody)?.[1] ?? '',
          );
        } else {
          valor = decodificarEntidadesXml(rawV);
        }

        if (valor.trim()) {
          columnas[ref] = valor.trim();
        }
      }

      if (Object.keys(columnas).length > 0) {
        const filaObj: FilaHojaCruda = {
          numeroFila,
          columnas,
        };
        if (resaltadoAmarillo) {
          filaObj.resaltadoAmarillo = true;
        }
        if (numHoja === 1 && comentariosHoja1.has(numeroFila)) {
          filaObj.comentarioExcel = comentariosHoja1.get(numeroFila);
        }
        filas.push(filaObj);
      }
    }

    hojas.push({ nombre, filas });
  }

  return hojas;
}

function main(): void {
  const argv = process.argv.slice(2);
  const idxInput = argv.indexOf('--input');
  const idxOutput = argv.indexOf('--output');

  const rutaInput =
    idxInput !== -1 && argv[idxInput + 1]
      ? resolve(argv[idxInput + 1] ?? '')
      : resolve(
          import.meta.dirname,
          '../../../data/lexicon/sources/diccionario-campo-namtrik-castellano.xlsm',
        );

  const rutaOutput =
    idxOutput !== -1 && argv[idxOutput + 1]
      ? resolve(argv[idxOutput + 1] ?? '')
      : resolve(import.meta.dirname, '../../../data/lexicon/v1/lexico.yaml');

  const buffer = readFileSync(rutaInput);
  const entradasZip = leerEntradasZip(buffer);
  const hojas = parsearHojasDesdeZip(entradasZip);

  const { lexico, cambiosOrtograficos } = extraerLexicoDeHojas(hojas);
  const validado = lexicoSchema.parse(lexico);

  mkdirSync(dirname(rutaOutput), { recursive: true });
  const yamlContenido =
    '# Léxico del diccionario Misak — versión 1\n' +
    '# Fuente: diccionario-campo-namtrik-castellano.xlsm (equipo lingüístico).\n' +
    '# Modelo Sentido + Formas (Spec 005): cada sentido agrupa 1..N formas namtrik y su ubicación multinivel.\n' +
    stringify(validado, { lineWidth: 110 });

  writeFileSync(rutaOutput, yamlContenido, 'utf8');

  const totalFormas = validado.sentidos.reduce((acc, s) => acc + s.formas.length, 0);
  const totalDialogicos = validado.sentidos.filter((s) => s.tipo === 'dialogico').length;
  const totalConContextoNamtrik = validado.sentidos.filter((s) => s.namtrikContexto).length;
  const totalConCientifico = validado.sentidos.filter((s) => s.nombreCientifico).length;
  const totalConObservacion = validado.sentidos.filter((s) => s.observacionEditorial).length;

  console.log('\nExtracción léxica completada:');
  console.log(`  archivo generado: ${rutaOutput}`);
  console.log(`  descripciones de nodos taxonómicos: ${validado.descripcionesNodos.length}`);
  console.log(
    `  sentidos léxicos totales: ${validado.sentidos.length} (estándar: ${validado.sentidos.length - totalDialogicos} · dialógicos: ${totalDialogicos})`,
  );
  console.log(`  formas namtrik totales: ${totalFormas}`);
  console.log(`  sentidos con contexto en namtrik (Col B): ${totalConContextoNamtrik}`);
  console.log(`  sentidos con nombre científico: ${totalConCientifico}`);
  console.log(
    `  duplicados exactos consecutivos colapsados: ${validado.fuente.duplicadosColapsados}`,
  );
  console.log(`  entradas con observación editorial (amarillo/comentario): ${totalConObservacion}`);
  console.log(`  ajustes ortográficos a vocal ɵ: ${cambiosOrtograficos}`);
}

main();
