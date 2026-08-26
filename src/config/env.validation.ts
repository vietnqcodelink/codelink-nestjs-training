import Joi from 'joi';
import { LOG_LEVELS, type LogLevel } from './logger.config';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  HOST: string;
  PORT: number;
  LOG_LEVEL?: LogLevel;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  DATABASE_POOL_MAX: number;
  DATABASE_CONNECTION_TIMEOUT_MS: number;
  JWT_SECRET: string;
  JWT_ACCESS_TOKEN_TTL_SECONDS: number;
}

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  HOST: Joi.string().hostname().default('0.0.0.0'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid(...LOG_LEVELS),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  DIRECT_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  DATABASE_POOL_MAX: Joi.number().integer().min(1).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: Joi.number().integer().min(100).default(5000),
  JWT_SECRET: Joi.string().trim().min(32).required(),
  JWT_ACCESS_TOKEN_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86_400)
    .default(900),
});
