import { Prisma } from '../generated/prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const LOGIN_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;
