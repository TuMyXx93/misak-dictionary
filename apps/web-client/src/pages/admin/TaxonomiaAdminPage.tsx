/**
 * TaxonomiaAdminPage
 * Spec 012 v0.2.0 — Gestión jerárquica de la taxonomía del Diccionario Misak.
 * Permite visualizar el árbol taxonómico completo (Campos, Subcampos, Microcampos, Subniveles),
 * crear y editar nodos con teclado Namtrik y medios culturales, y eliminar nodos con
 * protección jerárquica estricta (HTTP 409 Conflict si tienen dependencias activas).
 */

import { useState } from 'react';
import { CampoNamtrik } from '@/components/admin/CampoNamtrik';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSurface,
  AdminTextarea,
} from '@/components/admin/ui';
import {
  type AdminTaxonomyNode,
  useAdminTaxonomiaArbol,
  useCreateCampo,
  useCreateMicrocampo,
  useCreateSubcampo,
  useDeleteCampo,
  useDeleteMicrocampo,
  useDeleteSubcampo,
  useUpdateCampo,
  useUpdateMicrocampo,
  useUpdateSubcampo,
} from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';

export function TaxonomiaAdminPage() {
  const { hasPermission } = useAuthStore();
  const canWrite = hasPermission(PERMISSIONS.DICCIONARIO_ESCRIBIR);
  const canDelete = hasPermission(PERMISSIONS.DICCIONARIO_BORRAR);

  const { data: tree, isLoading, isError, error, refetch } = useAdminTaxonomiaArbol();

  const createCampoMutation = useCreateCampo();
  const updateCampoMutation = useUpdateCampo();
  const deleteCampoMutation = useDeleteCampo();

  const createSubcampoMutation = useCreateSubcampo();
  const updateSubcampoMutation = useUpdateSubcampo();
  const deleteSubcampoMutation = useDeleteSubcampo();

  const createMicrocampoMutation = useCreateMicrocampo();
  const updateMicrocampoMutation = useUpdateMicrocampo();
  const deleteMicrocampoMutation = useDeleteMicrocampo();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const [deleteTarget, setDeleteTarget] = useState<AdminTaxonomyNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [modalLevel, setModalLevel] = useState<'campo' | 'subcampo' | 'microcampo' | 'subnivel'>(
    'campo',
  );
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [targetSubcampoId, setTargetSubcampoId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<AdminTaxonomyNode | null>(null);

  const [formCodigo, setFormCodigo] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formNamtrikTermino, setFormNamtrikTermino] = useState('');
  const [formEspanolTermino, setFormEspanolTermino] = useState('');
  const [formNamtrikDescripcion, setFormNamtrikDescripcion] = useState('');
  const [formEspanolDescripcion, setFormEspanolDescripcion] = useState('');
  const [formImagen, setFormImagen] = useState('');
  const [formNamtrikAudio, setFormNamtrikAudio] = useState('');
  const [formEspanolAudio, setFormEspanolAudio] = useState('');
  const [formPosicion, setFormPosicion] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = (
    level: 'campo' | 'subcampo' | 'microcampo' | 'subnivel',
    parentId?: string,
    subcampoId?: string,
  ) => {
    setModalMode('create');
    setModalLevel(level);
    setTargetParentId(parentId ?? null);
    setTargetSubcampoId(subcampoId ?? null);
    setEditingNode(null);

    setFormCodigo('');
    setFormSlug('');
    setFormNamtrikTermino('');
    setFormEspanolTermino('');
    setFormNamtrikDescripcion('');
    setFormEspanolDescripcion('');
    setFormImagen('');
    setFormNamtrikAudio('');
    setFormEspanolAudio('');
    setFormPosicion(0);
    setFormError(null);
  };

  const openEditModal = (node: AdminTaxonomyNode) => {
    setModalMode('edit');
    setModalLevel(node.nivel);
    setEditingNode(node);

    setFormCodigo(node.codigo);
    setFormSlug(node.slug);
    setFormNamtrikTermino(node.namtrikTermino);
    setFormEspanolTermino(node.espanolTermino);
    setFormNamtrikDescripcion(node.namtrikDescripcion ?? '');
    setFormEspanolDescripcion(node.espanolDescripcion ?? '');
    setFormImagen(node.imagen ?? '');
    setFormNamtrikAudio(node.namtrikAudio ?? '');
    setFormEspanolAudio(node.espanolAudio ?? '');
    setFormPosicion(node.posicion);
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingNode(null);
    setFormError(null);
  };

  const handleSaveNode = async () => {
    setFormError(null);
    if (!formEspanolTermino.trim()) {
      setFormError('El término en castellano es obligatorio.');
      return;
    }
    if (modalMode === 'create' && (!formCodigo.trim() || !formSlug.trim())) {
      setFormError('El código y el slug son obligatorios para crear un nodo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        codigo: formCodigo.trim(),
        slug: formSlug.trim(),
        namtrikTermino: formNamtrikTermino.trim() || null,
        espanolTermino: formEspanolTermino.trim(),
        namtrikDescripcion: formNamtrikDescripcion.trim() || null,
        espanolDescripcion: formEspanolDescripcion.trim() || null,
        imagen: formImagen.trim() || null,
        namtrikAudio: formNamtrikAudio.trim() || null,
        espanolAudio: formEspanolAudio.trim() || null,
        posicion: Number(formPosicion) || 0,
      };

      if (modalMode === 'create') {
        if (modalLevel === 'campo') {
          await createCampoMutation.mutateAsync(payload);
        } else if (modalLevel === 'subcampo') {
          await createSubcampoMutation.mutateAsync({
            ...payload,
            campoSemanticoId: targetParentId,
          });
        } else if (modalLevel === 'microcampo') {
          await createMicrocampoMutation.mutateAsync({
            ...payload,
            subcampoSemanticoId: targetParentId,
          });
        } else if (modalLevel === 'subnivel') {
          await createMicrocampoMutation.mutateAsync({
            ...payload,
            subcampoSemanticoId: targetSubcampoId,
            padreId: targetParentId,
          });
        }
      } else if (modalMode === 'edit' && editingNode) {
        if (editingNode.nivel === 'campo') {
          await updateCampoMutation.mutateAsync({ id: editingNode.id, ...payload });
        } else if (editingNode.nivel === 'subcampo') {
          await updateSubcampoMutation.mutateAsync({ id: editingNode.id, ...payload });
        } else {
          await updateMicrocampoMutation.mutateAsync({ id: editingNode.id, ...payload });
        }
      }

      closeModal();
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el nodo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      if (deleteTarget.nivel === 'campo') {
        await deleteCampoMutation.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.nivel === 'subcampo') {
        await deleteSubcampoMutation.mutateAsync(deleteTarget.id);
      } else {
        await deleteMicrocampoMutation.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.statusCode === 409) {
        setDeleteError(err.message);
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Error al eliminar el nodo.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const renderBadgeForLevel = (nivel: AdminTaxonomyNode['nivel']) => {
    switch (nivel) {
      case 'campo':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#E52D6D]/15 text-[#E52D6D] border border-[#E52D6D]/30 uppercase">
            Nivel 1 · Campo
          </span>
        );
      case 'subcampo':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#0055AA]/15 text-[#0055AA] dark:text-[#5599EE] border border-[#0055AA]/30 uppercase">
            Nivel 2 · Subcampo
          </span>
        );
      case 'microcampo':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase">
            Nivel 3 · Microcampo
          </span>
        );
      case 'subnivel':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase">
            Nivel 4+ · Subnivel
          </span>
        );
    }
  };

  const renderNode = (node: AdminTaxonomyNode, depth = 0, currentSubcampoId?: string) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = Boolean(node.hijos && node.hijos.length > 0);
    const effectiveSubcampoId = node.nivel === 'subcampo' ? node.id : currentSubcampoId;

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
            depth === 0
              ? 'bg-[var(--admin-surface)] border-[var(--admin-border)] shadow-xs'
              : depth === 1
                ? 'bg-[var(--admin-surface-muted)]/60 border-[var(--admin-border)]/80 ml-4 sm:ml-6'
                : 'bg-[var(--admin-surface)]/80 border-[var(--admin-border)]/60 ml-8 sm:ml-12'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                aria-label={isExpanded ? 'Colapsar nodo' : 'Expandir nodo'}
                className="mt-1 sm:mt-0 p-1 text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] rounded-lg hover:bg-[var(--admin-surface-muted)] transition-colors cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {renderBadgeForLevel(node.nivel)}
                <span className="text-xs font-mono font-bold text-[var(--admin-text-muted)]">
                  {node.codigo}
                </span>
                <span className="text-sm font-bold text-[var(--admin-text)]" lang="gum">
                  {node.namtrikTermino}
                </span>
                <span className="text-xs text-[var(--admin-text-secondary)]">
                  — {node.espanolTermino}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--admin-text-muted)]">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
                  📖 {node.totalTerminos} términos
                </span>
                {node.totalHijos > 0 && (
                  <span>
                    • 🗂️ {node.totalHijos} {node.nivel === 'campo' ? 'subcampos' : 'microcampos'}
                  </span>
                )}
                {node.slug && <span>• slug: /{node.slug}</span>}
                {node.imagen && <span>• 🖼️ imagen</span>}
                {node.namtrikAudio && <span>• 🔊 audio</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--admin-border)]/50 self-end sm:self-auto shrink-0">
            {canWrite && (
              <>
                {node.nivel === 'campo' && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => openCreateModal('subcampo', node.id)}
                    aria-label={`Añadir subcampo a ${node.codigo}`}
                  >
                    + Subcampo
                  </AdminButton>
                )}
                {node.nivel === 'subcampo' && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => openCreateModal('microcampo', node.id)}
                    aria-label={`Añadir microcampo a ${node.codigo}`}
                  >
                    + Microcampo
                  </AdminButton>
                )}
                {(node.nivel === 'microcampo' || node.nivel === 'subnivel') && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => openCreateModal('subnivel', node.id, effectiveSubcampoId)}
                    aria-label={`Añadir subnivel a ${node.codigo}`}
                  >
                    + Subnivel
                  </AdminButton>
                )}
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(node)}
                  aria-label={`Editar ${node.codigo}`}
                >
                  Editar
                </AdminButton>
              </>
            )}

            {canDelete && (
              <AdminButton
                variant="danger"
                size="sm"
                onClick={() => {
                  setDeleteTarget(node);
                  setDeleteError(null);
                }}
                aria-label={`Eliminar ${node.codigo}`}
              >
                Eliminar
              </AdminButton>
            )}
          </div>
        </div>

        {/* Nodos hijos si está expandido */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 pt-1">
            {node.hijos?.map((child) => renderNode(child, depth + 1, effectiveSubcampoId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Taxonomía y Organización"
        title="Gestión de Taxonomía y Jerarquías"
        description="Administración de Campos, Subcampos, Microcampos y Subniveles con protección jerárquica de integridad (Spec 012 v0.2.0)."
        actions={
          canWrite ? (
            <AdminButton variant="primary" size="action" onClick={() => openCreateModal('campo')}>
              + Nuevo Campo (Nivel 1)
            </AdminButton>
          ) : undefined
        }
      />

      {/* Explicación de protección de integridad */}
      <AdminSurface className="p-4 sm:p-5 border-l-4 border-[#0055AA] bg-[#0055AA]/5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0055AA] dark:text-[#5599EE]">
          🛡️ Regla de Integridad Comunitaria y Jerárquica
        </h2>
        <p className="text-xs text-[var(--admin-text-secondary)] mt-1">
          Ningún nodo puede eliminarse si contiene subniveles o términos léxicos activos asociados
          (Código HTTP 409 Conflict). Para eliminar un nodo, reasigne o retire primero todos sus
          elementos hijos y términos subordinados.
        </p>
      </AdminSurface>

      {/* Estado de carga / error */}
      {isLoading && (
        <AdminSurface className="text-center py-12 px-4 text-[var(--admin-text-secondary)]">
          <div role="status">Cargando árbol taxonómico...</div>
        </AdminSurface>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 rounded-2xl text-sm font-medium"
        >
          Error al cargar la taxonomía:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Árbol taxonómico */}
      {!isLoading && !isError && tree && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              {tree.length} Campos Semánticos Registrados
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set(tree.map((c) => c.id)))}
                className="text-xs text-[var(--admin-primary-text)] hover:underline font-semibold cursor-pointer"
              >
                Expandir todos los campos
              </button>
              <span className="text-[var(--admin-border)]">•</span>
              <button
                type="button"
                onClick={() => setExpandedNodes(new Set())}
                className="text-xs text-[var(--admin-text-secondary)] hover:underline font-semibold cursor-pointer"
              >
                Colapsar todos
              </button>
            </div>
          </div>

          <div className="space-y-3">{tree.map((campo) => renderNode(campo, 0))}</div>
        </div>
      )}

      {/* Modal accesible de creación / edición de nodo */}
      <AdminDialog
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={
          modalMode === 'create'
            ? `Crear ${modalLevel.toUpperCase()} Taxonómico`
            : `Editar Nodo (${editingNode?.codigo})`
        }
        titleId="dialog-nodo-taxonomia"
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <AdminButton variant="secondary" size="md" onClick={closeModal}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              disabled={isSubmitting}
              onClick={handleSaveNode}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar nodo'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 text-xs bg-red-500/15 border border-red-500/35 text-red-800 dark:text-red-300 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminFieldLabel htmlFor="form-nodo-codigo">
                Código {!editingNode && <span className="text-[#E52D6D]">*</span>}
              </AdminFieldLabel>
              <AdminInput
                id="form-nodo-codigo"
                type="text"
                disabled={Boolean(editingNode)}
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value)}
                placeholder="ej: C1, C1.S1, C1.S1.M5"
                required
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="form-nodo-slug">
                Slug URL {!editingNode && <span className="text-[#E52D6D]">*</span>}
              </AdminFieldLabel>
              <AdminInput
                id="form-nodo-slug"
                type="text"
                disabled={Boolean(editingNode)}
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="ej: nakchak, wammera"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminFieldLabel htmlFor="form-nodo-namtrik">Término (Namtrik)</AdminFieldLabel>
              <CampoNamtrik
                id="form-nodo-namtrik"
                value={formNamtrikTermino}
                onChange={setFormNamtrikTermino}
                placeholder="Nombre en lengua Namtrik..."
                className="mt-1"
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="form-nodo-espanol">
                Término (Castellano) <span className="text-[#E52D6D]">*</span>
              </AdminFieldLabel>
              <AdminInput
                id="form-nodo-espanol"
                type="text"
                value={formEspanolTermino}
                onChange={(e) => setFormEspanolTermino(e.target.value)}
                placeholder="Nombre o traducción en castellano..."
                required
              />
            </div>
          </div>

          <div>
            <AdminFieldLabel htmlFor="form-nodo-desc-namtrik">
              Descripción Cultural (Namtrik)
            </AdminFieldLabel>
            <CampoNamtrik
              id="form-nodo-desc-namtrik"
              multiline
              rows={2}
              value={formNamtrikDescripcion}
              onChange={setFormNamtrikDescripcion}
              placeholder="Explicación en lengua Namtrik..."
              className="mt-1"
            />
          </div>

          <div>
            <AdminFieldLabel htmlFor="form-nodo-desc-espanol">
              Descripción Cultural (Castellano)
            </AdminFieldLabel>
            <AdminTextarea
              id="form-nodo-desc-espanol"
              rows={2}
              value={formEspanolDescripcion}
              onChange={(e) => setFormEspanolDescripcion(e.target.value)}
              placeholder="Explicación o contexto en castellano..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <AdminFieldLabel htmlFor="form-nodo-imagen">URL de Imagen</AdminFieldLabel>
              <AdminInput
                id="form-nodo-imagen"
                type="text"
                value={formImagen}
                onChange={(e) => setFormImagen(e.target.value)}
                placeholder="https://... o /media/..."
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="form-nodo-audio-namtrik">Audio Namtrik</AdminFieldLabel>
              <AdminInput
                id="form-nodo-audio-namtrik"
                type="text"
                value={formNamtrikAudio}
                onChange={(e) => setFormNamtrikAudio(e.target.value)}
                placeholder="URL de audio..."
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="form-nodo-posicion">Posición / Orden</AdminFieldLabel>
              <AdminInput
                id="form-nodo-posicion"
                type="number"
                value={String(formPosicion)}
                onChange={(e) => setFormPosicion(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </AdminDialog>

      {/* Diálogo de eliminación con protección 409 */}
      <AdminDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`¿Eliminar nodo ${deleteTarget?.codigo}?`}
        titleId="dialog-delete-nodo"
        maxWidthClass="max-w-md"
        footer={
          <>
            <AdminButton variant="secondary" size="lg" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </AdminButton>
            <AdminButton
              variant="danger"
              size="lg"
              disabled={isDeleting}
              onClick={handleDeleteNode}
            >
              {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--admin-text-secondary)]">
            Se intentará eliminar el nodo{' '}
            <span className="font-bold text-[var(--admin-text)]">
              {deleteTarget?.codigo} — {deleteTarget?.espanolTermino}
            </span>
            .
          </p>

          {deleteError ? (
            <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200 text-xs font-semibold">
              ⚠️ Bloqueo de integridad (HTTP 409 Conflict):
              <p className="mt-1 font-normal">{deleteError}</p>
            </div>
          ) : (
            <p className="text-xs text-[var(--admin-text-muted)]">
              Si este nodo contiene subcampos, microcampos o términos subordinados, el sistema
              bloqueará la operación protegiendo la integridad del diccionario.
            </p>
          )}
        </div>
      </AdminDialog>
    </div>
  );
}
