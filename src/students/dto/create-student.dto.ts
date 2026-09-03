import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: 'jane@example.com',
    format: 'email',
    maxLength: 320,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: '2000-01-15', format: 'date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must use the YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  dateOfBirth!: string;
}
