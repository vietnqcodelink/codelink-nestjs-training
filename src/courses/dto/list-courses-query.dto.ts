import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SortOrder } from '../../common/dto/sort-order';

export enum CourseSortField {
  NAME = 'name',
  CODE = 'code',
  CREATED_AT = 'createdAt',
}

export class ListCoursesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive match against course name or code',
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
    enum: CourseSortField,
    default: CourseSortField.CREATED_AT,
  })
  @IsEnum(CourseSortField)
  sortBy: CourseSortField = CourseSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
