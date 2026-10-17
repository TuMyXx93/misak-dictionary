/**
 * DashboardPage
 * Spec 006 (R-027, T-046)
 * Tablero editorial con progreso de ratificación por campo, subcampo y microcampo,
 * filtro «solo con pendientes» y barras de progreso accesibles.
 */

import { useState } from 'react';
import { useProgresoRatificacion } from '@/hooks/useAdmin';

export function DashboardPage() {
  const { data, isLoading, isError, error } = useProgresoRatificacion();
  const [soloConPendientes, setSoloConPendientes] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500" role="status">
        Cargando progreso de ratificación...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
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
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tablero de Gobierno Editorial
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Métricas y estado de ratificación del vocabulario Namtrik por jerarquía semántica (R-027).
        </p>
      </div>

      {/* Tarjetas de resumen global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Sentidos</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{data.global.total}</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Ratificados</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">
            {data.global.ratificados}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase">En Borrador</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-700">
            {data.global.borradores}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase">Avance Global</div>
          <div className="mt-2 text-3xl font-extrabold text-sky-800">{data.global.porcentaje}%</div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div
              role="progressbar"
              aria-label="Avance global de ratificación"
              aria-valuenow={data.global.porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.global.porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controles de filtro */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <label htmlFor="filtro-nodo" className="sr-only">
            Buscar por nodo
          </label>
          <input
            id="filtro-nodo"
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por código o título..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloConPendientes}
            onChange={(e) => setSoloConPendientes(e.target.checked)}
            className="h-4 w-4 text-sky-600 focus:ring-sky-500 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">
            Mostrar solo nodos con borradores pendientes
          </span>
        </label>
      </div>

      {/* Desglose por nodos */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {nodosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No se encontraron nodos con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Jerarquía
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Código / Título
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Ratificados
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Borradores
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-44"
                  >
                    Progreso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {nodosFiltrados.map((nodo) => (
                  <tr key={nodo.codigo} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs uppercase font-bold text-slate-500">
                      {nodo.tipo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="font-mono text-slate-600 mr-2">{nodo.codigo}</span>
                      <span className="font-medium text-slate-900">{nodo.titulo}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-emerald-700 font-semibold">
                      {nodo.ratificados}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-amber-700 font-semibold">
                      {nodo.borradores}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-700">
                      {nodo.total}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            role="progressbar"
                            aria-label={`Progreso del nodo ${nodo.codigo}`}
                            aria-valuenow={nodo.porcentaje}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className={`h-2 rounded-full ${
                              nodo.porcentaje === 100 ? 'bg-emerald-600' : 'bg-sky-600'
                            }`}
                            style={{ width: `${nodo.porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-600 w-10 text-right">
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
      </div>
    </div>
  );
}
