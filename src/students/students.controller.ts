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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
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
  @ApiOperation({ summary: 'Create a student' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiConflictResponse({ description: 'Student email already exists' })
  create(@Body() dto: CreateStudentDto): Promise<StudentResponse> {
    return this.studentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List students' })
  @ApiOkResponse({ type: PaginatedStudentsResponseDto })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedStudents> {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Student not found' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<StudentResponse> {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiNotFoundResponse({ description: 'Student not found' })
  @ApiConflictResponse({ description: 'Student email already exists' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student' })
  @ApiNoContentResponse({ description: 'Student deleted' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.studentsService.remove(id);
  }
}
