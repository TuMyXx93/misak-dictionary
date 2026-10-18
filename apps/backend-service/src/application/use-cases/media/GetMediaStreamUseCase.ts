import type { MedioCultural } from '../../../domain/entities/MedioCultural.js';
import type { IMedioCulturalRepository } from '../../../domain/interfaces/IMedioCulturalRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { IStorageService, StreamFileResult } from '../../../shared/storage/storage.service.js';

export interface GetMediaStreamInput {
  uuid: string;
  rangeHeader?: string;
  canReadDrafts?: boolean;
}

export interface GetMediaStreamOutput {
  streamResult: StreamFileResult;
  medio: MedioCultural;
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

    let start: number | undefined;
    let end: number | undefined;

    // Parsear cabecera HTTP Range (R-006): 'bytes=start-end' o 'bytes=start-'
    if (input.rangeHeader?.startsWith('bytes=')) {
      const parts = input.rangeHeader.replace(/bytes=/, '').split('-');
      const parsedStart = parseInt(parts[0], 10);
      const parsedEnd = parts[1] ? parseInt(parts[1], 10) : undefined;

      if (!Number.isNaN(parsedStart)) {
        start = parsedStart;
      }
      if (parsedEnd !== undefined && !Number.isNaN(parsedEnd)) {
        end = parsedEnd;
      }
    }

    const streamResult = await this.storageService.getStream(
      medio.filename,
      medio.mimetype,
      start !== undefined || end !== undefined ? { start, end } : undefined,
    );

    return {
      streamResult,
      medio,
    };
  }
}
