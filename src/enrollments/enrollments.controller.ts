import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { PaginatedCourses } from '../courses/courses.types';
import { PaginatedCoursesResponseDto } from '../courses/dto/course-response.dto';
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PERMISSION } from '../rbac/rbac.constants';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import type { EnrollmentResponse } from './enrollment.select';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiBadRequestResponse({
  description: 'Request validation failed',
  type: ApiErrorResponseDto,
})
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ApiErrorResponseDto,
})
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('enrollments')
  @RequirePermissions(PERMISSION.ENROLLMENT_CREATE)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  @ApiConflictResponse({
    description: 'Student is already enrolled',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Student or course not found',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'enrollment:create permission required',
    type: ApiErrorResponseDto,
  })
  create(@Body() dto: CreateEnrollmentDto): Promise<EnrollmentResponse> {
    return this.enrollmentsService.create(dto);
  }

  @Get('students/:studentId/courses')
  @RequirePermissions(PERMISSION.ENROLLMENT_READ)
  @ApiOperation({
    summary: 'List all courses of a student',
    description: 'Returns a deterministically ordered paginated course list.',
  })
  @ApiOkResponse({ type: PaginatedCoursesResponseDto })
  @ApiNotFoundResponse({
    description: 'Student not found',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'enrollment:read permission required',
    type: ApiErrorResponseDto,
  })
  findCoursesByStudent(
    @Param('studentId', new ParseUUIDPipe({ version: '4' }))
    studentId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedCourses> {
    return this.enrollmentsService.findCoursesByStudent(studentId, query);
  }

  @Delete('enrollments/:id')
  @RequirePermissions(PERMISSION.ENROLLMENT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an enrollment' })
  @ApiNoContentResponse({ description: 'Enrollment removed' })
  @ApiNotFoundResponse({
    description: 'Enrollment not found',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'enrollment:delete permission required',
    type: ApiErrorResponseDto,
  })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.enrollmentsService.remove(id);
  }
}
