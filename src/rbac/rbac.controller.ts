import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { SWAGGER_BEARER_AUTH } from '../common/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import {
  PermissionResponseDto,
  RoleResponseDto,
  UserRolesResponseDto,
} from './dto/rbac-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequirePermissions } from './permissions.decorator';
import { PERMISSION } from './rbac.constants';
import { RbacService } from './rbac.service';
import type {
  PermissionResponse,
  RoleResponse,
  UserRolesResponse,
} from './rbac.types';

@ApiTags('RBAC')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiBadRequestResponse({
  description: 'Request validation failed',
  type: ApiErrorResponseDto,
})
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ApiErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'RBAC management permission required',
  type: ApiErrorResponseDto,
})
@RequirePermissions(PERMISSION.RBAC_MANAGE)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiConflictResponse({
    description: 'Role name already exists',
    type: ApiErrorResponseDto,
  })
  createRole(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    return this.rbacService.createRole(dto);
  }

  @Get('roles')
  @ApiOperation({
    summary: 'List roles and their permissions',
    description: 'Returns system and custom roles ordered by role name.',
  })
  @ApiOkResponse({ type: [RoleResponseDto] })
  findRoles(): Promise<RoleResponse[]> {
    return this.rbacService.findRoles();
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update a custom role' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse({
    description: 'Role not found',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Role name already exists',
    type: ApiErrorResponseDto,
  })
  updateRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an unused custom role' })
  @ApiNoContentResponse({ description: 'Role deleted' })
  @ApiNotFoundResponse({
    description: 'Role not found',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Role is assigned to users',
    type: ApiErrorResponseDto,
  })
  deleteRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.rbacService.deleteRole(id);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'List the application permission catalog',
    description: 'Returns code-owned permission keys ordered alphabetically.',
  })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  findPermissions(): Promise<PermissionResponse[]> {
    return this.rbacService.findPermissions();
  }

  @Get('users/:userId/roles')
  @ApiOperation({ summary: 'List roles assigned to a user' })
  @ApiOkResponse({ type: UserRolesResponseDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ApiErrorResponseDto,
  })
  findUserRoles(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<UserRolesResponse> {
    return this.rbacService.findUserRoles(userId);
  }

  @Put('roles/:id/permissions')
  @ApiOperation({
    summary: 'Replace permissions assigned to a custom role',
    description:
      'Atomically replaces the complete permission set; system roles cannot be modified.',
  })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse({
    description: 'Role not found',
    type: ApiErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Unknown permission ID',
    type: ApiErrorResponseDto,
  })
  replaceRolePermissions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ): Promise<RoleResponse> {
    return this.rbacService.replaceRolePermissions(id, dto);
  }

  @Put('users/:userId/roles')
  @ApiOperation({
    summary: 'Replace roles assigned to a user',
    description:
      'Atomically replaces the complete role set while protecting the last administrator.',
  })
  @ApiOkResponse({ type: UserRolesResponseDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ApiErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Unknown role ID',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Last administrator protection',
    type: ApiErrorResponseDto,
  })
  replaceUserRoles(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: ReplaceUserRolesDto,
  ): Promise<UserRolesResponse> {
    return this.rbacService.replaceUserRoles(userId, dto);
  }
}
