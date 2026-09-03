import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  courseId!: string;
}
