import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CourseResponse } from '../courses/course.select';
import { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { EnrollmentResponse } from './enrollment.select';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsService', () => {
  const studentId = '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f';
  const course: CourseResponse = {
    id: '16a64c89-2ae6-460a-bf93-ff2121c59927',
    name: 'Computer Science',
    code: 'CS-101',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const enrollment: EnrollmentResponse = {
    id: '4a42535d-9fd9-4901-bb8f-74ca0cd25a32',
    studentId,
    courseId: course.id,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const createEnrollment = jest.fn<() => Promise<EnrollmentResponse>>();
  const deleteEnrollment = jest.fn<() => Promise<EnrollmentResponse>>();
  const findStudent = jest.fn<
    () => Promise<{
      enrollments: { course: CourseResponse }[];
      _count: { enrollments: number };
    } | null>
  >();
  const prisma = {
    enrollment: { create: createEnrollment, delete: deleteEnrollment },
    student: { findUnique: findStudent },
  } as unknown as PrismaService;
  const service = new EnrollmentsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an enrollment', async () => {
    createEnrollment.mockResolvedValue(enrollment);

    await expect(
      service.create({ studentId, courseId: course.id }),
    ).resolves.toEqual(enrollment);
  });

  it('rejects duplicate enrollments', async () => {
    createEnrollment.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.create({ studentId, courseId: course.id }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all courses of a student with pagination metadata', async () => {
    findStudent.mockResolvedValue({
      enrollments: [{ course }],
      _count: { enrollments: 1 },
    });

    await expect(
      service.findCoursesByStudent(studentId, { page: 1, limit: 20 }),
    ).resolves.toEqual({
      data: [course],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('returns not found for an unknown student', async () => {
    findStudent.mockResolvedValue(null);

    await expect(
      service.findCoursesByStudent(studentId, { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a missing relation to not found', async () => {
    createEnrollment.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key failed', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.create({ studentId, courseId: course.id }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
