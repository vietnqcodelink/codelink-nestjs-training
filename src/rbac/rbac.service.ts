import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { isPrismaError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import type { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import { SYSTEM_ROLE } from './rbac.constants';
import { PERMISSION_SELECT, ROLE_SELECT } from './rbac.select';
import {
  type PermissionResponse,
  type RoleResponse,
  type UserRolesResponse,
  toRoleResponse,
} from './rbac.types';

const ROLE_NOT_FOUND_MESSAGE = 'Role not found';
const USER_NOT_FOUND_MESSAGE = 'User not found';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto): Promise<RoleResponse> {
    try {
      const role = await this.prisma.role.create({
        data: {
          name: this.normalizeRoleName(dto.name),
          description: this.normalizeDescription(dto.description),
        },
        select: ROLE_SELECT,
      });

      return toRoleResponse(role);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async findRoles(): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: ROLE_SELECT,
    });
    return roles.map(toRoleResponse);
  }

  findPermissions(): Promise<PermissionResponse[]> {
    return this.prisma.permission.findMany({
      orderBy: { key: 'asc' },
      select: PERMISSION_SELECT,
    });
  }

  async findUserRoles(userId: string): Promise<UserRolesResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: { select: { role: { select: ROLE_SELECT } } },
      },
    });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }

    return {
      userId: user.id,
      roles: user.roles
        .map(({ role }) => toRoleResponse(role))
        .sort((left, right) => left.name.localeCompare(right.name)),
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
    const existingRole = await this.getMutableRole(id);
    const data: Prisma.RoleUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = this.normalizeRoleName(dto.name);
    }
    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      const role = await this.prisma.role.update({
        where: { id: existingRole.id },
        data,
        select: ROLE_SELECT,
      });
      return toRoleResponse(role);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A role with this name already exists');
      }
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException(ROLE_NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { isSystem: true, _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException(ROLE_NOT_FOUND_MESSAGE);
    }
    this.assertMutableRole(role.isSystem);
    if (role._count.users > 0) {
      throw new ConflictException('Unassign this role from all users first');
    }

    try {
      await this.prisma.role.delete({ where: { id } });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException(ROLE_NOT_FOUND_MESSAGE);
      }
      if (isPrismaError(error, 'P2003')) {
        throw new ConflictException('Unassign this role from all users first');
      }
      throw error;
    }
  }

  async replaceRolePermissions(
    roleId: string,
    dto: ReplaceRolePermissionsDto,
  ): Promise<RoleResponse> {
    const role = await this.getMutableRole(roleId);

    const updatedRole = await this.prisma.$transaction(async (transaction) => {
      const permissionCount = await transaction.permission.count({
        where: { id: { in: dto.permissionIds } },
      });
      if (permissionCount !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permissions do not exist');
      }

      await transaction.rolePermission.deleteMany({ where: { roleId } });
      if (dto.permissionIds.length > 0) {
        await transaction.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }

      return transaction.role.findUniqueOrThrow({
        where: { id: role.id },
        select: ROLE_SELECT,
      });
    });

    return toRoleResponse(updatedRole);
  }

  async replaceUserRoles(
    userId: string,
    dto: ReplaceUserRolesDto,
  ): Promise<UserRolesResponse> {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const user = await transaction.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              roles: { select: { roleId: true } },
            },
          });
          if (!user) {
            throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
          }

          const roles = await transaction.role.findMany({
            where: { id: { in: dto.roleIds } },
            select: { id: true, name: true },
          });
          if (roles.length !== dto.roleIds.length) {
            throw new BadRequestException('One or more roles do not exist');
          }

          await this.preventLastAdminRemoval(
            transaction,
            user.roles.map(({ roleId }) => roleId),
            roles,
          );

          await transaction.userRole.deleteMany({ where: { userId } });
          await transaction.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({ userId, roleId })),
          });

          const updatedUser = await transaction.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
              id: true,
              roles: { select: { role: { select: ROLE_SELECT } } },
            },
          });

          return {
            userId: updatedUser.id,
            roles: updatedUser.roles
              .map(({ role }) => toRoleResponse(role))
              .sort((left, right) => left.name.localeCompare(right.name)),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2034')) {
        throw new ConflictException(
          'Role assignments changed concurrently; retry the request',
        );
      }
      throw error;
    }
  }

  private async getMutableRole(id: string): Promise<{ id: string }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, isSystem: true },
    });
    if (!role) {
      throw new NotFoundException(ROLE_NOT_FOUND_MESSAGE);
    }
    this.assertMutableRole(role.isSystem);
    return role;
  }

  private assertMutableRole(isSystem: boolean): void {
    if (isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }
  }

  private async preventLastAdminRemoval(
    transaction: Prisma.TransactionClient,
    currentRoleIds: string[],
    nextRoles: { id: string; name: string }[],
  ): Promise<void> {
    const adminRole = await transaction.role.findUnique({
      where: { name: SYSTEM_ROLE.ADMIN },
      select: { id: true },
    });
    if (!adminRole) {
      throw new ConflictException('System ADMIN role is not initialized');
    }

    const removesAdmin =
      currentRoleIds.includes(adminRole.id) &&
      !nextRoles.some(({ id }) => id === adminRole.id);
    if (!removesAdmin) {
      return;
    }

    const adminCount = await transaction.userRole.count({
      where: { roleId: adminRole.id },
    });
    if (adminCount <= 1) {
      throw new ConflictException('The last administrator cannot be demoted');
    }
  }

  private normalizeRoleName(name: string): string {
    return name.trim().toUpperCase();
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
}
