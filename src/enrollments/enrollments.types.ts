import type { PaginatedResponse } from '../common/pagination';
import type { EnrollmentDetailsResponse } from './enrollment.select';

export type PaginatedEnrollments = PaginatedResponse<EnrollmentDetailsResponse>;
