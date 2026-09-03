import { Prisma } from '../generated/prisma/client';

export const COURSE_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CourseSelect;

export type CourseResponse = Prisma.CourseGetPayload<{
  select: typeof COURSE_SELECT;
}>;
