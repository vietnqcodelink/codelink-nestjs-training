import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { createPaginationMeta } from '../common/pagination';
import { Prisma } from '../generated/prisma/client';
import { isPrismaError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStudentDto } from './dto/create-student.dto';
import type { UpdateStudentDto } from './dto/update-student.dto';
import { STUDENT_SELECT, type StudentResponse } from './student.select';
import type { PaginatedStudents } from './students.types';

const STUDENT_NOT_FOUND_MESSAGE = 'Student not found';
const STUDENT_EMAIL_CONFLICT_MESSAGE =
  'A student with this email already exists';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto): Promise<StudentResponse> {
    try {
      return await this.prisma.student.create({
        data: {
          name: dto.name.trim(),
          email: this.normalizeEmail(dto.email),
          dateOfBirth: this.parseDateOfBirth(dto.dateOfBirth),
        },
        select: STUDENT_SELECT,
      });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedStudents> {
    const { page, limit } = query;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: STUDENT_SELECT,
      }),
      this.prisma.student.count(),
    ]);

    return {
      data,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<StudentResponse> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: STUDENT_SELECT,
    });

    if (!student) {
      throw new NotFoundException(STUDENT_NOT_FOUND_MESSAGE);
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<StudentResponse> {
    const data: Prisma.StudentUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.email !== undefined) {
      data.email = this.normalizeEmail(dto.email);
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = this.parseDateOfBirth(dto.dateOfBirth);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      return await this.prisma.student.update({
        where: { id },
        data,
        select: STUDENT_SELECT,
      });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.student.delete({ where: { id } });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private parseDateOfBirth(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );

    if (date.getTime() > todayUtc) {
      throw new BadRequestException('dateOfBirth cannot be in the future');
    }

    return date;
  }

  private handleWriteError(error: unknown): never {
    if (isPrismaError(error, 'P2002')) {
      throw new ConflictException(STUDENT_EMAIL_CONFLICT_MESSAGE);
    }
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException(STUDENT_NOT_FOUND_MESSAGE);
    }

    throw error;
  }
}
