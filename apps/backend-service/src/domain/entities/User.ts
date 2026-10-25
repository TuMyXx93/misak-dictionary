/**
 * User Domain Entity
 * Sprint 2 - Auth System
 * Representa un usuario del sistema administrativo
 */

export interface User {
  id: bigint;
  username: string;
  email: string;
  password: string; // hash
  fullName: string;
  nombres?: string | null;
  apellidos?: string | null;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * User sin password (para respuestas)
 */
export type UserWithoutPassword = Omit<User, 'password'>;

/**
 * User con roles
 */
export interface UserWithRoles extends UserWithoutPassword {
  roles: Array<{
    roleId: bigint;
    role: {
      id: bigint;
      name: string;
    };
  }>;
}

/**
 * Payload para crear un usuario
 */
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string; // plain text (será hasheado)
  fullName: string;
  nombres?: string | null;
  apellidos?: string | null;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  mustChangePassword?: boolean;
}

/**
 * Payload para actualizar un usuario
 */
export interface UpdateUserPayload {
  username?: string;
  email?: string;
  fullName?: string;
  nombres?: string | null;
  apellidos?: string | null;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string | null;
  telefonoContacto?: string | null;
  direccionResidencia?: string | null;
  barrio?: string | null;
  departamento?: string | null;
  ciudadMunicipio?: string | null;
  isActive?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
}
