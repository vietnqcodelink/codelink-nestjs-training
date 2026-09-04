import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-response.dto';
import { CourseResponseDto } from '../../courses/dto/course-response.dto';
import { StudentResponseDto } from '../../students/dto/student-response.dto';

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

export class EnrollmentDetailsResponseDto extends EnrollmentResponseDto {
  @ApiProperty({ type: StudentResponseDto })
  student!: StudentResponseDto;

  @ApiProperty({ type: CourseResponseDto })
  course!: CourseResponseDto;
}

export class PaginatedEnrollmentsResponseDto {
  @ApiProperty({ type: [EnrollmentDetailsResponseDto] })
  data!: EnrollmentDetailsResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
