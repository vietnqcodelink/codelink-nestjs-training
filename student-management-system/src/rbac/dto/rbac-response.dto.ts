import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-response.dto';

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'course:create' })
  key!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;
}

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'COURSE_EDITOR' })
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty()
  userCount!: number;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions!: PermissionResponseDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class UserRolesResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ type: [RoleResponseDto] })
  roles!: RoleResponseDto[];
}

export class RbacUserRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ADMIN' })
  name!: string;
}

export class RbacUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: [RbacUserRoleResponseDto] })
  roles!: RbacUserRoleResponseDto[];
}

export class PaginatedRbacUsersResponseDto {
  @ApiProperty({ type: [RbacUserResponseDto] })
  data!: RbacUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
