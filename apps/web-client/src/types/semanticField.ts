/**
 * Semantic Field & Cultural Multimedia Types
 *
 * Spec 001 / Spec 003 / Spec 004: Jerarquía taxonómica (Campo → Subcampo → Microcampo → Término).
 * Spec 005: Modelo léxico «Sentido + Formas», ubicaciones multinivel y pares dialógicos.
 * Spec 007 + Multimedia Expansion: Audio, Imagen, Video y recursos extensibles futuros.
 */

export type SemanticFieldIconKey =
  | 'house'
  | 'garden'
  | 'mountain-farm'
  | 'wildlife'
  | 'flora'
  | 'territory'
  | 'cosmos'
  | 'cosmos-grid'
  | 'neologism';

export type FieldStatus = 'available' | 'coming-soon';

/**
 * Estado editorial del sentido léxico (Spec 006 R-026).
 * 'borrador': en revisión editorial comunitaria, requiere insignia visual.
 * 'ratificado': aprobado oficialmente por el Equipo Namtrik.
 */
export type EstadoSentido = 'borrador' | 'ratificado';

/**
 * Tipo de recurso cultural soportado hoy ('audio' | 'imagen' | 'video') y abierto
 * a tipos futuros registrados en CulturalResourceRegistry (p. ej. 'documento_pdf', 'modelo_3d').
 */
export type CulturalMediaType = 'audio' | 'imagen' | 'video' | (string & {});

export interface CulturalMediaSummary {
  id?: string;
  uuid: string;
  tipo: CulturalMediaType;
  proposito: string;
  mimetype?: string;
  streamUrl?: string;
  posterUuid?: string | null;
  posterUrl?: string | null;
  duracionSegundos?: number | null;
  anchoPx?: number | null;
  altoPx?: number | null;
  tamanoBytes?: number | null;
  hablanteAutor?: string | null;
  varianteDialectal?: string | null;
  descripcionEspanol?: string | null;
  descripcionNamtrik?: string | null;
  licenciaComunitaria?: string;
  metadata?: Record<string, unknown> | null;
}

export interface SemanticFieldSummary {
  id: string;
  name: string;
  nameSpanish: string;
  shortDescription: string;
  iconKey: SemanticFieldIconKey;
  position: { x: number; y: number };
  drift: {
    amplitudeX: number;
    amplitudeY: number;
    duration: number;
    delay: number;
  };
}

export interface SemanticField extends SemanticFieldSummary {
  status: FieldStatus;
  longDescription?: string;
  descriptionMisak?: string;
  heroImage?: string;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: CulturalMediaSummary[];
  terms?: Term[];
  subfields: Subfield[];
}

export interface Subfield {
  id: string;
  name: string;
  nameMisak?: string;
  nameSpanish?: string;
  description: string;
  descriptionMisak?: string;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: CulturalMediaSummary[];
  terms?: Term[];
  microfields: Microfield[];
}

export interface Microfield {
  id: string;
  /** Nombre visible: namtrik si existe; si no (subniveles), el español */
  name: string;
  nameMisak?: string;
  nameSpanish?: string;
  description: string;
  descriptionMisak?: string;
  imagen?: string | null;
  namtrikAudio?: string | null;
  espanolAudio?: string | null;
  medios?: CulturalMediaSummary[];
  terms: Term[];
  /** Subniveles (microcampos hijos), a cualquier profundidad (spec 004) */
  subniveles?: Microfield[];
}

export interface FormaNamtrik {
  id?: string;
  orden: number;
  lema: string;
  acepcionHomonima?: number | null;
  categoriaGramatical?: string | null;
  variante?: string | null;
  esNeologismo: boolean;
  rasgosGramaticales: string[];
  etiquetaOriginal?: string | null;
  audioUrl?: string;
  medios?: CulturalMediaSummary[];
}

export interface ParDialogico {
  respuestaNamtrik: string | null;
  respuestaNamtrikContexto: string | null;
  respuestaEspanolGlosa: string | null;
  respuestaEspanolExplicacion: string | null;
}

export interface Term {
  id: string;
  codigo?: string;
  tipo?: 'estandar' | 'dialogico';
  estado?: EstadoSentido;
  misak: string;
  spanish: string;
  partOfSpeech?: string;
  descriptionMisak?: string;
  descriptionSpanish?: string;
  scientificName?: string;
  exampleMisak?: string;
  exampleSpanish?: string;
  audioUrl?: string;
  formas?: FormaNamtrik[];
  dialogo?: ParDialogico | null;
  medios?: CulturalMediaSummary[];
}

/**
 * Resuelve el par título primario / subtítulo bilingüe evitando duplicados
 * cuando el término en Namtrik y su glosa en español coinciden (p. ej. "Nakchak" / "Nakchak").
 */
export function resolveBilingualTitle(
  primary?: string | null,
  secondary?: string | null,
): { title: string; subtitle?: string } {
  const cleanPrimary = (primary ?? '').trim();
  const cleanSecondary = (secondary ?? '').trim();

  if (!cleanSecondary) {
    return { title: cleanPrimary };
  }

  if (cleanPrimary.toLocaleLowerCase('es') === cleanSecondary.toLocaleLowerCase('es')) {
    return { title: cleanPrimary };
  }

  return {
    title: cleanPrimary,
    subtitle: cleanSecondary,
  };
}
