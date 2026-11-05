/**
 * Search Ranking Misak Integration Tests (T-015)
 * Spec 009 — Enmienda 0.2.0: Validación de búsqueda bilingüe vectorizada multi-nivel
 * contra la base de datos PostgreSQL real (localhost:5434/misak_dictionary).
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../generated/prisma/client.js';
import { PalabraRepository } from '../infrastructure/repositories/PalabraRepository.js';

const dbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test')
    ? process.env.DATABASE_URL
    : 'postgresql://misak:change-me-strong-password@localhost:5434/misak_dictionary?schema=public');

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

describe('Search Ranking Misak (PostgreSQL Real Integration)', () => {
  let repository: PalabraRepository;

  beforeAll(async () => {
    repository = new PalabraRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('búsqueda exacta en Namtrik "waara" posiciona en el top a Vaca y Saltamontes con nivel 1', async () => {
    const result = await repository.searchModelo1({ query: 'waara', limit: 10 });

    expect(result.data.length).toBeGreaterThanOrEqual(2);

    const codigosTop = [result.data[0]?.codigo, result.data[1]?.codigo];
    expect(codigosTop).toContain('C2.S5.E002'); // Vaca
    expect(codigosTop).toContain('C4.S5.E035'); // Saltamontes, langosta

    expect(result.data[0]?.coincidencia).toBe('exacta');
    expect(result.data[1]?.coincidencia).toBe('exacta');
  });

  it('búsqueda exacta en Castellano "vaca" posiciona de primero a C2.S5.E002 (Vaca)', async () => {
    const result = await repository.searchModelo1({ query: 'vaca', limit: 10 });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    const primerResultado = result.data[0];

    expect(primerResultado?.codigo).toBe('C2.S5.E002');
    expect(primerResultado?.namtrikTermino).toContain('Waara');
    expect(primerResultado?.espanolTermino).toContain('Vaca');
    expect(primerResultado?.coincidencia).toBe('exacta');
  });

  it('normalización armónica de grafemas: kɵsak, køsak, k∅sak y kosak devuelven idéntico primer resultado', async () => {
    const [resTheta, resSlash, resEmpty, resLatin] = await Promise.all([
      repository.searchModelo1({ query: 'kɵsak', limit: 5 }),
      repository.searchModelo1({ query: 'køsak', limit: 5 }),
      repository.searchModelo1({ query: 'k∅sak', limit: 5 }),
      repository.searchModelo1({ query: 'kosak', limit: 5 }),
    ]);

    expect(resTheta.data.length).toBeGreaterThan(0);
    expect(resSlash.data.length).toBeGreaterThan(0);
    expect(resEmpty.data.length).toBeGreaterThan(0);
    expect(resLatin.data.length).toBeGreaterThan(0);

    const topIdTheta = resTheta.data[0]?.id;
    const topIdSlash = resSlash.data[0]?.id;
    const topIdEmpty = resEmpty.data[0]?.id;
    const topIdLatin = resLatin.data[0]?.id;

    expect(topIdSlash).toEqual(topIdTheta);
    expect(topIdEmpty).toEqual(topIdTheta);
    expect(topIdLatin).toEqual(topIdTheta);
  });

  it('función SQL misak_sort_key implementa fielmente el orden cultural del alfabeto Misak', async () => {
    const sortKeys = await prisma.$queryRaw<Array<{ lema: string; key: string }>>`
      SELECT lema, public.misak_sort_key(lema) AS key
      FROM (VALUES ('Mɵrɵpik'), ('Waara'), ('Trik'), ('Kɵsak')) AS t(lema)
      ORDER BY key ASC;
    `;

    // Orden alfabético Misak oficial (macro VBA): M (01), W (02), TR (03), SR (04), I (05), K (06)...
    expect(sortKeys[0]?.lema).toBe('Mɵrɵpik');
    expect(sortKeys[1]?.lema).toBe('Waara');
    expect(sortKeys[2]?.lema).toBe('Trik');
    expect(sortKeys[3]?.lema).toBe('Kɵsak');
  });

  it('soporta búsqueda de monografema "ú" y "u" devolviendo "Ú" (Flor) en primer lugar con coincidencia exacta', async () => {
    const [resTilde, resPlain] = await Promise.all([
      repository.searchModelo1({ query: 'ú', limit: 10 }),
      repository.searchModelo1({ query: 'u', limit: 10 }),
    ]);

    expect(resTilde.data.length).toBeGreaterThanOrEqual(1);
    expect(resPlain.data.length).toBeGreaterThanOrEqual(1);

    expect(resTilde.data[0]?.namtrikTermino).toBe('Ú');
    expect(resTilde.data[0]?.espanolTermino).toContain('Flor');
    expect(resTilde.data[0]?.coincidencia).toBe('exacta');
    expect(resTilde.data[0]?.campoCoincidencia).toBe('lema');

    expect(resPlain.data[0]?.id).toEqual(resTilde.data[0]?.id);
    expect(resPlain.data[0]?.namtrikTermino).toBe('Ú');
    expect(resPlain.data[0]?.coincidencia).toBe('exacta');
    expect(resPlain.data[0]?.campoCoincidencia).toBe('lema');
  });

  it('búsqueda de "estrella" posiciona primero a Kɵnchapik (nivel 5, glosa) antes que coincidencias en explicación (nivel 7)', async () => {
    const result = await repository.searchModelo1({ query: 'estrella', limit: 10 });

    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.data[0]?.namtrikTermino).toContain('Kɵnchapik');
    expect(result.data[0]?.espanolTermino).toContain('Representación de la estrella');
    expect(result.data[0]?.campoCoincidencia).toBe('glosa');

    const explicacionMatch = result.data.find((r) => r.campoCoincidencia === 'explicacion');
    expect(explicacionMatch).toBeDefined();
    expect(explicacionMatch?.extractoCoincidencia?.toLowerCase()).toContain('estrella');
  });

  it('búsqueda de "mundo" prioriza coincidencias en glosa (Kɵrɵishik, Munásrɵ?) y etiqueta con extracto las coincidencias en explicación', async () => {
    const result = await repository.searchModelo1({ query: 'mundo', limit: 10 });

    expect(result.data.length).toBeGreaterThanOrEqual(3);

    const topTwoLemas = [result.data[0]?.namtrikTermino, result.data[1]?.namtrikTermino];
    expect(topTwoLemas).toContain('Kɵrɵishik');
    expect(topTwoLemas).toContain('Munásrɵ?');
    expect(result.data[0]?.campoCoincidencia).toBe('glosa');
    expect(result.data[1]?.campoCoincidencia).toBe('glosa');

    const explicacionMatches = result.data.filter((r) => r.campoCoincidencia === 'explicacion');
    expect(explicacionMatches.length).toBeGreaterThanOrEqual(1);
    for (const item of explicacionMatches) {
      expect(item.extractoCoincidencia).toBeTruthy();
      expect(item.extractoCoincidencia?.toLowerCase()).toContain('mundo');
    }
  });

  it('escapa metacaracteres POSIX ERE en consultas como "pura(" y "Munásrɵ?" sin lanzar error SQL', async () => {
    await expect(repository.searchModelo1({ query: 'pura(', limit: 5 })).resolves.toBeDefined();
    const resMunasro = await repository.searchModelo1({ query: 'Munásrɵ?', limit: 5 });
    expect(resMunasro.data.length).toBeGreaterThanOrEqual(1);
    expect(resMunasro.data[0]?.namtrikTermino).toBe('Munásrɵ?');
  });
});
