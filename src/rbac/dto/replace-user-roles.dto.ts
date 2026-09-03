import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class ReplaceUserRolesDto {
  @ApiProperty({ type: [String], format: 'uuid', minItems: 1, maxItems: 20 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
