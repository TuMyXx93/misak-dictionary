/**
 * ManageSemanticFieldsUseCase
 * Sprint 4 - Admin API
 * Casos de uso para CRUD de campos semánticos, subcampos y microcampos
 */

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type {
  CreateCampoSemanticoDTO,
  CreateMicrocampoDTO,
  CreateSubcampoSemanticoDTO,
  UpdateCampoSemanticoDTO,
  UpdateMicrocampoDTO,
  UpdateSubcampoSemanticoDTO,
} from '../../dtos/AdminDictionaryDto.js';

export class ManageSemanticFieldsUseCase {
  // ========== CAMPO SEMÁNTICO ==========

  async createCampoSemantico(data: CreateCampoSemanticoDTO) {
    const existing = await prisma.campoSemantico.findFirst({
      where: {
        OR: [{ namtrikTermino: data.namtrikTermino }, { espanolTermino: data.espanolTermino }],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new AppError('Ya existe un campo semántico con este término', 409);
    }

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

    return prisma.campoSemantico.create({ data: createData });
  }

  async updateCampoSemantico(id: bigint, data: UpdateCampoSemanticoDTO) {
    const campo = await prisma.campoSemantico.findUnique({ where: { id } });

    if (!campo || campo.deletedAt) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.namtrikTermino) updateData.namtrikTermino = data.namtrikTermino;
    if (data.espanolTermino) updateData.espanolTermino = data.espanolTermino;
    if (data.namtrikDescripcion) updateData.namtrikDescripcion = data.namtrikDescripcion;
    if (data.espanolDescripcion) updateData.espanolDescripcion = data.espanolDescripcion;
    if (data.namtrikAudio) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen) updateData.imagen = data.imagen;

    return prisma.campoSemantico.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCampoSemantico(id: bigint) {
    const campo = await prisma.campoSemantico.findUnique({ where: { id } });

    if (!campo || campo.deletedAt) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    return prisma.campoSemantico.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ========== SUBCAMPO SEMÁNTICO ==========

  async createSubcampoSemantico(data: CreateSubcampoSemanticoDTO) {
    // Verificar que el campo semántico padre existe
    const campoSemantico = await prisma.campoSemantico.findUnique({
      where: { id: data.campoSemanticoId },
    });

    if (!campoSemantico || campoSemantico.deletedAt) {
      throw new AppError('Campo semántico padre no encontrado', 404);
    }

    const existing = await prisma.subcampoSemantico.findFirst({
      where: {
        campoSemanticoId: data.campoSemanticoId,
        OR: [{ namtrikTermino: data.namtrikTermino }, { espanolTermino: data.espanolTermino }],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new AppError('Ya existe un subcampo con este término en el campo padre', 409);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      campoSemanticoId: data.campoSemanticoId,
      namtrikTermino: data.namtrikTermino,
      espanolTermino: data.espanolTermino,
      namtrikDescripcion: data.namtrikDescripcion,
      espanolDescripcion: data.espanolDescripcion,
    };
    if (data.namtrikAudio) createData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) createData.espanolAudio = data.espanolAudio;
    if (data.imagen) createData.imagen = data.imagen;

    return prisma.subcampoSemantico.create({ data: createData });
  }

  async updateSubcampoSemantico(id: bigint, data: UpdateSubcampoSemanticoDTO) {
    const subcampo = await prisma.subcampoSemantico.findUnique({ where: { id } });

    if (!subcampo || subcampo.deletedAt) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.campoSemanticoId) updateData.campoSemanticoId = data.campoSemanticoId;
    if (data.namtrikTermino) updateData.namtrikTermino = data.namtrikTermino;
    if (data.espanolTermino) updateData.espanolTermino = data.espanolTermino;
    if (data.namtrikDescripcion) updateData.namtrikDescripcion = data.namtrikDescripcion;
    if (data.espanolDescripcion) updateData.espanolDescripcion = data.espanolDescripcion;
    if (data.namtrikAudio) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen) updateData.imagen = data.imagen;

    return prisma.subcampoSemantico.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteSubcampoSemantico(id: bigint) {
    const subcampo = await prisma.subcampoSemantico.findUnique({ where: { id } });

    if (!subcampo || subcampo.deletedAt) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    return prisma.subcampoSemantico.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ========== MICROCAMPO ==========

  async createMicrocampo(data: CreateMicrocampoDTO) {
    // Verificar que el subcampo padre existe
    const subcampoSemantico = await prisma.subcampoSemantico.findUnique({
      where: { id: data.subcampoSemanticoId },
    });

    if (!subcampoSemantico || subcampoSemantico.deletedAt) {
      throw new AppError('Subcampo semántico padre no encontrado', 404);
    }

    const existing = await prisma.microcampo.findFirst({
      where: {
        subcampoSemanticoId: data.subcampoSemanticoId,
        OR: [{ namtrikTermino: data.namtrikTermino }, { espanolTermino: data.espanolTermino }],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new AppError('Ya existe un microcampo con este término en el subcampo padre', 409);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      subcampoSemanticoId: data.subcampoSemanticoId,
      namtrikTermino: data.namtrikTermino,
      espanolTermino: data.espanolTermino,
      namtrikDescripcion: data.namtrikDescripcion,
      espanolDescripcion: data.espanolDescripcion,
    };
    if (data.namtrikAudio) createData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) createData.espanolAudio = data.espanolAudio;
    if (data.imagen) createData.imagen = data.imagen;

    return prisma.microcampo.create({ data: createData });
  }

  async updateMicrocampo(id: bigint, data: UpdateMicrocampoDTO) {
    const microcampo = await prisma.microcampo.findUnique({ where: { id } });

    if (!microcampo || microcampo.deletedAt) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.subcampoSemanticoId) updateData.subcampoSemanticoId = data.subcampoSemanticoId;
    if (data.namtrikTermino) updateData.namtrikTermino = data.namtrikTermino;
    if (data.espanolTermino) updateData.espanolTermino = data.espanolTermino;
    if (data.namtrikDescripcion) updateData.namtrikDescripcion = data.namtrikDescripcion;
    if (data.espanolDescripcion) updateData.espanolDescripcion = data.espanolDescripcion;
    if (data.namtrikAudio) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen) updateData.imagen = data.imagen;

    return prisma.microcampo.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteMicrocampo(id: bigint) {
    const microcampo = await prisma.microcampo.findUnique({ where: { id } });

    if (!microcampo || microcampo.deletedAt) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    return prisma.microcampo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
