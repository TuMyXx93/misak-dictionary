/**
 * User Domain Entity
 * Sprint 2 - Auth System
 * Representa un usuario del sistema administrativo
 */

export interface User {
  id: bigint;
  username: string;
  email: string;
  password: string; // bcrypt hash
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * User sin password (para respuestas)
 */
export type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Payload para crear un usuario
 */
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string; // plain text (será hasheado)
  fullName: string;
}

/**
 * Payload para actualizar un usuario
 */
export interface UpdateUserPayload {
  username?: string;
  email?: string;
  fullName?: string;
  isActive?: boolean;
}
