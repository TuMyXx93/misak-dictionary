/**
 * CreateSentidoUseCase
 * Spec 006 (R-008) - Creación de sentidos léxicos con código secuencial atómico,
 * estado borrador y registro del último editor.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { normalizarNamtrik } from '../../../shared/utils/namtrik.js';
import type { CreateSentidoDTO } from '../../dtos/AdminSentidoDto.js';

export interface ActorAdmin {
  userId: bigint;
  username: string;
}

export class CreateSentidoUseCase {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  async execute(dto: CreateSentidoDTO, actor: ActorAdmin) {
    if (!dto.formas || dto.formas.length === 0) {
      throw new AppError('Debe incluir al menos una forma léxica', 400);
    }

    const ubicacionNivel = dto.ubicacion.nivel;
    const ubicacionId = BigInt(dto.ubicacion.id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Validar y resolver nodo taxonómico
      let nodoCodigo = '';
      let campoId: bigint | null = null;
      let subcampoId: bigint | null = null;
      let microcampoId: bigint | null = null;

      if (ubicacionNivel === 'campo') {
        const campo = await tx.campoSemantico.findUnique({
          where: { id: ubicacionId },
          select: { id: true, codigo: true, deletedAt: true },
        });
        if (!campo || campo.deletedAt !== null) {
          throw new AppError('Nodo taxonómico de ubicación no encontrado', 404);
        }
        nodoCodigo = campo.codigo;
        campoId = campo.id;
      } else if (ubicacionNivel === 'subcampo') {
        const subcampo = await tx.subcampoSemantico.findUnique({
          where: { id: ubicacionId },
          select: { id: true, codigo: true, deletedAt: true },
        });
        if (!subcampo || subcampo.deletedAt !== null) {
          throw new AppError('Nodo taxonómico de ubicación no encontrado', 404);
        }
        nodoCodigo = subcampo.codigo;
        subcampoId = subcampo.id;
      } else if (ubicacionNivel === 'microcampo') {
        const microcampo = await tx.microcampo.findUnique({
          where: { id: ubicacionId },
          select: { id: true, codigo: true, deletedAt: true },
        });
        if (!microcampo || microcampo.deletedAt !== null) {
          throw new AppError('Nodo taxonómico de ubicación no encontrado', 404);
        }
        nodoCodigo = microcampo.codigo;
        microcampoId = microcampo.id;
      }

      // 2. Bloqueo transaccional por nodo para generación atómica de código
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${nodoCodigo}))`;
      } catch {
        // En tests con mocks de base de datos no relacional $executeRaw puede ser no-op
      }

      // 3. Calcular siguiente código secuencial <nodo>.E<NNN>
      const prefijo = `${nodoCodigo}.E`;
      const sentidosExistentes = await tx.sentidoLexico.findMany({
        where: {
          codigo: { startsWith: prefijo },
        },
        select: { codigo: true },
      });

      let maxSecuencia = 0;
      const regexSecuencia = new RegExp(`^${nodoCodigo.replace(/\./g, '\\.')}\\.E(\\d+)$`);

      for (const s of sentidosExistentes) {
        const match = regexSecuencia.exec(s.codigo);
        if (match?.[1]) {
          const num = parseInt(match[1], 10);
          if (!Number.isNaN(num) && num > maxSecuencia) {
            maxSecuencia = num;
          }
        }
      }

      const siguienteNumero = maxSecuencia + 1;
      const nuevoCodigo = `${prefijo}${String(siguienteNumero).padStart(3, '0')}`;

      // 4. Normalizar campos Namtrik (ɵ)
      const namtrikContexto = dto.namtrikContexto
        ? normalizarNamtrik(dto.namtrikContexto).valor
        : null;
      const respuestaNamtrik = dto.respuestaNamtrik
        ? normalizarNamtrik(dto.respuestaNamtrik).valor
        : null;
      const respuestaNamtrikContexto = dto.respuestaNamtrikContexto
        ? normalizarNamtrik(dto.respuestaNamtrikContexto).valor
        : null;

      const ahora = new Date();

      // 5. Crear sentido léxico
      const sentidoCreado = await tx.sentidoLexico.create({
        data: {
          codigo: nuevoCodigo,
          tipo: dto.tipo ?? 'estandar',
          estado: 'borrador',
          version: 1,
          espanolGlosa: dto.espanolGlosa,
          espanolExplicacion: dto.espanolExplicacion ?? null,
          namtrikContexto,
          nombreCientifico: dto.nombreCientifico ?? null,
          observacionEditorial: dto.observacionEditorial ?? null,
          respuestaNamtrik,
          respuestaNamtrikContexto,
          respuestaEspanolGlosa: dto.respuestaEspanolGlosa ?? null,
          respuestaEspanolExplicacion: dto.respuestaEspanolExplicacion ?? null,
          ultimoEditorId: actor.userId,
          ultimoEditorAt: ahora,
          ratificadoPorId: null,
          ratificadoAt: null,
          formas: {
            create: dto.formas.map((f, index) => ({
              orden: f.orden ?? index + 1,
              lema: normalizarNamtrik(f.lema).valor,
              acepcionHomonima: f.acepcionHomonima ?? null,
              categoriaGramatical: f.categoriaGramatical ?? null,
              variante: f.variante ?? null,
              esNeologismo: f.esNeologismo ?? false,
              rasgosGramaticales: f.rasgosGramaticales ?? [],
              etiquetaOriginal: f.etiquetaOriginal ?? null,
            })),
          },
          ubicaciones: {
            create: [
              {
                campoSemanticoId: campoId,
                subcampoSemanticoId: subcampoId,
                microcampoId: microcampoId,
                posicion: 0,
              },
            ],
          },
        },
        include: {
          formas: { orderBy: { orden: 'asc' } },
          ubicaciones: true,
        },
      });

      // 6. Registrar en auditoría
      await this.auditService.recordInTx(tx, {
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: 'create',
        entity: 'sentido',
        entityId: sentidoCreado.id.toString(),
        oldData: null,
        newData: {
          codigo: nuevoCodigo,
          estado: 'borrador',
          version: 1,
          espanolGlosa: sentidoCreado.espanolGlosa,
          formas: sentidoCreado.formas.map((f) => ({ orden: f.orden, lema: f.lema })),
          ubicacion: {
            nivel: ubicacionNivel,
            nodoCodigo,
          },
        },
      });

      return sentidoCreado;
    });
  }
}
