import type { PaginatedResponse } from '../common/pagination';
import type { CourseResponse } from './course.select';

export type PaginatedCourses = PaginatedResponse<CourseResponse>;
