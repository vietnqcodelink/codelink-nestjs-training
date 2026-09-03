import { Prisma } from '../generated/prisma/client';

export const PERMISSION_SELECT = {
  id: true,
  key: true,
  description: true,
} satisfies Prisma.PermissionSelect;

export const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: { permission: { select: PERMISSION_SELECT } },
  },
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

export type PermissionRecord = Prisma.PermissionGetPayload<{
  select: typeof PERMISSION_SELECT;
}>;

export type RoleRecord = Prisma.RoleGetPayload<{
  select: typeof ROLE_SELECT;
}>;
