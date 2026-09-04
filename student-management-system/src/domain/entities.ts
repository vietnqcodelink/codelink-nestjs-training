import type {
  Course,
  Enrollment,
  Permission,
  Role,
  RolePermission,
  Student,
  User,
  UserRole,
} from '../generated/prisma/client';

/** Internal entity; never expose passwordHash through an API response. */
export type UserEntity = Readonly<User>;

export type StudentEntity = Readonly<Student>;

export type CourseEntity = Readonly<Course>;

export type EnrollmentEntity = Readonly<Enrollment>;

export type RoleEntity = Readonly<Role>;

export type PermissionEntity = Readonly<Permission>;

export type UserRoleEntity = Readonly<UserRole>;

export type RolePermissionEntity = Readonly<RolePermission>;
