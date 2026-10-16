/**
 * CampoSemanticoRepository
 * Spec 003 — Integración vertical · Spec 004 — taxonomía v1 · Spec 005 — Sentido + Formas
 * Repositorio de la jerarquía pública: campo → subcampos → microcampos (árbol) → sentidos y formas.
 */

import { prisma as defaultPrisma } from '../../shared/config/prisma.js';
import { SystemSettingsService } from '../../shared/settings/SystemSettingsService.js';
import { arbolarMicrocampos } from '../../shared/utils/arbolMicrocampos.js';

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

  const sentidosUbicaciones = {
    where: { sentido: sentidoWhere },
    orderBy: { posicion: 'asc' as const },
    include: {
      sentido: {
        include: {
          formas: { orderBy: { orden: 'asc' as const } },
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
      sentidosUbicaciones,
    },
  };

  return {
    sentidosUbicaciones,
    subcampos: {
      where: { deletedAt: null },
      orderBy: { posicion: 'asc' as const },
      include: {
        sentidosUbicaciones,
        microcampos,
      },
    },
  };
}

type MicrocampoConSentidos = Parameters<typeof arbolarMicrocampos>[0][number] & {
  sentidosUbicaciones?: SentidoUbicacionRow[];
};

type CampoConJerarquiaPlana = {
  sentidosUbicaciones?: SentidoUbicacionRow[];
  subcampos: Array<{
    sentidosUbicaciones?: SentidoUbicacionRow[];
    microcampos: MicrocampoConSentidos[];
  }>;
};

/** Convierte los microcampos planos de cada subcampo en un árbol (`subniveles`) y proyecta `sentidos`. */
function conArbol<T extends CampoConJerarquiaPlana>(campo: T) {
  return {
    ...campo,
    sentidos: (campo.sentidosUbicaciones ?? []).map(mapearSentidoUbicacion),
    subcampos: campo.subcampos.map((subcampo) => ({
      ...subcampo,
      sentidos: (subcampo.sentidosUbicaciones ?? []).map(mapearSentidoUbicacion),
      microcampos: arbolarMicrocampos(
        subcampo.microcampos.map((m) => ({
          ...m,
          sentidos: (m.sentidosUbicaciones ?? []).map(mapearSentidoUbicacion),
        })),
      ),
    })),
  };
}

export class CampoSemanticoRepository {
  private readonly settingsService: SystemSettingsService;

  constructor(
    private readonly prisma = defaultPrisma,
    settingsService?: SystemSettingsService,
  ) {
    this.settingsService = settingsService ?? new SystemSettingsService(prisma as any);
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
