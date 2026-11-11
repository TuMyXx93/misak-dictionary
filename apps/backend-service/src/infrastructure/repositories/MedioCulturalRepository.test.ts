import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    medioCultural: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import type { MedioCultural } from '../../domain/entities/MedioCultural.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaMedioCulturalRepository } from './MedioCulturalRepository.js';

describe('PrismaMedioCulturalRepository', () => {
  const mockDb = {
    medioCultural: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };

  let repository: PrismaMedioCulturalRepository;

  const mockMedio: MedioCultural = {
    id: BigInt(10),
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    sentidoId: BigInt(1),
    formaId: BigInt(2),
    campoSemanticoId: null,
    subcampoSemanticoId: null,
    microcampoId: null,
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'audios/123e4567-e89b-12d3-a456-426614174000.mp3',
    originalName: 'pronunciacion_morok.mp3',
    mimetype: 'audio/mpeg',
    sizeBytes: BigInt(102400),
    hashSha256: 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    duracionSegundos: 2.5,
    anchoPx: null,
    altoPx: null,
    posterUuid: null,
    metadata: null,
    estado: 'borrador',
    hablanteAutor: 'Taita Manuel',
    varianteDialectal: 'Guambía Central',
    descripcionEspanol: 'Pronunciación estándar del término mɵrɵk',
    descripcionNamtrik: 'Mɵrɵk wam',
    licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
    subidoPorId: BigInt(5),
    ratificadoPorId: null,
    ratificadoAt: null,
    createdAt: new Date('2026-10-17T00:00:00Z'),
    updatedAt: new Date('2026-10-17T00:00:00Z'),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaMedioCulturalRepository(
      mockDb as unknown as ConstructorParameters<typeof PrismaMedioCulturalRepository>[0],
    );
  });

  it('encuentra medio por UUID', async () => {
    mockDb.medioCultural.findFirst.mockResolvedValue(mockMedio);

    const result = await repository.findByUuid('123e4567-e89b-12d3-a456-426614174000');
    expect(result).toEqual(mockMedio);
    expect(mockDb.medioCultural.findFirst).toHaveBeenCalledWith({
      where: { uuid: '123e4567-e89b-12d3-a456-426614174000', deletedAt: null },
    });
  });

  it('encuentra medio por ID', async () => {
    mockDb.medioCultural.findFirst.mockResolvedValue(mockMedio);

    const result = await repository.findById(BigInt(10));
    expect(result).toEqual(mockMedio);
    expect(mockDb.medioCultural.findFirst).toHaveBeenCalledWith({
      where: { id: BigInt(10), deletedAt: null },
    });
  });

  it('encuentra medio por SHA-256', async () => {
    mockDb.medioCultural.findFirst.mockResolvedValue(mockMedio);

    const result = await repository.findByHash(
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    );
    expect(result).toEqual(mockMedio);
  });

  it('crea un medio cultural en base de datos con estado inicial borrador', async () => {
    mockDb.medioCultural.create.mockResolvedValue(mockMedio);

    const result = await repository.create({
      uuid: mockMedio.uuid,
      sentidoId: mockMedio.sentidoId,
      formaId: mockMedio.formaId,
      tipo: 'audio',
      proposito: 'pronunciacion_lema',
      filename: mockMedio.filename,
      originalName: mockMedio.originalName,
      mimetype: 'audio/mpeg',
      sizeBytes: mockMedio.sizeBytes,
      hashSha256: mockMedio.hashSha256,
      subidoPorId: BigInt(5),
    });

    expect(result).toEqual(mockMedio);
    expect(mockDb.medioCultural.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uuid: mockMedio.uuid,
          estado: 'borrador',
          tipo: 'audio',
        }),
      }),
    );
  });

  it('ratifica un medio cultural actualizando estado a ratificado y registrando fecha', async () => {
    const ratifiedMedio = {
      ...mockMedio,
      estado: 'ratificado',
      ratificadoPorId: BigInt(3),
      ratificadoAt: new Date('2026-10-17T12:00:00Z'),
    };
    mockDb.medioCultural.update.mockResolvedValue(ratifiedMedio);

    const result = await repository.ratify(BigInt(10), BigInt(3));
    expect(result.estado).toBe('ratificado');
    expect(result.ratificadoPorId).toBe(BigInt(3));
    expect(mockDb.medioCultural.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(10) },
        data: expect.objectContaining({
          estado: 'ratificado',
          ratificadoPorId: BigInt(3),
        }),
      }),
    );
  });

  it('actualiza metadatos culturales', async () => {
    const updatedMedio = { ...mockMedio, hablanteAutor: 'Mama Rosa' };
    mockDb.medioCultural.update.mockResolvedValue(updatedMedio);

    const result = await repository.updateMetadata(BigInt(10), {
      hablanteAutor: 'Mama Rosa',
    });

    expect(result.hablanteAutor).toBe('Mama Rosa');
    expect(mockDb.medioCultural.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(10) },
        data: { hablanteAutor: 'Mama Rosa' },
      }),
    );
  });

  it('realiza soft-delete marcando deletedAt', async () => {
    mockDb.medioCultural.update.mockResolvedValue({ ...mockMedio, deletedAt: new Date() });

    await repository.softDelete(BigInt(10));
    expect(mockDb.medioCultural.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(10) },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('lista medios con paginación y filtros', async () => {
    mockDb.medioCultural.findMany.mockResolvedValue([mockMedio]);
    mockDb.medioCultural.count.mockResolvedValue(1);

    const result = await repository.list({
      tipo: 'audio',
      estado: 'ratificado',
      limit: 10,
      offset: 0,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockDb.medioCultural.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          tipo: 'audio',
          estado: 'ratificado',
        }),
        take: 10,
        skip: 0,
      }),
    );
  });

  it('soporta FKs taxonómicos, posterUuid y Prisma.JsonNull en create, updateMetadata y list', async () => {
    mockDb.medioCultural.create.mockResolvedValue({
      ...mockMedio,
      tipo: 'video',
      campoSemanticoId: BigInt(4),
      posterUuid: '11111111-2222-4333-8444-555555555555',
      metadata: { codec: 'vp9' },
    });

    await repository.create({
      uuid: mockMedio.uuid,
      campoSemanticoId: BigInt(4),
      tipo: 'video',
      proposito: 'relato_oral_video',
      filename: 'videos/video.webm',
      originalName: 'relato.webm',
      mimetype: 'video/webm',
      sizeBytes: BigInt(2048000),
      hashSha256: mockMedio.hashSha256,
      posterUuid: '11111111-2222-4333-8444-555555555555',
      metadata: { codec: 'vp9' },
    });

    expect(mockDb.medioCultural.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          campoSemanticoId: BigInt(4),
          posterUuid: '11111111-2222-4333-8444-555555555555',
          metadata: { codec: 'vp9' },
        }),
      }),
    );

    mockDb.medioCultural.update.mockResolvedValue({ ...mockMedio, metadata: null });
    await repository.updateMetadata(BigInt(10), {
      subcampoSemanticoId: BigInt(8),
      metadata: null,
    });

    expect(mockDb.medioCultural.update).toHaveBeenCalledWith({
      where: { id: BigInt(10) },
      data: {
        subcampoSemanticoId: BigInt(8),
        metadata: Prisma.JsonNull,
      },
    });

    mockDb.medioCultural.findMany.mockResolvedValue([]);
    mockDb.medioCultural.count.mockResolvedValue(0);
    await repository.list({
      tipo: 'video',
      campoSemanticoId: BigInt(4),
      subcampoSemanticoId: BigInt(8),
      microcampoId: BigInt(12),
    });

    expect(mockDb.medioCultural.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tipo: 'video',
          campoSemanticoId: BigInt(4),
          subcampoSemanticoId: BigInt(8),
          microcampoId: BigInt(12),
        }),
      }),
    );
  });
});
