import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SortOrder } from '../../common/dto/sort-order';

export enum StudentSortField {
  NAME = 'name',
  EMAIL = 'email',
  DATE_OF_BIRTH = 'dateOfBirth',
  CREATED_AT = 'createdAt',
}

export class ListStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive match against student name or email',
    maxLength: 200,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    description: 'Return only students enrolled in this course',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  courseId?: string;

  @ApiPropertyOptional({
    enum: StudentSortField,
    default: StudentSortField.CREATED_AT,
  })
  @IsEnum(StudentSortField)
  sortBy: StudentSortField = StudentSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
