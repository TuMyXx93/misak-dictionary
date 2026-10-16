/**
 * PapeleraUseCase Tests
 * Restauración de borrados lógicos de la taxonomía (404 si no está en papelera, 409 si colisiona).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';

vi.mock('../../../shared/audit/AuditService.js', () => ({
  AuditService: class {
    record = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    campoSemantico: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    subcampoSemantico: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    microcampo: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { PapeleraUseCase } from './PapeleraUseCase.js';

const actor = { userId: 1n, username: 'moderador' };

describe('PapeleraUseCase', () => {
  let useCase: PapeleraUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new PapeleraUseCase();
  });

  it('restaura un campo borrado y devuelve sin error', async () => {
    vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue({
      id: 8n,
      deletedAt: new Date('2026-10-01'),
    } as never);
    vi.mocked(prisma.campoSemantico.update).mockResolvedValue({} as never);

    await expect(useCase.restaurar('campo', 8n, actor)).resolves.toBeUndefined();

    expect(prisma.campoSemantico.update).toHaveBeenCalledWith({
      where: { id: 8n },
      data: { deletedAt: null },
    });
  });

  it('rechaza con 404 un elemento que no está en la papelera', async () => {
    vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue({
      id: 3n,
      deletedAt: null,
    } as never);

    await expect(useCase.restaurar('subcampo', 3n, actor)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.subcampoSemantico.update).not.toHaveBeenCalled();
  });

  it('convierte una colisión única (P2002) en 409 sin dejar la fila a medias', async () => {
    vi.mocked(prisma.microcampo.findUnique).mockResolvedValue({
      id: 9n,
      deletedAt: new Date(),
    } as never);
    vi.mocked(prisma.microcampo.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const error = await useCase.restaurar('microcampo', 9n, actor).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
  });

  it('lista campos, subcampos y microcampos borrados ordenados por fecha', async () => {
    vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([
      {
        id: 1n,
        codigo: 'C1',
        namtrikTermino: 'Ya',
        espanolTermino: 'La casa',
        deletedAt: new Date('2026-10-01'),
      },
    ] as never);
    vi.mocked(prisma.subcampoSemantico.findMany).mockResolvedValue([]);
    vi.mocked(prisma.microcampo.findMany).mockResolvedValue([
      {
        id: 2n,
        codigo: 'C1.S1.M1',
        namtrikTermino: null,
        espanolTermino: 'Fogón',
        deletedAt: new Date('2026-10-10'),
      },
    ] as never);

    const elementos = await useCase.listar();

    expect(elementos.map((e) => [e.nivel, e.codigo, e.id])).toEqual([
      ['microcampo', 'C1.S1.M1', '2'],
      ['campo', 'C1', '1'],
    ]);
  });
});
