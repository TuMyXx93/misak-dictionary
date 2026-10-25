/**
 * UsuariosPage
 * Spec 006 (R-018, T-048)
 * Gestión integral de usuarios, expediente administrativo normalizado,
 * controles de acceso en crudo, desbloqueo de seguridad y asignación de roles.
 */

import { useMemo, useState } from 'react';
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminPageHeader,
  AdminSurface,
} from '@/components/admin/ui';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import {
  type AdminUserItem,
  useAdminUsers,
  useCreateUser,
  useResetUserPassword,
  useToggleUserStatus,
  useUnlockUser,
  useUpdateUser,
} from '@/hooks/useAdmin';
import { AdminApiError, adminHttp } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { PasswordFields } from './usuarios/PasswordFields';
import { ResetPasswordPanel } from './usuarios/ResetPasswordPanel';
import { RoleSelector } from './usuarios/RoleSelector';
import { getRoleVisualDef } from './usuarios/roleCatalog';
import { SuspendUserDialog } from './usuarios/SuspendUserDialog';
import { UserFormFields } from './usuarios/UserFormFields';
import { USER_COPY } from './usuarios/userCopy';

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
      color: 'bg-red-600',
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
    color: 'bg-emerald-600',
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
  const specials = '!@#$%&*';
  const all = upper + lower + numbers + specials;

  const cryptoObj = window.crypto;
  const getRandom = (max: number) => {
    const array = new Uint32Array(1);
    cryptoObj.getRandomValues(array);
    return (array[0] ?? 0) % max;
  };

  const pass = [
    upper[getRandom(upper.length)],
    lower[getRandom(lower.length)],
    numbers[getRandom(numbers.length)],
    specials[getRandom(specials.length)],
  ];

  for (let i = 0; i < 10; i++) {
    pass.push(all[getRandom(all.length)]);
  }

  return pass.sort(() => getRandom(3) - 1).join('');
}

function renderRoleBadge(roleId: string, isDark: boolean) {
  const roleDef = getRoleVisualDef(roleId);
  return (
    <AdminBadge
      key={roleId}
      tone={roleDef.tone}
      className={
        roleDef.tone === 'success'
          ? isDark
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/45 font-medium'
            : 'bg-emerald-50 text-emerald-900 border-emerald-600/40 font-medium'
          : 'font-medium'
      }
    >
      {roleDef.name}
    </AdminBadge>
  );
}

export function UsuariosPage() {
  const { hasRole, user: currentUser } = useAuthStore();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin') || isSuperAdmin;

  const { data, isLoading, isError, error, refetch } = useAdminUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const toggleStatusMutation = useToggleUserStatus();
  const unlockUserMutation = useUnlockUser();
  const resetPasswordMutation = useResetUserPassword();

  // Modal Suspender Usuario
  const [userToSuspend, setUserToSuspend] = useState<AdminUserItem | null>(null);

  // Modal Restablecer Contraseña
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUserItem | null>(null);
  const [selfResetCompleted, setSelfResetCompleted] = useState(false);

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
    setNewDireccionResidencia('');
    setNewBarrio('');
    setNewDepartamento('');
    setNewCiudadMunicipio('');
    setNewUserRoles(['content_admin']);
    setCreateError(null);
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

  const handleConfirmSuspend = async (motivo?: string) => {
    if (!userToSuspend) return;
    const nextStatus = !userToSuspend.isActive;
    await toggleStatusMutation.mutateAsync({
      userId: userToSuspend.id,
      isActive: nextStatus,
      motivo,
    });
    setSuccessMessage(
      `Cuenta de ${userToSuspend.username} ${nextStatus ? 'reactivada' : 'suspendida'} exitosamente.`,
    );
    setUserToSuspend(null);
    refetch();
  };

  const handleConfirmResetPassword = async (userId: string) => {
    const res = await resetPasswordMutation.mutateAsync({ userId });
    setSuccessMessage(`Contraseña restablecida exitosamente para ${res.user.username}.`);
    if (String(userId) === String(currentUser?.userId)) {
      setSelfResetCompleted(true);
    } else {
      refetch();
    }
    return { temporaryPassword: res.temporaryPassword };
  };

  const handleCloseResetPasswordModal = () => {
    setUserToResetPassword(null);
    if (selfResetCompleted) {
      setSelfResetCompleted(false);
      // Tras haber visto y copiado su propia clave temporal y pulsar "Entendido y cerrar",
      // cerramos la sesión local para que pueda ingresar con la clave temporal recién copiada.
      useAuthStore.getState().clearSession();
    }
  };

  const successAlertClasses = isDark
    ? 'bg-emerald-950/80 text-emerald-100 border-emerald-500/50'
    : 'bg-emerald-50 text-emerald-900 border-emerald-600/40';

  const errorAlertClasses = isDark
    ? 'bg-red-950/80 text-red-100 border-red-500/50'
    : 'bg-red-50 text-red-900 border-red-600/40';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Control de Acceso y Permisos"
        title="Gestión de Usuarios y Roles"
        description="Administración centralizada de cuentas, perfiles y permisos de acceso del Equipo Namtrik."
        actions={
          isAdmin ? (
            <AdminButton variant="primary" onClick={handleOpenCreate}>
              + Nuevo usuario
            </AdminButton>
          ) : undefined
        }
      />

      {successMessage && (
        <div
          role="alert"
          className={cn('p-4 rounded-xl border text-sm font-medium', successAlertClasses)}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className={cn('p-4 rounded-xl border text-sm font-medium', errorAlertClasses)}
        >
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <AdminSurface
          variant="muted"
          className="text-center py-12 text-[var(--admin-text-secondary)]"
        >
          <output className="block">Cargando usuarios...</output>
        </AdminSurface>
      )}

      {isError && (
        <div role="alert" className={cn('p-4 rounded-xl border text-sm', errorAlertClasses)}>
          Error al cargar usuarios: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <AdminSurface className="overflow-hidden">
          <div className="misak-table-region @container">
            <table className="misak-responsive-table min-w-full divide-y divide-[var(--admin-border)]">
              <thead className="bg-[var(--admin-surface-muted)]">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                  >
                    Usuario / Correo
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                  >
                    Documento y Contacto
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                  >
                    Roles Asignados
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                  >
                    Estado y Seguridad
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)]"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--admin-surface)] divide-y divide-[var(--admin-border)]">
                {data.items.map((u) => {
                  const isLocked =
                    Boolean(u.lockedUntil) && new Date(u.lockedUntil as string) > new Date();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--admin-surface-muted)]/60 transition-colors"
                    >
                      <td data-label="Usuario / Correo" className="px-4 py-3.5 text-sm">
                        <div>
                          <div className="font-semibold text-[var(--admin-text)]">
                            {u.fullName ||
                              `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim() ||
                              u.email}
                          </div>
                          <div className="text-xs text-[var(--admin-text-secondary)] font-mono mt-0.5">
                            {u.email} • @{u.username}
                          </div>
                          {u.id === currentUser?.userId && (
                            <AdminBadge tone="primary" className="mt-1 px-2 py-0 text-[11px]">
                              (Tu sesión)
                            </AdminBadge>
                          )}
                        </div>
                      </td>
                      <td
                        data-label="Documento & Contacto"
                        className="px-4 py-3.5 text-xs text-[var(--admin-text-secondary)]"
                      >
                        <div>
                          <div>
                            <span className="font-semibold text-[var(--admin-text)]">
                              {u.tipoIdentificacion ?? 'CC'}:
                            </span>{' '}
                            {u.numeroIdentificacion || 'Sin documento'}
                          </div>
                          <div className="text-[var(--admin-text-muted)] mt-0.5">
                            {u.telefonoContacto ? `Tel: ${u.telefonoContacto}` : 'Sin teléfono'} •{' '}
                            {u.ciudadMunicipio
                              ? `${u.ciudadMunicipio}, ${u.departamento ?? ''}`
                              : 'Ubicación n/d'}
                          </div>
                        </div>
                      </td>
                      <td data-label="Roles Asignados" className="px-4 py-3.5 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => renderRoleBadge(r, isDark))}
                        </div>
                      </td>
                      <td
                        data-label="Estado & Seguridad"
                        className="px-4 py-3.5 whitespace-nowrap text-center text-xs"
                      >
                        <div className="inline-flex flex-col items-center gap-1">
                          {u.isActive ? (
                            <AdminBadge
                              tone="success"
                              className={
                                isDark
                                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/45'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-600/40'
                              }
                            >
                              Activo
                            </AdminBadge>
                          ) : (
                            <AdminBadge tone="neutral">Inactivo</AdminBadge>
                          )}

                          {isLocked ? (
                            <AdminBadge
                              tone="danger"
                              className={cn(
                                'font-bold animate-pulse',
                                isDark
                                  ? 'bg-red-950/85 text-red-100 border-red-500/50'
                                  : 'bg-red-50 text-red-900 border-red-600/40',
                              )}
                            >
                              Bloqueado
                            </AdminBadge>
                          ) : u.mustChangePassword ? (
                            <AdminBadge
                              tone="warning"
                              className={
                                isDark
                                  ? 'bg-amber-950/80 text-amber-100 border-amber-500/50'
                                  : 'bg-amber-50 text-amber-900 border-amber-600/45'
                              }
                            >
                              Cambio requerido
                            </AdminBadge>
                          ) : null}
                        </div>
                      </td>
                      <td
                        data-label="Acciones"
                        className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium"
                      >
                        {isAdmin && (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(u)}
                              aria-label={`Modificar expediente de ${u.email}`}
                              className="text-[var(--admin-primary-text)]"
                            >
                              Expediente
                            </AdminButton>
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              onClick={() => setUserToResetPassword(u)}
                              aria-label={`Restablecer contraseña de ${u.email}`}
                            >
                              Restablecer clave
                            </AdminButton>
                            <AdminButton
                              variant={u.isActive ? 'danger' : 'primary'}
                              size="sm"
                              onClick={() => setUserToSuspend(u)}
                              aria-label={`${u.isActive ? 'Suspender' : 'Activar'} cuenta de ${u.email}`}
                              disabled={u.id === currentUser?.userId && u.isActive}
                            >
                              {u.isActive ? 'Suspender' : 'Activar'}
                            </AdminButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminSurface>
      )}

      {/* MODAL EXPEDIENTE / EDICIÓN COMPLETA DE USUARIO */}
      {selectedUser && (
        <AdminDialog
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Expediente: ${selectedUser.fullName || selectedUser.username}`}
          subtitle={`ID #${selectedUser.id} • Correo: ${selectedUser.email}`}
          titleId="edit-user-title"
          maxWidthClass="max-w-3xl"
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setSelectedUser(null)}>
                Cerrar
              </AdminButton>
              <AdminButton
                variant="primary"
                disabled={selectedRoles.length === 0 || updateUserMutation.isPending}
                onClick={handleSaveExpediente}
              >
                {updateUserMutation.isPending ? 'Guardando expediente...' : 'Guardar expediente'}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-6">
            {/* Control de Seguridad y Estado */}
            <AdminSurface variant="muted" className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
                Control de Acceso y Seguridad
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--admin-text)]">
                    Estado en la plataforma:
                  </span>
                  <AdminBadge
                    tone={isEditUserActive ? 'success' : 'neutral'}
                    className={
                      isEditUserActive
                        ? isDark
                          ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/45 font-bold'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-600/40 font-bold'
                        : 'font-bold'
                    }
                  >
                    {isEditUserActive ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                  </AdminBadge>
                </div>

                <div className="flex items-center gap-2">
                  <AdminButton
                    variant={isEditUserActive ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => setUserToSuspend(selectedUser)}
                    disabled={selectedUser.id === currentUser?.userId && isEditUserActive}
                  >
                    {isEditUserActive ? 'Suspender cuenta' : 'Reactivar cuenta'}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setUserToResetPassword(selectedUser)}
                  >
                    Restablecer clave
                  </AdminButton>
                </div>
              </div>

              {selectedUser.lockedUntil &&
              new Date(selectedUser.lockedUntil as string) > new Date() ? (
                <div
                  className={cn(
                    'p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    errorAlertClasses,
                  )}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="text-sm" aria-hidden="true">
                        ⚠️
                      </span>{' '}
                      CUENTA BLOQUEADA POR INTENTOS FALLIDOS
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      Intentos fallidos: {selectedUser.failedLoginAttempts ?? 0} • Bloqueo activo
                      hasta: {new Date(selectedUser.lockedUntil as string).toLocaleTimeString()}
                    </div>
                  </div>
                  {isAdmin && (
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={handleUnlockUserDirect}
                      disabled={unlockUserMutation.isPending}
                      className="whitespace-nowrap"
                    >
                      ⚡ Desbloquear cuenta de inmediato
                    </AdminButton>
                  )}
                </div>
              ) : null}
            </AdminSurface>

            {/* Formulario de expediente usando UserFormFields */}
            <UserFormFields
              data={{
                email: editEmail,
                nombres: editNombres,
                apellidos: editApellidos,
                tipoIdentificacion: editTipoIdentificacion,
                numeroIdentificacion: editNumeroIdentificacion,
                telefonoContacto: editTelefonoContacto,
                username: editUsername,
                direccionResidencia: editDireccionResidencia,
                barrio: editBarrio,
                departamento: editDepartamento,
                ciudadMunicipio: editCiudadMunicipio,
              }}
              onChange={(field, value) => {
                if (field === 'email') setEditEmail(value);
                if (field === 'nombres') setEditNombres(value);
                if (field === 'apellidos') setEditApellidos(value);
                if (field === 'tipoIdentificacion') setEditTipoIdentificacion(value);
                if (field === 'numeroIdentificacion') setEditNumeroIdentificacion(value);
                if (field === 'telefonoContacto') setEditTelefonoContacto(value);
                if (field === 'username') setEditUsername(value);
                if (field === 'direccionResidencia') setEditDireccionResidencia(value);
                if (field === 'barrio') setEditBarrio(value);
                if (field === 'departamento') setEditDepartamento(value);
                if (field === 'ciudadMunicipio') setEditCiudadMunicipio(value);
              }}
              isEditMode
            />

            {/* Asignación de Roles usando RoleSelector (sin doble scroll) */}
            <RoleSelector
              selectedRoles={selectedRoles}
              onChange={setSelectedRoles}
              canManageSuperAdmin={isSuperAdmin}
            />
          </div>
        </AdminDialog>
      )}

      {/* MODAL CREAR NUEVO USUARIO */}
      <AdminDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={USER_COPY.header.createTitle}
        subtitle={USER_COPY.header.createSubtitle}
        titleId="create-user-title"
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </AdminButton>
            <AdminButton
              type="submit"
              form="create-user-form"
              variant="primary"
              disabled={createUserMutation.isPending || !isPasswordValid}
            >
              {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
            </AdminButton>
          </>
        }
      >
        {createError && (
          <div
            role="alert"
            className={cn('p-3.5 mb-4 rounded-xl border text-xs font-medium', errorAlertClasses)}
          >
            {createError}
          </div>
        )}

        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-5">
          <UserFormFields
            data={{
              email: newEmail,
              nombres: newNombres,
              apellidos: newApellidos,
              tipoIdentificacion: newTipoIdentificacion,
              numeroIdentificacion: newNumeroIdentificacion,
              telefonoContacto: newTelefonoContacto,
              username: newUsername,
              direccionResidencia: newDireccionResidencia,
              barrio: newBarrio,
              departamento: newDepartamento,
              ciudadMunicipio: newCiudadMunicipio,
            }}
            onChange={(field, value) => {
              if (field === 'email') setNewEmail(value);
              if (field === 'nombres') handleNombresChange(value);
              if (field === 'apellidos') handleApellidosChange(value);
              if (field === 'tipoIdentificacion') setNewTipoIdentificacion(value);
              if (field === 'numeroIdentificacion') setNewNumeroIdentificacion(value);
              if (field === 'telefonoContacto') setNewTelefonoContacto(value);
              if (field === 'username') {
                setNewUsername(value);
                setIsUsernameAuto(false);
              }
              if (field === 'direccionResidencia') setNewDireccionResidencia(value);
              if (field === 'barrio') setNewBarrio(value);
              if (field === 'departamento') setNewDepartamento(value);
              if (field === 'ciudadMunicipio') setNewCiudadMunicipio(value);
            }}
            onVerifyUsername={handleGenerateSmartUsername}
          />

          <PasswordFields
            password={newPassword}
            confirmPassword={newConfirmPassword}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setNewConfirmPassword}
            onGenerateAutoPassword={handleGeneratePassword}
          />

          <RoleSelector
            selectedRoles={newUserRoles}
            onChange={setNewUserRoles}
            canManageSuperAdmin={isSuperAdmin}
          />
        </form>
      </AdminDialog>

      {/* DIÁLOGO DE SUSPENSIÓN DE CUENTA */}
      <SuspendUserDialog
        user={userToSuspend}
        isOpen={Boolean(userToSuspend)}
        isSuspending={toggleStatusMutation.isPending}
        onClose={() => setUserToSuspend(null)}
        onConfirm={handleConfirmSuspend}
      />

      {/* DIÁLOGO DE RESTABLECIMIENTO DE CONTRASEÑA */}
      <ResetPasswordPanel
        user={userToResetPassword}
        isOpen={Boolean(userToResetPassword)}
        onClose={handleCloseResetPasswordModal}
        onResetPassword={handleConfirmResetPassword}
      />
    </div>
  );
}
