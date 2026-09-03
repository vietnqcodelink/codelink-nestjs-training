import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { AuthService } from './auth.service';
import type { AuthResponse } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';

@Public()
@ApiTags('Authentication')
@UseGuards(ThrottlerGuard)
@ApiBadRequestResponse({
  description: 'Request validation failed',
  type: ApiErrorResponseDto,
})
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiCreatedResponse({
    description: 'Account created and authenticated',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already registered',
    type: ApiErrorResponseDto,
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Credentials authenticated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: ApiErrorResponseDto,
  })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
}
