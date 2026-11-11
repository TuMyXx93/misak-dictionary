/**
 * CampoSemanticoRepository
 * Spec 003 — Integración vertical · Spec 004 — taxonomía v1 · Spec 005 — Sentido + Formas
 * Repositorio de la jerarquía pública: campo → subcampos → microcampos (árbol) → sentidos y formas.
 */

import type { PrismaClient } from '../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../shared/config/prisma.js';
import { SystemSettingsService } from '../../shared/settings/SystemSettingsService.js';
import { arbolarMicrocampos } from '../../shared/utils/arbolMicrocampos.js';

export interface MedioCulturalRow {
  id: bigint;
  uuid: string;
  tipo: string;
  proposito: string;
  mimetype: string;
  estado: string;
  duracionSegundos: number | null;
  anchoPx: number | null;
  altoPx: number | null;
  hablanteAutor: string | null;
  varianteDialectal: string | null;
  descripcionEspanol: string | null;
  descripcionNamtrik: string | null;
  licenciaComunitaria: string;
  posterUuid?: string | null;
  metadata?: unknown;
}

export function mapearMedioPublico(m: MedioCulturalRow) {
  return {
    id: m.id,
    uuid: m.uuid,
    tipo: m.tipo,
    proposito: m.proposito,
    mimetype: m.mimetype,
    estado: m.estado,
    duracionSegundos: m.duracionSegundos,
    anchoPx: m.anchoPx,
    altoPx: m.altoPx,
    hablanteAutor: m.hablanteAutor,
    varianteDialectal: m.varianteDialectal,
    descripcionEspanol: m.descripcionEspanol,
    descripcionNamtrik: m.descripcionNamtrik,
    licenciaComunitaria: m.licenciaComunitaria,
    posterUuid: m.posterUuid ?? null,
    metadata: m.metadata ?? null,
    streamUrl: `/api/media/${m.uuid}/stream`,
  };
}

export interface FormaNamtrikRow {
  id: bigint;
  orden: number;
  lema: string;
  acepcionHomonima: number | null;
  categoriaGramatical: string | null;
  variante: string | null;
  esNeologismo: boolean;
  rasgosGramaticales: string[];
  etiquetaOriginal: string | null;
  medios?: MedioCulturalRow[];
}

export interface SentidoUbicacionRow {
  posicion: number;
  sentido: {
    id: bigint;
    codigo: string;
    tipo: string;
    estado: string;
    namtrikContexto: string | null;
    espanolGlosa: string;
    espanolExplicacion: string | null;
    nombreCientifico: string | null;
    respuestaNamtrik: string | null;
    respuestaNamtrikContexto: string | null;
    respuestaEspanolGlosa: string | null;
    respuestaEspanolExplicacion: string | null;
    formas: FormaNamtrikRow[];
    medios?: MedioCulturalRow[];
  };
}

export function mapearSentidoUbicacion(ubicacion: SentidoUbicacionRow) {
  const { sentido, posicion } = ubicacion;
  const lemas = sentido.formas.map((f) => f.lema).join(', ');
  return {
    id: sentido.id,
    codigo: sentido.codigo,
    posicion,
    tipo: sentido.tipo,
    estado: sentido.estado,
    namtrikTermino: lemas,
    espanolTermino: sentido.espanolGlosa,
    namtrikContexto: sentido.namtrikContexto,
    espanolGlosa: sentido.espanolGlosa,
    espanolExplicacion: sentido.espanolExplicacion,
    nombreCientifico: sentido.nombreCientifico,
    namtrikDescripcion: sentido.namtrikContexto,
    espanolDescripcion: sentido.espanolExplicacion,
    medios: (sentido.medios ?? []).map(mapearMedioPublico),
    formas: sentido.formas.map((f) => ({
      id: f.id,
      orden: f.orden,
      lema: f.lema,
      acepcionHomonima: f.acepcionHomonima,
      categoriaGramatical: f.categoriaGramatical,
      variante: f.variante,
      esNeologismo: f.esNeologismo,
      rasgosGramaticales: f.rasgosGramaticales,
      etiquetaOriginal: f.etiquetaOriginal,
      medios: (f.medios ?? []).map(mapearMedioPublico),
    })),
    dialogo:
      sentido.tipo === 'dialogico'
        ? {
            respuestaNamtrik: sentido.respuestaNamtrik,
            respuestaNamtrikContexto: sentido.respuestaNamtrikContexto,
            respuestaEspanolGlosa: sentido.respuestaEspanolGlosa,
            respuestaEspanolExplicacion: sentido.respuestaEspanolExplicacion,
          }
        : null,
  };
}

/** Construye el include de la jerarquía semántica según la bandera PUBLIC_ONLY_RATIFIED (R-026) */
export function buildHierarchyInclude(onlyRatified: boolean) {
  const sentidoWhere = onlyRatified
    ? { deletedAt: null, estado: 'ratificado' }
    : { deletedAt: null };

  const medioWhere = onlyRatified ? { deletedAt: null, estado: 'ratificado' } : { deletedAt: null };

  const mediosInclude = {
    where: medioWhere,
    orderBy: { createdAt: 'asc' as const },
  };

  const sentidosUbicacion = {
    where: { sentido: sentidoWhere },
    orderBy: { posicion: 'asc' as const },
    include: {
      sentido: {
        include: {
          formas: {
            orderBy: { orden: 'asc' as const },
            include: {
              medios: mediosInclude,
            },
          },
          medios: mediosInclude,
        },
      },
    },
  };

  const microcampos = {
    where: { deletedAt: null },
    orderBy: [{ posicion: 'asc' as const }, { codigo: 'asc' as const }],
    include: {
      palabrasM1: {
        where: { palabra: { deletedAt: null } },
        include: { palabra: true },
      },
      sentidosUbicacion,
      medios: mediosInclude,
    },
  };

  return {
    medios: mediosInclude,
    sentidosUbicacion,
    subcampos: {
      where: { deletedAt: null },
      orderBy: { posicion: 'asc' as const },
      include: {
        medios: mediosInclude,
        sentidosUbicacion,
        microcampos,
      },
    },
  };
}

type MicrocampoConSentidos = Parameters<typeof arbolarMicrocampos>[0][number] & {
  sentidosUbicacion?: SentidoUbicacionRow[];
  medios?: MedioCulturalRow[];
};

type CampoConJerarquiaPlana = {
  sentidosUbicacion?: SentidoUbicacionRow[];
  medios?: MedioCulturalRow[];
  subcampos: Array<{
    sentidosUbicacion?: SentidoUbicacionRow[];
    medios?: MedioCulturalRow[];
    microcampos: MicrocampoConSentidos[];
  }>;
};

/** Convierte los microcampos planos de cada subcampo en un árbol (`subniveles`) y proyecta `sentidos` y `medios`. */
function conArbol<T extends CampoConJerarquiaPlana>(campo: T) {
  return {
    ...campo,
    medios: (campo.medios ?? []).map(mapearMedioPublico),
    sentidos: (campo.sentidosUbicacion ?? []).map(mapearSentidoUbicacion),
    subcampos: campo.subcampos.map((subcampo) => ({
      ...subcampo,
      medios: (subcampo.medios ?? []).map(mapearMedioPublico),
      sentidos: (subcampo.sentidosUbicacion ?? []).map(mapearSentidoUbicacion),
      microcampos: arbolarMicrocampos(
        subcampo.microcampos.map((m) => ({
          ...m,
          medios: (m.medios ?? []).map(mapearMedioPublico),
          sentidos: (m.sentidosUbicacion ?? []).map(mapearSentidoUbicacion),
        })),
      ),
    })),
  };
}

export class CampoSemanticoRepository {
  private readonly settingsService: SystemSettingsService;

  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    settingsService?: SystemSettingsService,
  ) {
    this.settingsService = settingsService ?? new SystemSettingsService(prisma);
  }

  /**
   * Obtener todos los campos semánticos con subcampos, microcampos (árbol) y sentidos
   */
  async findAllWithHierarchy() {
    const onlyRatified = await this.settingsService.getPublicOnlyRatified();
    const campos = await this.prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      include: buildHierarchyInclude(onlyRatified),
      orderBy: { posicion: 'asc' },
    });
    return campos.map(conArbol);
  }

  /**
   * Obtener un campo semántico por ID con jerarquía completa
   */
  async findByIdWithHierarchy(id: bigint) {
    const onlyRatified = await this.settingsService.getPublicOnlyRatified();
    const campo = await this.prisma.campoSemantico.findUnique({
      where: { id },
      include: buildHierarchyInclude(onlyRatified),
    });
    return campo ? conArbol(campo) : null;
  }

  /**
   * Resolver campo por slug persistido (ASCII, estable; spec 004 R-013).
   */
  async findBySlugWithHierarchy(slug: string) {
    const onlyRatified = await this.settingsService.getPublicOnlyRatified();
    const campo = await this.prisma.campoSemantico.findFirst({
      where: { slug, deletedAt: null },
      include: buildHierarchyInclude(onlyRatified),
    });
    return campo ? conArbol(campo) : null;
  }

  /**
   * Obtener campos semánticos simples (sin jerarquía)
   */
  async findAll() {
    return this.prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      orderBy: { posicion: 'asc' },
    });
  }

  /**
   * Spec 004 R-013: Obtener los botones del home persistidos (home_slots),
   * ordenados por posición, con los datos del campo activo si está asignado.
   */
  async findHomeSlots() {
    const slots = await this.prisma.homeSlot.findMany({
      orderBy: { posicion: 'asc' },
      include: {
        campo: {
          select: {
            id: true,
            codigo: true,
            slug: true,
            namtrikTermino: true,
            espanolTermino: true,
            espanolDescripcion: true,
            deletedAt: true,
          },
        },
      },
    });

    return slots.map((slot) => ({
      id: slot.id,
      clave: slot.clave,
      etiqueta: slot.etiqueta,
      posicion: slot.posicion,
      campo:
        slot.campo && !slot.campo.deletedAt
          ? {
              id: slot.campo.id,
              codigo: slot.campo.codigo,
              slug: slot.campo.slug,
              namtrikTermino: slot.campo.namtrikTermino,
              espanolTermino: slot.campo.espanolTermino,
              espanolDescripcion: slot.campo.espanolDescripcion,
            }
          : null,
    }));
  }
}
