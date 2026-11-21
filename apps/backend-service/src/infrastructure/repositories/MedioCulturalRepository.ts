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
import { Prisma } from '../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../shared/config/prisma.js';

const TAXONOMY_SUMMARY_SELECT = {
  id: true,
  codigo: true,
  namtrikTermino: true,
  espanolTermino: true,
} as const;

const MEDIO_RELATION_INCLUDE = {
  sentido: {
    select: {
      id: true,
      codigo: true,
      tipo: true,
      estado: true,
      espanolGlosa: true,
      nombreCientifico: true,
      namtrikContexto: true,
      respuestaNamtrik: true,
      formas: {
        select: {
          id: true,
          orden: true,
          lema: true,
          variante: true,
        },
        orderBy: { orden: 'asc' as const },
      },
      ubicaciones: {
        select: {
          campo: { select: TAXONOMY_SUMMARY_SELECT },
          subcampo: { select: TAXONOMY_SUMMARY_SELECT },
          microcampo: { select: TAXONOMY_SUMMARY_SELECT },
        },
      },
    },
  },
  forma: {
    select: {
      id: true,
      sentidoId: true,
      lema: true,
      variante: true,
      categoriaGramatical: true,
    },
  },
  campoSemantico: { select: TAXONOMY_SUMMARY_SELECT },
  subcampoSemantico: { select: TAXONOMY_SUMMARY_SELECT },
  microcampo: { select: TAXONOMY_SUMMARY_SELECT },
} as const;

export class PrismaMedioCulturalRepository implements IMedioCulturalRepository {
  constructor(private readonly db = defaultPrisma) {}

  async findById(id: bigint): Promise<MedioCultural | null> {
    const record = await this.db.medioCultural.findFirst({
      where: { id, deletedAt: null },
      include: MEDIO_RELATION_INCLUDE,
    });
    return (record as unknown as MedioCultural) || null;
  }

  async findByUuid(uuid: string): Promise<MedioCultural | null> {
    const record = await this.db.medioCultural.findFirst({
      where: { uuid, deletedAt: null },
      include: MEDIO_RELATION_INCLUDE,
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
        OR: [{ sentidoId }, { forma: { sentidoId } }],
        deletedAt: null,
        ...(soloRatificados ? { estado: 'ratificado' } : {}),
      },
      include: MEDIO_RELATION_INCLUDE,
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
      include: MEDIO_RELATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records as unknown as MedioCultural[];
  }

  async findSentidoIdByFormaId(formaId: bigint): Promise<bigint | null> {
    const forma = await this.db.formaNamtrik.findUnique({
      where: { id: formaId },
      select: { sentidoId: true },
    });
    return forma?.sentidoId ?? null;
  }

  async create(payload: CreateMedioCulturalPayload): Promise<MedioCultural> {
    const created = await this.db.medioCultural.create({
      data: {
        uuid: payload.uuid,
        sentidoId: payload.sentidoId ?? null,
        formaId: payload.formaId ?? null,
        campoSemanticoId: payload.campoSemanticoId ?? null,
        subcampoSemanticoId: payload.subcampoSemanticoId ?? null,
        microcampoId: payload.microcampoId ?? null,
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
        posterUuid: payload.posterUuid ?? null,
        ...(payload.metadata !== undefined
          ? {
              metadata:
                payload.metadata === null
                  ? Prisma.JsonNull
                  : (payload.metadata as Prisma.InputJsonValue),
            }
          : {}),
        estado: payload.estado ?? 'borrador',
        hablanteAutor: payload.hablanteAutor ?? null,
        varianteDialectal: payload.varianteDialectal ?? null,
        descripcionEspanol: payload.descripcionEspanol ?? null,
        descripcionNamtrik: payload.descripcionNamtrik ?? null,
        licenciaComunitaria:
          payload.licenciaComunitaria ?? 'Propiedad Intelectual Colectiva del Pueblo Misak',
        subidoPorId: payload.subidoPorId ?? null,
      },
      include: MEDIO_RELATION_INCLUDE,
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
        ...(payload.campoSemanticoId !== undefined
          ? { campoSemanticoId: payload.campoSemanticoId }
          : {}),
        ...(payload.subcampoSemanticoId !== undefined
          ? { subcampoSemanticoId: payload.subcampoSemanticoId }
          : {}),
        ...(payload.microcampoId !== undefined ? { microcampoId: payload.microcampoId } : {}),
        ...(payload.proposito !== undefined ? { proposito: payload.proposito } : {}),
        ...(payload.duracionSegundos !== undefined
          ? { duracionSegundos: payload.duracionSegundos }
          : {}),
        ...(payload.anchoPx !== undefined ? { anchoPx: payload.anchoPx } : {}),
        ...(payload.altoPx !== undefined ? { altoPx: payload.altoPx } : {}),
        ...(payload.posterUuid !== undefined ? { posterUuid: payload.posterUuid } : {}),
        ...(payload.metadata !== undefined
          ? {
              metadata:
                payload.metadata === null
                  ? Prisma.JsonNull
                  : (payload.metadata as Prisma.InputJsonValue),
            }
          : {}),
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
        ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
        ...(payload.ratificadoPorId !== undefined
          ? { ratificadoPorId: payload.ratificadoPorId }
          : {}),
        ...(payload.ratificadoAt !== undefined ? { ratificadoAt: payload.ratificadoAt } : {}),
      },
      include: MEDIO_RELATION_INCLUDE,
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
      include: MEDIO_RELATION_INCLUDE,
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
    const andConditions: Record<string, unknown>[] = [];

    if (filter.sentidoId) {
      andConditions.push({
        OR: [{ sentidoId: filter.sentidoId }, { forma: { sentidoId: filter.sentidoId } }],
      });
    }

    if (filter.query) {
      const raw = filter.query.trim();
      const unaccented = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const withTheta = unaccented.replace(/o/gi, 'ɵ');
      const withO = unaccented.replace(/[ɵø∅ɨ]/gi, 'o');
      const variants = Array.from(new Set([raw, unaccented, withTheta, withO])).filter(Boolean);
      if (variants.length > 0) {
        andConditions.push({
          OR: variants.flatMap((q) => [
            { originalName: { contains: q, mode: 'insensitive' as const } },
            { hablanteAutor: { contains: q, mode: 'insensitive' as const } },
            { varianteDialectal: { contains: q, mode: 'insensitive' as const } },
            { descripcionEspanol: { contains: q, mode: 'insensitive' as const } },
            { descripcionNamtrik: { contains: q, mode: 'insensitive' as const } },
            { sentido: { codigo: { contains: q, mode: 'insensitive' as const } } },
            { sentido: { espanolGlosa: { contains: q, mode: 'insensitive' as const } } },
            { sentido: { nombreCientifico: { contains: q, mode: 'insensitive' as const } } },
            {
              sentido: {
                formas: { some: { lema: { contains: q, mode: 'insensitive' as const } } },
              },
            },
            { forma: { lema: { contains: q, mode: 'insensitive' as const } } },
            { campoSemantico: { espanolTermino: { contains: q, mode: 'insensitive' as const } } },
            {
              subcampoSemantico: { espanolTermino: { contains: q, mode: 'insensitive' as const } },
            },
            { microcampo: { espanolTermino: { contains: q, mode: 'insensitive' as const } } },
          ]),
        });
      }
    }

    const where = {
      deletedAt: null,
      ...(filter.tipo ? { tipo: filter.tipo } : {}),
      ...(filter.estado ? { estado: filter.estado } : {}),
      ...(filter.formaId ? { formaId: filter.formaId } : {}),
      ...(filter.campoSemanticoId ? { campoSemanticoId: filter.campoSemanticoId } : {}),
      ...(filter.subcampoSemanticoId ? { subcampoSemanticoId: filter.subcampoSemanticoId } : {}),
      ...(filter.microcampoId ? { microcampoId: filter.microcampoId } : {}),
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.medioCultural.findMany({
        where,
        include: MEDIO_RELATION_INCLUDE,
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
