/**
 * CampoSemanticoRepository
 * Sprint 3 - Dictionary API
 * Repositorio para campos semánticos y su jerarquía
 */

import { prisma } from '../../shared/config/prisma.js';

export class CampoSemanticoRepository {
  /**
   * Obtener todos los campos semánticos con subcampos y microcampos
   */
  async findAllWithHierarchy() {
    return prisma.campoSemantico.findMany({
      where: { deletedAt: null },
      include: {
        subcampos: {
          where: { deletedAt: null },
          include: {
            microcampos: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { namtrikTermino: 'asc' },
    });
  }

  /**
   * Obtener un campo semántico por ID con jerarquía completa
   */
  async findByIdWithHierarchy(id: bigint) {
    return prisma.campoSemantico.findUnique({
      where: { id },
      include: {
        subcampos: {
          where: { deletedAt: null },
          include: {
            microcampos: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
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
