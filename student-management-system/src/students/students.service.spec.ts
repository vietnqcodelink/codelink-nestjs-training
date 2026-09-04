import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SortOrder } from '../common/dto/sort-order';
import { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { StudentSortField } from './dto/list-students-query.dto';
import type { StudentResponse } from './student.select';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  const student: StudentResponse = {
    id: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    name: 'Jane Doe',
    email: 'jane@example.com',
    dateOfBirth: new Date('2000-01-15T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const createStudent = jest.fn<() => Promise<StudentResponse>>();
  const findManyStudents = jest.fn<() => Promise<StudentResponse[]>>();
  const countStudents = jest.fn<() => Promise<number>>();
  const findStudent = jest.fn<() => Promise<StudentResponse | null>>();
  const updateStudent = jest.fn<() => Promise<StudentResponse>>();
  const deleteStudent = jest.fn<() => Promise<StudentResponse>>();
  const transaction = jest.fn((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  const prisma = {
    student: {
      create: createStudent,
      findMany: findManyStudents,
      count: countStudents,
      findUnique: findStudent,
      update: updateStudent,
      delete: deleteStudent,
    },
    $transaction: transaction,
  } as unknown as PrismaService;
  const service = new StudentsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a student with normalized values', async () => {
    createStudent.mockResolvedValue(student);

    await expect(
      service.create({
        name: '  Jane Doe  ',
        email: '  JANE@Example.com ',
        dateOfBirth: '2000-01-15',
      }),
    ).resolves.toEqual(student);

    expect(createStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          dateOfBirth: new Date('2000-01-15T00:00:00.000Z'),
        },
      }),
    );
  });

  it('rejects duplicate student emails', async () => {
    createStudent.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.create({
        name: student.name,
        email: student.email,
        dateOfBirth: '2000-01-15',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a deterministically ordered paginated list', async () => {
    findManyStudents.mockResolvedValue([student]);
    countStudents.mockResolvedValue(21);

    await expect(service.findAll({ page: 2, limit: 10 })).resolves.toEqual({
      data: [student],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(findManyStudents).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: {},
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(countStudents).toHaveBeenCalledWith({ where: {} });
  });

  it('searches students and applies a validated sort', async () => {
    findManyStudents.mockResolvedValue([student]);
    countStudents.mockResolvedValue(1);

    await service.findAll({
      page: 1,
      limit: 20,
      search: 'Jane',
      sortBy: StudentSortField.NAME,
      sortOrder: SortOrder.ASC,
    });

    expect(findManyStudents).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'Jane', mode: 'insensitive' } },
            { email: { contains: 'Jane', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('filters data and pagination total by course enrollment', async () => {
    const courseId = '16a64c89-2ae6-460a-bf93-ff2121c59927';
    const where = { enrollments: { some: { courseId } } };
    findManyStudents.mockResolvedValue([student]);
    countStudents.mockResolvedValue(1);

    await expect(
      service.findAll({ page: 1, limit: 20, courseId }),
    ).resolves.toEqual({
      data: [student],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(findManyStudents).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(countStudents).toHaveBeenCalledWith({ where });
  });

  it('returns a student by ID', async () => {
    findStudent.mockResolvedValue(student);

    await expect(service.findOne(student.id)).resolves.toEqual(student);
    expect(findStudent).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: student.id } }),
    );
  });

  it('returns not found for an unknown student', async () => {
    findStudent.mockResolvedValue(null);

    await expect(service.findOne(student.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('normalizes the fields provided when updating a student', async () => {
    const updatedStudent = {
      ...student,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      dateOfBirth: new Date('2001-02-20T00:00:00.000Z'),
    };
    updateStudent.mockResolvedValue(updatedStudent);

    await expect(
      service.update(student.id, {
        name: '  Jane Smith  ',
        email: '  JANE.SMITH@Example.com ',
        dateOfBirth: '2001-02-20',
      }),
    ).resolves.toEqual(updatedStudent);

    expect(updateStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: student.id },
        data: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          dateOfBirth: new Date('2001-02-20T00:00:00.000Z'),
        },
      }),
    );
  });

  it('maps a duplicate email during update to conflict', async () => {
    updateStudent.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.update(student.id, { email: 'existing@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an empty update and a future date of birth', async () => {
    await expect(service.update(student.id, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.update(student.id, { dateOfBirth: '2999-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateStudent).not.toHaveBeenCalled();
  });

  it('maps a missing delete target to not found', async () => {
    deleteStudent.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    );

    await expect(service.remove(student.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes a student by ID', async () => {
    deleteStudent.mockResolvedValue(student);

    await expect(service.remove(student.id)).resolves.toBeUndefined();
    expect(deleteStudent).toHaveBeenCalledWith({ where: { id: student.id } });
  });
});
