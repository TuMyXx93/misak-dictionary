/**
 * Contrato Canónico de Políticas de Rutas Administrativas
 * Spec 013 (R-005, R-007) — Fuente única de verdad para la autorización de vistas
 * en el router, el menú lateral (AdminLayout), canAccessAdminPath y firstAllowedRoute.
 */

import { PERMISSIONS, type Permission } from './permissions';

export interface AdminUserLike {
  userId?: string;
  username?: string;
  email?: string;
  mustChangePassword?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface AdminRoutePolicy {
  /** Ruta absoluta canónica dentro del panel administrativo */
  path: string;
  /** Permiso principal requerido por RequirePermission en el router */
  permission: Permission;
  /** Permisos alternativos aceptados al evaluar acceso o primera ruta permitida */
  anyOfPermissions?: readonly Permission[];
}

/**
 * Matriz única ruta -> permisos requeridos.
 * - /admin/dashboard se alinea con GET /api/admin/governance/progreso (dictionary:read, R-027).
 * - /admin/revision permite lectura con dictionary:read o taxonomy:ratify (R-014, R-003).
 * - /admin/ajustes se gobierna por settings:manage (habilitado para super_admin y admin, R-008).
 */
export const ADMIN_ROUTE_POLICIES: readonly AdminRoutePolicy[] = [
  {
    path: '/admin/dashboard',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    anyOfPermissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.AUDITORIA_LEER],
  },
  {
    path: '/admin/sentidos',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    anyOfPermissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.DICCIONARIO_ESCRIBIR],
  },
  {
    path: '/admin/sentidos/nuevo',
    permission: PERMISSIONS.DICCIONARIO_ESCRIBIR,
  },
  {
    path: '/admin/taxonomia',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    anyOfPermissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.DICCIONARIO_ESCRIBIR],
  },
  {
    path: '/admin/medios',
    permission: PERMISSIONS.MEDIOS_LEER,
    anyOfPermissions: [PERMISSIONS.MEDIOS_LEER, PERMISSIONS.MEDIOS_ESCRIBIR],
  },
  {
    path: '/admin/revision',
    permission: PERMISSIONS.DICCIONARIO_LEER,
    anyOfPermissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.TAXONOMIA_RATIFICAR,
      PERMISSIONS.TAXONOMIA_REVERTIR,
    ],
  },
  {
    path: '/admin/papelera',
    permission: PERMISSIONS.DICCIONARIO_BORRAR,
  },
  {
    path: '/admin/usuarios',
    permission: PERMISSIONS.USUARIOS_GESTIONAR,
  },
  {
    path: '/admin/auditoria',
    permission: PERMISSIONS.AUDITORIA_LEER,
  },
  {
    path: '/admin/ajustes',
    permission: PERMISSIONS.AJUSTES_GESTIONAR,
  },
] as const;

/**
 * Evalúa si un usuario posee un permiso específico.
 */
export function userHasPermission(
  user: AdminUserLike | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  if (user.permissions?.includes(permission)) return true;
  if (user.roles?.includes('super_admin')) return true;
  return false;
}

/**
 * Resuelve la política aplicable a un pathname del panel administrativo.
 */
export function resolveAdminRoutePolicy(pathname: string): AdminRoutePolicy | null {
  const cleanPath = (pathname.split(/[?#]/)[0] ?? '').replace(/\/+$/, '') || '/';

  if (/^\/admin\/sentidos\/[^/]+\/editar$/.test(cleanPath)) {
    return {
      path: cleanPath,
      permission: PERMISSIONS.DICCIONARIO_ESCRIBIR,
    };
  }

  return ADMIN_ROUTE_POLICIES.find((policy) => policy.path === cleanPath) ?? null;
}

/**
 * Determina si el usuario autenticado tiene permiso para acceder a una ruta administrativa dada.
 * Rechaza rutas de autenticación transicional (/admin/login, /admin/cambiar-password) o rutas
 * desconocidas para evitar redirecciones post-login hacia pantallas «Sin permiso».
 */
export function canAccessAdminPath(
  user: AdminUserLike | null | undefined,
  pathname: string | null | undefined,
): boolean {
  if (!user || !pathname) return false;

  const cleanPath = (pathname.split(/[?#]/)[0] ?? '').replace(/\/+$/, '') || '/';
  if (
    !cleanPath.startsWith('/admin') ||
    cleanPath === '/admin' ||
    cleanPath === '/admin/login' ||
    cleanPath === '/admin/cambiar-password'
  ) {
    return false;
  }

  const policy = resolveAdminRoutePolicy(cleanPath);
  if (!policy) return false;

  const accepted = policy.anyOfPermissions ?? [policy.permission];
  return accepted.some((perm) => userHasPermission(user, perm));
}

/**
 * Calcula la primera ruta administrativa permitida según los permisos y roles del usuario.
 */
export function resolveFirstAllowedRoute(user: AdminUserLike | null | undefined): string {
  if (!user) return '/admin/login';
  if (user.mustChangePassword) return '/admin/cambiar-password';

  const permissions = new Set(user.permissions ?? []);
  const isSuperAdmin = Boolean(user.roles?.includes('super_admin'));

  if (isSuperAdmin || permissions.has(PERMISSIONS.USUARIOS_GESTIONAR)) {
    return '/admin/usuarios';
  }
  if (
    permissions.has(PERMISSIONS.DICCIONARIO_LEER) ||
    permissions.has(PERMISSIONS.DICCIONARIO_ESCRIBIR)
  ) {
    return '/admin/sentidos';
  }
  if (permissions.has(PERMISSIONS.MEDIOS_LEER) || permissions.has(PERMISSIONS.MEDIOS_ESCRIBIR)) {
    return '/admin/medios';
  }
  if (
    permissions.has(PERMISSIONS.TAXONOMIA_RATIFICAR) ||
    permissions.has(PERMISSIONS.TAXONOMIA_REVERTIR)
  ) {
    return '/admin/revision';
  }
  if (permissions.has(PERMISSIONS.AUDITORIA_LEER)) {
    return '/admin/auditoria';
  }
  if (permissions.has(PERMISSIONS.AJUSTES_GESTIONAR)) {
    return '/admin/ajustes';
  }
  if (permissions.has(PERMISSIONS.DICCIONARIO_BORRAR)) {
    return '/admin/papelera';
  }

  return '/admin/sentidos';
}
