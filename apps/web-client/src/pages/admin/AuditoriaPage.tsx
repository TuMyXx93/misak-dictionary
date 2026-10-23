/**
 * AuditoriaPage
 * Spec 006 (R-019, T-049)
 * Consulta y trazabilidad del registro de auditoría con filtros por acción, usuario y visor de deltas (oldData/newData).
 */

import { useState } from 'react';
import { type AuditLogItem, useAdminAudit } from '@/hooks/useAdmin';

export function AuditoriaPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading, isError, error } = useAdminAudit({
    action: actionFilter || undefined,
    userId: userFilter || undefined,
    cursor,
    limit: 25,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Registro de Auditoría del Sistema
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Trazabilidad inmutable de todas las acciones editoriales y de gobierno (R-019).
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="filter-audit-action"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Filtrar por acción
          </label>
          <select
            id="filter-audit-action"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCursor(undefined);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Todas las acciones</option>
            <option value="sentido:create">Creación de sentido</option>
            <option value="sentido:update">Modificación de sentido</option>
            <option value="sentido:ratify">Ratificación de sentido</option>
            <option value="sentido:revert">Reversión de sentido</option>
            <option value="sentido:delete">Eliminación (papelera)</option>
            <option value="sentido:restore">Restauración de papelera</option>
            <option value="sentido:purge">Purga permanente</option>
            <option value="user:roles_update">Actualización de roles</option>
            <option value="user.create">Creación de usuario</option>
            <option value="settings:update">Modificación de ajustes</option>
            <option value="MEDIA_RATIFY">Ratificación de medio cultural</option>
            <option value="MEDIA_DELETE">Eliminación de medio cultural</option>
            <option value="auth.login">Inicio de sesión exitoso</option>
            <option value="auth.login.failed">Intento fallido de login</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-audit-user"
            className="block text-xs font-semibold text-slate-700 uppercase mb-1"
          >
            Filtrar por ID de Usuario
          </label>
          <input
            id="filter-audit-user"
            type="text"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setCursor(undefined);
            }}
            placeholder="Ej: 1 (ID numérico)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-slate-500" role="status">
          Cargando registros de auditoría...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          Error al cargar registros: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No se encontraron registros de auditoría con los filtros indicados.
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
                      Fecha y Hora
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Acción
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Usuario Responsable
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Entidad / ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-sky-800">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-700">
                        {log.userId ?? 'Sistema / Root'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {log.entityType} ({log.entityId ? log.entityId.slice(0, 8) + '...' : 'N/A'})
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {Boolean(log.oldData || log.newData) && (
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="text-sky-700 hover:text-sky-900 px-2 py-1 min-h-[44px]"
                          >
                            Ver cambios
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

      {/* Modal accesible para inspeccionar deltas oldData / newData */}
      {selectedLog && (
        <div
          role="dialog"
          aria-labelledby="audit-detail-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-slate-300">
            <h2 id="audit-detail-title" className="text-lg font-bold text-slate-900 mb-1">
              Detalle de Auditoría: {selectedLog.action}
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              ID: {selectedLog.id} | Fecha: {new Date(selectedLog.createdAt).toISOString()}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Estado Previo (oldData)
                </h3>
                <pre className="p-3 bg-slate-100 text-slate-800 text-xs rounded border border-slate-200 overflow-x-auto">
                  {selectedLog.oldData
                    ? JSON.stringify(selectedLog.oldData, null, 2)
                    : 'Sin datos previos'}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Nuevo Estado (newData)
                </h3>
                <pre className="p-3 bg-emerald-50 text-emerald-950 text-xs rounded border border-emerald-200 overflow-x-auto">
                  {selectedLog.newData
                    ? JSON.stringify(selectedLog.newData, null, 2)
                    : 'Sin datos nuevos'}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 min-h-[48px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
