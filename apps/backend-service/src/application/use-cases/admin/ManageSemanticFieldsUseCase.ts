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

export interface ActorTaxonomia {
  userId: bigint;
  username: string;
}

export class ManageSemanticFieldsUseCase {
  // ========== CAMPO SEMÁNTICO ==========

  async createCampoSemantico(data: CreateCampoSemanticoDTO, actor?: ActorTaxonomia) {
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
    if (actor) {
      createData.estado = 'borrador';
      createData.ultimoEditorId = actor.userId;
      createData.ultimoEditorAt = new Date();
    }

    return prisma.campoSemantico.create({ data: createData });
  }

  async updateCampoSemantico(id: bigint, data: UpdateCampoSemanticoDTO, actor?: ActorTaxonomia) {
    const campo = await prisma.campoSemantico.findUnique({ where: { id } });

    if (!campo || campo.deletedAt) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    let huboEdicionCultural = false;

    if (data.namtrikTermino !== undefined) {
      updateData.namtrikTermino = data.namtrikTermino;
      if (data.namtrikTermino !== campo.namtrikTermino) huboEdicionCultural = true;
    }
    if (data.espanolTermino !== undefined) {
      updateData.espanolTermino = data.espanolTermino;
      if (data.espanolTermino !== campo.espanolTermino) huboEdicionCultural = true;
    }
    if (data.namtrikDescripcion !== undefined) {
      updateData.namtrikDescripcion = data.namtrikDescripcion;
      if (data.namtrikDescripcion !== campo.namtrikDescripcion) huboEdicionCultural = true;
    }
    if (data.espanolDescripcion !== undefined) {
      updateData.espanolDescripcion = data.espanolDescripcion;
      if (data.espanolDescripcion !== campo.espanolDescripcion) huboEdicionCultural = true;
    }
    if (data.namtrikAudio !== undefined) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio !== undefined) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen !== undefined) updateData.imagen = data.imagen;

    if (campo.estado === 'ratificado' && huboEdicionCultural) {
      updateData.estado = 'borrador';
      updateData.ratificadoPorId = null;
      updateData.ratificadoAt = null;
      updateData.version = (campo.version ?? 1) + 1;
    }

    if (actor) {
      updateData.ultimoEditorId = actor.userId;
      updateData.ultimoEditorAt = new Date();
      if (!updateData.version) {
        updateData.version = (campo.version ?? 1) + 1;
      }
    }

    return prisma.campoSemantico.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCampoSemantico(id: bigint, actor?: ActorTaxonomia) {
    const campo = await prisma.campoSemantico.findUnique({ where: { id } });

    if (!campo || campo.deletedAt) {
      throw new AppError('Campo semántico no encontrado', 404);
    }

    const data: any = { deletedAt: new Date() };
    if (actor) {
      data.ultimoEditorId = actor.userId;
      data.ultimoEditorAt = new Date();
    }

    return prisma.campoSemantico.update({
      where: { id },
      data,
    });
  }

  // ========== SUBCAMPO SEMÁNTICO ==========

  async createSubcampoSemantico(data: CreateSubcampoSemanticoDTO, actor?: ActorTaxonomia) {
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
    if (actor) {
      createData.estado = 'borrador';
      createData.ultimoEditorId = actor.userId;
      createData.ultimoEditorAt = new Date();
    }

    return prisma.subcampoSemantico.create({ data: createData });
  }

  async updateSubcampoSemantico(
    id: bigint,
    data: UpdateSubcampoSemanticoDTO,
    actor?: ActorTaxonomia,
  ) {
    const subcampo = await prisma.subcampoSemantico.findUnique({ where: { id } });

    if (!subcampo || subcampo.deletedAt) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    let huboEdicionCultural = false;

    if (data.campoSemanticoId !== undefined) updateData.campoSemanticoId = data.campoSemanticoId;
    if (data.namtrikTermino !== undefined) {
      updateData.namtrikTermino = data.namtrikTermino;
      if (data.namtrikTermino !== subcampo.namtrikTermino) huboEdicionCultural = true;
    }
    if (data.espanolTermino !== undefined) {
      updateData.espanolTermino = data.espanolTermino;
      if (data.espanolTermino !== subcampo.espanolTermino) huboEdicionCultural = true;
    }
    if (data.namtrikDescripcion !== undefined) {
      updateData.namtrikDescripcion = data.namtrikDescripcion;
      if (data.namtrikDescripcion !== subcampo.namtrikDescripcion) huboEdicionCultural = true;
    }
    if (data.espanolDescripcion !== undefined) {
      updateData.espanolDescripcion = data.espanolDescripcion;
      if (data.espanolDescripcion !== subcampo.espanolDescripcion) huboEdicionCultural = true;
    }
    if (data.namtrikAudio !== undefined) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio !== undefined) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen !== undefined) updateData.imagen = data.imagen;

    if (subcampo.estado === 'ratificado' && huboEdicionCultural) {
      updateData.estado = 'borrador';
      updateData.ratificadoPorId = null;
      updateData.ratificadoAt = null;
      updateData.version = (subcampo.version ?? 1) + 1;
    }

    if (actor) {
      updateData.ultimoEditorId = actor.userId;
      updateData.ultimoEditorAt = new Date();
      if (!updateData.version) {
        updateData.version = (subcampo.version ?? 1) + 1;
      }
    }

    return prisma.subcampoSemantico.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteSubcampoSemantico(id: bigint, actor?: ActorTaxonomia) {
    const subcampo = await prisma.subcampoSemantico.findUnique({ where: { id } });

    if (!subcampo || subcampo.deletedAt) {
      throw new AppError('Subcampo semántico no encontrado', 404);
    }

    const data: any = { deletedAt: new Date() };
    if (actor) {
      data.ultimoEditorId = actor.userId;
      data.ultimoEditorAt = new Date();
    }

    return prisma.subcampoSemantico.update({
      where: { id },
      data,
    });
  }

  // ========== MICROCAMPO ==========

  async createMicrocampo(data: CreateMicrocampoDTO, actor?: ActorTaxonomia) {
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
    if (actor) {
      createData.estado = 'borrador';
      createData.ultimoEditorId = actor.userId;
      createData.ultimoEditorAt = new Date();
    }

    return prisma.microcampo.create({ data: createData });
  }

  async updateMicrocampo(id: bigint, data: UpdateMicrocampoDTO, actor?: ActorTaxonomia) {
    const microcampo = await prisma.microcampo.findUnique({ where: { id } });

    if (!microcampo || microcampo.deletedAt) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    let huboEdicionCultural = false;

    if (data.subcampoSemanticoId !== undefined)
      updateData.subcampoSemanticoId = data.subcampoSemanticoId;
    if (data.namtrikTermino !== undefined) {
      updateData.namtrikTermino = data.namtrikTermino;
      if (data.namtrikTermino !== microcampo.namtrikTermino) huboEdicionCultural = true;
    }
    if (data.espanolTermino !== undefined) {
      updateData.espanolTermino = data.espanolTermino;
      if (data.espanolTermino !== microcampo.espanolTermino) huboEdicionCultural = true;
    }
    if (data.namtrikDescripcion !== undefined) {
      updateData.namtrikDescripcion = data.namtrikDescripcion;
      if (data.namtrikDescripcion !== microcampo.namtrikDescripcion) huboEdicionCultural = true;
    }
    if (data.espanolDescripcion !== undefined) {
      updateData.espanolDescripcion = data.espanolDescripcion;
      if (data.espanolDescripcion !== microcampo.espanolDescripcion) huboEdicionCultural = true;
    }
    if (data.namtrikAudio !== undefined) updateData.namtrikAudio = data.namtrikAudio;
    if (data.espanolAudio !== undefined) updateData.espanolAudio = data.espanolAudio;
    if (data.imagen !== undefined) updateData.imagen = data.imagen;

    if (microcampo.estado === 'ratificado' && huboEdicionCultural) {
      updateData.estado = 'borrador';
      updateData.ratificadoPorId = null;
      updateData.ratificadoAt = null;
      updateData.version = (microcampo.version ?? 1) + 1;
    }

    if (actor) {
      updateData.ultimoEditorId = actor.userId;
      updateData.ultimoEditorAt = new Date();
      if (!updateData.version) {
        updateData.version = (microcampo.version ?? 1) + 1;
      }
    }

    return prisma.microcampo.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteMicrocampo(id: bigint, actor?: ActorTaxonomia) {
    const microcampo = await prisma.microcampo.findUnique({ where: { id } });

    if (!microcampo || microcampo.deletedAt) {
      throw new AppError('Microcampo no encontrado', 404);
    }

    const data: any = { deletedAt: new Date() };
    if (actor) {
      data.ultimoEditorId = actor.userId;
      data.ultimoEditorAt = new Date();
    }

    return prisma.microcampo.update({
      where: { id },
      data,
    });
  }
}
