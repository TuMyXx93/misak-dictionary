/**
 * Editorial Governance Integration Tests (T-028)
 * Spec 006 (R-007, R-010, R-017, R-025)
 *
 * Verifica contra PostgreSQL real:
 * 1. Invariante DDL de PostgreSQL: CHECK ((estado = 'ratificado') = (ratificado_at IS NOT NULL))
 * 2. Control de concurrencia optimista por version (R-007)
 * 3. Atomicidad todo-o-nada en ratificación por lote (R-025)
 * 4. Reglas de purga física: retención mínima >= 30 días y dependencias (R-017)
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '../generated/prisma/client.js';

const raizBackend = resolve(import.meta.dirname, '../..');

const describeIntegration = process.env.RUN_INTEGRATION ? describe : describe.skip;

describeIntegration('Editorial Governance (PostgreSQL Integration)', () => {
  let contenedor: StartedPostgreSqlContainer | undefined;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Si no hay DATABASE_URL configurada para test, usar Testcontainers
    if (!process.env.TEST_DATABASE_URL) {
      contenedor = await new PostgreSqlContainer('pgvector/pgvector:pg18').start();
      process.env.DATABASE_URL = contenedor.getConnectionUri();
    } else {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    }

    execSync('npx prisma migrate deploy', {
      cwd: raizBackend,
      env: { ...process.env },
      stdio: 'pipe',
    });

    const prismaModulo = await import('../shared/config/prisma.js');
    prisma = prismaModulo.prisma;
  }, 240_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await contenedor?.stop();
  });

  it('invariante DDL: rechaza sentidos ratificados con ratificado_at nulo', async () => {
    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO sentidos_lexicos (
          id, codigo, estado, ratificado_at, version, created_at, updated_at
        ) VALUES (
          999991, 'C1.E991', 'ratificado', NULL, 1, NOW(), NOW()
        );
      `),
    ).rejects.toThrow();
  });

  it('invariante DDL: rechaza sentidos borrador con ratificado_at no nulo', async () => {
    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO sentidos_lexicos (
          id, codigo, estado, ratificado_at, version, created_at, updated_at
        ) VALUES (
          999992, 'C1.E992', 'borrador', NOW(), 1, NOW(), NOW()
        );
      `),
    ).rejects.toThrow();
  });

  it('concurrencia optimista: dos updates simultáneos con version=1 causan 409 en el segundo', async () => {
    const { UpdateSentidoUseCase } = await import(
      '../application/use-cases/admin/UpdateSentidoUseCase.js'
    );
    const updateUseCase = new UpdateSentidoUseCase(prisma);

    // Crear sentido inicial
    const sentido = await prisma.sentidoLexico.create({
      data: {
        codigo: 'C1.E993',
        estado: 'borrador',
        version: 1,
        espanolGlosa: 'Glosa inicial',
      },
    });

    const actor1 = { userId: 101n, username: 'editor1' };
    const actor2 = { userId: 102n, username: 'editor2' };

    // Primer update exitoso: avanza a version 2
    const res1 = await updateUseCase.execute(
      sentido.id,
      { version: 1, espanolGlosa: 'Glosa actualizada por editor 1' },
      actor1,
    );
    expect(res1.version).toBe(2);

    // Segundo update con version desactualizada (1): debe lanzar 409
    await expect(
      updateUseCase.execute(
        sentido.id,
        { version: 1, espanolGlosa: 'Glosa por editor 2 desactualizado' },
        actor2,
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('atomicidad del lote: si un sentido está en conflicto, nada se ratifica y no hay auditoría', async () => {
    const { RatificarLoteUseCase } = await import(
      '../application/use-cases/admin/RatificarLoteUseCase.js'
    );
    const loteUseCase = new RatificarLoteUseCase(prisma);

    // Crear campo y microcampo
    const campo = await prisma.campoSemantico.create({
      data: {
        codigo: 'C99',
        espanolTermino: 'Campo de prueba lote',
        namtrikTermino: 'Campo',
        posicion: 99,
        version: 1,
      },
    });

    const microcampo = await prisma.microcampo.create({
      data: {
        codigo: 'C99.M1',
        espanolTermino: 'Microcampo prueba lote',
        namtrikTermino: 'Micro',
        posicion: 1,
        version: 1,
      },
    });

    // Crear dos sentidos en borrador: uno editado por actor1, otro por actor2
    const s1 = await prisma.sentidoLexico.create({
      data: {
        codigo: 'C99.M1.E001',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 201n, // Editado por actor1
        ubicaciones: {
          create: [{ campoSemanticoId: campo.id, microcampoId: microcampo.id, posicion: 1 }],
        },
      },
    });

    const s2 = await prisma.sentidoLexico.create({
      data: {
        codigo: 'C99.M1.E002',
        estado: 'borrador',
        version: 1,
        ultimoEditorId: 202n,
        ubicaciones: {
          create: [{ campoSemanticoId: campo.id, microcampoId: microcampo.id, posicion: 2 }],
        },
      },
    });

    // Intentar ratificar por lote siendo el actor 201 (revisor cultural, NO super_admin)
    // s1 fue editado por 201 -> auto-ratificación prohibida (R-012)
    const reviewerActor = {
      userId: 201n,
      username: 'revisor_cultural',
      roles: ['cultural_reviewer'],
    };

    await expect(
      loteUseCase.execute(
        'microcampo',
        microcampo.id,
        {
          checklist: {
            ortografia: true,
            categorias: true,
            glosas: true,
            cientificos: true,
          },
          snapshot: [
            { id: s1.id.toString(), version: 1 },
            { id: s2.id.toString(), version: 1 },
          ],
        },
        reviewerActor,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    // Verificar que NINGÚN sentido fue ratificado (atomicidad)
    const s1Check = await prisma.sentidoLexico.findUnique({ where: { id: s1.id } });
    const s2Check = await prisma.sentidoLexico.findUnique({ where: { id: s2.id } });
    expect(s1Check?.estado).toBe('borrador');
    expect(s2Check?.estado).toBe('borrador');
  });

  it('purga física: rechaza si retención < 30 días, y permite cuando se cumple el periodo sin dependencias', async () => {
    const { PapeleraUseCase } = await import('../application/use-cases/admin/PapeleraUseCase.js');
    const papeleraUseCase = new PapeleraUseCase(prisma);

    const superAdminActor = {
      userId: 1n,
      username: 'namtrik_super_admin',
      roles: ['super_admin'],
    };

    // Crear un sentido borrado lógicamente hoy (< 30 días)
    const sentidoReciente = await prisma.sentidoLexico.create({
      data: {
        codigo: 'C1.E994',
        estado: 'borrador',
        version: 1,
        deletedAt: new Date(), // Borrado hoy
      },
    });

    // Intento de purga debe fallar por retención mínima
    await expect(
      papeleraUseCase.purgar('sentido', sentidoReciente.id, 'C1.E994', superAdminActor),
    ).rejects.toMatchObject({ statusCode: 409 });

    // Modificar deletedAt a 31 días atrás
    const hace31Dias = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await prisma.sentidoLexico.update({
      where: { id: sentidoReciente.id },
      data: { deletedAt: hace31Dias },
    });

    // Ahora la purga debe tener éxito
    await expect(
      papeleraUseCase.purgar('sentido', sentidoReciente.id, 'C1.E994', superAdminActor),
    ).resolves.toBeUndefined();

    // Comprobar que ya no existe físicamente en la BD
    const existe = await prisma.sentidoLexico.findUnique({ where: { id: sentidoReciente.id } });
    expect(existe).toBeNull();
  });
});
