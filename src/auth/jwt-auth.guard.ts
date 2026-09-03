import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { isAccessTokenPayload } from './access-token.payload';
import type { AuthenticatedRequest } from './authenticated-request';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        algorithms: ['HS256'],
      });

      if (!isAccessTokenPayload(payload)) {
        throw new UnauthorizedException();
      }

      request.user = { id: payload.sub };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    return /^Bearer ([^\s]+)$/i.exec(authorization)?.[1];
  }
}
