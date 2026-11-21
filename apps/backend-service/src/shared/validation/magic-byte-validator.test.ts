import { describe, expect, it } from 'vitest';
import { detectMimetype, validateMediaFile } from './magic-byte-validator.js';

describe('MagicByteValidator', () => {
  describe('detectMimetype', () => {
    it('detecta PNG correctamente por su firma de 8 bytes', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(detectMimetype(pngBuffer)).toBe('image/png');
    });

    it('detecta JPEG correctamente por sus bytes iniciales FF D8 FF', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMimetype(jpegBuffer)).toBe('image/jpeg');
    });

    it('detecta WebP dentro del contenedor RIFF', () => {
      // RIFF....WEBP
      const webpBuffer = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0x20, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP', 'ascii'),
        Buffer.from('VP8 ', 'ascii'),
      ]);
      expect(detectMimetype(webpBuffer)).toBe('image/webp');
    });

    it('detecta WAV dentro del contenedor RIFF', () => {
      // RIFF....WAVE
      const wavBuffer = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0x24, 0x08, 0x00, 0x00]),
        Buffer.from('WAVE', 'ascii'),
        Buffer.from('fmt ', 'ascii'),
      ]);
      expect(detectMimetype(wavBuffer)).toBe('audio/wav');
    });

    it('detecta Ogg por la firma OggS', () => {
      const oggBuffer = Buffer.concat([
        Buffer.from('OggS', 'ascii'),
        Buffer.from([0x00, 0x02, 0x00, 0x00]),
      ]);
      expect(detectMimetype(oggBuffer)).toBe('audio/ogg');
    });

    it('detecta WebM / Matroska de audio por EBML ID sin pistas de video', () => {
      const webmBuffer = Buffer.concat([
        Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
        Buffer.from('...doctype=webm...'),
      ]);
      expect(detectMimetype(webmBuffer)).toBe('audio/webm');
    });

    it('detecta WebM de video cuando contiene codec V_VP9 o V_AV1 en los primeros 4096 bytes', () => {
      const webmVideoBuffer = Buffer.concat([
        Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
        Buffer.from('...webm...TrackEntry...V_VP9...'),
      ]);
      expect(detectMimetype(webmVideoBuffer)).toBe('video/webm');
    });

    it('detecta Ogg de video cuando contiene codec theora en los primeros 4096 bytes', () => {
      const oggVideoBuffer = Buffer.concat([
        Buffer.from('OggS', 'ascii'),
        Buffer.from([0x00, 0x02, 0x00, 0x00, 0x80]),
        Buffer.from('theora', 'ascii'),
      ]);
      expect(detectMimetype(oggVideoBuffer)).toBe('video/ogg');
    });

    it('detecta MP4 ISO BMFF con firma ftyp y brands válidos (isom, mp42, qt  )', () => {
      const mp4Isom = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x18]),
        Buffer.from('ftypisom', 'ascii'),
        Buffer.from([0x00, 0x00, 0x02, 0x00]),
        Buffer.from('isommp42', 'ascii'),
      ]);
      expect(detectMimetype(mp4Isom)).toBe('video/mp4');

      const movQt = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x14]),
        Buffer.from('ftypqt  ', 'ascii'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('qt  ', 'ascii'),
      ]);
      expect(detectMimetype(movQt)).toBe('video/mp4');
    });

    it('no confunde imágenes HEIC (ftypheic) con video/mp4', () => {
      const heicBuffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x18]),
        Buffer.from('ftypheic', 'ascii'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('mif1heic', 'ascii'),
      ]);
      expect(detectMimetype(heicBuffer)).toBeNull();
    });

    it('detecta MP3 con cabecera ID3v2', () => {
      const mp3Id3 = Buffer.concat([
        Buffer.from('ID3', 'ascii'),
        Buffer.from([0x03, 0x00, 0x00, 0x00, 0x00, 0x0a]),
      ]);
      expect(detectMimetype(mp3Id3)).toBe('audio/mpeg');
    });

    it('detecta MP3 por sincronización de frame binario (0xFF 0xFB)', () => {
      const mp3Frame = Buffer.from([0xff, 0xfb, 0x90, 0x44, 0x00, 0x00]);
      expect(detectMimetype(mp3Frame)).toBe('audio/mpeg');
    });

    it('detecta SVG válido en formato XML de texto', () => {
      const svgBuffer = Buffer.from(
        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>',
      );
      expect(detectMimetype(svgBuffer)).toBe('image/svg+xml');
    });

    it('detecta SVG simple que comienza directamente con <svg', () => {
      const svgBuffer = Buffer.from(
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
      );
      expect(detectMimetype(svgBuffer)).toBe('image/svg+xml');
    });

    it('retorna null para un ejecutable Linux ELF (0x7F ELF)', () => {
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01]);
      expect(detectMimetype(elfBuffer)).toBeNull();
    });

    it('retorna null para un ejecutable Windows PE / DOS (MZ)', () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      expect(detectMimetype(exeBuffer)).toBeNull();
    });

    it('retorna null si el buffer es menor a 4 bytes o vacío', () => {
      expect(detectMimetype(Buffer.alloc(0))).toBeNull();
      expect(detectMimetype(Buffer.from([0x01, 0x02]))).toBeNull();
    });
  });

  describe('validateMediaFile', () => {
    it('valida exitosamente un audio MP3 cuando el mimetype coincide', () => {
      const mp3Buffer = Buffer.concat([
        Buffer.from('ID3', 'ascii'),
        Buffer.from([0x03, 0x00, 0x00, 0x00, 0x00, 0x0a]),
      ]);

      const result = validateMediaFile(mp3Buffer, 'audio/mpeg', 'audio');
      expect(result.isValid).toBe(true);
      expect(result.detectedMimetype).toBe('audio/mpeg');
    });

    it('acepta "audio/mp3" como alias declarado de "audio/mpeg"', () => {
      const mp3Buffer = Buffer.from([0xff, 0xfb, 0x90, 0x44]);
      const result = validateMediaFile(mp3Buffer, 'audio/mp3', 'audio');
      expect(result.isValid).toBe(true);
      expect(result.detectedMimetype).toBe('audio/mpeg');
    });

    it('rechaza un archivo cuando los magic bytes no coinciden con el tipo declarado (ataque de extensión engañosa)', () => {
      // Un ejecutable ELF con nombre engañoso y mimetype declarado 'audio/mpeg'
      const maliciousBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01]);

      const result = validateMediaFile(maliciousBuffer, 'audio/mpeg', 'audio');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cabecera binaria no reconocida');
    });

    it('rechaza una imagen enviada a un endpoint que espera audio', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);

      const result = validateMediaFile(pngBuffer, 'image/png', 'audio');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Se esperaba un archivo de audio pero se detectó image/png');
    });

    it('rechaza un archivo de audio enviado a un endpoint que espera imagen', () => {
      const oggBuffer = Buffer.concat([
        Buffer.from('OggS', 'ascii'),
        Buffer.from([0x00, 0x02, 0x00, 0x00]),
      ]);

      const result = validateMediaFile(oggBuffer, 'audio/ogg', 'imagen');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Se esperaba un archivo de imagen pero se detectó audio/ogg');
    });

    it('rechaza un archivo vacío', () => {
      const result = validateMediaFile(Buffer.alloc(0), 'audio/mpeg');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo está vacío');
    });

    it('valida exitosamente un archivo MP4 cuando expectedTipo es video', () => {
      const mp4Buffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x14]),
        Buffer.from('ftypmp42', 'ascii'),
        Buffer.alloc(12),
      ]);
      const result = validateMediaFile(mp4Buffer, 'video/mp4', 'video');
      expect(result.isValid).toBe(true);
      expect(result.detectedMimetype).toBe('video/mp4');
    });

    it('normaliza contenedores EBML y OggS a video/webm y video/ogg cuando TrackEntry está más adelante', () => {
      const ebmlWithoutEarlyTrack = Buffer.concat([
        Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
        Buffer.from('...webm...'),
      ]);
      const webmResult = validateMediaFile(ebmlWithoutEarlyTrack, 'video/webm', 'video');
      expect(webmResult.isValid).toBe(true);
      expect(webmResult.detectedMimetype).toBe('video/webm');

      const oggWithoutEarlyTheora = Buffer.concat([
        Buffer.from('OggS', 'ascii'),
        Buffer.from([0x00, 0x02, 0x00, 0x00]),
      ]);
      const oggResult = validateMediaFile(oggWithoutEarlyTheora, 'video/ogg', 'video');
      expect(oggResult.isValid).toBe(true);
      expect(oggResult.detectedMimetype).toBe('video/ogg');
    });

    it('rechaza una imagen PNG enviada cuando se espera un video', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const result = validateMediaFile(pngBuffer, 'video/mp4', 'video');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Se esperaba un archivo de video pero se detectó image/png');
    });

    it('rechaza archivos SVG con scripts o manejadores inline ejecutables (XSS)', () => {
      const xssSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>',
      );
      const result = validateMediaFile(xssSvg, 'image/svg+xml', 'imagen');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no permitidos por seguridad');
    });
  });
});
