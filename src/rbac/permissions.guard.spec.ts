import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSION } from './rbac.constants';

describe('PermissionsGuard', () => {
  const userId = '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f';
  const getAllAndMerge = jest.fn();
  const countPermissions = jest.fn();
  const reflector = { getAllAndMerge } as unknown as Reflector;
  const prisma = {
    permission: { count: countPermissions },
  } as unknown as PrismaService;
  const guard = new PermissionsGuard(reflector, prisma);
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { id: userId } }) }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes without permission metadata without a database query', async () => {
    getAllAndMerge.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(countPermissions).not.toHaveBeenCalled();
  });

  it('requires every declared permission', async () => {
    getAllAndMerge.mockReturnValue([
      PERMISSION.COURSE_CREATE,
      PERMISSION.COURSE_UPDATE,
    ]);
    countPermissions.mockResolvedValue(2);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('returns forbidden when any declared permission is missing', async () => {
    getAllAndMerge.mockReturnValue([
      PERMISSION.COURSE_CREATE,
      PERMISSION.COURSE_UPDATE,
    ]);
    countPermissions.mockResolvedValue(1);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
