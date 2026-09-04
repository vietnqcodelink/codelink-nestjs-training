import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { createPaginationMeta } from '../common/pagination';
import { COURSE_SELECT } from '../courses/course.select';
import type { PaginatedCourses } from '../courses/courses.types';
import { Prisma } from '../generated/prisma/client';
import { isPrismaError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { ListEnrollmentsQueryDto } from './dto/list-enrollments-query.dto';
import {
  ENROLLMENT_DETAILS_SELECT,
  ENROLLMENT_SELECT,
  type EnrollmentResponse,
} from './enrollment.select';
import type { PaginatedEnrollments } from './enrollments.types';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto): Promise<EnrollmentResponse> {
    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId: dto.studentId,
          courseId: dto.courseId,
        },
        select: ENROLLMENT_SELECT,
      });

      this.logger.log({
        event: 'enrollment.created',
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
      });
      return enrollment;
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async findAll(query: ListEnrollmentsQueryDto): Promise<PaginatedEnrollments> {
    const { page, limit, studentId, courseId } = query;
    const where: Prisma.EnrollmentWhereInput = {
      ...(studentId ? { studentId } : {}),
      ...(courseId ? { courseId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: ENROLLMENT_DETAILS_SELECT,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findCoursesByStudent(
    studentId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedCourses> {
    const { page, limit } = query;
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        enrollments: {
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { course: { select: COURSE_SELECT } },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const total = student._count.enrollments;
    return {
      data: student.enrollments.map(({ course }) => course),
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.enrollment.delete({ where: { id } });
      this.logger.log({ event: 'enrollment.deleted', enrollmentId: id });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  private handleWriteError(error: unknown): never {
    if (isPrismaError(error, 'P2002')) {
      throw new ConflictException('Student is already enrolled in this course');
    }
    if (isPrismaError(error, 'P2003')) {
      throw new NotFoundException('Student or course not found');
    }
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException('Enrollment not found');
    }

    throw error;
  }
}
