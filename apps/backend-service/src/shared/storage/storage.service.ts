import type { Readable } from 'node:stream';

export interface SaveFileInput {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  subfolder?: 'audios' | 'imagenes' | 'videos' | 'documentos' | 'modelos_3d';
}

export interface SaveFileResult {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  hashSha256: string;
}

export interface StreamFileOptions {
  start?: number | undefined;
  end?: number | undefined;
}

export interface StreamFileResult {
  stream: Readable;
  totalSize: number;
  start: number;
  end: number;
  isPartial: boolean;
  contentType: string;
}

export interface IStorageService {
  save(input: SaveFileInput): Promise<SaveFileResult>;
  getStream(
    relativePath: string,
    mimetype: string,
    options?: StreamFileOptions,
  ): Promise<StreamFileResult>;
  delete(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  getAbsolutePath(relativePath: string): string;
}
