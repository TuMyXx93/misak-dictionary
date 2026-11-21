/**
 * AuditoriaPage
 * Spec 006 (R-019, T-049)
 * Consulta y trazabilidad del registro de auditoría con filtros por acción, usuario y visor de deltas (oldData/newData).
 */

import { useState } from 'react';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminSurface,
} from '@/components/admin/ui';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { type AuditLogItem, useAdminAudit } from '@/hooks/useAdmin';
import { cn } from '@/utils/cn';

export function AuditoriaPage() {
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const resetPagination = () => {
    setCursor(undefined);
    setCursorHistory([]);
  };

  const { data, isLoading, isError, error } = useAdminAudit({
    action: actionFilter || undefined,
    userId: userFilter || undefined,
    cursor,
    limit: 25,
  });

  const errorAlertClasses = isDark
    ? 'bg-red-950/80 text-red-100 border-red-500/50'
    : 'bg-red-50 text-red-900 border-red-600/40';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Trazabilidad y Gobernanza"
        title="Registro de Auditoría del Sistema"
        description="Trazabilidad inmutable de todas las acciones editoriales y de gobierno (R-019)."
      />

      {/* Filtros */}
      <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <AdminFieldLabel htmlFor="filter-audit-action">Filtrar por acción</AdminFieldLabel>
          <AdminSelect
            id="filter-audit-action"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              resetPagination();
            }}
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
            <option value="MEDIA_UPLOAD">Carga de medio cultural</option>
            <option value="MEDIA_UPDATE">Actualización de medio cultural</option>
            <option value="MEDIA_RATIFY">Ratificación de medio cultural</option>
            <option value="MEDIA_DELETE">Eliminación de medio cultural</option>
            <option value="auth.login">Inicio de sesión exitoso</option>
            <option value="auth.login.failed">Intento fallido de login</option>
          </AdminSelect>
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-audit-user">Filtrar por ID de Usuario</AdminFieldLabel>
          <AdminInput
            id="filter-audit-user"
            type="text"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              resetPagination();
            }}
            placeholder="Ej: 1 (ID numérico)"
            className="font-mono"
          />
        </div>
      </AdminSurface>

      {isLoading && (
        <AdminSurface
          variant="muted"
          className="text-center py-12 text-[var(--admin-text-secondary)]"
        >
          <output className="block">Cargando registros de auditoría...</output>
        </AdminSurface>
      )}

      {isError && (
        <div role="alert" className={cn('p-4 rounded-xl border text-sm', errorAlertClasses)}>
          Error al cargar registros: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <AdminSurface className="overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 text-[var(--admin-text-secondary)] text-sm">
              No se encontraron registros de auditoría con los filtros indicados.
            </div>
          ) : (
            <section
              className="misak-table-region @container"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: región de tabla desplazable por teclado (WCAG 2.1.1 / responsive-table)
              tabIndex={0}
              aria-label="Tabla de registros de auditoría"
            >
              <table className="misak-responsive-table min-w-full divide-y divide-[var(--admin-border)]">
                <thead className="bg-[var(--admin-surface-muted)]">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                    >
                      Fecha y Hora
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                    >
                      Acción
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                    >
                      Usuario Responsable
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                    >
                      Entidad / ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                    >
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--admin-surface)] divide-y divide-[var(--admin-border)]">
                  {data.items.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                    >
                      <td
                        data-label="Fecha y Hora"
                        className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--admin-text-secondary)]"
                      >
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td
                        data-label="Acción"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-[var(--admin-primary-text)]"
                      >
                        {log.action}
                      </td>
                      <td
                        data-label="Usuario Responsable"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-[var(--admin-text)]"
                      >
                        {log.actorUsername ?? log.userId ?? log.actorUserId ?? 'Sistema / Root'}
                      </td>
                      <td
                        data-label="Entidad / ID"
                        className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--admin-text-secondary)] font-mono"
                      >
                        {log.entityType ?? log.entity ?? 'sistema'} (
                        {log.entityId
                          ? log.entityId.length > 12
                            ? `${log.entityId.slice(0, 8)}...`
                            : log.entityId
                          : 'N/A'}
                        )
                      </td>
                      <td
                        data-label="Detalles"
                        className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium"
                      >
                        {Boolean(log.oldData || log.newData) && (
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="min-h-[44px] text-[var(--admin-primary-text)]"
                          >
                            Ver cambios
                          </AdminButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {(cursorHistory.length > 0 || data.nextCursor) && (
            <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)] flex items-center justify-end gap-2">
              {cursorHistory.length > 0 && (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    const prevCursor = cursorHistory[cursorHistory.length - 1];
                    setCursorHistory((prev) => prev.slice(0, -1));
                    setCursor(prevCursor);
                  }}
                >
                  Página anterior
                </AdminButton>
              )}
              {data.nextCursor && (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setCursorHistory((prev) => [...prev, cursor]);
                    setCursor(data.nextCursor ?? undefined);
                  }}
                >
                  Cargar página siguiente
                </AdminButton>
              )}
            </div>
          )}
        </AdminSurface>
      )}

      {/* Modal accesible para inspeccionar deltas oldData / newData */}
      {selectedLog && (
        <AdminDialog
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Detalle de Auditoría: ${selectedLog.action}`}
          subtitle={`ID: ${selectedLog.id} | Fecha: ${new Date(selectedLog.createdAt).toISOString()}`}
          titleId="audit-detail-title"
          maxWidthClass="max-w-3xl"
          footer={
            <AdminButton variant="secondary" size="lg" onClick={() => setSelectedLog(null)}>
              Cerrar
            </AdminButton>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1.5">
                Estado Previo (oldData)
              </h3>
              <pre className="p-3.5 bg-[var(--admin-surface-muted)] text-[var(--admin-text)] text-xs font-mono rounded-xl border border-[var(--admin-border)] overflow-x-auto">
                {selectedLog.oldData
                  ? JSON.stringify(selectedLog.oldData, null, 2)
                  : 'Sin datos previos'}
              </pre>
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--admin-primary-text)] uppercase tracking-wider mb-1.5">
                Nuevo Estado (newData)
              </h3>
              <pre className="p-3.5 bg-[var(--admin-surface-muted)] text-[var(--admin-text)] text-xs font-mono rounded-xl border border-[var(--admin-border)] overflow-x-auto">
                {selectedLog.newData
                  ? JSON.stringify(selectedLog.newData, null, 2)
                  : 'Sin datos nuevos'}
              </pre>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
