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

  const validMp4Buffer = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from('ftypmp42', 'ascii'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from('isommp42', 'ascii'),
    Buffer.alloc(128),
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
      campoSemanticoId: null,
      subcampoSemanticoId: null,
      microcampoId: null,
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
      posterUuid: null,
      metadata: null,
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

  it('procesa y persiste un video MP4 con asociación taxonómica, posterUuid y metadata en videos/', async () => {
    vi.mocked(mockStorage.save).mockResolvedValue({
      relativePath: 'videos/video-uuid.mp4',
      absolutePath: '/app/uploads/media/videos/video-uuid.mp4',
      sizeBytes: validMp4Buffer.length,
      hashSha256: 'videohash123',
    });

    const createdVideo = {
      id: BigInt(2),
      uuid: 'video-uuid',
      sentidoId: null,
      formaId: null,
      campoSemanticoId: BigInt(3),
      subcampoSemanticoId: null,
      microcampoId: null,
      tipo: 'video' as const,
      proposito: 'registro_practica_cultural' as const,
      filename: 'videos/video-uuid.mp4',
      originalName: 'minga.mp4',
      mimetype: 'video/mp4',
      sizeBytes: BigInt(validMp4Buffer.length),
      hashSha256: 'videohash123',
      duracionSegundos: 45.8,
      anchoPx: 1920,
      altoPx: 1080,
      posterUuid: '11111111-2222-4333-8444-555555555555',
      metadata: { lugar: 'Silvia, Cauca' },
      estado: 'borrador' as const,
      hablanteAutor: 'Cabildo Guambía',
      varianteDialectal: null,
      descripcionEspanol: 'Registro de práctica comunitaria',
      descripcionNamtrik: null,
      licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
      subidoPorId: BigInt(1),
      ratificadoPorId: null,
      ratificadoAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    vi.mocked(mockMediaRepo.create).mockResolvedValue(createdVideo);

    const result = await useCase.execute({
      fileBuffer: validMp4Buffer,
      originalFilename: 'minga.mp4',
      declaredMimetype: 'video/mp4',
      tipo: 'video',
      proposito: 'registro_practica_cultural',
      campoSemanticoId: BigInt(3),
      duracionSegundos: 45.8,
      anchoPx: 1920,
      altoPx: 1080,
      posterUuid: '11111111-2222-4333-8444-555555555555',
      metadata: { lugar: 'Silvia, Cauca' },
      userId: BigInt(1),
    });

    expect(result.tipo).toBe('video');
    expect(mockStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        mimetype: 'video/mp4',
        subfolder: 'videos',
      }),
    );
    expect(mockMediaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campoSemanticoId: BigInt(3),
        anchoPx: 1920,
        altoPx: 1080,
        duracionSegundos: 45.8,
        posterUuid: '11111111-2222-4333-8444-555555555555',
        metadata: { lugar: 'Silvia, Cauca' },
      }),
    );
  });

  it('permite subir medios al catálogo general sin asociación obligatoria a sentido ni forma', async () => {
    vi.mocked(mockStorage.save).mockResolvedValue({
      relativePath: 'audios/general-uuid.mp3',
      absolutePath: '/app/uploads/media/audios/general-uuid.mp3',
      sizeBytes: validMp3Buffer.length,
      hashSha256: 'generalhash',
    });
    vi.mocked(mockMediaRepo.create).mockResolvedValue({
      id: BigInt(3),
      uuid: 'general-uuid',
      sentidoId: null,
      formaId: null,
      campoSemanticoId: null,
      subcampoSemanticoId: null,
      microcampoId: null,
      tipo: 'audio',
      proposito: 'pronunciacion_lema',
      filename: 'audios/general-uuid.mp3',
      originalName: 'audio.mp3',
      mimetype: 'audio/mpeg',
      sizeBytes: BigInt(validMp3Buffer.length),
      hashSha256: 'generalhash',
      duracionSegundos: null,
      anchoPx: null,
      altoPx: null,
      posterUuid: null,
      metadata: null,
      estado: 'borrador',
      hablanteAutor: null,
      varianteDialectal: null,
      descripcionEspanol: null,
      descripcionNamtrik: null,
      licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
      subidoPorId: null,
      ratificadoPorId: null,
      ratificadoAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await useCase.execute({
      fileBuffer: validMp3Buffer,
      originalFilename: 'audio.mp3',
      declaredMimetype: 'audio/mpeg',
      tipo: 'audio',
      proposito: 'pronunciacion_lema',
    });

    expect(result.sentidoId).toBeNull();
    expect(result.formaId).toBeNull();
    expect(mockMediaRepo.create).toHaveBeenCalled();
  });

  it('rechaza un archivo de audio que excede 10 MB con AppError HTTP 400', async () => {
    const hugeAudioBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB

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

  it('rechaza un archivo de video que excede 100 MB con AppError HTTP 400', async () => {
    const fakeLargeBuffer = { length: 101 * 1024 * 1024 } as Buffer;

    await expect(
      useCase.execute({
        fileBuffer: fakeLargeBuffer,
        originalFilename: 'too-big.mp4',
        declaredMimetype: 'video/mp4',
        tipo: 'video',
        proposito: 'relato_oral_video',
      }),
    ).rejects.toThrow('excede el tamaño máximo permitido de 100 MB');

    expect(mockStorage.save).not.toHaveBeenCalled();
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

  it('rechaza tipo o propósito inválido', async () => {
    await expect(
      useCase.execute({
        fileBuffer: validMp3Buffer,
        originalFilename: 'audio.mp3',
        declaredMimetype: 'audio/mpeg',
        // biome-ignore lint/suspicious/noExplicitAny: prueba de validación en runtime
        tipo: 'holograma' as any,
        proposito: 'pronunciacion_lema',
        sentidoId: BigInt(1),
      }),
    ).rejects.toThrow('Tipo de medio inválido');
  });
});
