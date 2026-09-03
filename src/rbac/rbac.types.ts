import type { PermissionRecord, RoleRecord } from './rbac.select';

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
