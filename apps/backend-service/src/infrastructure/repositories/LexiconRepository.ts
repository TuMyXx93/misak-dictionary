/**
 * LexiconRepository
 * Lectura del estado actual de nodos taxonómicos y sentidos léxicos, y aplicación
 * transaccional de un plan de importación léxica (Spec 005).
 */

import type {
  AccionDescripcionNodo,
  AccionSentido,
  NodoTaxonomicoRef,
  SentidoExistenteSnapshot,
} from '../../application/lexicon/lexiconPlan.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/config/prisma.js';

type Cliente = Prisma.TransactionClient;

export interface SolicitudAplicacionLexico {
  batchId: string;
  aprobadoPor: string;
  fuenteSha256: string;
  duplicadosColapsados: number;
  descripciones: AccionDescripcionNodo[];
  sentidos: AccionSentido[];
}

export interface ResultadoAplicacionLexico {
  descripcionesActualizadas: number;
  sentidosCreados: number;
  sentidosActualizados: number;
  formasPersistidas: number;
  palabrasDemoRetiradas: number;
}

export class LexiconRepository {
  async cargarNodosActivos(cliente: Cliente = prisma): Promise<Map<string, NodoTaxonomicoRef>> {
    const [campos, subcampos, microcampos] = await Promise.all([
      cliente.campoSemantico.findMany({ where: { deletedAt: null } }),
      cliente.subcampoSemantico.findMany({ where: { deletedAt: null } }),
      cliente.microcampo.findMany({ where: { deletedAt: null } }),
    ]);

    const mapa = new Map<string, NodoTaxonomicoRef>();

    for (const c of campos) {
      mapa.set(c.codigo, {
        id: c.id,
        nivel: 'campo',
        codigo: c.codigo,
        namtrikDescripcion: c.namtrikDescripcion,
        espanolDescripcion: c.espanolDescripcion,
      });
    }
    for (const s of subcampos) {
      mapa.set(s.codigo, {
        id: s.id,
        nivel: 'subcampo',
        codigo: s.codigo,
        namtrikDescripcion: s.namtrikDescripcion,
        espanolDescripcion: s.espanolDescripcion,
      });
    }
    for (const m of microcampos) {
      mapa.set(m.codigo, {
        id: m.id,
        nivel: 'microcampo',
        codigo: m.codigo,
        namtrikDescripcion: m.namtrikDescripcion,
        espanolDescripcion: m.espanolDescripcion,
      });
    }

    return mapa;
  }

  async cargarSentidosActivos(
    cliente: Cliente = prisma,
  ): Promise<Map<string, SentidoExistenteSnapshot>> {
    const sentidos = await cliente.sentidoLexico.findMany({
      where: { deletedAt: null },
      include: {
        formas: { orderBy: { orden: 'asc' } },
        ubicaciones: {
          include: {
            campo: { select: { codigo: true } },
            subcampo: { select: { codigo: true } },
            microcampo: { select: { codigo: true } },
          },
        },
      },
    });

    const mapa = new Map<string, SentidoExistenteSnapshot>();

    for (const s of sentidos) {
      const ub = s.ubicaciones[0];
      const nodoCodigo = ub?.campo?.codigo ?? ub?.subcampo?.codigo ?? ub?.microcampo?.codigo ?? '';
      const posicion = ub?.posicion ?? 0;

      mapa.set(s.codigo, {
        id: s.id,
        codigo: s.codigo,
        nodoCodigo,
        posicion,
        tipo: s.tipo,
        namtrikContexto: s.namtrikContexto,
        espanolGlosa: s.espanolGlosa,
        espanolExplicacion: s.espanolExplicacion,
        nombreCientifico: s.nombreCientifico,
        respuestaNamtrik: s.respuestaNamtrik,
        respuestaNamtrikContexto: s.respuestaNamtrikContexto,
        respuestaEspanolGlosa: s.respuestaEspanolGlosa,
        respuestaEspanolExplicacion: s.respuestaEspanolExplicacion,
        observacionEditorial: s.observacionEditorial,
        formas: s.formas.map((f) => {
          const item: SentidoExistenteSnapshot['formas'][number] = {
            orden: f.orden,
            lema: f.lema,
            esNeologismo: f.esNeologismo,
            rasgosGramaticales: f.rasgosGramaticales,
          };
          if (f.acepcionHomonima !== null) item.acepcionHomonima = f.acepcionHomonima;
          if (f.categoriaGramatical !== null) item.categoriaGramatical = f.categoriaGramatical;
          if (f.variante !== null) item.variante = f.variante;
          if (f.etiquetaOriginal !== null) item.etiquetaOriginal = f.etiquetaOriginal;
          return item;
        }),
      });
    }

    return mapa;
  }

  async contarPalabrasDemoActivas(cliente: Cliente = prisma): Promise<number> {
    const [m1, m2] = await Promise.all([
      cliente.palabraModelo1.count({ where: { deletedAt: null } }),
      cliente.palabraModelo2.count({ where: { deletedAt: null } }),
    ]);
    return m1 + m2;
  }

  async aplicarEnTransaccion(
    solicitud: SolicitudAplicacionLexico,
  ): Promise<ResultadoAplicacionLexico> {
    return prisma.$transaction(
      async (tx) => {
        const ahora = new Date();
        let descripcionesActualizadas = 0;
        let sentidosCreados = 0;
        let sentidosActualizados = 0;
        let formasPersistidas = 0;

        // 1) Retirar lógicamente palabras demo legadas que siguieran activas
        const [retM1, retM2] = await Promise.all([
          tx.palabraModelo1.updateMany({
            where: { deletedAt: null },
            data: { deletedAt: ahora },
          }),
          tx.palabraModelo2.updateMany({
            where: { deletedAt: null },
            data: { deletedAt: ahora },
          }),
        ]);
        const palabrasDemoRetiradas = retM1.count + retM2.count;

        // 2) Actualizar descripciones bilingües de nodos taxonómicos
        for (const accDesc of solicitud.descripciones) {
          if (accDesc.tipo !== 'actualizar') continue;
          const data: { namtrikDescripcion?: string; espanolDescripcion?: string } = {};
          if (accDesc.descripcion.namtrikDescripcion !== undefined) {
            data.namtrikDescripcion = accDesc.descripcion.namtrikDescripcion;
          }
          if (accDesc.descripcion.espanolDescripcion !== undefined) {
            data.espanolDescripcion = accDesc.descripcion.espanolDescripcion;
          }

          if (accDesc.nivel === 'campo') {
            await tx.campoSemantico.update({ where: { id: accDesc.nodoId }, data });
          } else if (accDesc.nivel === 'subcampo') {
            await tx.subcampoSemantico.update({ where: { id: accDesc.nodoId }, data });
          } else {
            await tx.microcampo.update({ where: { id: accDesc.nodoId }, data });
          }
          descripcionesActualizadas += 1;
        }

        // 3) Crear en lote los sentidos nuevos y actualizar los modificados
        const accionesCrear = solicitud.sentidos.filter((acc) => acc.tipo === 'crear');
        const accionesActualizar = solicitud.sentidos.filter((acc) => acc.tipo === 'actualizar');

        if (accionesCrear.length > 0) {
          const creados = await tx.sentidoLexico.createManyAndReturn({
            data: accionesCrear.map((acc) => {
              const s = acc.sentido;
              return {
                codigo: s.codigo,
                tipo: s.tipo,
                namtrikContexto: s.namtrikContexto ?? null,
                espanolGlosa: s.espanolGlosa,
                espanolExplicacion: s.espanolExplicacion ?? null,
                nombreCientifico: s.nombreCientifico ?? null,
                respuestaNamtrik: s.dialogo?.respuestaNamtrik ?? null,
                respuestaNamtrikContexto: s.dialogo?.respuestaNamtrikContexto ?? null,
                respuestaEspanolGlosa: s.dialogo?.respuestaEspanolGlosa ?? null,
                respuestaEspanolExplicacion: s.dialogo?.respuestaEspanolExplicacion ?? null,
                observacionEditorial: s.observacionEditorial ?? null,
              };
            }),
            select: { id: true, codigo: true },
          });

          const idPorCodigo = new Map<string, bigint>(creados.map((c) => [c.codigo, c.id]));
          const formasBatch: Prisma.FormaNamtrikCreateManyInput[] = [];
          const ubicacionesBatch: Prisma.SentidoUbicacionCreateManyInput[] = [];

          for (const acc of accionesCrear) {
            const sentidoId = idPorCodigo.get(acc.sentido.codigo);
            if (sentidoId === undefined) continue;

            for (const f of acc.sentido.formas) {
              formasBatch.push({
                sentidoId,
                orden: f.orden,
                lema: f.lema,
                acepcionHomonima: f.acepcionHomonima ?? null,
                categoriaGramatical: f.categoriaGramatical ?? null,
                variante: f.variante ?? null,
                esNeologismo: f.esNeologismo,
                rasgosGramaticales: f.rasgosGramaticales,
                etiquetaOriginal: f.etiquetaOriginal ?? null,
              });
            }

            ubicacionesBatch.push({
              sentidoId,
              posicion: acc.sentido.posicion,
              campoSemanticoId: acc.nivelNodo === 'campo' ? acc.nodoId : null,
              subcampoSemanticoId: acc.nivelNodo === 'subcampo' ? acc.nodoId : null,
              microcampoId: acc.nivelNodo === 'microcampo' ? acc.nodoId : null,
            });
          }

          await tx.formaNamtrik.createMany({ data: formasBatch });
          await tx.sentidoUbicacion.createMany({ data: ubicacionesBatch });

          sentidosCreados += creados.length;
          formasPersistidas += formasBatch.length;
        }

        for (const acc of accionesActualizar) {
          if (acc.sentidoExistenteId === undefined) continue;
          const s = acc.sentido;
          const datosSentido = {
            codigo: s.codigo,
            tipo: s.tipo,
            namtrikContexto: s.namtrikContexto ?? null,
            espanolGlosa: s.espanolGlosa,
            espanolExplicacion: s.espanolExplicacion ?? null,
            nombreCientifico: s.nombreCientifico ?? null,
            respuestaNamtrik: s.dialogo?.respuestaNamtrik ?? null,
            respuestaNamtrikContexto: s.dialogo?.respuestaNamtrikContexto ?? null,
            respuestaEspanolGlosa: s.dialogo?.respuestaEspanolGlosa ?? null,
            respuestaEspanolExplicacion: s.dialogo?.respuestaEspanolExplicacion ?? null,
            observacionEditorial: s.observacionEditorial ?? null,
          };

          const formasCreate = s.formas.map((f) => ({
            orden: f.orden,
            lema: f.lema,
            acepcionHomonima: f.acepcionHomonima ?? null,
            categoriaGramatical: f.categoriaGramatical ?? null,
            variante: f.variante ?? null,
            esNeologismo: f.esNeologismo,
            rasgosGramaticales: f.rasgosGramaticales,
            etiquetaOriginal: f.etiquetaOriginal ?? null,
          }));

          const ubicacionCreate = {
            posicion: s.posicion,
            campoSemanticoId: acc.nivelNodo === 'campo' ? acc.nodoId : null,
            subcampoSemanticoId: acc.nivelNodo === 'subcampo' ? acc.nodoId : null,
            microcampoId: acc.nivelNodo === 'microcampo' ? acc.nodoId : null,
          };

          await tx.formaNamtrik.deleteMany({ where: { sentidoId: acc.sentidoExistenteId } });
          await tx.sentidoUbicacion.deleteMany({ where: { sentidoId: acc.sentidoExistenteId } });
          await tx.sentidoLexico.update({
            where: { id: acc.sentidoExistenteId },
            data: {
              ...datosSentido,
              version: { increment: 1 },
              formas: { create: formasCreate },
              ubicaciones: { create: [ubicacionCreate] },
            },
          });
          sentidosActualizados += 1;
          formasPersistidas += formasCreate.length;
        }

        // 4) Registrar en audit_log (R-008)
        await tx.auditLog.create({
          data: {
            actorUsername: solicitud.aprobadoPor,
            action: 'LEXICON_IMPORT',
            entity: 'lexicon',
            entityId: solicitud.batchId,
            newData: {
              fuenteSha256: solicitud.fuenteSha256,
              descripcionesActualizadas,
              sentidosCreados,
              sentidosActualizados,
              formasPersistidas,
              palabrasDemoRetiradas,
              duplicadosColapsados: solicitud.duplicadosColapsados,
            },
          },
        });

        return {
          descripcionesActualizadas,
          sentidosCreados,
          sentidosActualizados,
          formasPersistidas,
          palabrasDemoRetiradas,
        };
      },
      { timeout: 60000 },
    );
  }
}
