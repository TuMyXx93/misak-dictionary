/**
 * SentidosPage
 * Spec 006 (R-006, T-043)
 * Listado administrativo de sentidos con filtros por estado, tipo, nodo, texto y paginación.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminAbreviaturasModal } from '@/components/admin/AdminAbreviaturasModal';
import {
  AdminActionLink,
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminPlusIcon,
  AdminSelect,
  AdminSurface,
} from '@/components/admin/ui';
import { AbbreviationBadge } from '@/components/ui/AbbreviationBadge';
import { useAdminAbreviaturas, useAdminSentidos, useDeleteSentido } from '@/hooks/useAdmin';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';

export function SentidosPage() {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission(PERMISSIONS.DICCIONARIO_ESCRIBIR);
  const canDelete = hasPermission(PERMISSIONS.DICCIONARIO_BORRAR);

  const [estadoFilter, setEstadoFilter] = useState<'borrador' | 'ratificado' | ''>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [nodoFilter, setNodoFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [cientificoFilter, setCientificoFilter] = useState<'todos' | 'con' | 'sin'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAbrevModalOpen, setIsAbrevModalOpen] = useState(false);

  const resetPagination = () => {
    setCursor(undefined);
    setCursorHistory([]);
  };

  const { data: abreviaturas } = useAdminAbreviaturas();

  const { data, isLoading, isError, error } = useAdminSentidos({
    estado: estadoFilter || undefined,
    tipo: tipoFilter || undefined,
    nodo: nodoFilter || undefined,
    categoriaGramatical: categoriaFilter || undefined,
    conNombreCientifico:
      cientificoFilter === 'con' ? 'true' : cientificoFilter === 'sin' ? 'false' : undefined,
    search: debouncedSearch || undefined,
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
      <AdminPageHeader
        eyebrow="Inventario Léxico"
        title="Gestión de Sentidos Léxicos"
        description="Administración del inventario léxico Namtrik (R-006)."
        actions={
          canWrite ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <AdminButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsAbrevModalOpen(true)}
              >
                <span>Gestionar abreviaturas</span>
              </AdminButton>
              <AdminActionLink aria-label="+ Nuevo sentido" to="/admin/sentidos/nuevo">
                <AdminPlusIcon />
                <span>Nuevo sentido</span>
              </AdminActionLink>
            </div>
          ) : undefined
        }
      />

      {/* Filtros */}
      <AdminSurface className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <AdminFieldLabel htmlFor="filter-search">Buscar texto / lema</AdminFieldLabel>
          <AdminInput
            id="filter-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetPagination();
            }}
            placeholder="Buscar por lema o glosa..."
          />
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-estado">Estado editorial</AdminFieldLabel>
          <AdminSelect
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => {
              setEstadoFilter(e.target.value as 'borrador' | 'ratificado' | '');
              resetPagination();
            }}
          >
            <option value="">Todos los estados</option>
            <option value="borrador">En borrador</option>
            <option value="ratificado">Ratificado</option>
          </AdminSelect>
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-tipo">Tipo de entrada</AdminFieldLabel>
          <AdminSelect
            id="filter-tipo"
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value);
              resetPagination();
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="estandar">Estándar</option>
            <option value="dialogico">Dialógico</option>
          </AdminSelect>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <AdminFieldLabel htmlFor="filter-categoria">Categoría Gramatical</AdminFieldLabel>
            {canWrite && (
              <button
                type="button"
                onClick={() => setIsAbrevModalOpen(true)}
                className="text-xs text-[#0055AA] dark:text-[#5599EE] hover:underline font-semibold cursor-pointer mb-1.5"
              >
                Catálogo ({abreviaturas?.length ?? 41})
              </button>
            )}
          </div>
          <AdminSelect
            id="filter-categoria"
            value={categoriaFilter}
            onChange={(e) => {
              setCategoriaFilter(e.target.value);
              resetPagination();
            }}
          >
            <option value="">Todas las categorías</option>
            {abreviaturas?.map((abrev) => (
              <option key={abrev.id} value={abrev.codigo}>
                {abrev.codigo} — {abrev.etiquetaCompleta}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-cientifico">Nombre Científico</AdminFieldLabel>
          <AdminSelect
            id="filter-cientifico"
            value={cientificoFilter}
            onChange={(e) => {
              setCientificoFilter(e.target.value as 'todos' | 'con' | 'sin');
              resetPagination();
            }}
          >
            <option value="todos">Todos</option>
            <option value="con">Solo con nombre científico</option>
            <option value="sin">Sin nombre científico</option>
          </AdminSelect>
        </div>

        <div>
          <AdminFieldLabel htmlFor="filter-nodo">Filtrar por nodo</AdminFieldLabel>
          <AdminInput
            id="filter-nodo"
            type="text"
            value={nodoFilter}
            onChange={(e) => {
              setNodoFilter(e.target.value);
              resetPagination();
            }}
            placeholder="Ej: C1.S1.M5"
          />
        </div>
      </AdminSurface>

      {/* Estados de carga / error */}
      {isLoading && (
        <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
          <output className="block">Cargando sentidos...</output>
        </AdminSurface>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
        >
          Error al cargar los sentidos:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Tabla de resultados */}
      {!isLoading && !isError && data && (
        <AdminSurface className="overflow-hidden">
          {data.items.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
              No se encontraron sentidos con los filtros especificados.
            </div>
          ) : (
            <section
              className="misak-table-region @container"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: región de tabla desplazable por teclado (WCAG 2.1.1 / responsive-table)
              tabIndex={0}
              aria-label="Tabla de sentidos léxicos"
            >
              <table className="misak-responsive-table text-left text-sm text-[var(--admin-text)]">
                <thead className="bg-[var(--admin-surface-muted)] text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Código
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Lema (Namtrik)
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Glosa (Castellano)
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Nombre Científico
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Estado
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Medios
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left">
                      Versión
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {data.items.map((sentido) => (
                    <tr
                      key={sentido.id}
                      className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                    >
                      <td
                        data-label="Código"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-[var(--admin-text-secondary)]"
                      >
                        {sentido.codigo}
                      </td>
                      <td
                        data-label="Lema (Namtrik)"
                        className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-[var(--admin-text)]"
                        lang="gum"
                      >
                        <div className="flex items-center gap-2">
                          <span>{sentido.lema}</span>
                          {sentido.categoriaGramatical && (
                            <AbbreviationBadge value={sentido.categoriaGramatical} size="xs" />
                          )}
                        </div>
                      </td>
                      <td
                        data-label="Glosa (Castellano)"
                        className="px-4 py-3.5 text-sm text-[var(--admin-text-secondary)] max-w-xs truncate"
                      >
                        {sentido.glosa}
                      </td>
                      <td
                        data-label="Nombre Científico"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-serif italic text-emerald-800 dark:text-emerald-300"
                      >
                        {sentido.nombreCientifico || (
                          <span className="text-[var(--admin-text-muted)] not-italic">—</span>
                        )}
                      </td>
                      <td data-label="Estado" className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <AdminBadge tone={sentido.estado === 'ratificado' ? 'success' : 'warning'}>
                          {sentido.estado === 'ratificado' ? 'Ratificado' : 'Borrador'}
                        </AdminBadge>
                      </td>
                      <td
                        data-label="Medios"
                        className="px-4 py-3.5 whitespace-nowrap text-xs font-mono"
                      >
                        <AdminBadge tone={(sentido.mediosCount ?? 0) > 0 ? 'primary' : 'neutral'}>
                          {sentido.mediosCount ?? 0}
                        </AdminBadge>
                      </td>
                      <td
                        data-label="Versión"
                        className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--admin-text-muted)] font-mono"
                      >
                        v{sentido.version}
                      </td>
                      <td
                        data-label="Acciones"
                        className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium"
                      >
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {canWrite && (
                            <Link
                              to={`/admin/sentidos/${sentido.id}/editar`}
                              className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-primary-text)] transition-colors"
                            >
                              Editar
                            </Link>
                          )}
                          {canDelete && (
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmDeleteId(sentido.id)}
                              aria-label={`Eliminar sentido ${sentido.codigo}`}
                            >
                              Eliminar
                            </AdminButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Paginación */}
          {(cursorHistory.length > 0 || data.nextCursor) && (
            <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 flex items-center justify-end gap-2">
              {cursorHistory.length > 0 && (
                <AdminButton
                  variant="secondary"
                  size="md"
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
                  size="md"
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

      {/* Diálogo accesible de confirmación de eliminación */}
      <AdminDialog
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="¿Mover sentido a la papelera?"
        titleId="dialog-delete-title"
        maxWidthClass="max-w-md"
        footer={
          <>
            <AdminButton variant="secondary" size="lg" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="danger"
              size="lg"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirmDeleteId) {
                  void handleDelete(confirmDeleteId);
                }
              }}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-[var(--admin-text-secondary)]">
          El sentido podrá ser restaurado posteriormente desde la papelera o purgado según las
          políticas editoriales.
        </p>
      </AdminDialog>

      {/* Modal de gestión completa CRUD de abreviaturas gramaticales (Spec 012) */}
      <AdminAbreviaturasModal
        isOpen={isAbrevModalOpen}
        onClose={() => setIsAbrevModalOpen(false)}
      />
    </div>
  );
}
