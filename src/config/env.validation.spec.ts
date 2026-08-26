import { envValidationSchema } from './env.validation';

const validationOptions = { abortEarly: false, allowUnknown: true };

describe('environment validation', () => {
  it('applies safe defaults and converts the port to a number', () => {
    const result = envValidationSchema.validate(
      {
        PORT: '8080',
        DATABASE_URL:
          'postgresql://app:password@localhost:5432/student_management',
      },
      validationOptions,
    );

    expect(result.error).toBeUndefined();
    if (result.error) {
      throw result.error;
    }
    expect(result.value).toMatchObject({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 8080,
      DATABASE_POOL_MAX: 10,
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
    });
  });

  it('reports all invalid known variables at once', () => {
    const { error } = envValidationSchema.validate(
      {
        NODE_ENV: 'staging',
        HOST: 'bad host',
        PORT: 'not-a-port',
        LOG_LEVEL: 'everything',
        DATABASE_URL: 'mysql://localhost/database',
      },
      validationOptions,
    );

    expect(error?.details).toHaveLength(5);
  });
});
