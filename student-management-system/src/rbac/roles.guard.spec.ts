import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const userId = '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f';
  const getAllAndOverride = jest.fn();
  const findRole = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const prisma = {
    role: { findFirst: findRole },
  } as unknown as PrismaService;
  const guard = new RolesGuard(reflector, prisma);
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { id: userId } }) }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes without role metadata without querying the database', async () => {
    getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findRole).not.toHaveBeenCalled();
  });

  it('allows a user with any required role', async () => {
    getAllAndOverride.mockReturnValue(['ADMIN', 'SUPPORT']);
    findRole.mockResolvedValue({ id: '16a64c89-2ae6-460a-bf93-ff2121c59927' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findRole).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: { in: ['ADMIN', 'SUPPORT'] } }),
      }),
    );
  });

  it('returns forbidden when no required role is assigned', async () => {
    getAllAndOverride.mockReturnValue(['ADMIN']);
    findRole.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
