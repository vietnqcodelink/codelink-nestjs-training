import Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  HOST: string;
  PORT: number;
}

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  HOST: Joi.string().hostname().default('0.0.0.0'),
  PORT: Joi.number().port().default(3000),
});
