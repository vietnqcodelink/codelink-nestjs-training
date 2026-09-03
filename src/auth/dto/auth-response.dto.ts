import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token' })
  accessToken!: string;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';

  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;
}
