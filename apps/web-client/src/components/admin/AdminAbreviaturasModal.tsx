/**
 * AdminAbreviaturasModal
 * Modal administrativo CRUD para el catálogo de abreviaturas gramaticales,
 * con propagación transaccional de cambios de código y bloqueo 409 ante uso activo.
 */

import { type FormEvent, useState } from 'react';
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
} from '@/components/admin/ui';
import {
  type AdminAbreviaturaItem,
  useAdminAbreviaturas,
  useCreateAbreviatura,
  useDeleteAbreviatura,
  useUpdateAbreviatura,
} from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';

export interface AdminAbreviaturasModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback opcional cuando se crea o selecciona una abreviatura desde el editor de sentidos */
  onSelectAbreviatura?: (codigo: string) => void;
}

export function AdminAbreviaturasModal({
  isOpen,
  onClose,
  onSelectAbreviatura,
}: AdminAbreviaturasModalProps) {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission(PERMISSIONS.DICCIONARIO_ESCRIBIR);
  const canDelete = hasPermission(PERMISSIONS.DICCIONARIO_BORRAR);

  const { data: abreviaturas = [], isLoading } = useAdminAbreviaturas({ enabled: isOpen });
  const createMutation = useCreateAbreviatura();
  const updateMutation = useUpdateAbreviatura();
  const deleteMutation = useDeleteAbreviatura();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [etiquetaCompleta, setEtiquetaCompleta] = useState('');
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<AdminAbreviaturaItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setCodigo('');
    setEtiquetaCompleta('');
    setErrorMessage(null);
  };

  const handleStartEdit = (item: AdminAbreviaturaItem) => {
    setEditingId(item.id);
    setCodigo(item.codigo);
    setEtiquetaCompleta(item.etiquetaCompleta);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmDeleteItem(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCodigo = codigo.trim();
    const cleanEtiqueta = etiquetaCompleta.trim();

    if (!cleanCodigo || !cleanEtiqueta) {
      setErrorMessage('El código y el significado completo son obligatorios.');
      return;
    }

    try {
      if (editingId) {
        const updated = await updateMutation.mutateAsync({
          id: editingId,
          codigo: cleanCodigo,
          etiquetaCompleta: cleanEtiqueta,
        });
        setSuccessMessage(
          `Abreviatura «${updated.codigo} — ${updated.etiquetaCompleta}» actualizada correctamente.`,
        );
        if (onSelectAbreviatura) {
          onSelectAbreviatura(updated.codigo);
        }
        resetForm();
      } else {
        const created = await createMutation.mutateAsync({
          codigo: cleanCodigo,
          etiquetaCompleta: cleanEtiqueta,
        });
        setSuccessMessage(
          `Abreviatura «${created.codigo} — ${created.etiquetaCompleta}» creada correctamente.`,
        );
        if (onSelectAbreviatura) {
          onSelectAbreviatura(created.codigo);
        }
        resetForm();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al guardar la abreviatura gramatical.',
      );
    }
  };

  const handleConfirmDelete = async (item: AdminAbreviaturaItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteMutation.mutateAsync(item.id);
      setSuccessMessage(`Abreviatura «${item.codigo}» eliminada correctamente.`);
      setConfirmDeleteItem(null);
      if (editingId === item.id) {
        resetForm();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar la abreviatura porque está en uso.',
      );
      setConfirmDeleteItem(null);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = abreviaturas.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.codigo.toLowerCase().includes(normalizedQuery) ||
      item.etiquetaCompleta.toLowerCase().includes(normalizedQuery)
    );
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        setConfirmDeleteItem(null);
        setSuccessMessage(null);
        onClose();
      }}
      title="Gestión de Abreviaturas Gramaticales"
      titleId="dialog-crud-abreviaturas"
      maxWidthClass="max-w-3xl"
      footer={
        <AdminButton
          variant="secondary"
          size="md"
          type="button"
          onClick={() => {
            resetForm();
            setConfirmDeleteItem(null);
            setSuccessMessage(null);
            onClose();
          }}
        >
          Cerrar
        </AdminButton>
      }
    >
      <div className="space-y-5">
        <p className="text-xs text-[var(--admin-text-secondary)]">
          Catálogo oficial de abreviaturas lingüísticas Namtrik ({abreviaturas.length} registradas).
          Permite crear nuevas abreviaturas, editar su código o significado completo y eliminar
          aquellas que no estén asociadas a términos activos.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 text-xs font-medium bg-red-500/15 border border-red-500/35 text-red-800 dark:text-red-300 rounded-xl"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <output className="block p-3 text-xs font-medium bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 rounded-xl">
            {successMessage}
          </output>
        )}

        {/* Formulario de Creación / Edición */}
        {canWrite && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/45 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-primary-text)]">
                {editingId ? 'Editar abreviatura seleccionada' : 'Agregar nueva abreviatura'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] underline cursor-pointer"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <AdminFieldLabel htmlFor="abrev-crud-codigo">
                  Abreviatura / Código <span className="text-[#E52D6D]">*</span>
                </AdminFieldLabel>
                <AdminInput
                  id="abrev-crud-codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="ej: s., sn., v. pos."
                  required
                />
              </div>

              <div className="sm:col-span-5">
                <AdminFieldLabel htmlFor="abrev-crud-etiqueta">
                  Significado completo <span className="text-[#E52D6D]">*</span>
                </AdminFieldLabel>
                <AdminInput
                  id="abrev-crud-etiqueta"
                  type="text"
                  value={etiquetaCompleta}
                  onChange={(e) => setEtiquetaCompleta(e.target.value)}
                  placeholder="ej: Sustantivo, Sintagma Nominal"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex gap-2">
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingId
                      ? 'Actualizar'
                      : onSelectAbreviatura
                        ? 'Crear y usar'
                        : '+ Agregar'}
                </AdminButton>
              </div>
            </div>
          </form>
        )}

        {/* Confirmación de eliminación */}
        {confirmDeleteItem && (
          <div
            role="alertdialog"
            aria-label="Confirmar eliminación de abreviatura"
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="text-xs text-[var(--admin-text)]">
              <span className="font-bold">
                ¿Eliminar la abreviatura «{confirmDeleteItem.codigo} —{' '}
                {confirmDeleteItem.etiquetaCompleta}»?
              </span>
              <p className="text-[var(--admin-text-secondary)] mt-0.5">
                Esta acción la removerá del catálogo de abreviaturas.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDeleteItem(null)}
              >
                Cancelar
              </AdminButton>
              <AdminButton
                type="button"
                variant="danger"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => void handleConfirmDelete(confirmDeleteItem)}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar borrado'}
              </AdminButton>
            </div>
          </div>
        )}

        {/* Buscador y Tabla de Abreviaturas */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <AdminFieldLabel htmlFor="abrev-crud-search" className="mb-0">
              Listado de abreviaturas ({filteredItems.length})
            </AdminFieldLabel>
            <div className="w-full sm:w-64">
              <AdminInput
                id="abrev-crud-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por código o significado..."
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--admin-border)] divide-y divide-[var(--admin-border)] bg-[var(--admin-surface)]">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-[var(--admin-text-secondary)]">
                Cargando catálogo de abreviaturas...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--admin-text-secondary)]">
                No se encontraron abreviaturas con ese criterio.
              </div>
            ) : (
              filteredItems.map((item) => {
                const usos = item.usosCount ?? 0;
                const isProtected = usos > 0 || item.canDelete === false;

                return (
                  <div
                    key={item.id}
                    className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--admin-surface-muted)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 shrink-0">
                        {item.codigo}
                      </span>
                      <span className="text-sm font-medium text-[var(--admin-text)] break-words">
                        {item.etiquetaCompleta}
                      </span>
                      {usos > 0 && <AdminBadge tone="neutral">{usos} término(s)</AdminBadge>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {onSelectAbreviatura && (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            onSelectAbreviatura(item.codigo);
                            onClose();
                          }}
                        >
                          Seleccionar
                        </AdminButton>
                      )}
                      {canWrite && (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEdit(item)}
                          aria-label={`Editar abreviatura ${item.codigo}`}
                        >
                          Editar
                        </AdminButton>
                      )}
                      {(canDelete || canWrite) && (
                        <AdminButton
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isProtected}
                          title={
                            isProtected
                              ? `No se puede eliminar: en uso por ${usos} forma(s) léxica(s)`
                              : `Eliminar abreviatura ${item.codigo}`
                          }
                          aria-label={`Eliminar abreviatura ${item.codigo}`}
                          onClick={() => setConfirmDeleteItem(item)}
                        >
                          Eliminar
                        </AdminButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminDialog>
  );
}
