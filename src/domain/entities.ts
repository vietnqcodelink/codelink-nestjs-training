import type {
  Course,
  Enrollment,
  Student,
  User,
} from '../generated/prisma/client';

/** Internal entity; never expose passwordHash through an API response. */
export type UserEntity = Readonly<User>;

export type StudentEntity = Readonly<Student>;

export type CourseEntity = Readonly<Course>;

export type EnrollmentEntity = Readonly<Enrollment>;
