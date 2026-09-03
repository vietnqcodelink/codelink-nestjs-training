import { Prisma } from '../generated/prisma/client';

export const ENROLLMENT_SELECT = {
  id: true,
  studentId: true,
  courseId: true,
  createdAt: true,
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentResponse = Prisma.EnrollmentGetPayload<{
  select: typeof ENROLLMENT_SELECT;
}>;
