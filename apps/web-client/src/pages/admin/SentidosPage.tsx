/**
 * SentidosPage
 * Spec 006 (R-006, T-043)
 * Listado administrativo de sentidos con filtros por estado, tipo, nodo, texto y paginación.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSentidos, useDeleteSentido } from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

export function SentidosPage() {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission('taxonomy:write');
  const canDelete = hasPermission('taxonomy:delete');

  const [estadoFilter, setEstadoFilter] = useState<'borrador' | 'ratificado' | ''>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [nodoFilter, setNodoFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useAdminSentidos({
    estado: estadoFilter || undefined,
    tipo: tipoFilter || undefined,
    nodo: nodoFilter || undefined,
    search: searchQuery || undefined,
    cursor,
    limit: 20,
  });

  const deleteMutation = useDeleteSentido();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      setConfirmDeleteId(null);
    } catch {
      // Error manejado en UI
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Sentidos Léxicos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administración del inventario léxico Namtrik (R-006).
          </p>
        </div>
        {canWrite && (
          <Link
            to="/admin/sentidos/nuevo"
            className="inline-flex items-center justify-center px-4 py-2 min-h-[48px] rounded-md shadow-sm text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            + Nuevo sentido
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="filter-search"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Buscar texto / lema
          </label>
          <input
            id="filter-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCursor(undefined);
            }}
            placeholder="Buscar por lema o glosa..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label
            htmlFor="filter-estado"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Estado editorial
          </label>
          <select
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value as 'borrador' | 'ratificado' | '');
              setCursor(undefined);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">En borrador</option>
            <option value="ratificado">Ratificado</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-tipo"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Tipo de entrada
          </label>
          <select
            id="filter-tipo"
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value);
              setCursor(undefined);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Todos los tipos</option>
            <option value="termino">Término</option>
            <option value="variante">Variante</option>
            <option value="ejemplo">Ejemplo</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-nodo"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Filtrar por nodo
          </label>
          <input
            id="filter-nodo"
            type="text"
            value={nodoFilter}
            onChange={(e) => {
              setNodoFilter(e.target.value);
              setCursor(undefined);
            }}
            placeholder="Ej: C1.S1.M5"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Estados de carga / error */}
      {isLoading && (
        <div className="text-center py-12 text-slate-500" role="status">
          Cargando sentidos...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          Error al cargar los sentidos:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Tabla de resultados */}
      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No se encontraron sentidos con los filtros especificados.
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
                      Código
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Lema (Namtrik)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Glosa (Castellano)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Versión
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.items.map((sentido) => (
                    <tr key={sentido.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-600">
                        {sentido.codigo}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900"
                        lang="gum"
                      >
                        {sentido.lema}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                        {sentido.glosa}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sentido.estado === 'ratificado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sentido.estado === 'ratificado' ? 'Ratificado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                        v{sentido.version}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {canWrite && (
                          <Link
                            to={`/admin/sentidos/${sentido.id}/editar`}
                            className="text-sky-700 hover:text-sky-900 inline-block px-2 py-1 min-h-[36px] items-center"
                          >
                            Editar
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sentido.id)}
                            className="text-red-600 hover:text-red-800 inline-block px-2 py-1 min-h-[36px]"
                            aria-label={`Eliminar sentido ${sentido.codigo}`}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {data.nextCursor && (
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCursor(data.nextCursor ?? undefined)}
                className="px-4 py-2 min-h-[44px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cargar página siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Diálogo accesible de confirmación de eliminación */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-labelledby="dialog-delete-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 id="dialog-delete-title" className="text-lg font-bold text-slate-900">
              ¿Mover sentido a la papelera?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              El sentido podrá ser restaurado posteriormente desde la papelera o purgado según las
              políticas editoriales.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 min-h-[44px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
