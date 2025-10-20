/**
 * Role Domain Entity
 * Sprint 2 - Auth System
 * Representa un rol del sistema (super_admin, content_admin, etc.)
 */

export interface Role {
  id: bigint;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roles predefinidos del sistema
 */
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_ADMIN = 'content_admin',
  MEDIA_ADMIN = 'media_admin',
  CULTURAL_REVIEWER = 'cultural_reviewer',
  ANALYTICS_VIEWER = 'analytics_viewer',
}

/**
 * User con sus roles
 */
export interface UserWithRoles {
  id: bigint;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: Role[];
}
