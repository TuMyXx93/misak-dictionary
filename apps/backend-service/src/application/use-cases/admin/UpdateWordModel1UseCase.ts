/**
 * UpdateWordModel1UseCase
 * Sprint 4 - Admin API
 * Caso de uso para actualizar palabras Modelo 1
 */

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { UpdateWordModel1DTO } from '../../dtos/AdminDictionaryDto.js';

export class UpdateWordModel1UseCase {
  async execute(id: bigint, data: UpdateWordModel1DTO) {
    // Verificar que la palabra existe
    const palabra = await prisma.palabraModelo1.findUnique({
      where: { id },
    });

    if (!palabra || palabra.deletedAt) {
      throw new AppError('Palabra no encontrada', 404);
    }

    // Si se actualiza namtrikTermino, verificar que no exista otra palabra con ese término
    if (data.namtrikTermino && data.namtrikTermino !== palabra.namtrikTermino) {
      const existing = await prisma.palabraModelo1.findFirst({
        where: {
          namtrikTermino: data.namtrikTermino,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError('Ya existe otra palabra con este término en Namtrik', 409);
      }
    }

    // Si se actualiza espanolTermino, verificar que no exista otra palabra con ese término
    if (data.espanolTermino && data.espanolTermino !== palabra.espanolTermino) {
      const existing = await prisma.palabraModelo1.findFirst({
        where: {
          espanolTermino: data.espanolTermino,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError('Ya existe otra palabra con este término en Español', 409);
      }
    }

    // Actualizar la palabra
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.namtrikTermino) updateData.namtrikTermino = data.namtrikTermino;
    if (data.espanolTermino) updateData.espanolTermino = data.espanolTermino;
    if (data.namtrikDescripcion) updateData.namtrikDescripcion = data.namtrikDescripcion;
    if (data.espanolDescripcion) updateData.espanolDescripcion = data.espanolDescripcion;
    if (data.namtrikAudio) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen) updateData.imagen = data.imagen;

    await prisma.palabraModelo1.update({
      where: { id },
      data: updateData,
    });

    // Si se proporcionaron microcamposIds, actualizar las relaciones
    if (data.microcamposIds) {
      // Eliminar relaciones existentes
      await prisma.palabraM1Microcampo.deleteMany({
        where: { palabraId: id },
      });

      // Crear nuevas relaciones
      if (data.microcamposIds.length > 0) {
        await prisma.palabraM1Microcampo.createMany({
          data: data.microcamposIds.map((microcampoId) => ({
            palabraId: id,
            microcampoId,
          })),
        });
      }
    }

    // Retornar la palabra actualizada con sus relaciones
    return prisma.palabraModelo1.findUnique({
      where: { id },
      include: {
        microcampos: {
          include: {
            microcampo: true,
          },
        },
      },
    });
  }
}
