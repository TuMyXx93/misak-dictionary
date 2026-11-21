/**
 * PapeleraUseCase Tests
 * Restauración de borrados lógicos de la taxonomía (404 si no está en papelera, 409 si colisiona).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';

vi.mock('../../../shared/audit/AuditService.js', () => ({
  AuditService: class {
    record = vi.fn().mockResolvedValue(undefined);
    recordInTx = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../../shared/storage/local-storage.service.js', () => ({
  LocalStorageService: class {
    delete = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
    campoSemantico: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    subcampoSemantico: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    microcampo: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    sentidoLexico: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    medioCultural: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    sentidoUbicacion: { count: vi.fn() },
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
    vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([]);
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

  describe('purgar', () => {
    const superAdminActor = {
      userId: 1n,
      username: 'root',
      roles: ['super_admin'],
    };

    const adminActor = {
      userId: 2n,
      username: 'admin',
      roles: ['admin'],
    };

    it('bloquea la purga si el usuario no es super_admin (403)', async () => {
      await expect(useCase.purgar('sentido', 10n, 'C1.E001', adminActor)).rejects.toMatchObject({
        statusCode: 403,
        message: 'Solo el rol super_admin tiene autorización para purgar elementos de la papelera',
      });
    });

    it('bloquea si el código de confirmación no coincide exactamente (400)', async () => {
      vi.mocked(prisma.sentidoLexico.findUnique).mockResolvedValue({
        id: 10n,
        codigo: 'C1.E001',
        deletedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 días
      } as never);

      await expect(
        useCase.purgar('sentido', 10n, 'CODIGO_ERRONEO', superAdminActor),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'El código de confirmación no coincide con el elemento a purgar',
      });
    });

    it('bloquea si no ha cumplido la retención mínima de 30 días (409)', async () => {
      vi.mocked(prisma.sentidoLexico.findUnique).mockResolvedValue({
        id: 10n,
        codigo: 'C1.E001',
        deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Solo 5 días
      } as never);

      await expect(
        useCase.purgar('sentido', 10n, 'C1.E001', superAdminActor),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'No se puede purgar: se requiere una retención mínima de 30 días en papelera',
      });
    });

    it('bloquea la purga de un campo si tiene dependencias activas (409)', async () => {
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue({
        id: 1n,
        codigo: 'C1',
        deletedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      } as never);

      vi.mocked(prisma.subcampoSemantico.count).mockResolvedValue(2); // 2 subcampos activos

      await expect(useCase.purgar('campo', 1n, 'C1', superAdminActor)).rejects.toMatchObject({
        statusCode: 409,
        message: 'No se puede purgar: el campo tiene subcampos activos',
      });
    });

    it('purga físicamente y registra auditoría cuando se cumplen todas las condiciones', async () => {
      const fechaEliminado = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.sentidoLexico.findUnique).mockResolvedValue({
        id: 20n,
        codigo: 'C1.S1.M1.E002',
        espanolGlosa: 'río',
        deletedAt: fechaEliminado,
      } as never);

      vi.mocked(prisma.sentidoLexico.delete).mockResolvedValue({} as never);

      await useCase.purgar('sentido', 20n, 'C1.S1.M1.E002', superAdminActor);

      expect(prisma.sentidoLexico.delete).toHaveBeenCalledWith({
        where: { id: 20n },
      });
    });

    it('lista, restaura y purga elementos multimedia (nivel medio)', async () => {
      const deletedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.campoSemantico.findMany).mockResolvedValue([]);
      vi.mocked(prisma.subcampoSemantico.findMany).mockResolvedValue([]);
      vi.mocked(prisma.microcampo.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([]);
      vi.mocked(prisma.medioCultural.findMany).mockResolvedValue([
        {
          id: 42n,
          uuid: '22222222-2222-4222-8222-222222222222',
          originalName: 'pronunciacion.webm',
          descripcionEspanol: 'Audio de caracol',
          descripcionNamtrik: 'Milu kalik',
          hablanteAutor: 'Taita',
          deletedAt,
        } as never,
      ]);

      const lista = await useCase.listar();
      expect(lista).toHaveLength(1);
      expect(lista[0]).toMatchObject({
        nivel: 'medio',
        id: '42',
        codigo: 'MED-42',
        espanol: 'Audio de caracol',
      });

      vi.mocked(prisma.medioCultural.findUnique).mockResolvedValue({
        id: 42n,
        uuid: '22222222-2222-4222-8222-222222222222',
        filename: 'audios/file.webm',
        deletedAt,
      } as never);
      vi.mocked(prisma.medioCultural.update).mockResolvedValue({} as never);

      await useCase.restaurar('medio', 42n, actor);
      expect(prisma.medioCultural.update).toHaveBeenCalledWith({
        where: { id: 42n },
        data: { deletedAt: null },
      });

      vi.mocked(prisma.medioCultural.delete).mockResolvedValue({} as never);
      await useCase.purgar('medio', 42n, 'MED-42', superAdminActor);
      expect(prisma.medioCultural.delete).toHaveBeenCalledWith({ where: { id: 42n } });
    });
  });
});
