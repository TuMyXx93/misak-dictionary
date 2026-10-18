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
  MAX_SIZE_IMAGEN_BYTES,
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
  sentidoId?: bigint | null;
  formaId?: bigint | null;
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria?: string;
  duracionSegundos?: number | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  userId?: bigint | null;
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

    // 2. Validar que exista asociación con sentido o forma
    if (!input.sentidoId && !input.formaId) {
      throw new AppError(
        'El medio cultural debe estar asociado al menos a un sentido léxico o una forma en Namtrik',
        400,
      );
    }

    // 3. Validar límite de tamaño
    if (input.tipo === 'audio' && input.fileBuffer.length > MAX_SIZE_AUDIO_BYTES) {
      throw new AppError(
        `El archivo de audio excede el tamaño máximo permitido de 5 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }
    if (input.tipo === 'imagen' && input.fileBuffer.length > MAX_SIZE_IMAGEN_BYTES) {
      throw new AppError(
        `El archivo de imagen excede el tamaño máximo permitido de 10 MB (${(input.fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        400,
      );
    }

    // 4. Validar Magic Bytes de cabecera binaria
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

    // 5. Guardar en almacenamiento seguro (subdirectorios audios / imagenes)
    const saved = await this.storageService.save({
      buffer: input.fileBuffer,
      filename: safeFilename,
      mimetype: detectedMimetype,
      subfolder: input.tipo === 'audio' ? 'audios' : 'imagenes',
    });

    // 6. Crear registro en BD en estado 'borrador' (Gobernanza Cultural, R-002)
    const medio = await this.mediaRepository.create({
      uuid,
      sentidoId: input.sentidoId ?? null,
      formaId: input.formaId ?? null,
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
