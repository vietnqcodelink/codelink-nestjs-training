import { registerAs } from '@nestjs/config';
import type { NodeEnvironment } from './app.config';

export const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const DEFAULT_LOG_LEVEL: Record<NodeEnvironment, LogLevel> = {
  development: 'debug',
  test: 'silent',
  production: 'info',
};

export const loggerConfig = registerAs('logger', () => {
  const nodeEnv = process.env.NODE_ENV as NodeEnvironment;

  return {
    level:
      (process.env.LOG_LEVEL as LogLevel | undefined) ??
      DEFAULT_LOG_LEVEL[nodeEnv],
    pretty: nodeEnv === 'development',
  };
});
