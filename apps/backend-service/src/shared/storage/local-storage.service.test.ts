import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageService } from './local-storage.service.js';

describe('LocalStorageService', () => {
  const testBaseDir = path.join('/tmp', `misak-media-test-${Date.now()}`);
  let storageService: LocalStorageService;

  beforeEach(() => {
    storageService = new LocalStorageService(testBaseDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignorar si no existe
    }
  });

  it('guarda un archivo de audio en el subdirectorio audios y calcula SHA-256', async () => {
    const buffer = Buffer.from('AUDIO_TEST_PAYLOAD');
    const result = await storageService.save({
      buffer,
      filename: 'sample-uuid.mp3',
      mimetype: 'audio/mpeg',
    });

    expect(result.relativePath).toBe(path.join('audios', 'sample-uuid.mp3'));
    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.hashSha256).toBeDefined();
    expect(result.hashSha256.length).toBe(64);

    const exists = await storageService.exists(result.relativePath);
    expect(exists).toBe(true);
  });

  it('guarda un archivo de imagen en el subdirectorio imagenes', async () => {
    const buffer = Buffer.from('IMAGE_TEST_PAYLOAD');
    const result = await storageService.save({
      buffer,
      filename: 'sample-uuid.webp',
      mimetype: 'image/webp',
    });

    expect(result.relativePath).toBe(path.join('imagenes', 'sample-uuid.webp'));
    const exists = await storageService.exists(result.relativePath);
    expect(exists).toBe(true);
  });

  it('guarda un archivo de video en el subdirectorio videos cuando mimetype comienza por video/', async () => {
    const buffer = Buffer.from('VIDEO_TEST_PAYLOAD');
    const result = await storageService.save({
      buffer,
      filename: 'sample-uuid.mp4',
      mimetype: 'video/mp4',
    });

    expect(result.relativePath).toBe(path.join('videos', 'sample-uuid.mp4'));
    const exists = await storageService.exists(result.relativePath);
    expect(exists).toBe(true);
  });

  it('bloquea intentos de Path Traversal', () => {
    expect(() => {
      storageService.getAbsolutePath('../../../../etc/passwd');
    }).toThrow('Path Traversal detectado');
  });

  it('obtiene un stream completo de un archivo existente', async () => {
    const buffer = Buffer.from('CONTENIDO_COMPLETO_PARA_STREAM');
    const saved = await storageService.save({
      buffer,
      filename: 'stream-test.mp3',
      mimetype: 'audio/mpeg',
    });

    const streamResult = await storageService.getStream(saved.relativePath, 'audio/mpeg');
    expect(streamResult.isPartial).toBe(false);
    expect(streamResult.totalSize).toBe(buffer.length);
    expect(streamResult.start).toBe(0);
    expect(streamResult.end).toBe(buffer.length - 1);

    // Leer el stream y comprobar contenido
    const chunks: Buffer[] = [];
    for await (const chunk of streamResult.stream) {
      chunks.push(chunk as Buffer);
    }
    const readBuffer = Buffer.concat(chunks);
    expect(readBuffer.toString('utf8')).toBe('CONTENIDO_COMPLETO_PARA_STREAM');
  });

  it('obtiene un stream parcial (HTTP Range 206) con los bytes solicitados', async () => {
    const buffer = Buffer.from('0123456789ABCDEF'); // 16 bytes
    const saved = await storageService.save({
      buffer,
      filename: 'range-test.mp3',
      mimetype: 'audio/mpeg',
    });

    const streamResult = await storageService.getStream(saved.relativePath, 'audio/mpeg', {
      start: 4,
      end: 9,
    });

    expect(streamResult.isPartial).toBe(true);
    expect(streamResult.totalSize).toBe(16);
    expect(streamResult.start).toBe(4);
    expect(streamResult.end).toBe(9);

    const chunks: Buffer[] = [];
    for await (const chunk of streamResult.stream) {
      chunks.push(chunk as Buffer);
    }
    const readBuffer = Buffer.concat(chunks);
    expect(readBuffer.toString('utf8')).toBe('456789'); // Bytes del 4 al 9
  });

  it('elimina un archivo correctamente', async () => {
    const buffer = Buffer.from('BORRAME');
    const saved = await storageService.save({
      buffer,
      filename: 'delete-me.mp3',
      mimetype: 'audio/mpeg',
    });

    expect(await storageService.exists(saved.relativePath)).toBe(true);
    await storageService.delete(saved.relativePath);
    expect(await storageService.exists(saved.relativePath)).toBe(false);
  });
});
