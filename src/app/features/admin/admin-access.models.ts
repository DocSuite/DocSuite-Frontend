import { Role, User } from '../../core/auth/auth.models';

export interface RolePermission {
  view_id: number;
  code: string;
  name: string;
  route: string;
  group?: string | null;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface RolePayload {
  name: string;
  description?: string | null;
}

export interface UserAccessPayload {
  email?: string;
  full_name?: string;
  dni?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserCreatePayload {
  email: string;
  full_name: string;
  dni: string;
  role_id: number;
}

export type AdminRole = Role;
export type AdminUser = User;
