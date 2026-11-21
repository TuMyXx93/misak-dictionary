import { describe, expect, it, vi } from 'vitest';
import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { UpdateMediaMetadataUseCase } from './UpdateMediaMetadataUseCase.js';

function createBaseMedia(overrides: Partial<MedioCultural> = {}): MedioCultural {
  return {
    id: 10n,
    uuid: '11111111-1111-4111-8111-111111111111',
    sentidoId: 1351n,
    formaId: 200n,
    campoSemanticoId: 4n,
    subcampoSemanticoId: 6n,
    microcampoId: null,
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'audios/11111111.webm',
    originalName: 'milu-kalik.webm',
    mimetype: 'audio/webm',
    sizeBytes: 12000n,
    hashSha256: 'abc123',
    duracionSegundos: 2.5,
    anchoPx: null,
    altoPx: null,
    posterUuid: null,
    metadata: null,
    estado: 'borrador',
    hablanteAutor: 'Taita Lorenzo',
    varianteDialectal: 'Guambia',
    descripcionEspanol: 'Pronunciación de Milu kalik',
    descripcionNamtrik: 'Milu kalik',
    licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
    subidoPorId: 1n,
    ratificadoPorId: null,
    ratificadoAt: null,
    createdAt: new Date('2026-11-10T00:00:00Z'),
    updatedAt: new Date('2026-11-10T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

function createMocks(existing: MedioCultural | null) {
  const mediaRepo = {
    findById: vi.fn().mockResolvedValue(existing),
    findSentidoIdByFormaId: vi.fn().mockResolvedValue(1351n),
    updateMetadata: vi.fn().mockImplementation(async (_id, payload) =>
      createBaseMedia({
        ...(existing ?? {}),
        ...payload,
      }),
    ),
  } as unknown as IMedioCulturalRepository;

  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  return { mediaRepo, auditService };
}

describe('UpdateMediaMetadataUseCase', () => {
  it('lanza 404 si el medio cultural no existe', async () => {
    const { mediaRepo, auditService } = createMocks(null);
    const useCase = new UpdateMediaMetadataUseCase(mediaRepo, auditService);

    await expect(
      useCase.execute({
        id: 999n,
        payload: { descripcionEspanol: 'Nuevo texto' },
        actorUserId: 1n,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('limpia formaId huérfano al desvincular sentidoId (null) y registra auditoría MEDIA_UPDATE', async () => {
    const existing = createBaseMedia({ estado: 'borrador' });
    const { mediaRepo, auditService } = createMocks(existing);
    const useCase = new UpdateMediaMetadataUseCase(mediaRepo, auditService);

    const updated = await useCase.execute({
      id: 10n,
      payload: { sentidoId: null },
      actorUserId: 2n,
      actorUsername: 'media_admin',
    });

    expect(mediaRepo.updateMetadata).toHaveBeenCalledWith(10n, {
      sentidoId: null,
      formaId: null,
    });
    expect(updated.sentidoId).toBeNull();
    expect(updated.formaId).toBeNull();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MEDIA_UPDATE',
        entity: 'medios_culturales',
        entityId: '10',
        actorUserId: 2n,
      }),
    );
  });

  it('auto-resuelve el sentidoId padre cuando se vincula por formaId sobre un medio sin sentido', async () => {
    const existing = createBaseMedia({ sentidoId: null, formaId: null });
    const { mediaRepo, auditService } = createMocks(existing);
    if (mediaRepo.findSentidoIdByFormaId) {
      vi.mocked(mediaRepo.findSentidoIdByFormaId).mockResolvedValueOnce(1351n);
    }
    const useCase = new UpdateMediaMetadataUseCase(mediaRepo, auditService);

    const updated = await useCase.execute({
      id: 10n,
      payload: { formaId: 205n },
      actorUserId: 2n,
    });

    expect(mediaRepo.updateMetadata).toHaveBeenCalledWith(10n, {
      formaId: 205n,
      sentidoId: 1351n,
    });
    expect(updated.sentidoId).toBe(1351n);
  });

  it('rechaza con 400 si formaId no existe o pertenece a otro sentido', async () => {
    const existing = createBaseMedia({ sentidoId: 1351n });
    const { mediaRepo, auditService } = createMocks(existing);
    if (mediaRepo.findSentidoIdByFormaId) {
      vi.mocked(mediaRepo.findSentidoIdByFormaId).mockResolvedValueOnce(9999n);
    }
    const useCase = new UpdateMediaMetadataUseCase(mediaRepo, auditService);

    await expect(
      useCase.execute({
        id: 10n,
        payload: { formaId: 888n },
        actorUserId: 2n,
      }),
    ).rejects.toThrow(AppError);
  });

  it('aplica R-010 al editar un medio ratificado: lo retorna a borrador y limpia firma de ratificación', async () => {
    const existing = createBaseMedia({
      estado: 'ratificado',
      ratificadoPorId: 9n,
      ratificadoAt: new Date('2026-11-11T00:00:00Z'),
    });
    const { mediaRepo, auditService } = createMocks(existing);
    const useCase = new UpdateMediaMetadataUseCase(mediaRepo, auditService);

    const updated = await useCase.execute({
      id: 10n,
      payload: { descripcionEspanol: 'Descripción corregida' },
      actorUserId: 3n,
      actorUsername: 'editor',
    });

    expect(mediaRepo.updateMetadata).toHaveBeenCalledWith(10n, {
      descripcionEspanol: 'Descripción corregida',
      estado: 'borrador',
      ratificadoPorId: null,
      ratificadoAt: null,
    });
    expect(updated.estado).toBe('borrador');
  });
});
