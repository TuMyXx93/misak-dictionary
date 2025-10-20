/**
 * DeleteWordUseCase
 * Sprint 4 - Admin API
 * Caso de uso para soft delete de palabras (Modelo 1 y 2)
 */

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class DeleteWordUseCase {
  /**
   * Soft delete de palabra Modelo 1
   */
  async deleteModelo1(id: bigint) {
    const palabra = await prisma.palabraModelo1.findUnique({
      where: { id },
    });

    if (!palabra || palabra.deletedAt) {
      throw new AppError('Palabra no encontrada', 404);
    }

    // Soft delete (marcar deleted_at)
    return prisma.palabraModelo1.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete de palabra Modelo 2
   */
  async deleteModelo2(id: bigint) {
    const palabra = await prisma.palabraModelo2.findUnique({
      where: { id },
    });

    if (!palabra || palabra.deletedAt) {
      throw new AppError('Palabra no encontrada', 404);
    }

    // Soft delete (marcar deleted_at)
    return prisma.palabraModelo2.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restaurar palabra Modelo 1 eliminada
   */
  async restoreModelo1(id: bigint) {
    const palabra = await prisma.palabraModelo1.findUnique({
      where: { id },
    });

    if (!palabra) {
      throw new AppError('Palabra no encontrada', 404);
    }

    if (!palabra.deletedAt) {
      throw new AppError('La palabra no está eliminada', 400);
    }

    return prisma.palabraModelo1.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Restaurar palabra Modelo 2 eliminada
   */
  async restoreModelo2(id: bigint) {
    const palabra = await prisma.palabraModelo2.findUnique({
      where: { id },
    });

    if (!palabra) {
      throw new AppError('Palabra no encontrada', 404);
    }

    if (!palabra.deletedAt) {
      throw new AppError('La palabra no está eliminada', 400);
    }

    return prisma.palabraModelo2.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }
}
