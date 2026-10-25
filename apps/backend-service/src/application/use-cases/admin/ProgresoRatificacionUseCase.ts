/**
 * ProgresoRatificacionUseCase
 * Spec 006 (R-014, R-027) - Cálculo del progreso editorial de ratificación
 * (ratificados / total) agrupado por campo, subcampo y microcampo.
 */

import type { PrismaClient } from '../../../generated/prisma/client.js';
import { prisma as defaultPrisma } from '../../../shared/config/prisma.js';

export interface ProgresoNodoItem {
  id: string;
  codigo: string;
  nivel: 'campo' | 'subcampo' | 'microcampo';
  termino: string;
  padreCodigo: string | null;
  ratificados: number;
  borradores: number;
  total: number;
  porcentaje: number;
}

export interface ProgresoRatificacionFiltros {
  soloConPendientes?: boolean;
}

export class ProgresoRatificacionUseCase {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async execute(filtros: ProgresoRatificacionFiltros = {}): Promise<ProgresoNodoItem[]> {
    const [campos, subcampos, microcampos, ubicaciones] = await Promise.all([
      this.prisma.campoSemantico.findMany({
        where: { deletedAt: null },
        select: { id: true, codigo: true, espanolTermino: true },
        orderBy: { posicion: 'asc' },
      }),
      this.prisma.subcampoSemantico.findMany({
        where: { deletedAt: null },
        select: { id: true, codigo: true, espanolTermino: true, campoSemanticoId: true },
        orderBy: { posicion: 'asc' },
      }),
      this.prisma.microcampo.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          codigo: true,
          espanolTermino: true,
          subcampoSemanticoId: true,
          padreId: true,
        },
        orderBy: { posicion: 'asc' },
      }),
      this.prisma.sentidoUbicacion.findMany({
        where: {
          sentido: { deletedAt: null },
        },
        select: {
          campoSemanticoId: true,
          subcampoSemanticoId: true,
          microcampoId: true,
          sentido: {
            select: {
              id: true,
              estado: true,
            },
          },
        },
      }),
    ]);

    // Mapas de relaciones y contadores directos
    const subcampoToCampo = new Map<string, string>();
    const subcampoCodigos = new Map<string, string>();
    for (const s of subcampos) {
      subcampoToCampo.set(s.id.toString(), s.campoSemanticoId.toString());
      subcampoCodigos.set(s.id.toString(), s.codigo);
    }

    const microcampoToSubcampo = new Map<string, string>();
    const microcampoPadres = new Map<string, string | null>();
    const microcampoCodigos = new Map<string, string>();
    for (const m of microcampos) {
      microcampoToSubcampo.set(m.id.toString(), m.subcampoSemanticoId.toString());
      microcampoPadres.set(m.id.toString(), m.padreId ? m.padreId.toString() : null);
      microcampoCodigos.set(m.id.toString(), m.codigo);
    }

    // Estructuras de acumulación
    const campoContadores = new Map<string, { ratificados: number; total: number }>();
    for (const c of campos) {
      campoContadores.set(c.id.toString(), { ratificados: 0, total: 0 });
    }

    const subcampoContadores = new Map<string, { ratificados: number; total: number }>();
    for (const s of subcampos) {
      subcampoContadores.set(s.id.toString(), { ratificados: 0, total: 0 });
    }

    const microcampoContadores = new Map<string, { ratificados: number; total: number }>();
    for (const m of microcampos) {
      microcampoContadores.set(m.id.toString(), { ratificados: 0, total: 0 });
    }

    // Procesar cada ubicación activa
    for (const ub of ubicaciones) {
      const esRatificado = ub.sentido.estado === 'ratificado';

      if (ub.campoSemanticoId !== null) {
        const cId = ub.campoSemanticoId.toString();
        const stat = campoContadores.get(cId);
        if (stat) {
          stat.total += 1;
          if (esRatificado) stat.ratificados += 1;
        }
      } else if (ub.subcampoSemanticoId !== null) {
        const sId = ub.subcampoSemanticoId.toString();
        const statSub = subcampoContadores.get(sId);
        if (statSub) {
          statSub.total += 1;
          if (esRatificado) statSub.ratificados += 1;
        }

        // Acumular al campo padre
        const cId = subcampoToCampo.get(sId);
        if (cId) {
          const statCampo = campoContadores.get(cId);
          if (statCampo) {
            statCampo.total += 1;
            if (esRatificado) statCampo.ratificados += 1;
          }
        }
      } else if (ub.microcampoId !== null) {
        const mId = ub.microcampoId.toString();

        // Acumular recursivamente a todos los ancestros microcampo
        let currId: string | null = mId;
        while (currId) {
          const statMicro = microcampoContadores.get(currId);
          if (statMicro) {
            statMicro.total += 1;
            if (esRatificado) statMicro.ratificados += 1;
          }
          currId = microcampoPadres.get(currId) ?? null;
        }

        // Acumular al subcampo padre
        const sId = microcampoToSubcampo.get(mId);
        if (sId) {
          const statSub = subcampoContadores.get(sId);
          if (statSub) {
            statSub.total += 1;
            if (esRatificado) statSub.ratificados += 1;
          }

          // Acumular al campo padre
          const cId = subcampoToCampo.get(sId);
          if (cId) {
            const statCampo = campoContadores.get(cId);
            if (statCampo) {
              statCampo.total += 1;
              if (esRatificado) statCampo.ratificados += 1;
            }
          }
        }
      }
    }

    // Construir lista de resultados
    const resultados: ProgresoNodoItem[] = [];

    for (const c of campos) {
      const stats = campoContadores.get(c.id.toString()) ?? { ratificados: 0, total: 0 };
      const porcentaje =
        stats.total > 0 ? Math.round((stats.ratificados / stats.total) * 100) : 100;
      resultados.push({
        id: c.id.toString(),
        codigo: c.codigo,
        nivel: 'campo',
        termino: c.espanolTermino,
        padreCodigo: null,
        ratificados: stats.ratificados,
        borradores: stats.total - stats.ratificados,
        total: stats.total,
        porcentaje,
      });
    }

    for (const s of subcampos) {
      const stats = subcampoContadores.get(s.id.toString()) ?? { ratificados: 0, total: 0 };
      const porcentaje =
        stats.total > 0 ? Math.round((stats.ratificados / stats.total) * 100) : 100;
      const c = campos.find((c) => c.id === s.campoSemanticoId);
      resultados.push({
        id: s.id.toString(),
        codigo: s.codigo,
        nivel: 'subcampo',
        termino: s.espanolTermino,
        padreCodigo: c?.codigo ?? null,
        ratificados: stats.ratificados,
        borradores: stats.total - stats.ratificados,
        total: stats.total,
        porcentaje,
      });
    }

    for (const m of microcampos) {
      const stats = microcampoContadores.get(m.id.toString()) ?? { ratificados: 0, total: 0 };
      const porcentaje =
        stats.total > 0 ? Math.round((stats.ratificados / stats.total) * 100) : 100;
      const padreCodigo = m.padreId
        ? (microcampoCodigos.get(m.padreId.toString()) ?? null)
        : (subcampoCodigos.get(m.subcampoSemanticoId.toString()) ?? null);

      resultados.push({
        id: m.id.toString(),
        codigo: m.codigo,
        nivel: 'microcampo',
        termino: m.espanolTermino,
        padreCodigo,
        ratificados: stats.ratificados,
        borradores: stats.total - stats.ratificados,
        total: stats.total,
        porcentaje,
      });
    }

    if (filtros.soloConPendientes) {
      return resultados.filter((item) => item.total > item.ratificados);
    }

    return resultados;
  }
}
