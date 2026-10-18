/**
 * Entidad de dominio: MedioCultural
 * Spec 007 - Medios Escalonados (Fase 5)
 * Representa un archivo multimedia (audio o imagen) vinculado a sentidos o formas léxicas
 */

export type TipoMedio = 'audio' | 'imagen';

export type PropositoMedio =
  | 'pronunciacion_lema'
  | 'contexto_oracion'
  | 'pregunta_dialogo'
  | 'respuesta_dialogo'
  | 'ilustracion_cultural'
  | 'fotografia_territorio';

export type EstadoMedio = 'borrador' | 'ratificado';

export interface MedioCultural {
  id: bigint;
  uuid: string;
  sentidoId: bigint | null;
  formaId: bigint | null;
  tipo: TipoMedio;
  proposito: PropositoMedio;
  filename: string;
  originalName: string;
  mimetype: string;
  sizeBytes: bigint;
  hashSha256: string;
  duracionSegundos: number | null;
  anchoPx: number | null;
  altoPx: number | null;
  estado: EstadoMedio;
  hablanteAutor: string | null;
  varianteDialectal: string | null;
  descripcionEspanol: string | null;
  descripcionNamtrik: string | null;
  licenciaComunitaria: string;
  subidoPorId: bigint | null;
  ratificadoPorId: bigint | null;
  ratificadoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateMedioCulturalPayload {
  uuid: string;
  sentidoId?: bigint | null;
  formaId?: bigint | null;
  tipo: TipoMedio;
  proposito: PropositoMedio;
  filename: string;
  originalName: string;
  mimetype: string;
  sizeBytes: bigint;
  hashSha256: string;
  duracionSegundos?: number | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  estado?: EstadoMedio;
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria?: string;
  subidoPorId?: bigint | null;
}

export interface UpdateMedioCulturalMetadataPayload {
  sentidoId?: bigint | null;
  formaId?: bigint | null;
  proposito?: PropositoMedio;
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria?: string;
}

export const TIPOS_MEDIO_VALIDOS: readonly TipoMedio[] = ['audio', 'imagen'] as const;

export const PROPOSITOS_MEDIO_VALIDOS: readonly PropositoMedio[] = [
  'pronunciacion_lema',
  'contexto_oracion',
  'pregunta_dialogo',
  'respuesta_dialogo',
  'ilustracion_cultural',
  'fotografia_territorio',
] as const;

export const ESTADOS_MEDIO_VALIDOS: readonly EstadoMedio[] = ['borrador', 'ratificado'] as const;

export const MIMETYPES_AUDIO_PERMITIDOS = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
] as const;

export const MIMETYPES_IMAGEN_PERMITIDOS = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
] as const;

export const MAX_SIZE_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_SIZE_IMAGEN_BYTES = 10 * 1024 * 1024; // 10 MB

export function isTipoMedioValido(tipo: string): tipo is TipoMedio {
  return TIPOS_MEDIO_VALIDOS.includes(tipo as TipoMedio);
}

export function isPropositoValido(proposito: string): proposito is PropositoMedio {
  return PROPOSITOS_MEDIO_VALIDOS.includes(proposito as PropositoMedio);
}

export function isMimetypePermitido(mimetype: string, tipo: TipoMedio): boolean {
  if (tipo === 'audio') {
    return (MIMETYPES_AUDIO_PERMITIDOS as readonly string[]).includes(mimetype);
  }
  if (tipo === 'imagen') {
    return (MIMETYPES_IMAGEN_PERMITIDOS as readonly string[]).includes(mimetype);
  }
  return false;
}
