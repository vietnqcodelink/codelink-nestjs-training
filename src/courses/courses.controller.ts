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
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PERMISSION } from '../rbac/rbac.constants';
import type { CourseResponse } from './course.select';
import { CoursesService } from './courses.service';
import type { PaginatedCourses } from './courses.types';
import {
  CourseResponseDto,
  PaginatedCoursesResponseDto,
} from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('Courses')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @RequirePermissions(PERMISSION.COURSE_CREATE)
  @ApiOperation({ summary: 'Create a course' })
  @ApiCreatedResponse({ type: CourseResponseDto })
  @ApiConflictResponse({ description: 'Course code already exists' })
  @ApiForbiddenResponse({ description: 'course:create permission required' })
  create(@Body() dto: CreateCourseDto): Promise<CourseResponse> {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  @ApiOkResponse({ type: PaginatedCoursesResponseDto })
  findAll(@Query() query: ListCoursesQueryDto): Promise<PaginatedCourses> {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiNotFoundResponse({ description: 'Course not found' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CourseResponse> {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION.COURSE_UPDATE)
  @ApiOperation({ summary: 'Update a course' })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiConflictResponse({ description: 'Course code already exists' })
  @ApiForbiddenResponse({ description: 'course:update permission required' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponse> {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION.COURSE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiNoContentResponse({ description: 'Course deleted' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'course:delete permission required' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.coursesService.remove(id);
  }
}
