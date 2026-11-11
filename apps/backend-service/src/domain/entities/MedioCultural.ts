/**
 * Entidad de dominio: MedioCultural
 * Spec 007 — Medios Escalonados (Audio, Imagen, Video y Taxonomía)
 * Representa un archivo multimedia (audio, imagen o video) vinculado a sentidos, formas o nodos taxonómicos
 */

export type TipoMedio = 'audio' | 'imagen' | 'video' | 'documento' | 'modelo_3d';

export type PropositoMedio =
  | 'pronunciacion_lema'
  | 'contexto_oracion'
  | 'pregunta_dialogo'
  | 'respuesta_dialogo'
  | 'ilustracion_cultural'
  | 'fotografia_territorio'
  | 'registro_practica_cultural'
  | 'relato_oral_video'
  | 'demostracion_uso'
  | 'recorrido_territorial'
  | 'documento_etnolinguistico';

export type EstadoMedio = 'borrador' | 'ratificado';

export interface MedioCultural {
  id: bigint;
  uuid: string;
  sentidoId: bigint | null;
  formaId: bigint | null;
  campoSemanticoId: bigint | null;
  subcampoSemanticoId: bigint | null;
  microcampoId: bigint | null;
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
  posterUuid: string | null;
  metadata: Record<string, unknown> | null;
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
  sentidoId?: bigint | null | undefined;
  formaId?: bigint | null | undefined;
  campoSemanticoId?: bigint | null | undefined;
  subcampoSemanticoId?: bigint | null | undefined;
  microcampoId?: bigint | null | undefined;
  tipo: TipoMedio;
  proposito: PropositoMedio;
  filename: string;
  originalName: string;
  mimetype: string;
  sizeBytes: bigint;
  hashSha256: string;
  duracionSegundos?: number | null | undefined;
  anchoPx?: number | null | undefined;
  altoPx?: number | null | undefined;
  posterUuid?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  estado?: EstadoMedio | undefined;
  hablanteAutor?: string | null | undefined;
  varianteDialectal?: string | null | undefined;
  descripcionEspanol?: string | null | undefined;
  descripcionNamtrik?: string | null | undefined;
  licenciaComunitaria?: string | undefined;
  subidoPorId?: bigint | null | undefined;
}

export interface UpdateMedioCulturalMetadataPayload {
  sentidoId?: bigint | null | undefined;
  formaId?: bigint | null | undefined;
  campoSemanticoId?: bigint | null | undefined;
  subcampoSemanticoId?: bigint | null | undefined;
  microcampoId?: bigint | null | undefined;
  proposito?: PropositoMedio | undefined;
  duracionSegundos?: number | null | undefined;
  anchoPx?: number | null | undefined;
  altoPx?: number | null | undefined;
  posterUuid?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  hablanteAutor?: string | null | undefined;
  varianteDialectal?: string | null | undefined;
  descripcionEspanol?: string | null | undefined;
  descripcionNamtrik?: string | null | undefined;
  licenciaComunitaria?: string | undefined;
}

const TIPOS_MEDIO_VALIDOS: readonly TipoMedio[] = [
  'audio',
  'imagen',
  'video',
  'documento',
  'modelo_3d',
] as const;

const PROPOSITOS_MEDIO_VALIDOS: readonly PropositoMedio[] = [
  'pronunciacion_lema',
  'contexto_oracion',
  'pregunta_dialogo',
  'respuesta_dialogo',
  'ilustracion_cultural',
  'fotografia_territorio',
  'registro_practica_cultural',
  'relato_oral_video',
  'demostracion_uso',
  'recorrido_territorial',
  'documento_etnolinguistico',
] as const;

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

export const MIMETYPES_VIDEO_PERMITIDOS = ['video/mp4', 'video/webm', 'video/ogg'] as const;

export const MAX_SIZE_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SIZE_IMAGEN_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SIZE_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_SIZE_DOCUMENTO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_SIZE_MODELO_3D_BYTES = 50 * 1024 * 1024; // 50 MB

export function isTipoMedioValido(tipo: string): tipo is TipoMedio {
  return TIPOS_MEDIO_VALIDOS.includes(tipo as TipoMedio);
}

export function isPropositoValido(proposito: string): proposito is PropositoMedio {
  return PROPOSITOS_MEDIO_VALIDOS.includes(proposito as PropositoMedio);
}
