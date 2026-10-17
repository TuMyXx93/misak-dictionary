/**
 * UsuariosPage
 * Spec 006 (R-018, T-048)
 * Gestión de usuarios y asignación de roles con protección de último super_admin (HTTP 409).
 */

import { useState } from 'react';
import { type AdminUserItem, useAdminUsers, useUpdateUserRoles } from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

const ALL_ROLES = [
  { id: 'super_admin', label: 'Super Admin', desc: 'Control total del sistema' },
  { id: 'admin', label: 'Administrador', desc: 'Gestión de usuarios y auditoría' },
  { id: 'cultural_reviewer', label: 'Revisor Cultural', desc: 'Ratificación y reversión' },
  { id: 'content_admin', label: 'Admin Contenido', desc: 'Creación y edición léxica' },
  { id: 'analytics_viewer', label: 'Analista', desc: 'Solo lectura y métricas' },
] as const;

export function UsuariosPage() {
  const { hasRole, user: currentUser } = useAuthStore();
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin') || isSuperAdmin;

  const { data, isLoading, isError, error, refetch } = useAdminUsers();
  const updateRolesMutation = useUpdateUserRoles();

  // Usuario seleccionado para edición de roles
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenEdit = (user: AdminUserItem) => {
    setSelectedUser(user);
    setSelectedRoles([...user.roles]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleToggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateRolesMutation.mutateAsync({
        userId: selectedUser.id,
        roles: selectedRoles,
      });
      setSuccessMessage(`Roles actualizados para ${selectedUser.email}.`);
      setSelectedUser(null);
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.statusCode === 409) {
        // R-018: Protección del último super_admin
        setErrorMessage(
          err.message || 'No es posible revocar el rol super_admin al último super_admin activo.',
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Error al actualizar roles.';
        setErrorMessage(msg);
      }
      // Refrescar para sincronizar estado real
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestión de Usuarios y Roles
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Administración de cuentas institucionales y permisos RBAC del Equipo Namtrik (R-018).
        </p>
      </div>

      {successMessage && (
        <div
          role="alert"
          className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-sm"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm"
        >
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 text-slate-500" role="status">
          Cargando usuarios...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
        >
          Error al cargar usuarios: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Usuario / Correo
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Roles Asignados
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Estado Clave
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
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="font-semibold text-slate-900">{u.email}</div>
                      {u.id === currentUser?.userId && (
                        <span className="text-xs text-sky-700 font-medium">(Tu usuario)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              r === 'super_admin'
                                ? 'bg-purple-100 text-purple-800 font-bold'
                                : r === 'cultural_reviewer'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                      {u.mustChangePassword ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          Cambio requerido
                        </span>
                      ) : (
                        <span className="text-emerald-700">Al día</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="text-sky-700 hover:text-sky-900 px-3 py-1.5 min-h-[44px]"
                        >
                          Modificar roles
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de edición de roles */}
      {selectedUser && (
        <div
          role="dialog"
          aria-labelledby="edit-roles-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-300">
            <h2 id="edit-roles-title" className="text-lg font-bold text-slate-900 mb-1">
              Modificar roles de {selectedUser.email}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Seleccione los roles aplicables. Al menos un rol es requerido.
            </p>

            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-md border border-slate-200">
              {ALL_ROLES.map((role) => {
                const isChecked = selectedRoles.includes(role.id);
                // Si el usuario actual no es super_admin, no puede otorgar o quitar super_admin
                const isSuperAdminOptionDisabled = role.id === 'super_admin' && !isSuperAdmin;

                return (
                  <label
                    key={role.id}
                    className={`flex items-start gap-3 p-2 rounded cursor-pointer ${
                      isChecked ? 'bg-sky-50/50' : 'hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={isChecked}
                      disabled={isSuperAdminOptionDisabled}
                      onChange={() => handleToggleRole(role.id)}
                      className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 rounded border-slate-300"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{role.label}</div>
                      <div className="text-xs text-slate-500">{role.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 min-h-[48px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedRoles.length === 0 || updateRolesMutation.isPending}
                onClick={handleSaveRoles}
                className="px-4 py-2 min-h-[48px] bg-sky-700 hover:bg-sky-800 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {updateRolesMutation.isPending ? 'Guardando...' : 'Guardar roles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
