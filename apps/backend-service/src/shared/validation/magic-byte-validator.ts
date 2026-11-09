import {
  MIMETYPES_AUDIO_PERMITIDOS,
  MIMETYPES_IMAGEN_PERMITIDOS,
  MIMETYPES_VIDEO_PERMITIDOS,
  type TipoMedio,
} from '../../domain/entities/MedioCultural.js';

export interface ValidationResult {
  isValid: boolean;
  detectedMimetype: string | null;
  error?: string;
}

const MP4_FTYP_BRANDS = new Set([
  'isom',
  'iso2',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'M4V ',
  'dash',
  'MSNV',
  'qt  ',
]);

/**
 * Detecta el mimetype real de un buffer mediante la inspección de magic bytes (cabeceras binarias).
 */
export function detectMimetype(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 3. RIFF container (WAV o WEBP):
  // Primeros 4 bytes: 'RIFF' (0x52 0x49 0x46 0x46)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    const riffType = buffer.toString('ascii', 8, 12);
    if (riffType === 'WAVE') {
      return 'audio/wav';
    }
    if (riffType === 'WEBP') {
      return 'image/webp';
    }
  }

  // 4. ISO BMFF (MP4 / QuickTime): 'ftyp' en offset 4..8 con brands permitidos
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const majorBrand = buffer.toString('ascii', 8, 12);
    if (MP4_FTYP_BRANDS.has(majorBrand)) {
      return 'video/mp4';
    }
    if (buffer.length >= 20) {
      const boxSize = buffer.readUInt32BE(0);
      const limit = Math.min(boxSize >= 20 ? boxSize : 64, buffer.length, 64);
      for (let offset = 16; offset + 4 <= limit; offset += 4) {
        if (MP4_FTYP_BRANDS.has(buffer.toString('ascii', offset, offset + 4))) {
          return 'video/mp4';
        }
      }
    }
  }

  // 5. Ogg: 'OggS' (0x4F 0x67 0x67 0x53)
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    const oggSlice = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    if (oggSlice.toLowerCase().includes('theora')) {
      return 'video/ogg';
    }
    return 'audio/ogg';
  }

  // 6. WebM / Matroska: 1A 45 DF A3 (EBML)
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    const ebmlSlice = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    if (
      ebmlSlice.includes('V_VP8') ||
      ebmlSlice.includes('V_VP9') ||
      ebmlSlice.includes('V_AV1') ||
      ebmlSlice.includes('V_MPEG4')
    ) {
      return 'video/webm';
    }
    return 'audio/webm';
  }

  // 7. MP3:
  // a) ID3v2: 'ID3' (0x49 0x44 0x33)
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return 'audio/mpeg';
  }
  // b) MP3 sync frame: 11 bits en 1 (0xFF seguido de 0xE0 en los 3 bits superiores)
  const b0 = buffer[0];
  const b1 = buffer[1];
  if (b0 === 0xff && b1 !== undefined && (b1 & 0xe0) === 0xe0 && (b1 & 0x18) !== 0x08) {
    return 'audio/mpeg';
  }

  // 8. SVG: Texto XML o etiqueta <svg
  if (isSvgBuffer(buffer)) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * Determina de forma segura si un buffer corresponde a un archivo SVG válido
 */
function isSvgBuffer(buffer: Buffer): boolean {
  // Limitar escaneo a los primeros 1024 bytes
  const scanLimit = Math.min(buffer.length, 1024);
  const chunk = buffer.subarray(0, scanLimit);

  // Un SVG no debe tener bytes nulos (0x00)
  for (let i = 0; i < scanLimit; i++) {
    if (chunk[i] === 0x00) {
      return false;
    }
  }

  const text = chunk.toString('utf8').trim().toLowerCase();
  return text.includes('<svg') || (text.startsWith('<?xml') && text.includes('<svg'));
}

/**
 * Valida un archivo contra su tipo esperado y su mimetype declarado.
 */
export function validateMediaFile(
  buffer: Buffer,
  declaredMimetype: string,
  expectedTipo?: TipoMedio,
): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      detectedMimetype: null,
      error: 'El archivo está vacío',
    };
  }

  let detected = detectMimetype(buffer);

  if (!detected) {
    return {
      isValid: false,
      detectedMimetype: null,
      error: 'Cabecera binaria no reconocida o tipo de archivo no permitido',
    };
  }

  // En WebM (EBML) y Ogg (OggS), la cabecera de contenedor es idéntica cuando el TrackEntry
  // está más adelante de los primeros 4096 bytes; normalizamos cuando el contexto es video.
  if (
    detected === 'audio/webm' &&
    (expectedTipo === 'video' || declaredMimetype === 'video/webm')
  ) {
    detected = 'video/webm';
  } else if (
    detected === 'audio/ogg' &&
    (expectedTipo === 'video' || declaredMimetype === 'video/ogg')
  ) {
    detected = 'video/ogg';
  }

  // Si se especificó el tipo esperado ('audio', 'imagen' o 'video'), validar que pertenezca
  if (expectedTipo === 'audio') {
    if (!(MIMETYPES_AUDIO_PERMITIDOS as readonly string[]).includes(detected)) {
      return {
        isValid: false,
        detectedMimetype: detected,
        error: `Se esperaba un archivo de audio pero se detectó ${detected}`,
      };
    }
  } else if (expectedTipo === 'imagen') {
    if (!(MIMETYPES_IMAGEN_PERMITIDOS as readonly string[]).includes(detected)) {
      return {
        isValid: false,
        detectedMimetype: detected,
        error: `Se esperaba un archivo de imagen pero se detectó ${detected}`,
      };
    }
  } else if (expectedTipo === 'video') {
    if (!(MIMETYPES_VIDEO_PERMITIDOS as readonly string[]).includes(detected)) {
      return {
        isValid: false,
        detectedMimetype: detected,
        error: `Se esperaba un archivo de video pero se detectó ${detected}`,
      };
    }
  }

  // Validar coincidencia con el mimetype declarado (tolerando audio/mp3 vs audio/mpeg)
  const normalizedDeclared = declaredMimetype === 'audio/mp3' ? 'audio/mpeg' : declaredMimetype;
  if (normalizedDeclared && normalizedDeclared !== detected) {
    return {
      isValid: false,
      detectedMimetype: detected,
      error: `Discrepancia de tipo MIME: declarado '${declaredMimetype}', pero los magic bytes corresponden a '${detected}'`,
    };
  }

  return {
    isValid: true,
    detectedMimetype: detected,
  };
}
