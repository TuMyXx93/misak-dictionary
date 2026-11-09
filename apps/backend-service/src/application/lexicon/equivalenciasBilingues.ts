/**
 * Equivalencias Bilingües — Servicio de Extracción y Sincronización
 * Spec 012 / ADR-0008: Matriz de Equivalencias Bilingüe (Namtrik ↔ Castellano)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { normalizeNamtrikEsQuery } from '../../infrastructure/repositories/PalabraRepository.js';

export type TipoRelacionEquivalencia =
  | 'glosa_directa'
  | 'sub_acepcion'
  | 'nucleo_nominal'
  | 'raiz_morfologica'
  | 'sinonimo_es'
  | 'hiperonimo'
  | 'afinidad_cultural';

export interface ExtractedEquivalencia {
  sentidoId?: bigint | undefined;
  codigo?: string | undefined;
  terminoEs: string;
  terminoNamtrik?: string | null | undefined;
  tipoRelacion: TipoRelacionEquivalencia;
  peso: number;
  origen: 'corpus_v1' | 'derivacion_morfologica' | 'curaduria_linguistica';
  ratificado: boolean;
}

export interface CuratedYamlEntry {
  codigo: string;
  sentidoLema?: string;
  terminoEs: string;
  terminoNamtrik?: string;
  tipoRelacion: TipoRelacionEquivalencia;
  peso?: number;
  origen?: 'corpus_v1' | 'derivacion_morfologica' | 'curaduria_linguistica';
  ratificado?: boolean;
}

export interface CuratedYamlManifest {
  version: string;
  equivalencias: CuratedYamlEntry[];
}

const STOPWORDS_ES = new Set([
  'de',
  'la',
  'el',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'y',
  'o',
  'en',
  'por',
  'para',
  'con',
  'sin',
  'del',
  'al',
  'que',
  'se',
]);

/**
 * Extrae la cabeza de glosa en español (término primario antes de aclaraciones o puntuación).
 */
export function extractGlosaCabeza(glosa: string | null | undefined): string {
  if (!glosa) return '';
  const preParen = glosa.split('(')[0] ?? '';
  const firstToken = preParen.split(/[,;:]/)[0] ?? '';
  return firstToken.trim();
}

/**
 * Extrae de forma pura y determinista las equivalencias asociadas a un sentido léxico.
 */
export function extractEquivalenciasFromSentido(sentido: {
  id?: bigint;
  codigo?: string;
  espanolGlosa: string;
  formas?: Array<{ lema: string; orden?: number }>;
}): ExtractedEquivalencia[] {
  const results: ExtractedEquivalencia[] = [];
  const seen = new Set<string>();

  const primaryLema =
    sentido.formas && sentido.formas.length > 0
      ? ([...sentido.formas].sort((a, b) => (a.orden ?? 1) - (b.orden ?? 1))[0]?.lema ?? null)
      : null;

  const addEquiv = (
    terminoEs: string,
    tipoRelacion: TipoRelacionEquivalencia,
    peso: number,
    origen: 'corpus_v1' | 'derivacion_morfologica' | 'curaduria_linguistica' = 'corpus_v1',
    terminoNamtrik: string | null = primaryLema,
  ) => {
    const cleanTerm = terminoEs.replace(/[().,;:]/g, '').trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    if (STOPWORDS_ES.has(cleanTerm.toLowerCase())) return;

    const key = `${normalizeNamtrikEsQuery(cleanTerm)}|${tipoRelacion}`;
    if (seen.has(key)) return;
    seen.add(key);

    results.push({
      sentidoId: sentido.id,
      codigo: sentido.codigo,
      terminoEs: cleanTerm,
      terminoNamtrik,
      tipoRelacion,
      peso,
      origen,
      ratificado: true,
    });
  };

  const fullGlosa = sentido.espanolGlosa?.trim() ?? '';
  if (!fullGlosa) return results;

  // 1. Cabeza de glosa directa
  const cabeza = extractGlosaCabeza(fullGlosa);
  if (cabeza) {
    addEquiv(cabeza, 'glosa_directa', 1.0, 'corpus_v1');
  }

  // 2. Sub-acepciones separadas por coma o punto y coma (antes del primer paréntesis)
  const preParen = fullGlosa.split('(')[0] ?? '';
  const tokens = preParen.split(/[,;]/);
  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (token && token.toLowerCase() !== cabeza.toLowerCase()) {
      addEquiv(token, 'sub_acepcion', 0.95, 'corpus_v1');
    }
  }

  // 3. Extracción de núcleos nominales de locuciones descriptivas
  // "Representación de la/del <X>" -> "<X>"
  const matchRep = fullGlosa.match(
    /^representaci[oó]n\s+de\s+(?:la\s+|el\s+|los\s+|las\s+|del\s+)?([^.,;()]+)/i,
  );
  if (matchRep?.[1]) {
    addEquiv(matchRep[1].trim(), 'nucleo_nominal', 0.95, 'corpus_v1');
  }

  // "Nuestro/a <X>" -> "<X>"
  const matchNuestro = fullGlosa.match(/^nuestr[oa]s?\s+([^.,;()]+)/i);
  if (matchNuestro?.[1]) {
    addEquiv(matchNuestro[1].trim(), 'nucleo_nominal', 0.95, 'corpus_v1');
  }

  // "Especie/Tipo de <X>" -> "<X>"
  const matchEspecie = fullGlosa.match(/^(?:especie|tipo)\s+de\s+([^.,;()]+)/i);
  if (matchEspecie?.[1]) {
    addEquiv(matchEspecie[1].trim(), 'nucleo_nominal', 0.92, 'corpus_v1');
  }

  // 4. Raíces morfológicas Namtrik: familia "pura*" ↔ "maíz"
  if (sentido.formas) {
    for (const f of sentido.formas) {
      const normLema = normalizeNamtrikEsQuery(f.lema);
      if (normLema.startsWith('pura')) {
        addEquiv('maíz', 'raiz_morfologica', 0.9, 'derivacion_morfologica', 'Pura');
        break;
      }
    }
  }

  return results;
}

/**
 * Resuelve la ruta canónica del manifiesto YAML curado sin importar el cwd del entorno de ejecución.
 */
export function getDefaultYamlPath(): string {
  const fromMeta = fileURLToPath(
    new URL('../../../../data/lexicon/v1/equivalencias-bilingues.yaml', import.meta.url),
  );
  if (fs.existsSync(fromMeta)) return fromMeta;

  const candidateCwd1 = path.resolve(process.cwd(), 'data/lexicon/v1/equivalencias-bilingues.yaml');
  if (fs.existsSync(candidateCwd1)) return candidateCwd1;

  const candidateCwd2 = path.resolve(
    process.cwd(),
    '../data/lexicon/v1/equivalencias-bilingues.yaml',
  );
  if (fs.existsSync(candidateCwd2)) return candidateCwd2;

  const candidateCwd3 = path.resolve(
    process.cwd(),
    '../../data/lexicon/v1/equivalencias-bilingues.yaml',
  );
  if (fs.existsSync(candidateCwd3)) return candidateCwd3;

  return fromMeta;
}

/**
 * Carga el manifiesto curado de equivalencias bilingües YAML.
 */
export function loadCuratedYamlManifest(yamlPath: string): CuratedYamlManifest {
  const content = fs.readFileSync(yamlPath, 'utf-8');
  return YAML.parse(content) as CuratedYamlManifest;
}

/**
 * Sincroniza la matriz de equivalencias bilingües en PostgreSQL de forma idempotente.
 */
export async function syncEquivalenciasBilingues(
  prisma: PrismaClient,
  yamlPath = getDefaultYamlPath(),
): Promise<{ totalSentidos: number; totalEquivalencias: number }> {
  // 1. Obtener todos los sentidos activos con sus formas
  const sentidos = await prisma.sentidoLexico.findMany({
    where: { deletedAt: null },
    include: {
      formas: {
        orderBy: { orden: 'asc' },
      },
    },
  });

  const sentidoByCodigo = new Map(sentidos.map((s) => [s.codigo, s]));

  // 2. Extraer equivalencias automáticas
  const toUpsert: ExtractedEquivalencia[] = [];
  for (const s of sentidos) {
    const extracted = extractEquivalenciasFromSentido(s);
    toUpsert.push(...extracted);
  }

  // 3. Incorporar equivalencias curadas del YAML si el archivo existe
  if (fs.existsSync(yamlPath)) {
    const manifest = loadCuratedYamlManifest(yamlPath);
    for (const entry of manifest.equivalencias ?? []) {
      const targetSentido = sentidoByCodigo.get(entry.codigo);
      if (targetSentido) {
        toUpsert.push({
          sentidoId: targetSentido.id,
          codigo: entry.codigo,
          terminoEs: entry.terminoEs,
          terminoNamtrik: entry.terminoNamtrik ?? targetSentido.formas[0]?.lema ?? null,
          tipoRelacion: entry.tipoRelacion,
          peso: entry.peso ?? 1.0,
          origen: entry.origen ?? 'curaduria_linguistica',
          ratificado: entry.ratificado ?? true,
        });
      }
    }
  }

  // 4. Upsert idempotente en base de datos
  for (const eq of toUpsert) {
    const sentidoId = eq.sentidoId;
    if (!sentidoId) continue;
    const terminoNamtrik = eq.terminoNamtrik ?? null;
    await prisma.equivalenciaBilingue.upsert({
      where: {
        sentidoId_terminoEs_tipoRelacion: {
          sentidoId,
          terminoEs: eq.terminoEs,
          tipoRelacion: eq.tipoRelacion,
        },
      },
      create: {
        sentidoId,
        terminoEs: eq.terminoEs,
        terminoNamtrik,
        tipoRelacion: eq.tipoRelacion,
        peso: eq.peso,
        origen: eq.origen,
        ratificado: eq.ratificado,
      },
      update: {
        terminoNamtrik,
        peso: eq.peso,
        origen: eq.origen,
        ratificado: eq.ratificado,
      },
    });
  }

  const totalCount = await prisma.equivalenciaBilingue.count();
  return {
    totalSentidos: sentidos.length,
    totalEquivalencias: totalCount,
  };
}
