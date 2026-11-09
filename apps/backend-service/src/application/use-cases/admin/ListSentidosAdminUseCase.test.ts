import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { ListSentidosAdminUseCase } from './ListSentidosAdminUseCase.js';

describe('ListSentidosAdminUseCase', () => {
  let mockPrisma: any;
  let useCase: ListSentidosAdminUseCase;

  beforeEach(() => {
    mockPrisma = {
      sentidoLexico: {
        findMany: vi.fn(),
      },
      campoSemantico: {
        findFirst: vi.fn(),
      },
      subcampoSemantico: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      microcampo: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };
    useCase = new ListSentidosAdminUseCase(mockPrisma as unknown as PrismaClient);
  });

  it('lista sentidos con valores por defecto y mapea campos correctamente', async () => {
    const mockSentidos = [
      {
        id: 10n,
        codigo: 'C1.S1.M1.E001',
        tipo: 'estandar',
        estado: 'borrador',
        version: 1,
        espanolGlosa: 'montaña grande',
        espanolExplicacion: 'elevación de tierra',
        namtrikContexto: 'kusreik',
        nombreCientifico: null,
        observacionEditorial: 'pendiente audio',
        respuestaNamtrik: null,
        respuestaNamtrikContexto: null,
        respuestaEspanolGlosa: null,
        respuestaEspanolExplicacion: null,
        formas: [
          {
            id: 1n,
            orden: 1,
            lema: 'pish',
            acepcionHomonima: null,
            categoriaGramatical: 'sustantivo',
            variante: null,
            esNeologismo: false,
            rasgosGramaticales: ['singular'],
            etiquetaOriginal: null,
          },
        ],
        ubicaciones: [
          {
            campo: null,
            subcampo: null,
            microcampo: { id: 5n, codigo: 'C1.S1.M1', espanolTermino: 'Territorio' },
          },
        ],
        ultimoEditor: { id: 2n, username: 'editor1' },
        ultimoEditorAt: new Date('2026-10-15T10:00:00Z'),
        ratificadoPorUser: null,
        ratificadoAt: null,
        createdAt: new Date('2026-10-15T09:00:00Z'),
        updatedAt: new Date('2026-10-15T10:00:00Z'),
      },
    ];

    mockPrisma.sentidoLexico.findMany.mockResolvedValue(mockSentidos);

    const result = await useCase.execute({});

    expect(mockPrisma.sentidoLexico.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: expect.any(Object),
      orderBy: { id: 'desc' },
      take: 21,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: '10',
      codigo: 'C1.S1.M1.E001',
      estado: 'borrador',
      espanolGlosa: 'montaña grande',
      formas: [
        {
          id: '1',
          lema: 'pish',
          categoriaGramatical: 'sustantivo',
        },
      ],
      ubicacion: {
        nivel: 'microcampo',
        id: '5',
        codigo: 'C1.S1.M1',
        termino: 'Territorio',
      },
      ultimoEditor: {
        id: '2',
        username: 'editor1',
      },
    });
    expect(result.nextCursor).toBeNull();
  });

  it('calcula nextCursor cuando hay más elementos que el límite', async () => {
    const mockSentidos = [
      {
        id: 20n,
        codigo: 'C1.S1.M1.E002',
        tipo: 'estandar',
        estado: 'ratificado',
        version: 2,
        espanolGlosa: 'río',
        espanolExplicacion: null,
        namtrikContexto: null,
        nombreCientifico: null,
        observacionEditorial: null,
        respuestaNamtrik: null,
        respuestaNamtrikContexto: null,
        respuestaEspanolGlosa: null,
        respuestaEspanolExplicacion: null,
        formas: [],
        ubicaciones: [],
        ultimoEditor: null,
        ultimoEditorAt: null,
        ratificadoPorUser: null,
        ratificadoAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 19n,
        codigo: 'C1.S1.M1.E001',
        tipo: 'estandar',
        estado: 'ratificado',
        version: 1,
        espanolGlosa: 'agua',
        espanolExplicacion: null,
        namtrikContexto: null,
        nombreCientifico: null,
        observacionEditorial: null,
        respuestaNamtrik: null,
        respuestaNamtrikContexto: null,
        respuestaEspanolGlosa: null,
        respuestaEspanolExplicacion: null,
        formas: [],
        ubicaciones: [],
        ultimoEditor: null,
        ultimoEditorAt: null,
        ratificadoPorUser: null,
        ratificadoAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockPrisma.sentidoLexico.findMany.mockResolvedValue(mockSentidos);

    const result = await useCase.execute({ limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('20');
    expect(result.nextCursor).toBe('20');
  });

  it('filtra por estado, tipo y búsqueda de texto q', async () => {
    mockPrisma.sentidoLexico.findMany.mockResolvedValue([]);

    await useCase.execute({
      estado: 'borrador',
      tipo: 'dialogico',
      q: 'namtrik',
    });

    expect(mockPrisma.sentidoLexico.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        estado: 'borrador',
        tipo: 'dialogico',
        OR: [
          { espanolGlosa: { contains: 'namtrik', mode: 'insensitive' } },
          { formas: { some: { lema: { contains: 'namtrik', mode: 'insensitive' } } } },
          { nombreCientifico: { contains: 'namtrik', mode: 'insensitive' } },
        ],
      },
      include: expect.any(Object),
      orderBy: { id: 'desc' },
      take: 21,
    });
  });

  it('resuelve filtro recursivo por nodo de tipo Campo', async () => {
    mockPrisma.campoSemantico.findFirst.mockResolvedValue({ id: 1n });
    mockPrisma.subcampoSemantico.findMany.mockResolvedValue([{ id: 10n }, { id: 11n }]);
    mockPrisma.microcampo.findMany.mockResolvedValue([{ id: 100n }, { id: 101n }]);
    mockPrisma.sentidoLexico.findMany.mockResolvedValue([]);

    await useCase.execute({ nodo: 'C1' });

    expect(mockPrisma.campoSemantico.findFirst).toHaveBeenCalledWith({
      where: { codigo: 'C1', deletedAt: null },
      select: { id: true },
    });

    expect(mockPrisma.sentidoLexico.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ubicaciones: {
            some: {
              OR: [
                { campoSemanticoId: 1n },
                { subcampoSemanticoId: { in: [10n, 11n] } },
                { microcampoId: { in: [100n, 101n] } },
              ],
            },
          },
        }),
      }),
    );
  });

  it('devuelve lista vacía si el nodo no existe', async () => {
    mockPrisma.campoSemantico.findFirst.mockResolvedValue(null);
    mockPrisma.subcampoSemantico.findFirst.mockResolvedValue(null);
    mockPrisma.microcampo.findFirst.mockResolvedValue(null);

    const result = await useCase.execute({ nodo: 'INEXISTENTE' });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
    expect(mockPrisma.sentidoLexico.findMany).not.toHaveBeenCalled();
  });
});
