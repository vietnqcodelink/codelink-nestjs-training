import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
  poolMax: Number(process.env.DATABASE_POOL_MAX),
  connectionTimeoutMs: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS),
}));
