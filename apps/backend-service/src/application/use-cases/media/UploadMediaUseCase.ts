import { randomUUID } from 'node:crypto';
import type {
  MedioCultural,
  PropositoMedio,
  TipoMedio,
} from '../../../domain/entities/MedioCultural.js';
import {
  isPropositoValido,
  isTipoMedioValido,
  MAX_SIZE_AUDIO_BYTES,
  MAX_SIZE_DOCUMENTO_BYTES,
  MAX_SIZE_IMAGEN_BYTES,
  MAX_SIZE_MODELO_3D_BYTES,
  MAX_SIZE_VIDEO_BYTES,
} from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { IStorageService } from '../../../shared/storage/storage.service.js';
import { validateMediaFile } from '../../../shared/validation/magic-byte-validator.js';

export interface UploadMediaInput {
  fileBuffer: Buffer;
  originalFilename: string;
  declaredMimetype: string;
  tipo: TipoMedio;
  proposito: PropositoMedio;
  sentidoId?: bigint | null | undefined;
  formaId?: bigint | null | undefined;
  campoSemanticoId?: bigint | null | undefined;
  subcampoSemanticoId?: bigint | null | undefined;
  microcampoId?: bigint | null | undefined;
  hablanteAutor?: string | null | undefined;
  varianteDialectal?: string | null | undefined;
  descripcionEspanol?: string | null | undefined;
  descripcionNamtrik?: string | null | undefined;
  licenciaComunitaria?: string | undefined;
  duracionSegundos?: number | null | undefined;
  anchoPx?: number | null | undefined;
  altoPx?: number | null | undefined;
  posterUuid?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  userId?: bigint | null | undefined;
}

const EXTENSION_MAP: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

export class UploadMediaUseCase {
  constructor(
    private readonly mediaRepository: IMedioCulturalRepository,
    private readonly storageService: IStorageService,
  ) {}

  async execute(input: UploadMediaInput): Promise<MedioCultural> {
    // 1. Validar tipo y propósito
    if (!isTipoMedioValido(input.tipo)) {
      throw new AppError(`Tipo de medio inválido: ${input.tipo}`, 400);
    }
    if (!isPropositoValido(input.proposito)) {
      throw new AppError(`Propósito de medio inválido: ${input.proposito}`, 400);
    }

    // 2. Validar límite de tamaño según tipo de medio
    if (input.tipo === 'audio' && input.fileBuffer.length > MAX_SIZE_AUDIO_BYTES) {
      throw new AppError(
        `El archivo de audio excede el tamaño máximo permitido de 10 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }
    if (input.tipo === 'imagen' && input.fileBuffer.length > MAX_SIZE_IMAGEN_BYTES) {
      throw new AppError(
        `El archivo de imagen excede el tamaño máximo permitido de 10 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }
    if (input.tipo === 'video' && input.fileBuffer.length > MAX_SIZE_VIDEO_BYTES) {
      throw new AppError(
        `El archivo de video excede el tamaño máximo permitido de 100 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }
    if (input.tipo === 'documento' && input.fileBuffer.length > MAX_SIZE_DOCUMENTO_BYTES) {
      throw new AppError(
        `El archivo de documento excede el tamaño máximo permitido de 25 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }
    if (input.tipo === 'modelo_3d' && input.fileBuffer.length > MAX_SIZE_MODELO_3D_BYTES) {
      throw new AppError(
        `El archivo de modelo 3D excede el tamaño máximo permitido de 50 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }

    // 3. Validar Magic Bytes de cabecera binaria
    const validation = validateMediaFile(input.fileBuffer, input.declaredMimetype, input.tipo);
    if (!validation.isValid || !validation.detectedMimetype) {
      throw new AppError(
        validation.error || 'Tipo de archivo no permitido o cabecera binaria corrupta',
        400,
      );
    }

    const detectedMimetype = validation.detectedMimetype;
    const extension = EXTENSION_MAP[detectedMimetype] || 'bin';
    const uuid = randomUUID();
    const safeFilename = `${uuid}.${extension}`;
    const subfolder =
      input.tipo === 'video'
        ? 'videos'
        : input.tipo === 'audio'
          ? 'audios'
          : input.tipo === 'documento'
            ? 'documentos'
            : input.tipo === 'modelo_3d'
              ? 'modelos_3d'
              : 'imagenes';

    // 4. Resolver y validar coherencia sentidoId <-> formaId
    let resolvedSentidoId = input.sentidoId ?? null;
    if (input.formaId != null && this.mediaRepository.findSentidoIdByFormaId) {
      const parentSentidoId = await this.mediaRepository.findSentidoIdByFormaId(input.formaId);
      if (parentSentidoId === null) {
        throw new AppError('La forma léxica seleccionada no existe', 400);
      }
      if (resolvedSentidoId !== null && parentSentidoId !== resolvedSentidoId) {
        throw new AppError('La forma léxica seleccionada no pertenece al sentido indicado', 400);
      }
      if (resolvedSentidoId === null) {
        resolvedSentidoId = parentSentidoId;
      }
    }

    // 5. Guardar en almacenamiento seguro (subdirectorios audios / imagenes / videos)
    const saved = await this.storageService.save({
      buffer: input.fileBuffer,
      filename: safeFilename,
      mimetype: detectedMimetype,
      subfolder,
    });

    // 6. Crear registro en BD en estado 'borrador' (Gobernanza Cultural, R-002)
    const medio = await this.mediaRepository.create({
      uuid,
      sentidoId: resolvedSentidoId,
      formaId: input.formaId ?? null,
      campoSemanticoId: input.campoSemanticoId ?? null,
      subcampoSemanticoId: input.subcampoSemanticoId ?? null,
      microcampoId: input.microcampoId ?? null,
      tipo: input.tipo,
      proposito: input.proposito,
      filename: saved.relativePath,
      originalName: input.originalFilename,
      mimetype: detectedMimetype,
      sizeBytes: BigInt(saved.sizeBytes),
      hashSha256: saved.hashSha256,
      duracionSegundos: input.duracionSegundos ?? null,
      anchoPx: input.anchoPx ?? null,
      altoPx: input.altoPx ?? null,
      posterUuid: input.posterUuid ?? null,
      metadata: input.metadata,
      estado: 'borrador', // Estado inicial obligatorio
      hablanteAutor: input.hablanteAutor ?? null,
      varianteDialectal: input.varianteDialectal ?? null,
      descripcionEspanol: input.descripcionEspanol ?? null,
      descripcionNamtrik: input.descripcionNamtrik ?? null,
      licenciaComunitaria:
        input.licenciaComunitaria ?? 'Propiedad Intelectual Colectiva del Pueblo Misak',
      subidoPorId: input.userId ?? null,
    });

    return medio;
  }
}
