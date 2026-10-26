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
});
