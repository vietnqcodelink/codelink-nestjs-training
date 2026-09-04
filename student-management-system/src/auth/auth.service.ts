import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { isPrismaError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  LOGIN_USER_SELECT,
  PUBLIC_USER_SELECT,
  type AuthenticatedUser,
  toAuthenticatedUser,
} from './auth.select';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthResponse } from './auth.types';
import { SYSTEM_ROLE } from '../rbac/rbac.constants';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

// Keeps unknown-email and wrong-password attempts on a similar expensive path.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$31hAb7fpAWZ0Kbl8YcpZ/Q$V00QQxl+emq1I27/QmHiUpMgJyzgsCAr5KvUwonM2fo';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          roles: {
            create: { role: { connect: { name: SYSTEM_ROLE.USER } } },
          },
        },
        select: PUBLIC_USER_SELECT,
      });

      return this.createAuthResponse(toAuthenticatedUser(user));
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      if (isPrismaError(error, 'P2025')) {
        throw new InternalServerErrorException(
          'Default authorization role is not initialized',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: LOGIN_USER_SELECT,
    });
    const passwordMatches = await argon2.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      dto.password,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.createAuthResponse(toAuthenticatedUser(user));
  }

  private async createAuthResponse(
    user: AuthenticatedUser,
  ): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id });

    return {
      accessToken,
      tokenType: 'Bearer',
      user,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
