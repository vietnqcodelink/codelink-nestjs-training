import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}
