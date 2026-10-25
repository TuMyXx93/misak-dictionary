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
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminSurface,
} from '@/components/admin/ui';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
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
import { cn } from '@/utils/cn';

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
  const specials = '!@#$%^&*()_+~=';
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

  for (let i = pass.length; i < 16; i++) {
    pass.push(all[getRandom(all.length)]);
  }

  return pass.sort(() => getRandom(3) - 1).join('');
}

function renderRoleBadge(role: string, isDark: boolean) {
  if (role === 'super_admin') {
    return (
      <AdminBadge key={role} tone="accent" className="font-bold">
        {role}
      </AdminBadge>
    );
  }

  if (role === 'admin' || role === 'content_admin') {
    return (
      <AdminBadge key={role} tone="primary">
        {role}
      </AdminBadge>
    );
  }

  if (role === 'cultural_reviewer') {
    return (
      <AdminBadge
        key={role}
        tone="success"
        className={
          isDark
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/45'
            : 'bg-emerald-50 text-emerald-900 border-emerald-600/40'
        }
      >
        {role}
      </AdminBadge>
    );
  }

  return (
    <AdminBadge key={role} tone="neutral">
      {role}
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

  const successAlertClasses = isDark
    ? 'bg-emerald-950/80 text-emerald-100 border-emerald-500/50'
    : 'bg-emerald-50 text-emerald-900 border-emerald-600/40';

  const errorAlertClasses = isDark
    ? 'bg-red-950/80 text-red-100 border-red-500/50'
    : 'bg-red-50 text-red-900 border-red-600/40';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gobernanza y Seguridad RBAC"
        title="Gestión de Usuarios y Roles"
        description="Administración centralizada de cuentas, expedientes normalizados y seguridad RBAC del Equipo Namtrik."
        actions={
          isSuperAdmin ? (
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
                    Documento & Contacto
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
                    Estado & Seguridad
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
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                            aria-label={`Modificar roles de ${u.email}`}
                            className="min-h-[44px] text-[var(--admin-primary-text)]"
                          >
                            Expediente / Modificar roles
                          </AdminButton>
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
          title={`Expediente de Usuario: ${selectedUser.fullName || selectedUser.username}`}
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
            {/* SECCIÓN 1: CONTROL DE ACCESO EN CRUDO Y SEGURIDAD */}
            <AdminSurface variant="muted" className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
                Control de Acceso y Estado de Seguridad
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--admin-text)]">
                    Estado en el sistema:
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
                    {isEditUserActive ? 'Cuenta Activa' : 'Cuenta Desactivada'}
                  </AdminBadge>
                </div>

                {isSuperAdmin && (
                  <AdminButton
                    variant={isEditUserActive ? 'danger' : 'primary'}
                    size="sm"
                    onClick={handleToggleUserStatusDirect}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {isEditUserActive ? 'Desactivar acceso en crudo' : 'Activar acceso en crudo'}
                  </AdminButton>
                )}
              </div>

              {/* Lógica de desbloqueo de cuenta */}
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
                  {isSuperAdmin && (
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
              ) : (
                <div
                  className={cn(
                    'p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2',
                    successAlertClasses,
                  )}
                >
                  <div className="text-xs">
                    <span className="font-semibold">Seguridad:</span> Acceso normal. No hay bloqueos
                    activos de contraseña.
                  </div>
                  <span className="text-[11px] text-[var(--admin-text-secondary)] italic bg-[var(--admin-surface)] px-2.5 py-0.5 rounded-lg border border-[var(--admin-border)]">
                    Desbloqueo no requerido
                  </span>
                </div>
              )}
            </AdminSurface>

            {/* SECCIÓN 2: DATOS PERSONALES NORMALIZADOS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-1.5">
                Información Personal e Identificación
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <AdminFieldLabel htmlFor="edit-nombres">Nombre o nombres *</AdminFieldLabel>
                  <AdminInput
                    id="edit-nombres"
                    type="text"
                    value={editNombres}
                    onChange={(e) => setEditNombres(e.target.value)}
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-apellidos">Apellido o apellidos *</AdminFieldLabel>
                  <AdminInput
                    id="edit-apellidos"
                    type="text"
                    value={editApellidos}
                    onChange={(e) => setEditApellidos(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <AdminFieldLabel htmlFor="edit-tipo-doc">
                    Tipo de Identificación *
                  </AdminFieldLabel>
                  <AdminSelect
                    id="edit-tipo-doc"
                    value={editTipoIdentificacion}
                    onChange={(e) => setEditTipoIdentificacion(e.target.value)}
                  >
                    {TIPOS_IDENTIFICACION.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </AdminSelect>
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-num-doc">
                    Número de identificación *
                  </AdminFieldLabel>
                  <AdminInput
                    id="edit-num-doc"
                    type="text"
                    value={editNumeroIdentificacion}
                    onChange={(e) => setEditNumeroIdentificacion(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <AdminFieldLabel htmlFor="edit-telefono">Número de contacto</AdminFieldLabel>
                  <AdminInput
                    id="edit-telefono"
                    type="tel"
                    value={editTelefonoContacto}
                    onChange={(e) => setEditTelefonoContacto(e.target.value)}
                    placeholder="312 000 0000"
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-email">Correo de usuario *</AdminFieldLabel>
                  <AdminInput
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-username">Nombre de usuario *</AdminFieldLabel>
                  <AdminInput
                    id="edit-username"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DIRECCIÓN NORMALIZADA */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-1.5">
                Dirección de Residencia Normalizada
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <AdminFieldLabel htmlFor="edit-direccion">1) Dirección como tal</AdminFieldLabel>
                  <AdminInput
                    id="edit-direccion"
                    type="text"
                    value={editDireccionResidencia}
                    onChange={(e) => setEditDireccionResidencia(e.target.value)}
                    placeholder="Calle 10 # 4-20"
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-barrio">2) Sección de barrio</AdminFieldLabel>
                  <AdminInput
                    id="edit-barrio"
                    type="text"
                    value={editBarrio}
                    onChange={(e) => setEditBarrio(e.target.value)}
                    placeholder="Barrio Centro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <AdminFieldLabel htmlFor="edit-depto">3) Sección de departamento</AdminFieldLabel>
                  <AdminInput
                    id="edit-depto"
                    type="text"
                    value={editDepartamento}
                    onChange={(e) => setEditDepartamento(e.target.value)}
                    placeholder="Cauca"
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="edit-ciudad">
                    4) Sección de ciudad/municipio
                  </AdminFieldLabel>
                  <AdminInput
                    id="edit-ciudad"
                    type="text"
                    value={editCiudadMunicipio}
                    onChange={(e) => setEditCiudadMunicipio(e.target.value)}
                    placeholder="Silvia"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: ROLES ASIGNADOS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-1.5">
                Roles y Permisos de Administración
              </h3>

              <AdminSurface variant="muted" className="p-3 space-y-2">
                {ALL_ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role.id);
                  const isSuperAdminOptionDisabled = role.id === 'super_admin' && !isSuperAdmin;

                  return (
                    <label
                      key={role.id}
                      htmlFor={`role-${role.id}`}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer',
                        isChecked
                          ? 'bg-[var(--admin-primary-soft)] border-[#0055AA]/40'
                          : 'bg-[var(--admin-surface)] border-[var(--admin-border)] hover:bg-[var(--admin-surface-muted)]',
                      )}
                    >
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={isChecked}
                        disabled={isSuperAdminOptionDisabled}
                        onChange={() => handleToggleRole(role.id)}
                        className="mt-0.5 h-4 w-4 rounded border-[var(--admin-control-border)] accent-[#0055AA] focus:ring-2 focus:ring-[#0055AA] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[var(--admin-text)]">
                          {role.label}
                        </div>
                        <div className="text-[11px] text-[var(--admin-text-secondary)]">
                          {role.desc}
                        </div>
                      </div>
                      {renderRoleBadge(role.id, isDark)}
                    </label>
                  );
                })}
              </AdminSurface>
            </div>
          </div>
        </AdminDialog>
      )}

      {/* MODAL CREAR NUEVO USUARIO */}
      <AdminDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nuevo Usuario"
        subtitle="Registro completo de datos normalizados del nuevo integrante del equipo administrativo."
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

        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {/* 1. Correo de usuario */}
          <div>
            <AdminFieldLabel htmlFor="new-user-email">Correo de usuario *</AdminFieldLabel>
            <AdminInput
              id="new-user-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="usuario@misak.local"
            />
          </div>

          {/* 2. Nombres y Apellidos en recuadros propios obligatorios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <AdminFieldLabel htmlFor="new-user-nombres">Nombre o nombres *</AdminFieldLabel>
              <AdminInput
                id="new-user-nombres"
                type="text"
                required
                value={newNombres}
                onChange={(e) => handleNombresChange(e.target.value)}
                placeholder="Ej. Juan Carlos"
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="new-user-apellidos">Apellido o apellidos *</AdminFieldLabel>
              <AdminInput
                id="new-user-apellidos"
                type="text"
                required
                value={newApellidos}
                onChange={(e) => handleApellidosChange(e.target.value)}
                placeholder="Ej. Gómez Hurtado"
              />
            </div>
          </div>

          {/* 3. Identificación y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <AdminFieldLabel htmlFor="new-user-tipo-id">Tipo Identificación *</AdminFieldLabel>
              <AdminSelect
                id="new-user-tipo-id"
                value={newTipoIdentificacion}
                onChange={(e) => setNewTipoIdentificacion(e.target.value)}
              >
                {TIPOS_IDENTIFICACION.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <AdminFieldLabel htmlFor="new-user-num-id">Número Identificación *</AdminFieldLabel>
              <AdminInput
                id="new-user-num-id"
                type="text"
                required
                value={newNumeroIdentificacion}
                onChange={(e) => setNewNumeroIdentificacion(e.target.value)}
                placeholder="1061000000"
              />
            </div>

            <div>
              <AdminFieldLabel htmlFor="new-user-telefono">Número de Contacto</AdminFieldLabel>
              <AdminInput
                id="new-user-telefono"
                type="tel"
                value={newTelefonoContacto}
                onChange={(e) => setNewTelefonoContacto(e.target.value)}
                placeholder="312 000 0000"
              />
            </div>
          </div>

          {/* 4. Generación Inteligente de Nombre de Usuario */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
              <AdminFieldLabel htmlFor="new-user-username" className="mb-0">
                Nombre de usuario * (acceso por correo o usuario)
              </AdminFieldLabel>
              <button
                type="button"
                onClick={handleGenerateSmartUsername}
                className="text-xs font-semibold text-[var(--admin-primary-text)] hover:underline cursor-pointer"
              >
                ⚡ Validar / Sugerir sin colisión
              </button>
            </div>
            <AdminInput
              id="new-user-username"
              type="text"
              required
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setIsUsernameAuto(false);
              }}
              placeholder="nombre.apellido"
              className="font-mono"
            />
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-1">
              Generado automáticamente a partir de nombres y apellidos. Único e irrepetible en el
              sistema.
            </p>
          </div>

          {/* 5. Contraseña, Confirmación, Barra Semaforizada y Generador Criptográfico */}
          <AdminSurface variant="muted" className="p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
                Seguridad de la Contraseña
              </span>
              <AdminButton variant="secondary" size="sm" onClick={handleGeneratePassword}>
                🎲 Generar contraseña segura automática
              </AdminButton>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel htmlFor="new-user-password">
                  Contraseña inicial * (mínimo 8 caracteres)
                </AdminFieldLabel>
                <AdminInput
                  id="new-user-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono"
                />
              </div>

              <div>
                <AdminFieldLabel htmlFor="new-user-confirm-password">
                  Confirmar contraseña *
                </AdminFieldLabel>
                <AdminInput
                  id="new-user-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'font-mono',
                    newConfirmPassword &&
                      newPassword !== newConfirmPassword &&
                      'border-red-500 focus:border-red-600 focus:ring-red-600',
                  )}
                />
              </div>
            </div>

            {/* Barra semaforizada */}
            {newPassword && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--admin-text-secondary)] font-medium">
                    Nivel de robustez:
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      passwordStrength.score === 3
                        ? isDark
                          ? 'text-emerald-300'
                          : 'text-emerald-800'
                        : passwordStrength.score === 2
                          ? isDark
                            ? 'text-amber-300'
                            : 'text-amber-800'
                          : isDark
                            ? 'text-red-300'
                            : 'text-red-800',
                    )}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--admin-border)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-300', passwordStrength.color)}
                    style={{ width: `${passwordStrength.percent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2.5 text-[11px] pt-1">
                  {[
                    { met: passwordStrength.hasMinLength, text: '✓ 8+ car.' },
                    { met: passwordStrength.hasUpper, text: '✓ Mayúscula' },
                    { met: passwordStrength.hasLower, text: '✓ Minúscula' },
                    { met: passwordStrength.hasNumber, text: '✓ Número' },
                    { met: passwordStrength.hasSpecial, text: '✓ Carácter especial' },
                  ].map((item) => (
                    <span
                      key={item.text}
                      className={
                        item.met
                          ? isDark
                            ? 'text-emerald-300 font-semibold'
                            : 'text-emerald-800 font-semibold'
                          : 'text-[var(--admin-text-muted)]'
                      }
                    >
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </AdminSurface>

          {/* 6. Dirección Normalizada en 4 recuadros */}
          <div className="space-y-3.5">
            <span className="block text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-1.5">
              Dirección de Residencia Normalizada
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel htmlFor="new-user-direccion">
                  1) Dirección como tal
                </AdminFieldLabel>
                <AdminInput
                  id="new-user-direccion"
                  type="text"
                  value={newDireccionResidencia}
                  onChange={(e) => setNewDireccionResidencia(e.target.value)}
                  placeholder="Calle 10 # 4-20"
                />
              </div>
              <div>
                <AdminFieldLabel htmlFor="new-user-barrio">2) Sección de barrio</AdminFieldLabel>
                <AdminInput
                  id="new-user-barrio"
                  type="text"
                  value={newBarrio}
                  onChange={(e) => setNewBarrio(e.target.value)}
                  placeholder="Barrio La Campana"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel htmlFor="new-user-departamento">
                  3) Sección de departamento
                </AdminFieldLabel>
                <AdminInput
                  id="new-user-departamento"
                  type="text"
                  value={newDepartamento}
                  onChange={(e) => setNewDepartamento(e.target.value)}
                  placeholder="Cauca"
                />
              </div>
              <div>
                <AdminFieldLabel htmlFor="new-user-ciudad">
                  4) Sección de ciudad/municipio
                </AdminFieldLabel>
                <AdminInput
                  id="new-user-ciudad"
                  type="text"
                  value={newCiudadMunicipio}
                  onChange={(e) => setNewCiudadMunicipio(e.target.value)}
                  placeholder="Silvia"
                />
              </div>
            </div>
          </div>

          {/* 7. Roles */}
          <div>
            <span className="block text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-2">
              Roles a asignar *
            </span>
            <AdminSurface variant="muted" className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {ALL_ROLES.map((role) => {
                const isChecked = newUserRoles.includes(role.id);
                const isSuperAdminOptionDisabled = role.id === 'super_admin' && !isSuperAdmin;

                return (
                  <label
                    key={role.id}
                    htmlFor={`new-role-${role.id}`}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded-xl border transition-colors cursor-pointer',
                      isChecked
                        ? 'bg-[var(--admin-primary-soft)] border-[#0055AA]/40'
                        : 'bg-[var(--admin-surface)] border-[var(--admin-border)] hover:bg-[var(--admin-surface-muted)]',
                    )}
                  >
                    <input
                      type="checkbox"
                      id={`new-role-${role.id}`}
                      checked={isChecked}
                      disabled={isSuperAdminOptionDisabled}
                      onChange={() => handleToggleNewUserRole(role.id)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--admin-control-border)] accent-[#0055AA] focus:ring-2 focus:ring-[#0055AA] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--admin-text)]">{role.label}</div>
                      <div className="text-[11px] text-[var(--admin-text-secondary)]">
                        {role.desc}
                      </div>
                    </div>
                    {renderRoleBadge(role.id, isDark)}
                  </label>
                );
              })}
            </AdminSurface>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
