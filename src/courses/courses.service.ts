import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SortOrder } from '../common/dto/sort-order';
import { createPaginationMeta } from '../common/pagination';
import { Prisma } from '../generated/prisma/client';
import { isPrismaError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { COURSE_SELECT, type CourseResponse } from './course.select';
import type { PaginatedCourses } from './courses.types';
import type { CreateCourseDto } from './dto/create-course.dto';
import {
  CourseSortField,
  type ListCoursesQueryDto,
} from './dto/list-courses-query.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';

const COURSE_NOT_FOUND_MESSAGE = 'Course not found';
const COURSE_CODE_CONFLICT_MESSAGE = 'A course with this code already exists';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto): Promise<CourseResponse> {
    try {
      return await this.prisma.course.create({
        data: {
          name: dto.name.trim(),
          code: this.normalizeCode(dto.code),
          description: this.normalizeDescription(dto.description),
        },
        select: COURSE_SELECT,
      });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async findAll(query: ListCoursesQueryDto): Promise<PaginatedCourses> {
    const { page, limit, search } = query;
    const sortBy = query.sortBy ?? CourseSortField.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    const where: Prisma.CourseWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
        select: COURSE_SELECT,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<CourseResponse> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: COURSE_SELECT,
    });

    if (!course) {
      throw new NotFoundException(COURSE_NOT_FOUND_MESSAGE);
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseResponse> {
    const data: Prisma.CourseUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.code !== undefined) {
      data.code = this.normalizeCode(dto.code);
    }
    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      return await this.prisma.course.update({
        where: { id },
        data,
        select: COURSE_SELECT,
      });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.course.delete({ where: { id } });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private normalizeDescription(
    value: string | null | undefined,
  ): string | null {
    if (value == null) {
      return null;
    }

    const description = value.trim();
    return description.length > 0 ? description : null;
  }

  private handleWriteError(error: unknown): never {
    if (isPrismaError(error, 'P2002')) {
      throw new ConflictException(COURSE_CODE_CONFLICT_MESSAGE);
    }
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException(COURSE_NOT_FOUND_MESSAGE);
    }

    throw error;
  }
}
