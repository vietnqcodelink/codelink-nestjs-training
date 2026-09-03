import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './rbac.constants';

export const PERMISSIONS_KEY = Symbol('rbac:permissions');

export const RequirePermissions = (
  ...permissions: [PermissionKey, ...PermissionKey[]]
) => SetMetadata(PERMISSIONS_KEY, permissions);
