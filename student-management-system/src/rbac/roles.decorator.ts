import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = Symbol('rbac:roles');

export const Roles = (...roles: [string, ...string[]]) =>
  SetMetadata(ROLES_KEY, roles);
