import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { DeleteMediaUseCase } from './DeleteMediaUseCase.js';
import { ListMediaUseCase } from './ListMediaUseCase.js';

describe('DeleteMediaUseCase & ListMediaUseCase', () => {
  let mockMediaRepo: IMedioCulturalRepository;
  let mockAuditService: AuditService;

  const sampleMedio: MedioCultural = {
    id: BigInt(7),
    uuid: 'uuid-777',
    sentidoId: BigInt(3),
    formaId: null,
    tipo: 'imagen',
    proposito: 'ilustracion_cultural',
    filename: 'imagenes/uuid-777.webp',
    originalName: 'sombrero.webp',
    mimetype: 'image/webp',
    sizeBytes: BigInt(150000),
    hashSha256: 'hash777',
    duracionSegundos: null,
    anchoPx: 800,
    altoPx: 600,
    estado: 'ratificado',
    hablanteAutor: 'Artesano Misak',
    varianteDialectal: null,
    descripcionEspanol: 'Kuarimpoto tradicional',
    descripcionNamtrik: 'Kuarimpoto',
    licenciaComunitaria: 'Licencia Misak',
    subidoPorId: BigInt(1),
    ratificadoPorId: BigInt(2),
    ratificadoAt: new Date(),
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
  });

  describe('DeleteMediaUseCase', () => {
    it('elimina un medio lógicamente y registra auditoría (R-007, R-014)', async () => {
      vi.mocked(mockMediaRepo.findById).mockResolvedValue(sampleMedio);
      const useCase = new DeleteMediaUseCase(mockMediaRepo, mockAuditService);

      await useCase.execute({
        id: BigInt(7),
        actorUserId: BigInt(2),
        actorUsername: 'admin_user',
      });

      expect(mockMediaRepo.softDelete).toHaveBeenCalledWith(BigInt(7));
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDIA_DELETE',
          entity: 'medios_culturales',
          entityId: '7',
          actorUserId: BigInt(2),
        }),
      );
    });

    it('falla con 404 si el medio no existe', async () => {
      vi.mocked(mockMediaRepo.findById).mockResolvedValue(null);
      const useCase = new DeleteMediaUseCase(mockMediaRepo, mockAuditService);

      await expect(
        useCase.execute({
          id: BigInt(99),
          actorUserId: BigInt(2),
        }),
      ).rejects.toThrow('Medio cultural no encontrado');
    });
  });

  describe('ListMediaUseCase', () => {
    it('delega la consulta con filtros al repositorio (R-014)', async () => {
      const listOutput = { items: [sampleMedio], total: 1 };
      vi.mocked(mockMediaRepo.list).mockResolvedValue(listOutput);
      const useCase = new ListMediaUseCase(mockMediaRepo);

      const result = await useCase.execute({ tipo: 'imagen', limit: 10 });
      expect(result).toEqual(listOutput);
      expect(mockMediaRepo.list).toHaveBeenCalledWith({ tipo: 'imagen', limit: 10 });
    });
  });
});
