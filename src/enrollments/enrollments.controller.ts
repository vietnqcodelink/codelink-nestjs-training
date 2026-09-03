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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { PaginatedCourses } from '../courses/courses.types';
import { PaginatedCoursesResponseDto } from '../courses/dto/course-response.dto';
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import type { EnrollmentResponse } from './enrollment.select';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('enrollments')
  @ApiOperation({ summary: 'Enroll a student in a course' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  @ApiConflictResponse({ description: 'Student is already enrolled' })
  @ApiNotFoundResponse({ description: 'Student or course not found' })
  create(@Body() dto: CreateEnrollmentDto): Promise<EnrollmentResponse> {
    return this.enrollmentsService.create(dto);
  }

  @Get('students/:studentId/courses')
  @ApiOperation({ summary: 'List all courses of a student' })
  @ApiOkResponse({ type: PaginatedCoursesResponseDto })
  @ApiNotFoundResponse({ description: 'Student not found' })
  findCoursesByStudent(
    @Param('studentId', new ParseUUIDPipe({ version: '4' }))
    studentId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedCourses> {
    return this.enrollmentsService.findCoursesByStudent(studentId, query);
  }

  @Delete('enrollments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an enrollment' })
  @ApiNoContentResponse({ description: 'Enrollment removed' })
  @ApiNotFoundResponse({ description: 'Enrollment not found' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.enrollmentsService.remove(id);
  }
}
