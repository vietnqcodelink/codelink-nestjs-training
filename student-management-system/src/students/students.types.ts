import type { PaginatedResponse } from '../common/pagination';
import type { StudentResponse } from './student.select';

export type PaginatedStudents = PaginatedResponse<StudentResponse>;
