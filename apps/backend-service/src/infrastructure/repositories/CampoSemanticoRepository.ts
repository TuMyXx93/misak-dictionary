/**
 * CampoSemanticoRepository
 * Spec 003 — Integración vertical
 * Repositorio para campos semánticos y su jerarquía (con términos M1)
 */

import { prisma } from '../../shared/config/prisma.js';
import { toSlug } from '../../shared/utils/slug.js';

/** Include reutilizable: campo → subcampos → microcampos → términos (M1) */
const HIERARCHY_INCLUDE = {
  subcampos: {
    where: { deletedAt: null },
    include: {
      microcampos: {
        where: { deletedAt: null },
        include: {
          palabrasM1: {
            where: { palabra: { deletedAt: null } },
            include: { palabra: true },
          },
        },
      },
    },
  },
} as const;

export class CampoSemanticoRepository {
  /**
   * Obtener todos los campos semánticos con subcampos, microcampos y términos
   */
  async findAllWithHierarchy() {
    return prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      include: HIERARCHY_INCLUDE,
      orderBy: { namtrikTermino: 'asc' },
    });
  }

  /**
   * Obtener un campo semántico por ID con jerarquía completa
   */
  async findByIdWithHierarchy(id: bigint) {
    return prisma.campoSemantico.findUnique({
      where: { id },
      include: HIERARCHY_INCLUDE,
    });
  }

  /**
   * Spec 003: resolver campo por slug (derivado del término Namtrik).
   * Spec 004 reemplazará esto por una columna slug persistida.
   */
  async findBySlugWithHierarchy(slug: string) {
    const campos = await prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      include: HIERARCHY_INCLUDE,
    });
    return campos.find((campo) => toSlug(campo.namtrikTermino) === slug) ?? null;
  }

  /**
   * Obtener campos semánticos simples (sin jerarquía)
   */
  async findAll() {
    return prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      orderBy: { namtrikTermino: 'asc' },
    });
  }
}
