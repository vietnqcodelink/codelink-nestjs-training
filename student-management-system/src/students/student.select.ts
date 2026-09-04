import { Prisma } from '../generated/prisma/client';

export const STUDENT_SELECT = {
  id: true,
  name: true,
  email: true,
  dateOfBirth: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StudentSelect;

export type StudentResponse = Prisma.StudentGetPayload<{
  select: typeof STUDENT_SELECT;
}>;
