import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @ApiProperty({ type: [String], format: 'uuid', maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
