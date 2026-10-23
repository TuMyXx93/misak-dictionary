/**
 * UsuariosPage
 * Spec 006 (R-018, T-048)
 * Gestión integral de usuarios, expediente administrativo normalizado,
 * controles de acceso en crudo, desbloqueo de seguridad y asignación de roles.
 */

import { useMemo, useState } from 'react';
import {
  type AdminUserItem,
  useAdminUsers,
  useCreateUser,
  useToggleUserStatus,
  useUnlockUser,
  useUpdateUser,
} from '@/hooks/useAdmin';
import { AdminApiError, adminHttp } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

const ALL_ROLES = [
  { id: 'super_admin', label: 'Super Admin', desc: 'Control total del sistema' },
  { id: 'admin', label: 'Administrador', desc: 'Gestión de usuarios y auditoría' },
  { id: 'cultural_reviewer', label: 'Revisor Cultural', desc: 'Ratificación y reversión' },
  { id: 'content_admin', label: 'Admin Contenido', desc: 'Creación y edición léxica' },
  { id: 'analytics_viewer', label: 'Analista', desc: 'Solo lectura y métricas' },
] as const;

const TIPOS_IDENTIFICACION = [
  { id: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { id: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { id: 'CE', label: 'Cédula de Extranjería (CE)' },
  { id: 'PASAPORTE', label: 'Pasaporte' },
  { id: 'OTRO', label: 'Otro Documento' },
] as const;

function cleanStringLocal(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

function generateLocalUsername(nombres: string, apellidos: string): string {
  const cleanN = cleanStringLocal(nombres).split(/\s+/).filter(Boolean);
  const cleanA = cleanStringLocal(apellidos).split(/\s+/).filter(Boolean);
  const pNom = cleanN[0] || '';
  const pApe = cleanA[0] || '';
  return pApe ? `${pNom}.${pApe}` : pNom;
}

function calculatePasswordStrength(pass: string): {
  score: number;
  label: 'Débil' | 'Media' | 'Fuerte';
  color: string;
  percent: number;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  const hasMinLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  let criteriaMet = 0;
  if (hasMinLength) criteriaMet++;
  if (hasUpper) criteriaMet++;
  if (hasLower) criteriaMet++;
  if (hasNumber) criteriaMet++;
  if (hasSpecial) criteriaMet++;

  if (!hasMinLength || criteriaMet < 4) {
    return {
      score: 1,
      label: 'Débil',
      color: 'bg-red-500',
      percent: Math.max(20, (criteriaMet / 5) * 35),
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  if (criteriaMet === 4 || pass.length < 10) {
    return {
      score: 2,
      label: 'Media',
      color: 'bg-amber-500',
      percent: 66,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  return {
    score: 3,
    label: 'Fuerte',
    color: 'bg-emerald-500',
    percent: 100,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const specials = '!@#$%^&*()_+~=';
  const all = upper + lower + numbers + specials;

  const cryptoObj = window.crypto;
  const getRandom = (max: number) => {
    const array = new Uint32Array(1);
    cryptoObj.getRandomValues(array);
    return array[0]! % max;
  };

  const pass = [
    upper[getRandom(upper.length)],
    lower[getRandom(lower.length)],
    numbers[getRandom(numbers.length)],
    specials[getRandom(specials.length)],
  ];

  for (let i = pass.length; i < 16; i++) {
    pass.push(all[getRandom(all.length)]);
  }

  return pass.sort(() => getRandom(3) - 1).join('');
}

export function UsuariosPage() {
  const { hasRole, user: currentUser } = useAuthStore();
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin') || isSuperAdmin;

  const { data, isLoading, isError, error, refetch } = useAdminUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const toggleStatusMutation = useToggleUserStatus();
  const unlockUserMutation = useUnlockUser();

  // Modal Crear Usuario
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNombres, setNewNombres] = useState('');
  const [newApellidos, setNewApellidos] = useState('');
  const [newTipoIdentificacion, setNewTipoIdentificacion] = useState('CC');
  const [newNumeroIdentificacion, setNewNumeroIdentificacion] = useState('');
  const [newTelefonoContacto, setNewTelefonoContacto] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isUsernameAuto, setIsUsernameAuto] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newDireccionResidencia, setNewDireccionResidencia] = useState('');
  const [newBarrio, setNewBarrio] = useState('');
  const [newDepartamento, setNewDepartamento] = useState('');
  const [newCiudadMunicipio, setNewCiudadMunicipio] = useState('');
  const [newUserRoles, setNewUserRoles] = useState<string[]>(['content_admin']);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Expediente / Edición de Usuario
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [editNombres, setEditNombres] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editTipoIdentificacion, setEditTipoIdentificacion] = useState('CC');
  const [editNumeroIdentificacion, setEditNumeroIdentificacion] = useState('');
  const [editTelefonoContacto, setEditTelefonoContacto] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editDireccionResidencia, setEditDireccionResidencia] = useState('');
  const [editBarrio, setEditBarrio] = useState('');
  const [editDepartamento, setEditDepartamento] = useState('');
  const [editCiudadMunicipio, setEditCiudadMunicipio] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isEditUserActive, setIsEditUserActive] = useState(true);

  // Mensajes globales
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const isPasswordValid =
    passwordStrength.hasMinLength &&
    passwordStrength.hasUpper &&
    passwordStrength.hasLower &&
    passwordStrength.hasNumber &&
    passwordStrength.hasSpecial &&
    newPassword === newConfirmPassword;

  // Auto-sugerencia de nombre de usuario inteligente
  const handleNombresChange = (val: string) => {
    setNewNombres(val);
    if (isUsernameAuto) {
      const generated = generateLocalUsername(val, newApellidos);
      if (generated) setNewUsername(generated);
    }
  };

  const handleApellidosChange = (val: string) => {
    setNewApellidos(val);
    if (isUsernameAuto) {
      const generated = generateLocalUsername(newNombres, val);
      if (generated) setNewUsername(generated);
    }
  };

  const handleGenerateSmartUsername = async () => {
    const nombres = newNombres.trim();
    const apellidos = newApellidos.trim();
    if (!nombres && !apellidos) {
      setCreateError('Ingrese nombres o apellidos para generar el nombre de usuario.');
      return;
    }
    try {
      const res = await adminHttp<{ username: string; available: boolean }>(
        `/api/admin/users/suggest-username?nombres=${encodeURIComponent(nombres)}&apellidos=${encodeURIComponent(apellidos)}`,
      );
      if (res?.username) {
        setNewUsername(res.username);
        setIsUsernameAuto(false);
      }
    } catch {
      // Fallback local
      setNewUsername(generateLocalUsername(nombres, apellidos));
    }
  };

  const handleGeneratePassword = () => {
    const robustPass = generateSecurePassword();
    setNewPassword(robustPass);
    setNewConfirmPassword(robustPass);
    setShowPassword(true);
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setNewEmail('');
    setNewNombres('');
    setNewApellidos('');
    setNewTipoIdentificacion('CC');
    setNewNumeroIdentificacion('');
    setNewTelefonoContacto('');
    setNewUsername('');
    setIsUsernameAuto(true);
    setNewPassword('');
    setNewConfirmPassword('');
    setShowPassword(false);
    setNewDireccionResidencia('');
    setNewBarrio('');
    setNewDepartamento('');
    setNewCiudadMunicipio('');
    setNewUserRoles(['content_admin']);
    setCreateError(null);
  };

  const handleToggleNewUserRole = (roleId: string) => {
    if (newUserRoles.includes(roleId)) {
      setNewUserRoles(newUserRoles.filter((r) => r !== roleId));
    } else {
      setNewUserRoles([...newUserRoles, roleId]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newEmail.trim()) {
      setCreateError('El correo de usuario es obligatorio.');
      return;
    }
    if (!newNombres.trim()) {
      setCreateError('El nombre o nombres son obligatorios.');
      return;
    }
    if (!newApellidos.trim()) {
      setCreateError('El apellido o apellidos son obligatorios.');
      return;
    }
    if (!newNumeroIdentificacion.trim()) {
      setCreateError('El número de identificación es obligatorio.');
      return;
    }
    if (!newUsername.trim()) {
      setCreateError('El nombre de usuario es obligatorio.');
      return;
    }
    if (!isPasswordValid) {
      if (newPassword !== newConfirmPassword) {
        setCreateError('Las contraseñas ingresadas no coinciden.');
      } else {
        setCreateError('La contraseña no cumple con los requisitos de seguridad requeridos.');
      }
      return;
    }
    if (newUserRoles.length === 0) {
      setCreateError('Debe asignar al menos un rol al nuevo usuario.');
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: newEmail.trim(),
        username: newUsername.trim(),
        nombres: newNombres.trim(),
        apellidos: newApellidos.trim(),
        fullName: `${newNombres.trim()} ${newApellidos.trim()}`,
        tipoIdentificacion: newTipoIdentificacion,
        numeroIdentificacion: newNumeroIdentificacion.trim(),
        telefonoContacto: newTelefonoContacto.trim() || undefined,
        direccionResidencia: newDireccionResidencia.trim() || undefined,
        barrio: newBarrio.trim() || undefined,
        departamento: newDepartamento.trim() || undefined,
        ciudadMunicipio: newCiudadMunicipio.trim() || undefined,
        password: newPassword,
        roles: newUserRoles,
      });
      setSuccessMessage(`Usuario ${newEmail.trim()} creado exitosamente.`);
      setIsCreateOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el usuario.';
      setCreateError(msg);
    }
  };

  const handleOpenEdit = (user: AdminUserItem) => {
    setSelectedUser(user);
    setEditNombres(user.nombres ?? '');
    setEditApellidos(user.apellidos ?? '');
    setEditTipoIdentificacion(user.tipoIdentificacion ?? 'CC');
    setEditNumeroIdentificacion(user.numeroIdentificacion ?? '');
    setEditTelefonoContacto(user.telefonoContacto ?? '');
    setEditEmail(user.email ?? '');
    setEditUsername(user.username ?? '');
    setEditDireccionResidencia(user.direccionResidencia ?? '');
    setEditBarrio(user.barrio ?? '');
    setEditDepartamento(user.departamento ?? '');
    setEditCiudadMunicipio(user.ciudadMunicipio ?? '');
    setSelectedRoles([...user.roles]);
    setIsEditUserActive(user.isActive);
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

  const handleSaveExpediente = async () => {
    if (!selectedUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Guardar datos personales y residencia
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        data: {
          email: editEmail.trim(),
          username: editUsername.trim(),
          nombres: editNombres.trim(),
          apellidos: editApellidos.trim(),
          fullName: `${editNombres.trim()} ${editApellidos.trim()}`,
          tipoIdentificacion: editTipoIdentificacion,
          numeroIdentificacion: editNumeroIdentificacion.trim() || null,
          telefonoContacto: editTelefonoContacto.trim() || null,
          direccionResidencia: editDireccionResidencia.trim() || null,
          barrio: editBarrio.trim() || null,
          departamento: editDepartamento.trim() || null,
          ciudadMunicipio: editCiudadMunicipio.trim() || null,
          roles: selectedRoles,
          isActive: isEditUserActive,
        },
      });

      setSuccessMessage(`Expediente actualizado exitosamente para ${editEmail.trim()}.`);
      setSelectedUser(null);
      refetch();
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.statusCode === 409) {
        setErrorMessage(err.message || 'Conflicto al actualizar datos del usuario.');
      } else {
        const msg = err instanceof Error ? err.message : 'Error al actualizar expediente.';
        setErrorMessage(msg);
      }
      refetch();
    }
  };

  const handleToggleUserStatusDirect = async () => {
    if (!selectedUser) return;
    const nextStatus = !isEditUserActive;
    setErrorMessage(null);

    try {
      await toggleStatusMutation.mutateAsync({
        userId: selectedUser.id,
        isActive: nextStatus,
      });
      setIsEditUserActive(nextStatus);
      setSelectedUser({ ...selectedUser, isActive: nextStatus });
      setSuccessMessage(
        `Usuario ${selectedUser.username} ${nextStatus ? 'activado' : 'desactivado'} en el sistema.`,
      );
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado de acceso.';
      setErrorMessage(msg);
    }
  };

  const handleUnlockUserDirect = async () => {
    if (!selectedUser) return;
    setErrorMessage(null);

    try {
      await unlockUserMutation.mutateAsync(selectedUser.id);
      setSelectedUser({
        ...selectedUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      setSuccessMessage(`Cuenta del usuario ${selectedUser.username} desbloqueada de inmediato.`);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desbloquear la cuenta.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administración centralizada de cuentas, expedientes normalizados y seguridad RBAC del
            Equipo Namtrik.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md shadow-sm text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 transition-colors"
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {successMessage && (
        <div
          role="alert"
          className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-sm font-medium"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm font-medium"
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
                    Documento & Contacto
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
                    Estado & Seguridad
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
                {data.items.map((u) => {
                  const isLocked =
                    Boolean(u.lockedUntil) && new Date(u.lockedUntil as string) > new Date();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-slate-900">
                          {u.fullName ||
                            `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim() ||
                            u.email}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {u.email} • @{u.username}
                        </div>
                        {u.id === currentUser?.userId && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                            (Tu sesión)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>
                          <span className="font-medium text-slate-800">
                            {u.tipoIdentificacion ?? 'CC'}:
                          </span>{' '}
                          {u.numeroIdentificacion || 'Sin documento'}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {u.telefonoContacto ? `Tel: ${u.telefonoContacto}` : 'Sin teléfono'} •{' '}
                          {u.ciudadMunicipio
                            ? `${u.ciudadMunicipio}, ${u.departamento ?? ''}`
                            : 'Ubicación n/d'}
                        </div>
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
                        <div className="flex flex-col items-center gap-1">
                          {u.isActive ? (
                            <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                              Activo
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                              Inactivo
                            </span>
                          )}

                          {isLocked ? (
                            <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold animate-pulse">
                              Bloqueado
                            </span>
                          ) : u.mustChangePassword ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                              Cambio requerido
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            aria-label={`Modificar roles de ${u.email}`}
                            className="text-sky-700 hover:text-sky-900 px-3 py-1.5 min-h-[44px] font-semibold"
                          >
                            Expediente / Modificar roles
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EXPEDIENTE / EDICIÓN COMPLETA DE USUARIO */}
      {selectedUser && (
        <div
          role="dialog"
          aria-labelledby="edit-user-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <h2 id="edit-user-title" className="text-xl font-bold text-slate-900">
                  Expediente de Usuario: {selectedUser.fullName || selectedUser.username}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID #{selectedUser.id} • Correo: {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* SECCIÓN 1: CONTROL DE ACCESO EN CRUDO Y SEGURIDAD */}
            <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Control de Acceso y Estado de Seguridad
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    Estado en el sistema:
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      isEditUserActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isEditUserActive ? 'Cuenta Activa' : 'Cuenta Desactivada'}
                  </span>
                </div>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleUserStatusDirect}
                    disabled={toggleStatusMutation.isPending}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      isEditUserActive
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isEditUserActive ? 'Desactivar acceso en crudo' : 'Activar acceso en crudo'}
                  </button>
                )}
              </div>

              {/* Lógica de desbloqueo de cuenta */}
              {selectedUser.lockedUntil &&
              new Date(selectedUser.lockedUntil as string) > new Date() ? (
                <div className="p-3 bg-red-50 border border-red-300 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <span className="text-sm">⚠️</span> CUENTA BLOQUEADA POR INTENTOS FALLIDOS
                    </div>
                    <div className="text-[11px] text-red-700 mt-0.5">
                      Intentos fallidos: {selectedUser.failedLoginAttempts ?? 0} • Bloqueo activo
                      hasta: {new Date(selectedUser.lockedUntil as string).toLocaleTimeString()}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={handleUnlockUserDirect}
                      disabled={unlockUserMutation.isPending}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold shadow-sm whitespace-nowrap min-h-[36px]"
                    >
                      ⚡ Desbloquear cuenta de inmediato
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-md flex items-center justify-between">
                  <div className="text-xs text-emerald-800">
                    <span className="font-semibold">Seguridad:</span> Acceso normal. No hay bloqueos
                    activos de contraseña.
                  </div>
                  <span className="text-[11px] text-slate-500 italic bg-white px-2 py-0.5 rounded border border-slate-200">
                    Desbloqueo no requerido
                  </span>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DATOS PERSONALES NORMALIZADOS */}
            <div className="mb-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
                Información Personal e Identificación
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-nombres"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Nombre o nombres *
                  </label>
                  <input
                    id="edit-nombres"
                    type="text"
                    value={editNombres}
                    onChange={(e) => setEditNombres(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-apellidos"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Apellido o apellidos *
                  </label>
                  <input
                    id="edit-apellidos"
                    type="text"
                    value={editApellidos}
                    onChange={(e) => setEditApellidos(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-tipo-doc"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Tipo de Identificación *
                  </label>
                  <select
                    id="edit-tipo-doc"
                    value={editTipoIdentificacion}
                    onChange={(e) => setEditTipoIdentificacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-sky-500 focus:border-sky-500"
                  >
                    {TIPOS_IDENTIFICACION.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-num-doc"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Número de identificación *
                  </label>
                  <input
                    id="edit-num-doc"
                    type="text"
                    value={editNumeroIdentificacion}
                    onChange={(e) => setEditNumeroIdentificacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="edit-telefono"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Número de contacto
                  </label>
                  <input
                    id="edit-telefono"
                    type="tel"
                    value={editTelefonoContacto}
                    onChange={(e) => setEditTelefonoContacto(e.target.value)}
                    placeholder="312 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Correo de usuario *
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-username"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Nombre de usuario *
                  </label>
                  <input
                    id="edit-username"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DIRECCIÓN NORMALIZADA */}
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
                Dirección de Residencia Normalizada
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-direccion"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    1) Dirección como tal
                  </label>
                  <input
                    id="edit-direccion"
                    type="text"
                    value={editDireccionResidencia}
                    onChange={(e) => setEditDireccionResidencia(e.target.value)}
                    placeholder="Calle 10 # 4-20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-barrio"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    2) Sección de barrio
                  </label>
                  <input
                    id="edit-barrio"
                    type="text"
                    value={editBarrio}
                    onChange={(e) => setEditBarrio(e.target.value)}
                    placeholder="Barrio Centro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-depto"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    3) Sección de departamento
                  </label>
                  <input
                    id="edit-depto"
                    type="text"
                    value={editDepartamento}
                    onChange={(e) => setEditDepartamento(e.target.value)}
                    placeholder="Cauca"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-ciudad"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    4) Sección de ciudad/municipio
                  </label>
                  <input
                    id="edit-ciudad"
                    type="text"
                    value={editCiudadMunicipio}
                    onChange={(e) => setEditCiudadMunicipio(e.target.value)}
                    placeholder="Silvia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: ROLES ASIGNADOS */}
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
                Roles y Permisos de Administración
              </h3>

              <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                {ALL_ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role.id);
                  const isSuperAdminOptionDisabled = role.id === 'super_admin' && !isSuperAdmin;

                  return (
                    <label
                      key={role.id}
                      className={`flex items-start gap-3 p-2 rounded cursor-pointer ${
                        isChecked ? 'bg-sky-50/60' : 'hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={isChecked}
                        disabled={isSuperAdminOptionDisabled}
                        onChange={() => handleToggleRole(role.id)}
                        className="mt-0.5 h-4 w-4 text-sky-600 focus:ring-sky-500 rounded border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{role.label}</div>
                        <div className="text-[11px] text-slate-500">{role.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 min-h-[44px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={selectedRoles.length === 0 || updateUserMutation.isPending}
                onClick={handleSaveExpediente}
                className="px-4 py-2 min-h-[44px] bg-sky-700 hover:bg-sky-800 text-white rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {updateUserMutation.isPending ? 'Guardando expediente...' : 'Guardar expediente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO USUARIO */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-labelledby="create-user-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h2 id="create-user-title" className="text-xl font-bold text-slate-900 mb-1">
              Crear Nuevo Usuario
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Registro completo de datos normalizados del nuevo integrante del equipo
              administrativo.
            </p>

            {createError && (
              <div
                role="alert"
                className="p-3 mb-4 bg-red-50 text-red-800 border border-red-200 rounded-md text-xs font-medium"
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* 1. Correo de usuario */}
              <div>
                <label
                  htmlFor="new-user-email"
                  className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                >
                  Correo de usuario *
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@misak.local"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* 2. Nombres y Apellidos en recuadros propios obligatorios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="new-user-nombres"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Nombre o nombres *
                  </label>
                  <input
                    id="new-user-nombres"
                    type="text"
                    required
                    value={newNombres}
                    onChange={(e) => handleNombresChange(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-user-apellidos"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Apellido o apellidos *
                  </label>
                  <input
                    id="new-user-apellidos"
                    type="text"
                    required
                    value={newApellidos}
                    onChange={(e) => handleApellidosChange(e.target.value)}
                    placeholder="Ej. Gómez Hurtado"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* 3. Identificación y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="new-user-tipo-id"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Tipo Identificación *
                  </label>
                  <select
                    id="new-user-tipo-id"
                    value={newTipoIdentificacion}
                    onChange={(e) => setNewTipoIdentificacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-sky-500 focus:border-sky-500"
                  >
                    {TIPOS_IDENTIFICACION.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-user-num-id"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Número Identificación *
                  </label>
                  <input
                    id="new-user-num-id"
                    type="text"
                    required
                    value={newNumeroIdentificacion}
                    onChange={(e) => setNewNumeroIdentificacion(e.target.value)}
                    placeholder="1061000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-user-telefono"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Número de Contacto
                  </label>
                  <input
                    id="new-user-telefono"
                    type="tel"
                    value={newTelefonoContacto}
                    onChange={(e) => setNewTelefonoContacto(e.target.value)}
                    placeholder="312 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* 4. Generación Inteligente de Nombre de Usuario */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="new-user-username"
                    className="block text-xs font-semibold text-slate-700 uppercase"
                  >
                    Nombre de usuario * (acceso por correo o usuario)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSmartUsername}
                    className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline"
                  >
                    ⚡ Validar / Sugerir sin colisión
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="new-user-username"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setIsUsernameAuto(false);
                    }}
                    placeholder="nombre.apellido"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generado automáticamente a partir de nombres y apellidos. Único e irrepetible en
                  el sistema.
                </p>
              </div>

              {/* 5. Contraseña, Confirmación, Barra Semaforizada y Generador Criptográfico */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Seguridad de la Contraseña
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-semibold rounded transition-colors"
                  >
                    🎲 Generar contraseña segura automática
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-user-password"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Contraseña inicial * (mínimo 8 caracteres)
                    </label>
                    <input
                      id="new-user-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-confirm-password"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Confirmar contraseña *
                    </label>
                    <input
                      id="new-user-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500 ${
                        newConfirmPassword && newPassword !== newConfirmPassword
                          ? 'border-red-400 bg-red-50/40'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Barra semaforizada */}
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Nivel de robustez:</span>
                      <span
                        className={`font-bold ${
                          passwordStrength.score === 3
                            ? 'text-emerald-700'
                            : passwordStrength.score === 2
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                      <span
                        className={
                          passwordStrength.hasMinLength
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ 8+ car.
                      </span>
                      <span
                        className={
                          passwordStrength.hasUpper
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ Mayúscula
                      </span>
                      <span
                        className={
                          passwordStrength.hasLower
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ Minúscula
                      </span>
                      <span
                        className={
                          passwordStrength.hasNumber
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ Número
                      </span>
                      <span
                        className={
                          passwordStrength.hasSpecial
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ Carácter especial
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Dirección Normalizada en 4 recuadros */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-700 uppercase">
                  Dirección de Residencia Normalizada
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-user-direccion"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      1) Dirección como tal
                    </label>
                    <input
                      id="new-user-direccion"
                      type="text"
                      value={newDireccionResidencia}
                      onChange={(e) => setNewDireccionResidencia(e.target.value)}
                      placeholder="Calle 10 # 4-20"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-user-barrio"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      2) Sección de barrio
                    </label>
                    <input
                      id="new-user-barrio"
                      type="text"
                      value={newBarrio}
                      onChange={(e) => setNewBarrio(e.target.value)}
                      placeholder="Barrio La Campana"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-user-departamento"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      3) Sección de departamento
                    </label>
                    <input
                      id="new-user-departamento"
                      type="text"
                      value={newDepartamento}
                      onChange={(e) => setNewDepartamento(e.target.value)}
                      placeholder="Cauca"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-user-ciudad"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      4) Sección de ciudad/municipio
                    </label>
                    <input
                      id="new-user-ciudad"
                      type="text"
                      value={newCiudadMunicipio}
                      onChange={(e) => setNewCiudadMunicipio(e.target.value)}
                      placeholder="Silvia"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Roles */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                  Roles a asignar *
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-md border border-slate-200">
                  {ALL_ROLES.map((role) => {
                    const isChecked = newUserRoles.includes(role.id);
                    const isSuperAdminOptionDisabled = role.id === 'super_admin' && !isSuperAdmin;

                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-1.5 rounded cursor-pointer ${
                          isChecked ? 'bg-sky-50/60' : 'hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`new-role-${role.id}`}
                          checked={isChecked}
                          disabled={isSuperAdminOptionDisabled}
                          onChange={() => handleToggleNewUserRole(role.id)}
                          className="mt-0.5 h-4 w-4 text-sky-600 focus:ring-sky-500 rounded border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{role.label}</div>
                          <div className="text-[11px] text-slate-500">{role.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 min-h-[44px] border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending || !isPasswordValid}
                  className="px-4 py-2 min-h-[44px] bg-sky-700 hover:bg-sky-800 text-white rounded-md text-sm font-semibold disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
