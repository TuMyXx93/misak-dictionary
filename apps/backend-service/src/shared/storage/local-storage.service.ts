import { createHash } from 'node:crypto';
import { createReadStream, existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  IStorageService,
  SaveFileInput,
  SaveFileResult,
  StreamFileOptions,
  StreamFileResult,
} from './storage.service.js';

export class LocalStorageService implements IStorageService {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ? path.resolve(baseDir) : path.resolve(process.cwd(), 'uploads/media');
  }

  public getAbsolutePath(relativePath: string): string {
    // Protección estricta contra Path Traversal: asegurar que la ruta resuelta quede dentro de baseDir
    const absolute = path.resolve(this.baseDir, relativePath);

    if (!absolute.startsWith(this.baseDir + path.sep) && absolute !== this.baseDir) {
      throw new Error('Intento de acceso a ruta no permitida (Path Traversal detectado)');
    }

    return absolute;
  }

  public async save(input: SaveFileInput): Promise<SaveFileResult> {
    const subfolder =
      input.subfolder ||
      (input.mimetype.startsWith('video/')
        ? 'videos'
        : input.mimetype.startsWith('audio/')
          ? 'audios'
          : 'imagenes');
    const targetDir = path.join(this.baseDir, subfolder);

    await fs.mkdir(targetDir, { recursive: true });

    // Sanitizar y asegurar nombre seguro (usar el filename provisto que ya debe ser seguro, p. ej. UUID.ext)
    const sanitizedFilename = path.basename(input.filename);
    const relativePath = path.join(subfolder, sanitizedFilename);
    const absolutePath = path.join(targetDir, sanitizedFilename);

    await fs.writeFile(absolutePath, input.buffer);

    const hashSha256 = createHash('sha256').update(input.buffer).digest('hex');

    return {
      relativePath,
      absolutePath,
      sizeBytes: input.buffer.length,
      hashSha256,
    };
  }

  public async getStream(
    relativePath: string,
    mimetype: string,
    options?: StreamFileOptions,
  ): Promise<StreamFileResult> {
    const absolutePath = this.getAbsolutePath(relativePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`Archivo no encontrado: ${relativePath}`);
    }

    const stat = await fs.stat(absolutePath);
    const totalSize = stat.size;

    if (options && (options.start !== undefined || options.end !== undefined)) {
      const start = options.start ?? 0;
      const end = options.end !== undefined ? Math.min(options.end, totalSize - 1) : totalSize - 1;

      if (start > end || start >= totalSize) {
        throw new Error(`Rango de bytes inválido: ${start}-${end}/${totalSize}`);
      }

      const stream = createReadStream(absolutePath, { start, end });

      return {
        stream,
        totalSize,
        start,
        end,
        isPartial: true,
        contentType: mimetype,
      };
    }

    const stream = createReadStream(absolutePath);

    return {
      stream,
      totalSize,
      start: 0,
      end: Math.max(0, totalSize - 1),
      isPartial: false,
      contentType: mimetype,
    };
  }

  public async delete(relativePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(relativePath);
    if (existsSync(absolutePath)) {
      await fs.unlink(absolutePath);
    }
  }

  public async exists(relativePath: string): Promise<boolean> {
    const absolutePath = this.getAbsolutePath(relativePath);
    return existsSync(absolutePath);
  }
}
