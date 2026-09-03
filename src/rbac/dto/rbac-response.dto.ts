import { ApiProperty } from '@nestjs/swagger';

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
