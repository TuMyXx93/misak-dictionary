import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type {
  IStorageService,
  StreamFileOptions,
  StreamFileResult,
} from '../../../shared/storage/storage.service.js';

export interface GetMediaStreamInput {
  uuid: string;
  rangeHeader?: string | undefined;
  canReadDrafts?: boolean | undefined;
  headOnly?: boolean | undefined;
}

export interface GetMediaStreamOutput {
  streamResult: StreamFileResult;
  medio: MedioCultural;
}

/**
 * Parsea la cabecera HTTP Range (RFC 9110 §14.1.2):
 * soporta `bytes=start-end`, `bytes=start-` y rangos de sufijo `bytes=-N`.
 */
export function parseByteRangeHeader(rangeHeader?: string): StreamFileOptions | null {
  if (!rangeHeader) {
    return null;
  }

  const trimmedHeader = rangeHeader.trim();
  if (!trimmedHeader.toLowerCase().startsWith('bytes=')) {
    return null;
  }

  const rawSpec = trimmedHeader.slice(6).trim();
  if (!rawSpec || rawSpec.includes(',')) {
    // Múltiples rangos no soportados: responder entidad completa (200) o inválido si vacío
    return rawSpec ? null : { invalidRange: true };
  }

  const match = /^(\d*)-(\d*)$/.exec(rawSpec);
  if (!match) {
    return { invalidRange: true };
  }

  const rawStart = match[1] ?? '';
  const rawEnd = match[2] ?? '';

  if (rawStart === '' && rawEnd === '') {
    return { invalidRange: true };
  }

  // Rango sufijo: bytes=-N (últimos N bytes)
  if (rawStart === '') {
    const suffixLength = Number.parseInt(rawEnd, 10);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return { invalidRange: true };
    }
    return { suffixLength };
  }

  const start = Number.parseInt(rawStart, 10);
  if (!Number.isSafeInteger(start) || start < 0) {
    return { invalidRange: true };
  }

  if (rawEnd === '') {
    return { start, end: undefined };
  }

  const end = Number.parseInt(rawEnd, 10);
  if (!Number.isSafeInteger(end) || end < start) {
    return { invalidRange: true };
  }

  return { start, end };
}

export class GetMediaStreamUseCase {
  constructor(
    private readonly mediaRepository: IMedioCulturalRepository,
    private readonly storageService: IStorageService,
  ) {}

  async execute(input: GetMediaStreamInput): Promise<GetMediaStreamOutput> {
    const medio = await this.mediaRepository.findByUuid(input.uuid);

    if (!medio) {
      throw new AppError('Archivo multimedia no encontrado', 404);
    }

    // Gobernanza Cultural: Si el medio está en estado borrador, solo usuarios con permiso de lectura pueden accederlo (R-002)
    if (medio.estado === 'borrador' && !input.canReadDrafts) {
      throw new AppError(
        'El archivo multimedia se encuentra en estado borrador y no está disponible públicamente',
        403,
      );
    }

    const parsedRange = parseByteRangeHeader(input.rangeHeader);
    const streamOptions: StreamFileOptions | undefined =
      parsedRange || input.headOnly
        ? {
            ...(parsedRange ?? {}),
            ...(input.headOnly ? { headOnly: true } : {}),
          }
        : undefined;

    const streamResult = await this.storageService.getStream(
      medio.filename,
      medio.mimetype,
      streamOptions,
    );

    return {
      streamResult,
      medio,
    };
  }
}
