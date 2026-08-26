import { registerAs } from '@nestjs/config';

export type NodeEnvironment = 'development' | 'test' | 'production';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV as NodeEnvironment,
  host: process.env.HOST as string,
  port: Number(process.env.PORT),
}));
