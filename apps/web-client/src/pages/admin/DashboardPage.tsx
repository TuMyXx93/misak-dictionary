/**
 * DashboardPage
 * Spec 006 (R-027, T-046)
 * Tablero editorial con progreso de ratificación por campo, subcampo y microcampo,
 * filtro «solo con pendientes» y barras de progreso accesibles en modo Light y Dark Misak.
 */

import { useState } from 'react';
import { AdminBadge, AdminInput, AdminPageHeader, AdminSurface } from '@/components/admin/ui';
import { useProgresoRatificacion } from '@/hooks/useAdmin';

export function DashboardPage() {
  const { data, isLoading, isError, error } = useProgresoRatificacion();
  const [soloConPendientes, setSoloConPendientes] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');

  if (isLoading) {
    return (
      <AdminSurface className="py-12 px-6 text-center text-[var(--admin-text-secondary)]">
        <div role="status">Cargando progreso de ratificación...</div>
      </AdminSurface>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
      >
        Error al cargar métricas: {error instanceof Error ? error.message : 'Error desconocido'}
      </div>
    );
  }

  if (!data) return null;

  const nodosFiltrados = data.nodos.filter((n) => {
    if (soloConPendientes && n.borradores === 0) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      return n.codigo.toLowerCase().includes(q) || Boolean(n.titulo?.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gobierno Lingüístico"
        title="Tablero de Gobierno Editorial"
        description="Métricas y estado de ratificación del vocabulario Namtrik por jerarquía semántica (R-027)."
      />

      {/* Tarjetas KPI superiores con acento cromático Misak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminSurface className="overflow-hidden">
          <div className="h-1.5 w-full bg-[#0055AA]" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-bold text-[var(--admin-primary-text)] uppercase tracking-wider">
              Total Sentidos
            </div>
            <div className="mt-2 text-3xl font-extrabold font-display text-[var(--admin-text)]">
              {data.global.total}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface className="overflow-hidden">
          <div className="h-1.5 w-full bg-emerald-600" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Ratificados
            </div>
            <div className="mt-2 text-3xl font-extrabold font-display text-emerald-800 dark:text-emerald-300">
              {data.global.ratificados}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface className="overflow-hidden">
          <div className="h-1.5 w-full bg-amber-500" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              En Borrador
            </div>
            <div className="mt-2 text-3xl font-extrabold font-display text-amber-900 dark:text-amber-200">
              {data.global.borradores}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface className="overflow-hidden">
          <div
            className="h-1.5 w-full bg-gradient-to-r from-[#E52D6D] to-[#0055AA]"
            aria-hidden="true"
          />
          <div className="p-5">
            <div className="text-xs font-bold text-[var(--admin-accent-text)] uppercase tracking-wider">
              Avance Global
            </div>
            <div className="mt-2 text-3xl font-extrabold font-display text-[var(--admin-text)]">
              {data.global.porcentaje}%
            </div>
            <div className="mt-2.5 w-full bg-[var(--admin-surface-muted)] rounded-full h-2.5 overflow-hidden border border-[var(--admin-border)]">
              <div
                role="progressbar"
                aria-label="Avance global de ratificación"
                aria-valuenow={data.global.porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-gradient-to-r from-[#0055AA] to-[#E52D6D] h-full rounded-full transition-all duration-300"
                style={{ width: `${data.global.porcentaje}%` }}
              />
            </div>
          </div>
        </AdminSurface>
      </div>

      {/* Controles de filtro */}
      <AdminSurface className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label htmlFor="filtro-nodo" className="sr-only">
            Buscar por nodo
          </label>
          <AdminInput
            id="filtro-nodo"
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por código o título..."
          />
        </div>

        <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloConPendientes}
            onChange={(e) => setSoloConPendientes(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--admin-control-border)] accent-[#0055AA] focus:ring-2 focus:ring-[#0055AA]"
          />
          <span className="text-sm font-medium text-[var(--admin-text)]">
            Mostrar solo nodos con borradores pendientes
          </span>
        </label>
      </AdminSurface>

      {/* Desglose por nodos */}
      <AdminSurface className="overflow-hidden">
        {nodosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
            No se encontraron nodos con los criterios seleccionados.
          </div>
        ) : (
          <div className="misak-table-region @container">
            <table className="misak-responsive-table text-left text-sm text-[var(--admin-text)]">
              <thead className="bg-[var(--admin-surface-muted)] text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)]">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left">
                    Jerarquía
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left">
                    Código / Título
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Ratificados
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Borradores
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left w-52">
                    Progreso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {nodosFiltrados.map((nodo) => (
                  <tr
                    key={nodo.codigo}
                    className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                  >
                    <td data-label="Jerarquía" className="px-4 py-3.5 whitespace-nowrap">
                      <AdminBadge
                        tone={
                          nodo.tipo === 'campo'
                            ? 'primary'
                            : nodo.tipo === 'subcampo'
                              ? 'accent'
                              : 'neutral'
                        }
                        className="uppercase"
                      >
                        {nodo.tipo}
                      </AdminBadge>
                    </td>
                    <td data-label="Código / Título" className="px-4 py-3.5 text-sm">
                      <div>
                        <span className="font-mono text-xs font-semibold text-[var(--admin-text-secondary)] mr-2">
                          {nodo.codigo}
                        </span>
                        <span className="font-semibold text-[var(--admin-text)]">
                          {nodo.titulo}
                        </span>
                      </div>
                    </td>
                    <td
                      data-label="Ratificados"
                      className="px-4 py-3.5 whitespace-nowrap text-sm text-center text-emerald-700 dark:text-emerald-300 font-bold"
                    >
                      {nodo.ratificados}
                    </td>
                    <td
                      data-label="Borradores"
                      className="px-4 py-3.5 whitespace-nowrap text-sm text-center text-amber-800 dark:text-amber-300 font-bold"
                    >
                      {nodo.borradores}
                    </td>
                    <td
                      data-label="Total"
                      className="px-4 py-3.5 whitespace-nowrap text-sm text-center font-medium text-[var(--admin-text)]"
                    >
                      {nodo.total}
                    </td>
                    <td data-label="Progreso" className="px-4 py-3.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <div className="flex-1 bg-[var(--admin-surface-muted)] rounded-full h-2.5 overflow-hidden border border-[var(--admin-border)]">
                          <div
                            role="progressbar"
                            aria-label={`Progreso del nodo ${nodo.codigo}`}
                            aria-valuenow={nodo.porcentaje}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className={`h-full rounded-full transition-all ${
                              nodo.porcentaje === 100 ? 'bg-emerald-600' : 'bg-[#0055AA]'
                            }`}
                            style={{ width: `${nodo.porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-[var(--admin-text-secondary)] w-10 text-right">
                          {nodo.porcentaje}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSurface>
    </div>
  );
}
