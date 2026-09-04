import type { PaginatedResponse } from '../common/pagination';
import type {
  PermissionRecord,
  RbacUserRecord,
  RoleRecord,
} from './rbac.select';

export type PermissionResponse = PermissionRecord;

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: PermissionResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRolesResponse {
  userId: string;
  roles: RoleResponse[];
}

export interface RbacUserResponse {
  id: string;
  email: string;
  createdAt: Date;
  roles: { id: string; name: string }[];
}

export type PaginatedRbacUsers = PaginatedResponse<RbacUserResponse>;

export function toRoleResponse(role: RoleRecord): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    userCount: role._count.users,
    permissions: role.permissions
      .map(({ permission }) => permission)
      .sort((left, right) => left.key.localeCompare(right.key)),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export function toRbacUserResponse(user: RbacUserRecord): RbacUserResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    roles: user.roles
      .map(({ role }) => role)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
