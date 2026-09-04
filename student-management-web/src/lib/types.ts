export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: AuthenticatedUser;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  createdAt: string;
}

export interface EnrollmentDetails extends Enrollment {
  student: Student;
  course: Course;
}

export interface Permission {
  id: string;
  key: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRoles {
  userId: string;
  roles: Role[];
}

export interface RbacUser {
  id: string;
  email: string;
  createdAt: string;
  roles: Pick<Role, "id" | "name">[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
}
