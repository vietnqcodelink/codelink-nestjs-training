import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SortOrder } from '../common/dto/sort-order';
import { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CourseResponse } from './course.select';
import { CoursesService } from './courses.service';
import { CourseSortField } from './dto/list-courses-query.dto';

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
    expect(findManyCourses).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(countCourses).toHaveBeenCalledWith({ where: {} });
  });

  it('searches courses and applies a validated sort', async () => {
    findManyCourses.mockResolvedValue([course]);
    countCourses.mockResolvedValue(1);

    await service.findAll({
      page: 1,
      limit: 20,
      search: 'CS',
      sortBy: CourseSortField.CODE,
      sortOrder: SortOrder.ASC,
    });

    expect(findManyCourses).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'CS', mode: 'insensitive' } },
            { code: { contains: 'CS', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ code: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('returns a course by ID', async () => {
    findCourse.mockResolvedValue(course);

    await expect(service.findOne(course.id)).resolves.toEqual(course);
    expect(findCourse).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: course.id } }),
    );
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

  it('normalizes the fields provided when updating a course', async () => {
    const updatedCourse = {
      ...course,
      name: 'Advanced Computer Science',
      code: 'CS-201',
      description: null,
    };
    updateCourse.mockResolvedValue(updatedCourse);

    await expect(
      service.update(course.id, {
        name: '  Advanced Computer Science  ',
        code: ' cs-201 ',
        description: '   ',
      }),
    ).resolves.toEqual(updatedCourse);

    expect(updateCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: course.id },
        data: {
          name: 'Advanced Computer Science',
          code: 'CS-201',
          description: null,
        },
      }),
    );
  });

  it('maps a missing update target to not found', async () => {
    updateCourse.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.update(course.id, { name: 'Updated course' }),
    ).rejects.toBeInstanceOf(NotFoundException);
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

  it('deletes a course by ID', async () => {
    deleteCourse.mockResolvedValue(course);

    await expect(service.remove(course.id)).resolves.toBeUndefined();
    expect(deleteCourse).toHaveBeenCalledWith({ where: { id: course.id } });
  });
});
