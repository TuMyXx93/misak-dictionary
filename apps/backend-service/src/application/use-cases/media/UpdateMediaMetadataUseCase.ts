import type {
  MedioCultural,
  UpdateMedioCulturalMetadataPayload,
} from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface UpdateMediaMetadataInput {
  id: bigint;
  payload: UpdateMedioCulturalMetadataPayload;
  actorUserId: bigint;
  actorUsername?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

const EDITORIAL_SENSITIVE_FIELDS: readonly (keyof UpdateMedioCulturalMetadataPayload)[] = [
  'proposito',
  'sentidoId',
  'formaId',
  'campoSemanticoId',
  'subcampoSemanticoId',
  'microcampoId',
  'hablanteAutor',
  'varianteDialectal',
  'descripcionEspanol',
  'descripcionNamtrik',
  'licenciaComunitaria',
  'posterUuid',
] as const;

/**
 * Actualiza metadatos y vínculos de un medio cultural aplicando la regla R-010:
 * editar un medio ratificado lo devuelve a estado `borrador` sin alterar el sentido padre.
 */
export class UpdateMediaMetadataUseCase {
  constructor(
    private readonly mediaRepository: IMedioCulturalRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: UpdateMediaMetadataInput): Promise<MedioCultural> {
    const existing = await this.mediaRepository.findById(input.id);
    if (!existing) {
      throw new AppError('Medio cultural no encontrado', 404);
    }

    const effectivePayload: UpdateMedioCulturalMetadataPayload = { ...input.payload };

    // Si se desvincula el sentido sin enviar formaId explícitamente, limpiar formaId huérfana
    if (effectivePayload.sentidoId === null && effectivePayload.formaId === undefined) {
      effectivePayload.formaId = null;
    }

    const targetFormaId =
      effectivePayload.formaId !== undefined ? effectivePayload.formaId : existing.formaId;
    const targetSentidoId =
      effectivePayload.sentidoId !== undefined ? effectivePayload.sentidoId : existing.sentidoId;

    if (targetFormaId != null && this.mediaRepository.findSentidoIdByFormaId) {
      const parentSentidoId = await this.mediaRepository.findSentidoIdByFormaId(targetFormaId);
      if (parentSentidoId === null) {
        throw new AppError('La forma léxica seleccionada no existe', 400);
      }
      if (targetSentidoId != null && parentSentidoId !== targetSentidoId) {
        throw new AppError('La forma léxica seleccionada no pertenece al sentido indicado', 400);
      }
      if (effectivePayload.sentidoId === undefined && existing.sentidoId === null) {
        effectivePayload.sentidoId = parentSentidoId;
      }
    }

    const touchesEditorialData = EDITORIAL_SENSITIVE_FIELDS.some(
      (field) => effectivePayload[field] !== undefined,
    );

    // Regla R-010: modificar metadatos o vínculos de un medio ratificado lo retorna a borrador
    if (existing.estado === 'ratificado' && touchesEditorialData) {
      effectivePayload.estado = 'borrador';
      effectivePayload.ratificadoPorId = null;
      effectivePayload.ratificadoAt = null;
    }

    const updated = await this.mediaRepository.updateMetadata(input.id, effectivePayload);

    await this.auditService.record({
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      action: 'MEDIA_UPDATE',
      entity: 'medios_culturales',
      entityId: input.id.toString(),
      oldData: {
        estado: existing.estado,
        sentidoId: existing.sentidoId?.toString() ?? null,
        formaId: existing.formaId?.toString() ?? null,
        proposito: existing.proposito,
      },
      newData: {
        estado: updated.estado,
        sentidoId: updated.sentidoId?.toString() ?? null,
        formaId: updated.formaId?.toString() ?? null,
        proposito: updated.proposito,
        revertedToDraft: existing.estado === 'ratificado' && updated.estado === 'borrador',
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return updated;
  }
}
