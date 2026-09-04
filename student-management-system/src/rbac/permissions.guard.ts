import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { PermissionKey } from './rbac.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndMerge<
      readonly PermissionKey[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    const grantedCount = await this.prisma.permission.count({
      where: {
        key: { in: [...requiredPermissions] },
        roles: {
          some: { role: { users: { some: { userId: request.user.id } } } },
        },
      },
    });

    if (grantedCount !== new Set(requiredPermissions).size) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
