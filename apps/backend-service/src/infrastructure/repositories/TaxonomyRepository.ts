/**
 * TaxonomyRepository
 * Lectura de la taxonomía activa y aplicación transaccional de un plan de
 * importación (spec 004: gobernanza de la carga).
 */

import type {
  FilaBoton,
  FilaExistente,
  NodoPlan,
} from '../../application/taxonomy/taxonomyPlan.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/config/prisma.js';

type Cliente = Prisma.TransactionClient;

/** Prefijo de las filas de demo migradas por la 0006: se retiran al importar. */
export const PREFIJO_LEGADO = 'LEG-';

export type FilaActiva = FilaExistente;

export interface ResultadoAplicacion {
  retiradas: number;
  palabrasRetiradas: number;
  creadas: number;
  actualizadas: number;
  botonesActualizados: number;
}

export interface AplicacionPlan {
  batchId: string;
  aprobadoPor: string;
  fuenteSha256: string;
  retirar: boolean;
  nodos: { accion: 'crear' | 'actualizar'; nodo: NodoPlan }[];
  botones: {
    clave: string;
    etiqueta: string;
    posicion: number;
    campoCodigo: string | null;
  }[];
}

export class TaxonomyRepository {
  async cargarActivos(cliente: Cliente = prisma): Promise<FilaActiva[]> {
    const [campos, subcampos, microcampos] = await Promise.all([
      cliente.campoSemantico.findMany({ where: { deletedAt: null } }),
      cliente.subcampoSemantico.findMany({
        where: { deletedAt: null },
        include: { campoSemantico: { select: { codigo: true } } },
      }),
      cliente.microcampo.findMany({
        where: { deletedAt: null },
        include: {
          subcampoSemantico: { select: { codigo: true } },
          padre: { select: { codigo: true } },
        },
      }),
    ]);

    const filas: FilaActiva[] = [];

    for (const c of campos) {
      filas.push({
        id: c.id,
        codigo: c.codigo,
        nivel: 'campo',
        padreCodigo: null,
        subcampoCodigo: null,
        profundidad: 0,
        namtrik: c.namtrikTermino,
        espanol: c.espanolTermino,
        descripcion: c.espanolDescripcion,
        slug: c.slug,
        posicion: c.posicion,
      });
    }

    for (const s of subcampos) {
      filas.push({
        id: s.id,
        codigo: s.codigo,
        nivel: 'subcampo',
        padreCodigo: s.campoSemantico.codigo,
        subcampoCodigo: null,
        profundidad: 0,
        namtrik: s.namtrikTermino,
        espanol: s.espanolTermino,
        descripcion: s.espanolDescripcion,
        slug: s.slug,
        posicion: s.posicion,
      });
    }

    for (const m of microcampos) {
      filas.push({
        id: m.id,
        codigo: m.codigo,
        nivel: 'microcampo',
        padreCodigo: m.padre?.codigo ?? m.subcampoSemantico.codigo,
        subcampoCodigo: m.subcampoSemantico.codigo,
        profundidad: m.profundidad,
        namtrik: m.namtrikTermino,
        espanol: m.espanolTermino,
        descripcion: m.espanolDescripcion,
        slug: m.slug,
        posicion: m.posicion,
      });
    }

    return filas;
  }

  async cargarBotones(): Promise<FilaBoton[]> {
    const botones = await prisma.homeSlot.findMany({
      orderBy: { posicion: 'asc' },
      include: { campo: { select: { codigo: true } } },
    });
    return botones.map((boton) => ({
      clave: boton.clave,
      etiqueta: boton.etiqueta,
      campoCodigo: boton.campo?.codigo ?? null,
      posicion: boton.posicion,
    }));
  }

  /**
   * Aplica el plan en una sola transacción: retira filas legadas (si procede),
   * crea y actualiza nodos en orden padre→hijo (cualquier profundidad),
   * sincroniza botones del home y registra una entrada de auditoría por lote.
   */
  async aplicar(plan: AplicacionPlan): Promise<ResultadoAplicacion> {
    return prisma.$transaction(
      async (tx) => {
        let retiradas = 0;
        let palabrasRetiradas = 0;

        if (plan.retirar) {
          const campos = await tx.campoSemantico.updateMany({
            where: { codigo: { startsWith: PREFIJO_LEGADO }, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          const subcampos = await tx.subcampoSemantico.updateMany({
            where: { codigo: { startsWith: PREFIJO_LEGADO }, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          const micros = await tx.microcampo.updateMany({
            where: { codigo: { startsWith: PREFIJO_LEGADO }, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          retiradas = campos.count + subcampos.count + micros.count;

          palabrasRetiradas = await tx.$executeRaw`
            UPDATE palabras_modelo_1 p
               SET deleted_at = now()
             WHERE p.deleted_at IS NULL
               AND EXISTS (
                 SELECT 1 FROM palabrasm1_microcampos l
                   JOIN microcampos m ON m.id = l.microcampo_id
                  WHERE l.palabra_id = p.id AND m.codigo LIKE 'LEG-%')
               AND NOT EXISTS (
                 SELECT 1 FROM palabrasm1_microcampos l
                   JOIN microcampos m ON m.id = l.microcampo_id
                  WHERE l.palabra_id = p.id AND m.codigo NOT LIKE 'LEG-%')`;
        }

        const idPorCodigo = new Map<string, bigint>();
        const subcampoPorMicro = new Map<string, bigint>();
        const existentes = await this.cargarActivos(tx);
        for (const fila of existentes) {
          idPorCodigo.set(fila.codigo, fila.id);
        }
        for (const fila of existentes) {
          if (fila.nivel === 'microcampo' && fila.subcampoCodigo !== null) {
            const subcampoId = idPorCodigo.get(fila.subcampoCodigo);
            if (subcampoId !== undefined) subcampoPorMicro.set(fila.codigo, subcampoId);
          }
        }

        let creadas = 0;
        let actualizadas = 0;
        const registro: { codigo: string; accion: string }[] = [];

        for (const { accion, nodo } of plan.nodos) {
          const datosComunes = {
            codigo: nodo.codigo,
            slug: nodo.slug,
            posicion: nodo.posicion,
            espanolTermino: nodo.espanol,
            espanolDescripcion: nodo.descripcion,
          };

          if (accion === 'actualizar') {
            const id = idPorCodigo.get(nodo.codigo);
            if (id === undefined)
              throw new Error(`nodo a actualizar no encontrado: ${nodo.codigo}`);
            await this.actualizarNodo(tx, nodo, id, datosComunes);
            actualizadas += 1;
            registro.push({ codigo: nodo.codigo, accion });
            continue;
          }

          if (nodo.nivel === 'campo') {
            const creado = await tx.campoSemantico.create({
              data: {
                ...datosComunes,
                namtrikTermino: nodo.namtrik ?? '',
                estado: 'borrador',
              },
            });
            idPorCodigo.set(nodo.codigo, creado.id);
          } else if (nodo.nivel === 'subcampo') {
            const campoId = this.buscarPadre(idPorCodigo, nodo.padreCodigo);
            const creado = await tx.subcampoSemantico.create({
              data: {
                ...datosComunes,
                campoSemanticoId: campoId,
                namtrikTermino: nodo.namtrik ?? '',
              },
            });
            idPorCodigo.set(nodo.codigo, creado.id);
          } else {
            // Hijo directo del subcampo (profundidad 0) o subnivel (profundidad > 0):
            // el padre del subnivel comparte subcampo, garantizado por la FK compuesta.
            let padreMicroId: bigint | null = null;
            let subcampoId: bigint;
            if (nodo.profundidad === 0) {
              subcampoId = this.buscarPadre(idPorCodigo, nodo.padreCodigo);
            } else {
              padreMicroId = this.buscarPadre(idPorCodigo, nodo.padreCodigo);
              subcampoId = this.buscarSubcampoDeMicro(subcampoPorMicro, nodo.padreCodigo);
            }
            const creado = await tx.microcampo.create({
              data: {
                ...datosComunes,
                subcampoSemanticoId: subcampoId,
                padreId: padreMicroId,
                profundidad: nodo.profundidad,
                namtrikTermino: nodo.namtrik,
              },
            });
            idPorCodigo.set(nodo.codigo, creado.id);
            subcampoPorMicro.set(nodo.codigo, subcampoId);
          }
          creadas += 1;
          registro.push({ codigo: nodo.codigo, accion: 'crear' });
        }

        let botonesActualizados = 0;
        for (const boton of plan.botones) {
          const campoId =
            boton.campoCodigo === null ? null : (idPorCodigo.get(boton.campoCodigo) ?? null);
          if (boton.campoCodigo !== null && campoId === null) {
            throw new Error(`botón ${boton.clave} referencia un campo inexistente`);
          }
          await tx.homeSlot.upsert({
            where: { clave: boton.clave },
            update: {
              etiqueta: boton.etiqueta,
              posicion: boton.posicion,
              campoSemanticoId: campoId,
              version: { increment: 1 },
            },
            create: {
              clave: boton.clave,
              etiqueta: boton.etiqueta,
              posicion: boton.posicion,
              campoSemanticoId: campoId,
            },
          });
          botonesActualizados += 1;
        }

        await tx.auditLog.create({
          data: {
            action: 'taxonomy.import',
            entity: 'taxonomy',
            entityId: plan.batchId,
            actorUsername: plan.aprobadoPor,
            newData: {
              fuenteSha256: plan.fuenteSha256,
              retiradas,
              palabrasRetiradas,
              creadas,
              actualizadas,
              botonesActualizados,
              nodos: registro,
            },
          },
        });

        return {
          retiradas,
          palabrasRetiradas,
          creadas,
          actualizadas,
          botonesActualizados,
        };
      },
      { timeout: 60_000 },
    );
  }

  private async actualizarNodo(
    tx: Cliente,
    nodo: NodoPlan,
    id: bigint,
    datosComunes: {
      codigo: string;
      slug: string;
      posicion: number;
      espanolTermino: string;
      espanolDescripcion: string | null;
    },
  ): Promise<void> {
    const data = {
      slug: datosComunes.slug,
      posicion: datosComunes.posicion,
      espanolTermino: datosComunes.espanolTermino,
      espanolDescripcion: datosComunes.espanolDescripcion,
      version: { increment: 1 },
    };

    if (nodo.nivel === 'campo') {
      await tx.campoSemantico.update({
        where: { id },
        data: { ...data, namtrikTermino: nodo.namtrik ?? '' },
      });
    } else if (nodo.nivel === 'subcampo') {
      await tx.subcampoSemantico.update({
        where: { id },
        data: { ...data, namtrikTermino: nodo.namtrik ?? '' },
      });
    } else {
      await tx.microcampo.update({
        where: { id },
        data: { ...data, namtrikTermino: nodo.namtrik },
      });
    }
  }

  private buscarPadre(idPorCodigo: Map<string, bigint>, padreCodigo: string | null): bigint {
    const id = padreCodigo === null ? undefined : idPorCodigo.get(padreCodigo);
    if (id === undefined) throw new Error(`padre no encontrado: ${padreCodigo ?? '(ninguno)'}`);
    return id;
  }

  private buscarSubcampoDeMicro(
    subcampoPorMicro: Map<string, bigint>,
    microCodigo: string | null,
  ): bigint {
    const id = microCodigo === null ? undefined : subcampoPorMicro.get(microCodigo);
    if (id === undefined) throw new Error(`microcampo padre no encontrado: ${microCodigo}`);
    return id;
  }
}
