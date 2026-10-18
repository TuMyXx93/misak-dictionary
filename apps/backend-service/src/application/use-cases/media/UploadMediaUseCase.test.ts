import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { IStorageService } from '../../../shared/storage/storage.service.js';
import { UploadMediaUseCase } from './UploadMediaUseCase.js';

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mockMediaRepo: IMedioCulturalRepository;
  let mockStorage: IStorageService;

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

    useCase = new UploadMediaUseCase(mockMediaRepo, mockStorage);
  });

  const validMp3Buffer = Buffer.concat([
    Buffer.from('ID3', 'ascii'),
    Buffer.from([0x03, 0x00, 0x00, 0x00, 0x00, 0x0a]),
    Buffer.alloc(100),
  ]);

  it('procesa y persiste exitosamente un audio en estado inicial borrador (R-001, R-002)', async () => {
    vi.mocked(mockStorage.save).mockResolvedValue({
      relativePath: 'audios/test-uuid.mp3',
      absolutePath: '/app/uploads/media/audios/test-uuid.mp3',
      sizeBytes: validMp3Buffer.length,
      hashSha256: 'abc123hash',
    });

    const createdMedio = {
      id: BigInt(1),
      uuid: 'test-uuid',
      sentidoId: BigInt(10),
      formaId: BigInt(20),
      tipo: 'audio' as const,
      proposito: 'pronunciacion_lema' as const,
      filename: 'audios/test-uuid.mp3',
      originalName: 'audio_morok.mp3',
      mimetype: 'audio/mpeg',
      sizeBytes: BigInt(validMp3Buffer.length),
      hashSha256: 'abc123hash',
      duracionSegundos: 3.2,
      anchoPx: null,
      altoPx: null,
      estado: 'borrador' as const,
      hablanteAutor: 'Taita Misak',
      varianteDialectal: 'Guambía',
      descripcionEspanol: 'Pronunciación estándar',
      descripcionNamtrik: 'Wam',
      licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
      subidoPorId: BigInt(4),
      ratificadoPorId: null,
      ratificadoAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    vi.mocked(mockMediaRepo.create).mockResolvedValue(createdMedio);

    const result = await useCase.execute({
      fileBuffer: validMp3Buffer,
      originalFilename: 'audio_morok.mp3',
      declaredMimetype: 'audio/mpeg',
      tipo: 'audio',
      proposito: 'pronunciacion_lema',
      sentidoId: BigInt(10),
      formaId: BigInt(20),
      hablanteAutor: 'Taita Misak',
      duracionSegundos: 3.2,
      userId: BigInt(4),
    });

    expect(result.estado).toBe('borrador');
    expect(mockStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: validMp3Buffer,
        mimetype: 'audio/mpeg',
        subfolder: 'audios',
      }),
    );
    expect(mockMediaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'borrador',
        tipo: 'audio',
        proposito: 'pronunciacion_lema',
        sentidoId: BigInt(10),
      }),
    );
  });

  it('rechaza un archivo de audio que excede 5 MB con AppError HTTP 400', async () => {
    const hugeAudioBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB

    await expect(
      useCase.execute({
        fileBuffer: hugeAudioBuffer,
        originalFilename: 'heavy.mp3',
        declaredMimetype: 'audio/mpeg',
        tipo: 'audio',
        proposito: 'pronunciacion_lema',
        sentidoId: BigInt(10),
      }),
    ).rejects.toThrow(AppError);

    expect(mockStorage.save).not.toHaveBeenCalled();
    expect(mockMediaRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza un archivo con extensión engañosa pero Magic Bytes inválidos con HTTP 400 (R-005)', async () => {
    const fakeMp3Buffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02]); // Linux ELF executable

    await expect(
      useCase.execute({
        fileBuffer: fakeMp3Buffer,
        originalFilename: 'virus.mp3',
        declaredMimetype: 'audio/mpeg',
        tipo: 'audio',
        proposito: 'pronunciacion_lema',
        sentidoId: BigInt(10),
      }),
    ).rejects.toThrow('Cabecera binaria no reconocida o tipo de archivo no permitido');

    expect(mockStorage.save).not.toHaveBeenCalled();
  });

  it('rechaza si no se proporciona sentidoId ni formaId con HTTP 400', async () => {
    await expect(
      useCase.execute({
        fileBuffer: validMp3Buffer,
        originalFilename: 'audio.mp3',
        declaredMimetype: 'audio/mpeg',
        tipo: 'audio',
        proposito: 'pronunciacion_lema',
      }),
    ).rejects.toThrow(
      'El medio cultural debe estar asociado al menos a un sentido léxico o una forma en Namtrik',
    );
  });

  it('rechaza tipo o propósito inválido', async () => {
    await expect(
      useCase.execute({
        fileBuffer: validMp3Buffer,
        originalFilename: 'audio.mp3',
        declaredMimetype: 'audio/mpeg',
        tipo: 'video' as any,
        proposito: 'pronunciacion_lema',
        sentidoId: BigInt(1),
      }),
    ).rejects.toThrow('Tipo de medio inválido');
  });
});
