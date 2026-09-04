import { Prisma } from '../generated/prisma/client';
import { COURSE_SELECT } from '../courses/course.select';
import { STUDENT_SELECT } from '../students/student.select';

export const ENROLLMENT_SELECT = {
  id: true,
  studentId: true,
  courseId: true,
  createdAt: true,
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentResponse = Prisma.EnrollmentGetPayload<{
  select: typeof ENROLLMENT_SELECT;
}>;

export const ENROLLMENT_DETAILS_SELECT = {
  ...ENROLLMENT_SELECT,
  student: { select: STUDENT_SELECT },
  course: { select: COURSE_SELECT },
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentDetailsResponse = Prisma.EnrollmentGetPayload<{
  select: typeof ENROLLMENT_DETAILS_SELECT;
}>;
