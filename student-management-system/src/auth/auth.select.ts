import { Prisma } from '../generated/prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: { role: { select: { name: true } } },
  },
} satisfies Prisma.UserSelect;

export const LOGIN_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function toAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map(({ role }) => role.name).sort(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
