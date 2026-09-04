import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET as string,
  accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS),
}));
