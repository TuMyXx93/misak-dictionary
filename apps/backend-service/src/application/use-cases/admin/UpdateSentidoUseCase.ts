/**
 * UpdateSentidoUseCase
 * Spec 006 (R-007, R-010, R-022) - Actualización de sentidos con concurrencia optimista,
 * reemplazo ordenado de formas, normalización ɵ y reinicio de ratificación ante edición cultural.
 */

import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { normalizarNamtrik } from '../../../shared/utils/namtrik.js';
import type { UpdateSentidoDTO } from '../../dtos/AdminSentidoDto.js';

export interface ActorAdmin {
  userId: bigint;
  username: string;
}

export class UpdateSentidoUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(id: bigint, dto: UpdateSentidoDTO, actor: ActorAdmin) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener sentido existente con sus formas
      const sentidoActual = await tx.sentidoLexico.findUnique({
        where: { id },
        include: {
          formas: { orderBy: { orden: 'asc' } },
        },
      });

      if (!sentidoActual || sentidoActual.deletedAt !== null) {
        throw new AppError('Sentido no encontrado', 404);
      }

      // 2. Control de concurrencia optimista
      if (sentidoActual.version !== dto.version) {
        throw new AppError(
          'Conflicto de concurrencia: el sentido ha sido modificado por otro usuario',
          409,
        );
      }

      // 3. Preparar formas si se envían
      let nuevasFormasData: Array<{
        orden: number;
        lema: string;
        acepcionHomonima: number | null;
        categoriaGramatical: string | null;
        variante: string | null;
        esNeologismo: boolean;
        rasgosGramaticales: string[];
        etiquetaOriginal: string | null;
      }> | null = null;

      if (dto.formas !== undefined) {
        if (dto.formas.length === 0) {
          throw new AppError('Debe incluir al menos una forma léxica', 400);
        }
        nuevasFormasData = dto.formas.map((f, index) => ({
          orden: f.orden ?? index + 1,
          lema: normalizarNamtrik(f.lema).valor,
          acepcionHomonima: f.acepcionHomonima ?? null,
          categoriaGramatical: f.categoriaGramatical ?? null,
          variante: f.variante ?? null,
          esNeologismo: f.esNeologismo ?? false,
          rasgosGramaticales: f.rasgosGramaticales ?? [],
          etiquetaOriginal: f.etiquetaOriginal ?? null,
        }));
      }

      // 4. Detectar si hay edición cultural (dispara R-010 si estaba ratificado)
      let huboEdicionCultural = false;

      if (dto.espanolGlosa !== undefined && dto.espanolGlosa !== sentidoActual.espanolGlosa) {
        huboEdicionCultural = true;
      }
      if (
        dto.espanolExplicacion !== undefined &&
        dto.espanolExplicacion !== sentidoActual.espanolExplicacion
      ) {
        huboEdicionCultural = true;
      }
      if (dto.namtrikContexto !== undefined) {
        const norm = dto.namtrikContexto ? normalizarNamtrik(dto.namtrikContexto).valor : null;
        if (norm !== sentidoActual.namtrikContexto) {
          huboEdicionCultural = true;
        }
      }
      if (
        dto.nombreCientifico !== undefined &&
        dto.nombreCientifico !== sentidoActual.nombreCientifico
      ) {
        huboEdicionCultural = true;
      }
      if (dto.respuestaNamtrik !== undefined) {
        const norm = dto.respuestaNamtrik ? normalizarNamtrik(dto.respuestaNamtrik).valor : null;
        if (norm !== sentidoActual.respuestaNamtrik) {
          huboEdicionCultural = true;
        }
      }
      if (dto.respuestaNamtrikContexto !== undefined) {
        const norm = dto.respuestaNamtrikContexto
          ? normalizarNamtrik(dto.respuestaNamtrikContexto).valor
          : null;
        if (norm !== sentidoActual.respuestaNamtrikContexto) {
          huboEdicionCultural = true;
        }
      }
      if (
        dto.respuestaEspanolGlosa !== undefined &&
        dto.respuestaEspanolGlosa !== sentidoActual.respuestaEspanolGlosa
      ) {
        huboEdicionCultural = true;
      }
      if (
        dto.respuestaEspanolExplicacion !== undefined &&
        dto.respuestaEspanolExplicacion !== sentidoActual.respuestaEspanolExplicacion
      ) {
        huboEdicionCultural = true;
      }

      if (nuevasFormasData !== null) {
        // Comparar lemas de las formas
        const lemasActuales = sentidoActual.formas.map((f) => f.lema).join('|');
        const lemasNuevos = nuevasFormasData.map((f) => f.lema).join('|');
        if (lemasActuales !== lemasNuevos) {
          huboEdicionCultural = true;
        }
      }

      // 5. Determinar estado y ratificación
      let estado = sentidoActual.estado;
      let ratificadoPorId = sentidoActual.ratificadoPorId;
      let ratificadoAt = sentidoActual.ratificadoAt;

      if (sentidoActual.estado === 'ratificado' && huboEdicionCultural) {
        estado = 'borrador';
        ratificadoPorId = null;
        ratificadoAt = null;
      }

      const nuevaVersion = sentidoActual.version + 1;
      const ahora = new Date();

      // 6. Preparar datos a actualizar
      const updateData: Prisma.SentidoLexicoUncheckedUpdateInput = {
        version: nuevaVersion,
        estado,
        ratificadoPorId,
        ratificadoAt,
        ultimoEditorId: actor.userId,
        ultimoEditorAt: ahora,
      };

      if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
      if (dto.espanolGlosa !== undefined) updateData.espanolGlosa = dto.espanolGlosa;
      if (dto.espanolExplicacion !== undefined)
        updateData.espanolExplicacion = dto.espanolExplicacion;
      if (dto.namtrikContexto !== undefined) {
        updateData.namtrikContexto = dto.namtrikContexto
          ? normalizarNamtrik(dto.namtrikContexto).valor
          : null;
      }
      if (dto.nombreCientifico !== undefined) updateData.nombreCientifico = dto.nombreCientifico;
      if (dto.observacionEditorial !== undefined)
        updateData.observacionEditorial = dto.observacionEditorial;
      if (dto.respuestaNamtrik !== undefined) {
        updateData.respuestaNamtrik = dto.respuestaNamtrik
          ? normalizarNamtrik(dto.respuestaNamtrik).valor
          : null;
      }
      if (dto.respuestaNamtrikContexto !== undefined) {
        updateData.respuestaNamtrikContexto = dto.respuestaNamtrikContexto
          ? normalizarNamtrik(dto.respuestaNamtrikContexto).valor
          : null;
      }
      if (dto.respuestaEspanolGlosa !== undefined)
        updateData.respuestaEspanolGlosa = dto.respuestaEspanolGlosa;
      if (dto.respuestaEspanolExplicacion !== undefined)
        updateData.respuestaEspanolExplicacion = dto.respuestaEspanolExplicacion;

      // 7. Si se actualizan formas, reemplazar ordenadamente
      if (nuevasFormasData !== null) {
        await tx.formaNamtrik.deleteMany({
          where: { sentidoId: id },
        });

        await tx.formaNamtrik.createMany({
          data: nuevasFormasData.map((f) => ({
            ...f,
            sentidoId: id,
          })),
        });
      }

      const sentidoActualizado = await tx.sentidoLexico.update({
        where: { id },
        data: updateData,
        include: {
          formas: { orderBy: { orden: 'asc' } },
        },
      });

      // 8. Auditoría transaccional
      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'update',
        entity: 'sentido',
        entityId: id.toString(),
        oldData: {
          version: sentidoActual.version,
          estado: sentidoActual.estado,
          espanolGlosa: sentidoActual.espanolGlosa,
          formas: sentidoActual.formas.map((f) => ({ orden: f.orden, lema: f.lema })),
        },
        newData: {
          version: sentidoActualizado.version,
          estado: sentidoActualizado.estado,
          espanolGlosa: sentidoActualizado.espanolGlosa,
          formas: sentidoActualizado.formas.map((f) => ({ orden: f.orden, lema: f.lema })),
          huboEdicionCultural,
        },
      });

      return sentidoActualizado;
    });
  }
}
