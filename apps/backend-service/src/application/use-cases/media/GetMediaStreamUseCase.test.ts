import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { IStorageService } from '../../../shared/storage/storage.service.js';
import { GetMediaStreamUseCase } from './GetMediaStreamUseCase.js';

describe('GetMediaStreamUseCase', () => {
  let useCase: GetMediaStreamUseCase;
  let mockMediaRepo: IMedioCulturalRepository;
  let mockStorage: IStorageService;

  const mockRatifiedMedio: MedioCultural = {
    id: BigInt(1),
    uuid: '11111111-2222-3333-4444-555555555555',
    sentidoId: BigInt(10),
    formaId: null,
    campoSemanticoId: null,
    subcampoSemanticoId: null,
    microcampoId: null,
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'audios/test-audio.mp3',
    originalName: 'audio.mp3',
    mimetype: 'audio/mpeg',
    sizeBytes: BigInt(204800),
    hashSha256: 'hash123',
    duracionSegundos: 5.0,
    anchoPx: null,
    altoPx: null,
    posterUuid: null,
    metadata: null,
    estado: 'ratificado',
    hablanteAutor: 'Taita',
    varianteDialectal: null,
    descripcionEspanol: null,
    descripcionNamtrik: null,
    licenciaComunitaria: 'Licencia Misak',
    subidoPorId: BigInt(1),
    ratificadoPorId: BigInt(2),
    ratificadoAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockDraftMedio: MedioCultural = {
    ...mockRatifiedMedio,
    id: BigInt(2),
    uuid: 'draft-uuid-0000',
    estado: 'borrador',
    ratificadoPorId: null,
    ratificadoAt: null,
  };

  beforeEach(() => {
    mockMediaRepo = {
      findById: vi.fn(),
      findByUuid: vi.fn(),
      findByHash: vi.fn(),
      findBySentidoId: vi.fn(),
      findByFormaId: vi.fn(),
      create: vi.fn(),
      updateMetadata: vi.fn(),
      ratify: vi.fn(),
      softDelete: vi.fn(),
      list: vi.fn(),
    };

    mockStorage = {
      save: vi.fn(),
      getStream: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      getAbsolutePath: vi.fn(),
    };

    useCase = new GetMediaStreamUseCase(mockMediaRepo, mockStorage);
  });

  it('obtiene un stream completo para un medio ratificado sin cabecera Range (código 200)', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 204800,
      start: 0,
      end: 204799,
      isPartial: false,
      contentType: 'audio/mpeg',
    });

    const result = await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
    });

    expect(result.medio).toEqual(mockRatifiedMedio);
    expect(result.streamResult.isPartial).toBe(false);
    expect(mockStorage.getStream).toHaveBeenCalledWith(
      'audios/test-audio.mp3',
      'audio/mpeg',
      undefined,
    );
  });

  it('procesa cabecera Range y solicita stream parcial (HTTP 206, R-006)', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 204800,
      start: 0,
      end: 1024,
      isPartial: true,
      contentType: 'audio/mpeg',
    });

    const result = await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      rangeHeader: 'bytes=0-1024',
    });

    expect(result.streamResult.isPartial).toBe(true);
    expect(mockStorage.getStream).toHaveBeenCalledWith('audios/test-audio.mp3', 'audio/mpeg', {
      start: 0,
      end: 1024,
    });
  });

  it('deniega acceso público con HTTP 403 si el medio está en estado borrador (R-002)', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockDraftMedio);

    await expect(
      useCase.execute({
        uuid: mockDraftMedio.uuid,
        canReadDrafts: false,
      }),
    ).rejects.toThrow('El archivo multimedia se encuentra en estado borrador');

    expect(mockStorage.getStream).not.toHaveBeenCalled();
  });

  it('permite acceso a medio en borrador si canReadDrafts es true (panel admin)', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockDraftMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 100,
      start: 0,
      end: 99,
      isPartial: false,
      contentType: 'audio/mpeg',
    });

    const result = await useCase.execute({
      uuid: mockDraftMedio.uuid,
      canReadDrafts: true,
    });

    expect(result.medio).toEqual(mockDraftMedio);
    expect(mockStorage.getStream).toHaveBeenCalled();
  });

  it('lanza AppError 404 si el UUID no existe', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(null);

    await expect(
      useCase.execute({
        uuid: 'inexistente',
      }),
    ).rejects.toThrow('Archivo multimedia no encontrado');
  });

  it('interpreta rango sufijo bytes=-N (RFC 9110) hacia suffixLength', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 2048,
      start: 1536,
      end: 2047,
      isPartial: true,
      contentType: 'audio/mpeg',
    });

    const result = await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      rangeHeader: 'bytes=-512',
    });

    expect(result.streamResult.isPartial).toBe(true);
    expect(mockStorage.getStream).toHaveBeenCalledWith('audios/test-audio.mp3', 'audio/mpeg', {
      suffixLength: 512,
    });
  });

  it('marca rangos inválidos (bytes=200-100 o bytes=abc) con invalidRange: true para HTTP 416', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 2048,
      start: 0,
      end: 2047,
      isPartial: false,
      contentType: 'audio/mpeg',
    });

    await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      rangeHeader: 'bytes=200-100',
    });

    expect(mockStorage.getStream).toHaveBeenCalledWith('audios/test-audio.mp3', 'audio/mpeg', {
      invalidRange: true,
    });
  });

  it('propaga headOnly al StorageService cuando se solicita HEAD', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 2048,
      start: 0,
      end: 2047,
      isPartial: false,
      contentType: 'audio/mpeg',
    });

    await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      headOnly: true,
    });

    expect(mockStorage.getStream).toHaveBeenCalledWith('audios/test-audio.mp3', 'audio/mpeg', {
      headOnly: true,
    });
  });

  it('no invoca el resolver perezoso de canReadDrafts cuando el medio ya está ratificado', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 2048,
      start: 0,
      end: 2047,
      isPartial: false,
      contentType: 'audio/mpeg',
    });
    const lazyPermissionChecker = vi.fn(async () => true);

    const result = await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      canReadDrafts: lazyPermissionChecker,
    });

    expect(result.etag).toBe('"hash123"');
    expect(result.notModified).toBe(false);
    expect(lazyPermissionChecker).not.toHaveBeenCalled();
  });

  it('responde notModified sin leer del disco cuando If-None-Match coincide con el ETag', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);

    const result = await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      ifNoneMatchHeader: '"hash123"',
    });

    expect(result.notModified).toBe(true);
    expect(result.etag).toBe('"hash123"');
    expect(mockStorage.getStream).not.toHaveBeenCalled();
  });

  it('ignora la cabecera Range cuando If-Range no coincide con el ETag del medio (RFC 9110)', async () => {
    vi.mocked(mockMediaRepo.findByUuid).mockResolvedValue(mockRatifiedMedio);
    vi.mocked(mockStorage.getStream).mockResolvedValue({
      stream: new Readable(),
      totalSize: 204800,
      start: 0,
      end: 204799,
      isPartial: false,
      contentType: 'audio/mpeg',
    });

    await useCase.execute({
      uuid: mockRatifiedMedio.uuid,
      rangeHeader: 'bytes=0-1024',
      ifRangeHeader: '"stale-etag"',
    });

    expect(mockStorage.getStream).toHaveBeenCalledWith(
      'audios/test-audio.mp3',
      'audio/mpeg',
      undefined,
    );
  });
});
