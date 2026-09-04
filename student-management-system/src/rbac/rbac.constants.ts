export const SYSTEM_ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const PERMISSION = {
  COURSE_CREATE: 'course:create',
  COURSE_UPDATE: 'course:update',
  COURSE_DELETE: 'course:delete',
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  ENROLLMENT_CREATE: 'enrollment:create',
  ENROLLMENT_READ: 'enrollment:read',
  ENROLLMENT_DELETE: 'enrollment:delete',
  RBAC_MANAGE: 'rbac:manage',
} as const;

export type PermissionKey = (typeof PERMISSION)[keyof typeof PERMISSION];
