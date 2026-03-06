/**
 * CreateWordModel1UseCase
 * Sprint 4 - Admin API
 * Caso de uso para crear palabras Modelo 1
 */

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { CreateWordModel1DTO } from '../../dtos/AdminDictionaryDto.js';

export class CreateWordModel1UseCase {
  async execute(data: CreateWordModel1DTO) {
    // Verificar que no exista una palabra con el mismo término
    const existingByNamtrik = await prisma.palabraModelo1.findFirst({
      where: {
        namtrikTermino: data.namtrikTermino,
        deletedAt: null,
      },
    });

    if (existingByNamtrik) {
      throw new AppError('Ya existe una palabra con este término en Namtrik', 409);
    }

    const existingByEspanol = await prisma.palabraModelo1.findFirst({
      where: {
        espanolTermino: data.espanolTermino,
        deletedAt: null,
      },
    });

    if (existingByEspanol) {
      throw new AppError('Ya existe una palabra con este término en Español', 409);
    }

    // Crear la palabra
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      namtrikTermino: data.namtrikTermino,
      espanolTermino: data.espanolTermino,
      namtrikDescripcion: data.namtrikDescripcion,
      espanolDescripcion: data.espanolDescripcion,
    };
    if (data.namtrikAudio) createData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) createData.espanolAudio = data.espanolAudio;
    if (data.imagen) createData.imagen = data.imagen;

    const palabra = await prisma.palabraModelo1.create({
      data: createData,
    });

    // Si hay microcampos, crear las relaciones
    if (data.microcamposIds && data.microcamposIds.length > 0) {
      await prisma.palabraM1Microcampo.createMany({
        data: data.microcamposIds.map((microcampoId) => ({
          palabraId: palabra.id,
          microcampoId,
        })),
      });
    }

    // Retornar la palabra creada con sus relaciones
    return prisma.palabraModelo1.findUnique({
      where: { id: palabra.id },
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
