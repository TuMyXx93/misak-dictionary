import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { RatifyMediaUseCase } from './RatifyMediaUseCase.js';

describe('RatifyMediaUseCase', () => {
  let useCase: RatifyMediaUseCase;
  let mockMediaRepo: IMedioCulturalRepository;
  let mockAuditService: AuditService;

  const mockDraftMedio: MedioCultural = {
    id: BigInt(5),
    uuid: 'draft-uuid-5555',
    sentidoId: BigInt(12),
    formaId: null,
    campoSemanticoId: null,
    subcampoSemanticoId: null,
    microcampoId: null,
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'audios/test.mp3',
    originalName: 'audio.mp3',
    mimetype: 'audio/mpeg',
    sizeBytes: BigInt(50000),
    hashSha256: 'hash555',
    duracionSegundos: 2.1,
    anchoPx: null,
    altoPx: null,
    posterUuid: null,
    metadata: null,
    estado: 'borrador',
    hablanteAutor: 'Taita Manuel',
    varianteDialectal: null,
    descripcionEspanol: null,
    descripcionNamtrik: null,
    licenciaComunitaria: 'Licencia Misak',
    subidoPorId: BigInt(1),
    ratificadoPorId: null,
    ratificadoAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
      recordInTx: vi.fn(),
    } as unknown as AuditService;

    useCase = new RatifyMediaUseCase(mockMediaRepo, mockAuditService);
  });

  it('ratifica exitosamente un medio y registra el evento MEDIA_RATIFY en auditoría (R-003)', async () => {
    vi.mocked(mockMediaRepo.findById).mockResolvedValue(mockDraftMedio);
    const ratifiedMedio = {
      ...mockDraftMedio,
      estado: 'ratificado' as const,
      ratificadoPorId: BigInt(9),
      ratificadoAt: new Date(),
    };
    vi.mocked(mockMediaRepo.ratify).mockResolvedValue(ratifiedMedio);

    const result = await useCase.execute({
      id: BigInt(5),
      actorUserId: BigInt(9),
      actorUsername: 'cultural_checker',
    });

    expect(result.estado).toBe('ratificado');
    expect(mockMediaRepo.ratify).toHaveBeenCalledWith(BigInt(5), BigInt(9));
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MEDIA_RATIFY',
        entity: 'medios_culturales',
        entityId: '5',
        actorUserId: BigInt(9),
        actorUsername: 'cultural_checker',
      }),
    );
  });

  it('lanza AppError 404 si el medio no existe', async () => {
    vi.mocked(mockMediaRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: BigInt(999),
        actorUserId: BigInt(9),
      }),
    ).rejects.toThrow('Medio cultural no encontrado');
  });

  it('retorna el medio sin re-auditar si ya estaba ratificado', async () => {
    const alreadyRatified = { ...mockDraftMedio, estado: 'ratificado' as const };
    vi.mocked(mockMediaRepo.findById).mockResolvedValue(alreadyRatified);

    const result = await useCase.execute({
      id: BigInt(5),
      actorUserId: BigInt(9),
    });

    expect(result.estado).toBe('ratificado');
    expect(mockMediaRepo.ratify).not.toHaveBeenCalled();
    expect(mockAuditService.record).not.toHaveBeenCalled();
  });

  it('bloquea la autorratificación con 409 SELF_RATIFICATION_FORBIDDEN si no es super_admin', async () => {
    const selfUploaded = { ...mockDraftMedio, subidoPorId: BigInt(9) };
    vi.mocked(mockMediaRepo.findById).mockResolvedValue(selfUploaded);

    await expect(
      useCase.execute({
        id: BigInt(5),
        actorUserId: BigInt(9),
        actorRoles: ['cultural_reviewer'],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'SELF_RATIFICATION_FORBIDDEN',
    });

    expect(mockMediaRepo.ratify).not.toHaveBeenCalled();
  });

  it('permite que super_admin ratifique incluso un medio cargado por sí mismo', async () => {
    const selfUploaded = { ...mockDraftMedio, subidoPorId: BigInt(1) };
    vi.mocked(mockMediaRepo.findById).mockResolvedValue(selfUploaded);
    vi.mocked(mockMediaRepo.ratify).mockResolvedValue({
      ...selfUploaded,
      estado: 'ratificado',
      ratificadoPorId: BigInt(1),
      ratificadoAt: new Date(),
    });

    const result = await useCase.execute({
      id: BigInt(5),
      actorUserId: BigInt(1),
      actorRoles: ['super_admin'],
    });

    expect(result.estado).toBe('ratificado');
    expect(mockMediaRepo.ratify).toHaveBeenCalledWith(BigInt(5), BigInt(1));
  });
});
