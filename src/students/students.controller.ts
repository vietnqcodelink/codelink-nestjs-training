import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PERMISSION } from '../rbac/rbac.constants';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import {
  PaginatedStudentsResponseDto,
  StudentResponseDto,
} from './dto/student-response.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import type { StudentResponse } from './student.select';
import { StudentsService } from './students.service';
import type { PaginatedStudents } from './students.types';

@ApiTags('Students')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiBadRequestResponse({
  description: 'Request validation failed',
  type: ApiErrorResponseDto,
})
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ApiErrorResponseDto,
})
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions(PERMISSION.STUDENT_CREATE)
  @ApiOperation({ summary: 'Create a student' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiConflictResponse({
    description: 'Student email already exists',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'student:create permission required',
    type: ApiErrorResponseDto,
  })
  create(@Body() dto: CreateStudentDto): Promise<StudentResponse> {
    return this.studentsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSION.STUDENT_READ)
  @ApiOperation({
    summary: 'List students',
    description:
      'Supports pagination, case-insensitive search, sorting, and filtering by course enrollment.',
  })
  @ApiOkResponse({ type: PaginatedStudentsResponseDto })
  @ApiForbiddenResponse({
    description: 'student:read permission required',
    type: ApiErrorResponseDto,
  })
  findAll(@Query() query: ListStudentsQueryDto): Promise<PaginatedStudents> {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION.STUDENT_READ)
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({
    description: 'Student not found',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'student:read permission required',
    type: ApiErrorResponseDto,
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<StudentResponse> {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Update a student' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({
    description: 'Student not found',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Student email already exists',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'student:update permission required',
    type: ApiErrorResponseDto,
  })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION.STUDENT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student' })
  @ApiNoContentResponse({ description: 'Student deleted' })
  @ApiNotFoundResponse({
    description: 'Student not found',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'student:delete permission required',
    type: ApiErrorResponseDto,
  })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.studentsService.remove(id);
  }
}
