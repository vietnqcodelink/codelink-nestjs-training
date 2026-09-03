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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PERMISSION } from '../rbac/rbac.constants';
import { CreateStudentDto } from './dto/create-student.dto';
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
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions(PERMISSION.STUDENT_CREATE)
  @ApiOperation({ summary: 'Create a student' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiConflictResponse({ description: 'Student email already exists' })
  @ApiForbiddenResponse({ description: 'student:create permission required' })
  create(@Body() dto: CreateStudentDto): Promise<StudentResponse> {
    return this.studentsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSION.STUDENT_READ)
  @ApiOperation({ summary: 'List students' })
  @ApiOkResponse({ type: PaginatedStudentsResponseDto })
  @ApiForbiddenResponse({ description: 'student:read permission required' })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedStudents> {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION.STUDENT_READ)
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Student not found' })
  @ApiForbiddenResponse({ description: 'student:read permission required' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<StudentResponse> {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Update a student' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Student not found' })
  @ApiConflictResponse({ description: 'Student email already exists' })
  @ApiForbiddenResponse({ description: 'student:update permission required' })
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
  @ApiNotFoundResponse({ description: 'Student not found' })
  @ApiForbiddenResponse({ description: 'student:delete permission required' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.studentsService.remove(id);
  }
}
