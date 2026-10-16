/**
 * CampoSemanticoRepository
 * Spec 003 — Integración vertical · Spec 004 — taxonomía v1
 * Repositorio de la jerarquía pública: campo → subcampos → microcampos (árbol) → términos.
 */

import { prisma } from '../../shared/config/prisma.js';
import { arbolarMicrocampos } from '../../shared/utils/arbolMicrocampos.js';

/**
 * Microcampos planos de un subcampo (todas las profundidades). El árbol se arma
 * después en memoria: una sola consulta, sin importar cuántos niveles existan.
 */
const MICROCAMPOS_INCLUDE = {
  where: { deletedAt: null },
  orderBy: [{ posicion: 'asc' as const }, { codigo: 'asc' as const }],
  include: {
    palabrasM1: {
      where: { palabra: { deletedAt: null } },
      include: { palabra: true },
    },
  },
};

/** Include reutilizable: campo → subcampos → microcampos (planos) → términos (M1) */
const HIERARCHY_INCLUDE = {
  subcampos: {
    where: { deletedAt: null },
    orderBy: { posicion: 'asc' as const },
    include: {
      microcampos: MICROCAMPOS_INCLUDE,
    },
  },
};

type CampoConJerarquiaPlana = {
  subcampos: Array<{
    microcampos: Parameters<typeof arbolarMicrocampos>[0];
  }>;
};

/** Convierte los microcampos planos de cada subcampo en un árbol (`subniveles`). */
function conArbol<T extends CampoConJerarquiaPlana>(campo: T) {
  return {
    ...campo,
    subcampos: campo.subcampos.map((subcampo) => ({
      ...subcampo,
      microcampos: arbolarMicrocampos(subcampo.microcampos),
    })),
  };
}

export class CampoSemanticoRepository {
  /**
   * Obtener todos los campos semánticos con subcampos, microcampos (árbol) y términos
   */
  async findAllWithHierarchy() {
    const campos = await prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      include: HIERARCHY_INCLUDE,
      orderBy: { posicion: 'asc' },
    });
    return campos.map(conArbol);
  }

  /**
   * Obtener un campo semántico por ID con jerarquía completa
   */
  async findByIdWithHierarchy(id: bigint) {
    const campo = await prisma.campoSemantico.findUnique({
      where: { id },
      include: HIERARCHY_INCLUDE,
    });
    return campo ? conArbol(campo) : null;
  }

  /**
   * Resolver campo por slug persistido (ASCII, estable; spec 004 R-013).
   */
  async findBySlugWithHierarchy(slug: string) {
    const campo = await prisma.campoSemantico.findFirst({
      where: { slug, deletedAt: null },
      include: HIERARCHY_INCLUDE,
    });
    return campo ? conArbol(campo) : null;
  }

  /**
   * Obtener campos semánticos simples (sin jerarquía)
   */
  async findAll() {
    return prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      orderBy: { posicion: 'asc' },
    });
  }
}
