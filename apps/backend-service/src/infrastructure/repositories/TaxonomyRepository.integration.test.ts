/**
 * @module TaxonomyRepository.integration.test
 * @description Verifica contra PostgreSQL real (Testcontainers) que un lote de
 * taxonomía es atómico: si un nodo falla, ni las filas ni la auditoría quedan escritas.
 * Requiere Docker. Se ejecuta con `pnpm test:integration`.
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AplicacionPlan } from './TaxonomyRepository.js';

const raizBackend = resolve(import.meta.dirname, '../../..');

let contenedor: StartedPostgreSqlContainer | undefined;
let repositorio: import('./TaxonomyRepository.js').TaxonomyRepository;
let prismaCliente: typeof import('../../shared/config/prisma.js').prisma;

function planBase(batchId: string, nodos: AplicacionPlan['nodos']): AplicacionPlan {
  return {
    batchId,
    aprobadoPor: 'prueba de integración',
    fuenteSha256: 'test',
    retirar: false,
    nodos,
    botones: [],
  };
}

function toSlugPrueba(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const campoC1 = {
  accion: 'crear' as const,
  nodo: {
    nivel: 'campo' as const,
    codigo: 'C1',
    padreCodigo: null,
    namtrik: 'Ya',
    espanol: 'La casa',
    descripcion: null,
    slug: 'ya',
    posicion: 1,
  },
};

describe('TaxonomyRepository (integración)', () => {
  beforeAll(async () => {
    contenedor = await new PostgreSqlContainer('pgvector/pgvector:pg18').start();
    process.env['DATABASE_URL'] = contenedor.getConnectionUri();

    execSync('npx prisma migrate deploy', {
      cwd: raizBackend,
      env: { ...process.env },
      stdio: 'pipe',
    });

    const repoModulo = await import('./TaxonomyRepository.js');
    const prismaModulo = await import('../../shared/config/prisma.js');
    repositorio = new repoModulo.TaxonomyRepository();
    prismaCliente = prismaModulo.prisma;
  }, 240_000);

  afterAll(async () => {
    await prismaCliente?.$disconnect();
    await contenedor?.stop();
  });

  it('un lote con un nodo inválido no deja filas ni auditoría (rollback completo)', async () => {
    const batchId = '11111111-1111-4111-8111-111111111111';
    const plan = planBase(batchId, [
      campoC1,
      {
        accion: 'crear',
        nodo: {
          nivel: 'subcampo',
          codigo: 'C1.S1',
          padreCodigo: 'C404',
          namtrik: 'Nakchak',
          espanol: 'Cocina',
          descripcion: null,
          slug: 'nakchak',
          posicion: 1,
        },
      },
    ]);

    await expect(repositorio.aplicar(plan)).rejects.toThrow('padre no encontrado: C404');

    const campos = await prismaCliente.campoSemantico.count({
      where: { codigo: 'C1' },
    });
    const auditorias = await prismaCliente.auditLog.count({
      where: { entityId: batchId },
    });
    expect(campos).toBe(0);
    expect(auditorias).toBe(0);
  });

  it('un lote válido crea los nodos y registra una única auditoría', async () => {
    const batchId = '22222222-2222-4222-8222-222222222222';
    const plan = planBase(batchId, [
      campoC1,
      {
        accion: 'crear',
        nodo: {
          nivel: 'subcampo',
          codigo: 'C1.S1',
          padreCodigo: 'C1',
          namtrik: 'Nakchak',
          espanol: 'Cocina',
          descripcion: null,
          slug: 'nakchak',
          posicion: 1,
        },
      },
    ]);

    const resultado = await repositorio.aplicar(plan);

    expect(resultado.creadas).toBe(2);
    const subcampo = await prismaCliente.subcampoSemantico.findFirst({
      where: { codigo: 'C1.S1', deletedAt: null },
      include: { campoSemantico: { select: { codigo: true } } },
    });
    expect(subcampo?.campoSemantico.codigo).toBe('C1');
    const auditorias = await prismaCliente.auditLog.count({
      where: { entityId: batchId },
    });
    expect(auditorias).toBe(1);
  });
  it('aplica un árbol de subniveles de profundidad arbitraria con el padre en el mismo subcampo', async () => {
    const batchId = '33333333-3333-4333-8333-333333333333';
    const nodo = (
      codigo: string,
      nivel: 'campo' | 'subcampo' | 'microcampo',
      padreCodigo: string | null,
      profundidad: number,
      espanol: string,
    ) => ({
      accion: 'crear' as const,
      nodo: {
        nivel,
        codigo,
        padreCodigo,
        subcampoCodigo: nivel === 'microcampo' ? 'C2.S1' : null,
        profundidad,
        namtrik: null,
        espanol,
        descripcion: null,
        slug: toSlugPrueba(espanol),
        posicion: 1,
      },
    });
    const plan = planBase(batchId, [
      {
        accion: 'crear',
        nodo: {
          ...campoC1.nodo,
          codigo: 'C2',
          namtrik: 'Ya tul',
          slug: 'ya-tul',
          espanol: 'La huerta',
        },
      },
      nodo('C2.S1', 'subcampo', 'C2', 0, 'Terminología agrícola'),
      nodo('C2.S1.M1', 'microcampo', 'C2.S1', 0, 'Plantas'),
      nodo('C2.S1.M1.1', 'microcampo', 'C2.S1.M1', 1, 'Hoja'),
      nodo('C2.S1.M1.1.1', 'microcampo', 'C2.S1.M1.1', 2, 'Borde'),
    ]);

    const resultado = await repositorio.aplicar(plan);

    expect(resultado.creadas).toBe(5);
    const hoja = await prismaCliente.microcampo.findFirst({
      where: { codigo: 'C2.S1.M1.1.1' },
      include: {
        padre: { select: { codigo: true } },
        subcampoSemantico: { select: { codigo: true } },
      },
    });
    expect(hoja?.profundidad).toBe(2);
    expect(hoja?.padre?.codigo).toBe('C2.S1.M1.1');
    expect(hoja?.subcampoSemantico.codigo).toBe('C2.S1');
  });

  it('la base rechaza un hijo cuyo subcampo no coincide con el de su padre', async () => {
    const padre = await prismaCliente.microcampo.findFirstOrThrow({
      where: { codigo: 'C2.S1.M1' },
    });
    const subcampoAjeno = await prismaCliente.subcampoSemantico.findFirstOrThrow({
      where: { codigo: 'C1.S1' },
    });

    await expect(
      prismaCliente.microcampo.create({
        data: {
          codigo: 'C1.S1.M9.1',
          slug: 'intruso',
          espanolTermino: 'Intruso',
          subcampoSemanticoId: subcampoAjeno.id,
          padreId: padre.id,
          profundidad: 1,
        },
      }),
    ).rejects.toThrow();
  });

  it('la base rechaza una profundidad que no sea la del padre + 1', async () => {
    const padre = await prismaCliente.microcampo.findFirstOrThrow({
      where: { codigo: 'C2.S1.M1' },
    });

    await expect(
      prismaCliente.microcampo.create({
        data: {
          codigo: 'C2.S1.M1.9',
          slug: 'profundidad-mala',
          espanolTermino: 'Profundidad mala',
          subcampoSemanticoId: padre.subcampoSemanticoId,
          padreId: padre.id,
          profundidad: 5,
        },
      }),
    ).rejects.toThrow(/inconsistente con el padre/);
  });
});
