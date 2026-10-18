import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface RatifyMediaInput {
  id: bigint;
  actorUserId: bigint;
  actorUsername?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class RatifyMediaUseCase {
  constructor(
    private readonly mediaRepository: IMedioCulturalRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: RatifyMediaInput): Promise<MedioCultural> {
    const medio = await this.mediaRepository.findById(input.id);

    if (!medio) {
      throw new AppError('Medio cultural no encontrado', 404);
    }

    if (medio.estado === 'ratificado') {
      return medio;
    }

    const ratified = await this.mediaRepository.ratify(input.id, input.actorUserId);

    // Registro inmutable de auditoría (R-003)
    await this.auditService.record({
      action: 'MEDIA_RATIFY',
      entity: 'medios_culturales',
      entityId: input.id.toString(),
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      oldData: { estado: medio.estado },
      newData: {
        estado: 'ratificado',
        ratificadoPorId: input.actorUserId.toString(),
        uuid: medio.uuid,
        tipo: medio.tipo,
        proposito: medio.proposito,
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return ratified;
  }
}
