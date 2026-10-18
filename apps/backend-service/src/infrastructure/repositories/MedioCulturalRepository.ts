import type {
  CreateMedioCulturalPayload,
  MedioCultural,
  UpdateMedioCulturalMetadataPayload,
} from '../../domain/entities/MedioCultural.js';
import type {
  IMedioCulturalRepository,
  ListMediosFilter,
  ListMediosResult,
} from '../../domain/interfaces/IMedioCulturalRepository.js';
import { prisma as defaultPrisma } from '../../shared/config/prisma.js';

export class PrismaMedioCulturalRepository implements IMedioCulturalRepository {
  constructor(private readonly db = defaultPrisma) {}

  async findById(id: bigint): Promise<MedioCultural | null> {
    const record = await this.db.medioCultural.findFirst({
      where: { id, deletedAt: null },
    });
    return (record as unknown as MedioCultural) || null;
  }

  async findByUuid(uuid: string): Promise<MedioCultural | null> {
    const record = await this.db.medioCultural.findFirst({
      where: { uuid, deletedAt: null },
    });
    return (record as unknown as MedioCultural) || null;
  }

  async findByHash(hashSha256: string): Promise<MedioCultural | null> {
    const record = await this.db.medioCultural.findFirst({
      where: { hashSha256, deletedAt: null },
    });
    return (record as unknown as MedioCultural) || null;
  }

  async findBySentidoId(sentidoId: bigint, soloRatificados = false): Promise<MedioCultural[]> {
    const records = await this.db.medioCultural.findMany({
      where: {
        sentidoId,
        deletedAt: null,
        ...(soloRatificados ? { estado: 'ratificado' } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records as unknown as MedioCultural[];
  }

  async findByFormaId(formaId: bigint, soloRatificados = false): Promise<MedioCultural[]> {
    const records = await this.db.medioCultural.findMany({
      where: {
        formaId,
        deletedAt: null,
        ...(soloRatificados ? { estado: 'ratificado' } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return records as unknown as MedioCultural[];
  }

  async create(payload: CreateMedioCulturalPayload): Promise<MedioCultural> {
    const created = await this.db.medioCultural.create({
      data: {
        uuid: payload.uuid,
        sentidoId: payload.sentidoId ?? null,
        formaId: payload.formaId ?? null,
        tipo: payload.tipo,
        proposito: payload.proposito,
        filename: payload.filename,
        originalName: payload.originalName,
        mimetype: payload.mimetype,
        sizeBytes: payload.sizeBytes,
        hashSha256: payload.hashSha256,
        duracionSegundos: payload.duracionSegundos ?? null,
        anchoPx: payload.anchoPx ?? null,
        altoPx: payload.altoPx ?? null,
        estado: payload.estado ?? 'borrador',
        hablanteAutor: payload.hablanteAutor ?? null,
        varianteDialectal: payload.varianteDialectal ?? null,
        descripcionEspanol: payload.descripcionEspanol ?? null,
        descripcionNamtrik: payload.descripcionNamtrik ?? null,
        licenciaComunitaria:
          payload.licenciaComunitaria ?? 'Propiedad Intelectual Colectiva del Pueblo Misak',
        subidoPorId: payload.subidoPorId ?? null,
      },
    });

    return created as unknown as MedioCultural;
  }

  async updateMetadata(
    id: bigint,
    payload: UpdateMedioCulturalMetadataPayload,
  ): Promise<MedioCultural> {
    const updated = await this.db.medioCultural.update({
      where: { id },
      data: {
        ...(payload.sentidoId !== undefined ? { sentidoId: payload.sentidoId } : {}),
        ...(payload.formaId !== undefined ? { formaId: payload.formaId } : {}),
        ...(payload.proposito !== undefined ? { proposito: payload.proposito } : {}),
        ...(payload.hablanteAutor !== undefined ? { hablanteAutor: payload.hablanteAutor } : {}),
        ...(payload.varianteDialectal !== undefined
          ? { varianteDialectal: payload.varianteDialectal }
          : {}),
        ...(payload.descripcionEspanol !== undefined
          ? { descripcionEspanol: payload.descripcionEspanol }
          : {}),
        ...(payload.descripcionNamtrik !== undefined
          ? { descripcionNamtrik: payload.descripcionNamtrik }
          : {}),
        ...(payload.licenciaComunitaria !== undefined
          ? { licenciaComunitaria: payload.licenciaComunitaria }
          : {}),
      },
    });

    return updated as unknown as MedioCultural;
  }

  async ratify(id: bigint, ratificadoPorId: bigint): Promise<MedioCultural> {
    const ratified = await this.db.medioCultural.update({
      where: { id },
      data: {
        estado: 'ratificado',
        ratificadoPorId,
        ratificadoAt: new Date(),
      },
    });

    return ratified as unknown as MedioCultural;
  }

  async softDelete(id: bigint): Promise<void> {
    await this.db.medioCultural.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async list(filter: ListMediosFilter): Promise<ListMediosResult> {
    const where = {
      deletedAt: null,
      ...(filter.tipo ? { tipo: filter.tipo } : {}),
      ...(filter.estado ? { estado: filter.estado } : {}),
      ...(filter.sentidoId ? { sentidoId: filter.sentidoId } : {}),
      ...(filter.formaId ? { formaId: filter.formaId } : {}),
      ...(filter.query
        ? {
            OR: [
              { originalName: { contains: filter.query, mode: 'insensitive' as const } },
              { hablanteAutor: { contains: filter.query, mode: 'insensitive' as const } },
              { descripcionEspanol: { contains: filter.query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.medioCultural.findMany({
        where,
        take: filter.limit ?? 20,
        skip: filter.offset ?? 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.medioCultural.count({ where }),
    ]);

    return {
      items: items as unknown as MedioCultural[],
      total,
    };
  }
}
