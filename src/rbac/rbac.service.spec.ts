import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { RoleRecord } from './rbac.select';
import { RbacService } from './rbac.service';

describe('RbacService', () => {
  const roleId = '16a64c89-2ae6-460a-bf93-ff2121c59927';
  const userId = '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f';
  const permissionId = '78d875ff-643f-40cd-b458-8647acf22c3f';
  const role: RoleRecord = {
    id: roleId,
    name: 'COURSE_EDITOR',
    description: null,
    isSystem: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    permissions: [],
    _count: { users: 0 },
  };

  const createRole = jest.fn();
  const findRole = jest.fn();
  const findRoles = jest.fn();
  const updateRole = jest.fn();
  const deleteRole = jest.fn();
  const countPermissions = jest.fn();
  const findPermissions = jest.fn();
  const deleteRolePermissions = jest.fn();
  const createRolePermissions = jest.fn();
  const findUser = jest.fn();
  const deleteUserRoles = jest.fn();
  const createUserRoles = jest.fn();
  const countUserRoles = jest.fn();

  const transactionClient = {
    role: {
      findUnique: findRole,
      findUniqueOrThrow: findRole,
      findMany: findRoles,
    },
    permission: { count: countPermissions },
    rolePermission: {
      deleteMany: deleteRolePermissions,
      createMany: createRolePermissions,
    },
    user: { findUnique: findUser, findUniqueOrThrow: findUser },
    userRole: {
      deleteMany: deleteUserRoles,
      createMany: createUserRoles,
      count: countUserRoles,
    },
  };
  const transaction = jest.fn(
    (callback: (client: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
  );
  const prisma = {
    role: {
      create: createRole,
      findUnique: findRole,
      findMany: findRoles,
      update: updateRole,
      delete: deleteRole,
    },
    permission: { count: countPermissions, findMany: findPermissions },
    $transaction: transaction,
  } as unknown as PrismaService;
  const service = new RbacService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a normalized custom role', async () => {
    createRole.mockResolvedValue(role);

    await expect(
      service.createRole({ name: ' course_editor ', description: ' Editor ' }),
    ).resolves.toMatchObject({ name: 'COURSE_EDITOR' });
    expect(createRole).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'COURSE_EDITOR', description: 'Editor' },
      }),
    );
  });

  it('does not allow system roles to be modified', async () => {
    findRole.mockResolvedValue({ id: roleId, isSystem: true });

    await expect(
      service.updateRole(roleId, { description: 'Changed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not delete a role that is still assigned', async () => {
    findRole.mockResolvedValue({ isSystem: false, _count: { users: 1 } });

    await expect(service.deleteRole(roleId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(deleteRole).not.toHaveBeenCalled();
  });

  it('validates permission IDs before replacing assignments', async () => {
    findRole.mockResolvedValueOnce({ id: roleId, isSystem: false });
    countPermissions.mockResolvedValue(0);

    await expect(
      service.replaceRolePermissions(roleId, {
        permissionIds: [permissionId],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(deleteRolePermissions).not.toHaveBeenCalled();
  });

  it('replaces permissions for a custom role atomically', async () => {
    const roleWithPermission: RoleRecord = {
      ...role,
      permissions: [
        {
          permission: {
            id: permissionId,
            key: 'course:create',
            description: 'Create courses',
          },
        },
      ],
    };
    findRole
      .mockResolvedValueOnce({ id: roleId, isSystem: false })
      .mockResolvedValueOnce(roleWithPermission);
    countPermissions.mockResolvedValue(1);
    deleteRolePermissions.mockResolvedValue({ count: 0 });
    createRolePermissions.mockResolvedValue({ count: 1 });

    await expect(
      service.replaceRolePermissions(roleId, {
        permissionIds: [permissionId],
      }),
    ).resolves.toMatchObject({
      id: roleId,
      permissions: [{ key: 'course:create' }],
    });
    expect(deleteRolePermissions).toHaveBeenCalled();
    expect(createRolePermissions).toHaveBeenCalled();
  });

  it('protects the last administrator from demotion', async () => {
    const adminRoleId = '00000000-0000-4000-8000-000000000002';
    findUser.mockResolvedValue({
      id: userId,
      roles: [{ roleId: adminRoleId }],
    });
    findRoles.mockResolvedValue([{ id: roleId, name: 'USER' }]);
    findRole.mockResolvedValue({ id: adminRoleId });
    countUserRoles.mockResolvedValue(1);

    await expect(
      service.replaceUserRoles(userId, { roleIds: [roleId] }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(deleteUserRoles).not.toHaveBeenCalled();
  });
});
