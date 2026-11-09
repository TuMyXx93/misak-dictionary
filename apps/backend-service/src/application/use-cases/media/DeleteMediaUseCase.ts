import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface DeleteMediaInput {
  id: bigint;
  actorUserId: bigint;
  actorUsername?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class DeleteMediaUseCase {
  constructor(
    private readonly mediaRepository: IMedioCulturalRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: DeleteMediaInput): Promise<void> {
    const medio = await this.mediaRepository.findById(input.id);

    if (!medio) {
      throw new AppError('Medio cultural no encontrado', 404);
    }

    await this.mediaRepository.softDelete(input.id);

    await this.auditService.record({
      action: 'MEDIA_DELETE',
      entity: 'medios_culturales',
      entityId: input.id.toString(),
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      oldData: {
        uuid: medio.uuid,
        tipo: medio.tipo,
        proposito: medio.proposito,
        estado: medio.estado,
      },
      newData: {
        deleted: true,
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
