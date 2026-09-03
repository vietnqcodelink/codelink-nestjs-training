import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CourseResponse } from './course.select';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  const course: CourseResponse = {
    id: '16a64c89-2ae6-460a-bf93-ff2121c59927',
    name: 'Computer Science',
    code: 'CS-101',
    description: 'Foundations',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const createCourse = jest.fn<() => Promise<CourseResponse>>();
  const findManyCourses = jest.fn<() => Promise<CourseResponse[]>>();
  const countCourses = jest.fn<() => Promise<number>>();
  const findCourse = jest.fn<() => Promise<CourseResponse | null>>();
  const updateCourse = jest.fn<() => Promise<CourseResponse>>();
  const deleteCourse = jest.fn<() => Promise<CourseResponse>>();
  const prisma = {
    course: {
      create: createCourse,
      findMany: findManyCourses,
      count: countCourses,
      findUnique: findCourse,
      update: updateCourse,
      delete: deleteCourse,
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;
  const service = new CoursesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes course fields on create', async () => {
    createCourse.mockResolvedValue(course);

    await service.create({
      name: '  Computer Science  ',
      code: ' cs-101 ',
      description: '  Foundations  ',
    });

    expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Computer Science',
          code: 'CS-101',
          description: 'Foundations',
        },
      }),
    );
  });

  it('maps duplicate codes to conflict', async () => {
    createCourse.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.create({ name: course.name, code: course.code }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns paginated courses', async () => {
    findManyCourses.mockResolvedValue([course]);
    countCourses.mockResolvedValue(21);

    await expect(service.findAll({ page: 2, limit: 10 })).resolves.toEqual({
      data: [course],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
  });

  it('returns not found for an unknown course', async () => {
    findCourse.mockResolvedValue(null);

    await expect(service.findOne(course.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects empty updates', async () => {
    await expect(service.update(course.id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(updateCourse).not.toHaveBeenCalled();
  });

  it('maps a missing delete target to not found', async () => {
    deleteCourse.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    );

    await expect(service.remove(course.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
